"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

const proposeSchema = z.object({
  orderId: z.string().min(1),
  equipmentId: z.string().min(1),
  comment: z.string().max(1000).optional().or(z.literal("")),
  changes: z.object({
    name: z.string().min(1).max(200).optional(),
    brand: z.string().max(120).optional().nullable(),
    model: z.string().max(120).optional().nullable(),
    serialNumber: z.string().max(120).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    serviceIntervalDays: z.number().int().positive().optional().nullable(),
  }),
});

/**
 * Исполнитель предлагает изменения цифрового профиля —
 * напрямую не перезаписывает оборудование (Concept.txt §4).
 */
export async function proposeProfileChange(
  input: z.input<typeof proposeSchema>,
): Promise<ActionResult<{ proposalId: string }>> {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);
  if (!org) return actionError("Сначала заполните профиль компании");

  const parsed = proposeSchema.safeParse(input);
  if (!parsed.success) return actionError("Проверьте поля предложения");

  const order = await db.order.findFirst({
    where: { id: parsed.data.orderId, organizationId: org.id },
    include: { facility: { select: { id: true, ownerId: true } } },
  });
  if (!order) return actionError("Заказ не найден");
  if (!["IN_PROGRESS", "AWAITING_ACCEPTANCE", "COMPLETED", "REWORK"].includes(order.status)) {
    return actionError("Предложение доступно после начала работ");
  }

  const equipment = await db.equipment.findFirst({
    where: {
      id: parsed.data.equipmentId,
      facilityId: order.facilityId,
    },
  });
  if (!equipment) return actionError("Оборудование не найдено на объекте");

  const changes = Object.fromEntries(
    Object.entries(parsed.data.changes).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(changes).length === 0) {
    return actionError("Укажите хотя бы одно изменение");
  }

  const proposal = await db.profileChangeProposal.create({
    data: {
      facilityId: order.facilityId,
      equipmentId: equipment.id,
      orderId: order.id,
      authorId: user.id,
      authorOrgId: org.id,
      status: "PENDING",
      changes,
      comment: parsed.data.comment || null,
    },
  });

  await db.notification.create({
    data: {
      userId: order.facility.ownerId,
      kind: "ORDER",
      title: "Предложены изменения профиля",
      body: `${order.number}: исполнитель предлагает обновить «${equipment.name}».`,
      href: `/app/customer/objects/${order.facilityId}?tab=proposals`,
    },
  });

  await db.auditEvent.create({
    data: {
      actorId: user.id,
      action: "profile.propose",
      entity: "ProfileChangeProposal",
      entityId: proposal.id,
      meta: { orderId: order.id, equipmentId: equipment.id },
    },
  });

  revalidatePath(`/app/contractor/orders/${order.id}`);
  revalidatePath(`/app/customer/objects/${order.facilityId}`);
  return actionOk({ proposalId: proposal.id });
}

const decideSchema = z.object({
  proposalId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "CLARIFICATION"]),
  decisionComment: z.string().max(1000).optional().or(z.literal("")),
});

/**
 * Заказчик подтверждает / отклоняет / возвращает на уточнение
 * предложение об изменении профиля. При APPROVED — новая EquipmentVersion.
 */
export async function decideProfileChange(
  input: z.input<typeof decideSchema>,
): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return actionError("Проверьте решение");

  const proposal = await db.profileChangeProposal.findFirst({
    where: {
      id: parsed.data.proposalId,
      facility: { ownerId: user.id },
      status: "PENDING",
    },
    include: {
      equipment: true,
      author: { select: { id: true } },
    },
  });
  if (!proposal) return actionError("Предложение не найдено");

  const decision = parsed.data.decision;

  await db.$transaction(async (tx) => {
    await tx.profileChangeProposal.update({
      where: { id: proposal.id },
      data: {
        status: decision,
        decisionComment: parsed.data.decisionComment || null,
        decidedById: user.id,
        decidedAt: new Date(),
      },
    });

    if (decision === "APPROVED" && proposal.equipment) {
      const changes = proposal.changes as Record<string, unknown>;
      const eq = proposal.equipment;

      const nextData = {
        name: (changes.name as string | undefined) ?? eq.name,
        brand:
          changes.brand !== undefined
            ? (changes.brand as string | null)
            : eq.brand,
        model:
          changes.model !== undefined
            ? (changes.model as string | null)
            : eq.model,
        serialNumber:
          changes.serialNumber !== undefined
            ? (changes.serialNumber as string | null)
            : eq.serialNumber,
        notes:
          changes.notes !== undefined
            ? (changes.notes as string | null)
            : eq.notes,
        serviceIntervalDays:
          changes.serviceIntervalDays !== undefined
            ? (changes.serviceIntervalDays as number | null)
            : eq.serviceIntervalDays,
      };

      await tx.equipment.update({
        where: { id: eq.id },
        data: nextData,
      });

      const last = await tx.equipmentVersion.findFirst({
        where: { equipmentId: eq.id },
        orderBy: { version: "desc" },
      });

      await tx.equipmentVersion.create({
        data: {
          equipmentId: eq.id,
          version: (last?.version ?? 0) + 1,
          data: {
            before: {
              name: eq.name,
              brand: eq.brand,
              model: eq.model,
              serialNumber: eq.serialNumber,
              notes: eq.notes,
              serviceIntervalDays: eq.serviceIntervalDays,
            },
            after: nextData,
          },
          authorId: proposal.authorId,
          orderId: proposal.orderId,
          comment: proposal.comment,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: proposal.authorId,
        kind: "ORDER",
        title:
          decision === "APPROVED"
            ? "Изменения профиля приняты"
            : decision === "REJECTED"
              ? "Изменения профиля отклонены"
              : "Нужно уточнить изменения профиля",
        body: parsed.data.decisionComment || undefined,
        href: proposal.orderId
          ? `/app/contractor/orders/${proposal.orderId}`
          : "/app/contractor/orders",
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        action: `profile.${decision.toLowerCase()}`,
        entity: "ProfileChangeProposal",
        entityId: proposal.id,
      },
    });
  });

  revalidatePath(`/app/customer/objects/${proposal.facilityId}`);
  if (proposal.orderId) {
    revalidatePath(`/app/contractor/orders/${proposal.orderId}`);
  }
  return actionOk();
}

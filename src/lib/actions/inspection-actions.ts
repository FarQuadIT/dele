"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

/* ------------------------------------------------------------------ */
/* Технадзор                                                           */
/* ------------------------------------------------------------------ */

/**
 * Заказчик запрашивает независимый технадзор на приёмке.
 * Заказ переходит в статус INSPECTION до заключения инженера.
 */
export async function requestInspection(orderId: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const order = await db.order.findFirst({
    where: { id: orderId, customerId: user.id },
    include: {
      request: { select: { title: true } },
      participants: { select: { userId: true } },
      inspections: { where: { status: { in: ["REQUESTED", "IN_PROGRESS"] } } },
    },
  });
  if (!order) return actionError("Заказ не найден");
  if (order.status !== "AWAITING_ACCEPTANCE") {
    return actionError("Технадзор доступен на этапе приёмки");
  }
  if (order.inspections.length > 0) {
    return actionError("Технадзор уже запрошен");
  }

  await db.$transaction([
    db.inspection.create({
      data: {
        orderId: order.id,
        requestedById: user.id,
        status: "REQUESTED",
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { status: "INSPECTION" },
    }),
    ...order.participants.map((p) =>
      db.notification.create({
        data: {
          userId: p.userId,
          kind: "ORDER",
          title: "Запрошен технадзор",
          body: `${order.number}: заказчик пригласил независимого инженера для проверки работ.`,
          href: "/app/contractor/orders",
        },
      }),
    ),
  ]);

  await db.auditEvent.create({
    data: {
      actorId: user.id,
      action: "inspection.request",
      entity: "Order",
      entityId: order.id,
      meta: { number: order.number },
    },
  });

  revalidatePath(`/app/customer/orders/${orderId}`);
  return actionOk();
}

const concludeSchema = z.object({
  inspectionId: z.string().min(1),
  passed: z.boolean(),
  conclusion: z.string().min(5, "Опишите заключение").max(2000),
});

/** Админ фиксирует заключение технадзора; заказ возвращается на приёмку. */
export async function concludeInspection(
  input: z.input<typeof concludeSchema>,
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  const parsed = concludeSchema.safeParse(input);
  if (!parsed.success) return actionError("Проверьте форму заключения");

  const inspection = await db.inspection.findUnique({
    where: { id: parsed.data.inspectionId },
    include: {
      order: {
        include: {
          participants: { select: { userId: true } },
          request: { select: { title: true } },
        },
      },
    },
  });
  if (!inspection) return actionError("Технадзор не найден");
  if (!["REQUESTED", "IN_PROGRESS"].includes(inspection.status)) {
    return actionError("Заключение уже зафиксировано");
  }

  const order = inspection.order;
  const recipients = [
    order.customerId,
    ...order.participants.map((p) => p.userId),
  ];

  await db.$transaction([
    db.inspection.update({
      where: { id: inspection.id },
      data: {
        status: parsed.data.passed ? "PASSED" : "ISSUES_FOUND",
        conclusion: parsed.data.conclusion,
        inspectorName: "Независимый инженер DELE",
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { status: parsed.data.passed ? "AWAITING_ACCEPTANCE" : "REWORK" },
    }),
    ...recipients.map((userId) =>
      db.notification.create({
        data: {
          userId,
          kind: "ORDER",
          title: parsed.data.passed
            ? "Технадзор пройден"
            : "Технадзор выявил замечания",
          body: `${order.number}: ${parsed.data.conclusion.slice(0, 140)}`,
          href: `/app/customer/orders/${order.id}`,
        },
      }),
    ),
  ]);

  await db.auditEvent.create({
    data: {
      actorId: admin.id,
      action: "inspection.conclude",
      entity: "Order",
      entityId: order.id,
      meta: { passed: parsed.data.passed },
    },
  });

  revalidatePath("/admin/control");
  return actionOk();
}

/* ------------------------------------------------------------------ */
/* Споры                                                               */
/* ------------------------------------------------------------------ */

const disputeSchema = z.object({
  orderId: z.string().min(1),
  subject: z.string().min(5, "Кратко опишите суть").max(160),
  description: z.string().max(2000).optional().or(z.literal("")),
});

/** Заказчик открывает спор по заказу — статус DISPUTE до решения платформы. */
export async function openDispute(
  input: z.input<typeof disputeSchema>,
): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте форму",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const order = await db.order.findFirst({
    where: { id: parsed.data.orderId, customerId: user.id },
    include: {
      participants: { select: { userId: true } },
      disputes: { where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
    },
  });
  if (!order) return actionError("Заказ не найден");
  if (["COMPLETED", "CANCELLED"].includes(order.status)) {
    return actionError("По завершённому заказу спор не открывается");
  }
  if (order.disputes.length > 0) return actionError("Спор уже открыт");

  await db.$transaction([
    db.dispute.create({
      data: {
        orderId: order.id,
        openedById: user.id,
        subject: parsed.data.subject,
        description: parsed.data.description || null,
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { status: "DISPUTE" },
    }),
    ...order.participants.map((p) =>
      db.notification.create({
        data: {
          userId: p.userId,
          kind: "ORDER",
          title: "Открыт спор по заказу",
          body: `${order.number}: ${parsed.data.subject}`,
          href: "/app/contractor/orders",
        },
      }),
    ),
  ]);

  await db.auditEvent.create({
    data: {
      actorId: user.id,
      action: "dispute.open",
      entity: "Order",
      entityId: order.id,
      meta: { subject: parsed.data.subject },
    },
  });

  revalidatePath(`/app/customer/orders/${order.id}`);
  return actionOk();
}

const resolveDisputeSchema = z.object({
  disputeId: z.string().min(1),
  outcome: z.enum([
    "RESOLVED_CUSTOMER",
    "RESOLVED_CONTRACTOR",
    "RESOLVED_COMPROMISE",
  ]),
  resolution: z.string().min(5, "Опишите решение").max(2000),
});

/** Админ решает спор; заказ возвращается на приёмку. */
export async function resolveDispute(
  input: z.input<typeof resolveDisputeSchema>,
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  const parsed = resolveDisputeSchema.safeParse(input);
  if (!parsed.success) return actionError("Проверьте форму решения");

  const dispute = await db.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: {
      order: { include: { participants: { select: { userId: true } } } },
    },
  });
  if (!dispute) return actionError("Спор не найден");
  if (!["OPEN", "UNDER_REVIEW"].includes(dispute.status)) {
    return actionError("Спор уже решён");
  }

  const order = dispute.order;
  const recipients = [
    order.customerId,
    ...order.participants.map((p) => p.userId),
  ];

  await db.$transaction([
    db.dispute.update({
      where: { id: dispute.id },
      data: {
        status: parsed.data.outcome,
        resolution: parsed.data.resolution,
        resolvedAt: new Date(),
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { status: "AWAITING_ACCEPTANCE" },
    }),
    ...recipients.map((userId) =>
      db.notification.create({
        data: {
          userId,
          kind: "ORDER",
          title: "Спор решён",
          body: `${order.number}: ${parsed.data.resolution.slice(0, 140)}`,
          href: `/app/customer/orders/${order.id}`,
        },
      }),
    ),
  ]);

  await db.auditEvent.create({
    data: {
      actorId: admin.id,
      action: "dispute.resolve",
      entity: "Order",
      entityId: order.id,
      meta: { outcome: parsed.data.outcome },
    },
  });

  revalidatePath("/admin/control");
  return actionOk();
}

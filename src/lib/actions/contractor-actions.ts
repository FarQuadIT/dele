"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getContractorOrg } from "@/lib/contractor";

/* ------------------------------------------------------------------ */
/* Компания                                                            */
/* ------------------------------------------------------------------ */

const orgSchema = z.object({
  name: z.string().min(2, "Укажите название").max(160),
  inn: z
    .string()
    .regex(/^\d{10}(\d{2})?$/, "ИНН — 10 или 12 цифр")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  description: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Некорректный e-mail").optional().or(z.literal("")),
  website: z.string().max(200).optional().or(z.literal("")),
  specializations: z.array(z.string()).default([]),
  regionsServed: z.string().max(300).optional().or(z.literal("")),
});

export type OrgInput = z.input<typeof orgSchema>;

function slugify(name: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };
  return (
    name
      .toLowerCase()
      .split("")
      .map((ch) => map[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `org-${Date.now()}`
  );
}

export async function upsertOrganization(
  input: OrgInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("CONTRACTOR");

  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте поля формы",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const data = parsed.data;
  const { org } = await getContractorOrg(user.id);

  try {
    if (org) {
      await db.organization.update({
        where: { id: org.id },
        data: {
          name: data.name,
          inn: data.inn ?? null,
          description: data.description || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          specializations: data.specializations,
          regionsServed: data.regionsServed
            ? data.regionsServed.split(",").map((s) => s.trim())
            : [],
          // Правки профиля отправляют компанию на повторную модерацию,
          // кроме случая, когда она уже проверена (демо-послабление).
          verificationStatus:
            org.verificationStatus === "VERIFIED" ? "VERIFIED" : "PENDING",
        },
      });
      revalidatePath("/app/contractor/company");
      return actionOk({ id: org.id });
    }

    const created = await db.organization.create({
      data: {
        name: data.name,
        slug: slugify(data.name),
        inn: data.inn ?? null,
        description: data.description || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        specializations: data.specializations,
        regionsServed: data.regionsServed
          ? data.regionsServed.split(",").map((s) => s.trim())
          : [],
        verificationStatus: "PENDING",
        members: {
          create: { userId: user.id, role: "OWNER", position: "Руководитель" },
        },
      },
    });

    await db.auditEvent.create({
      data: {
        actorId: user.id,
        action: "organization.create",
        entity: "Organization",
        entityId: created.id,
        meta: { name: created.name },
      },
    });

    revalidatePath("/app/contractor", "layout");
    return actionOk({ id: created.id });
  } catch (error) {
    console.error("upsertOrganization failed:", error);
    return actionError("Не удалось сохранить компанию");
  }
}

/* ------------------------------------------------------------------ */
/* Отклики                                                             */
/* ------------------------------------------------------------------ */

const offerSchema = z.object({
  requestId: z.string().min(1),
  priceTotal: z.coerce.number().int().min(100, "Укажите цену").max(1_000_000_000),
  priceMaterials: z
    .union([z.coerce.number().int().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  isEstimate: z.boolean(),
  durationDays: z
    .union([z.coerce.number().int().min(1).max(365), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  warrantyMonths: z
    .union([z.coerce.number().int().min(0).max(120), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  comment: z.string().max(2000).optional().or(z.literal("")),
  stagesPlan: z.string().max(2000).optional().or(z.literal("")),
});

export type OfferInput = z.input<typeof offerSchema>;

export async function submitOffer(
  input: OfferInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  if (!org) return actionError("Сначала создайте профиль компании");
  if (org.verificationStatus !== "VERIFIED") {
    return actionError(
      "Откликаться могут только проверенные компании. Дождитесь модерации.",
    );
  }

  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте поля формы",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const data = parsed.data;

  const request = await db.request.findUnique({
    where: { id: data.requestId },
  });
  if (!request || !["PUBLISHED", "HAS_OFFERS"].includes(request.status)) {
    return actionError("Заявка недоступна для откликов");
  }

  const existing = await db.offer.findUnique({
    where: {
      requestId_organizationId: {
        requestId: request.id,
        organizationId: org.id,
      },
    },
  });
  if (existing) return actionError("Вы уже откликнулись на эту заявку");

  try {
    const offer = await db.offer.create({
      data: {
        requestId: request.id,
        organizationId: org.id,
        authorId: user.id,
        status: "SENT",
        priceTotal: data.priceTotal * 100,
        priceMaterials:
          data.priceMaterials !== undefined ? data.priceMaterials * 100 : null,
        isEstimate: data.isEstimate,
        durationDays: data.durationDays ?? null,
        warrantyMonths: data.warrantyMonths ?? null,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        comment: data.comment || null,
        stagesPlan: data.stagesPlan
          ? data.stagesPlan
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      },
    });

    await db.$transaction([
      db.request.update({
        where: { id: request.id },
        data: request.status === "PUBLISHED" ? { status: "HAS_OFFERS" } : {},
      }),
      db.notification.create({
        data: {
          userId: request.customerId,
          kind: "OFFER",
          title: "Новый отклик на заявку",
          body: `«${org.name}» предложила решение по заявке «${request.title}».`,
          href: `/app/customer/requests/${request.id}`,
        },
      }),
    ]);

    revalidatePath("/app/contractor/requests");
    revalidatePath("/app/contractor/offers");
    return actionOk({ id: offer.id });
  } catch (error) {
    console.error("submitOffer failed:", error);
    return actionError("Не удалось отправить отклик");
  }
}

export async function withdrawOffer(offerId: string): Promise<ActionResult> {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);
  if (!org) return actionError("Компания не найдена");

  const offer = await db.offer.findFirst({
    where: { id: offerId, organizationId: org.id },
  });
  if (!offer) return actionError("Отклик не найден");
  if (offer.status !== "SENT") {
    return actionError("Отозвать можно только отправленный отклик");
  }

  await db.offer.update({
    where: { id: offerId },
    data: { status: "WITHDRAWN" },
  });
  revalidatePath("/app/contractor/offers");
  return actionOk();
}

/* ------------------------------------------------------------------ */
/* Ведение этапов заказа                                               */
/* ------------------------------------------------------------------ */

async function getOwnOrder(userId: string, orderId: string) {
  const { org } = await getContractorOrg(userId);
  if (!org) return null;
  return db.order.findFirst({
    where: { id: orderId, organizationId: org.id },
    include: { stages: { orderBy: { index: "asc" } } },
  });
}

export async function startStage(input: {
  orderId: string;
  stageId: string;
}): Promise<ActionResult> {
  const user = await requireRole("CONTRACTOR");
  const order = await getOwnOrder(user.id, input.orderId);
  if (!order) return actionError("Заказ не найден");

  const stage = order.stages.find((s) => s.id === input.stageId);
  if (!stage) return actionError("Этап не найден");
  if (stage.status !== "PENDING") return actionError("Этап уже начат");

  await db.$transaction([
    db.orderStage.update({
      where: { id: stage.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    }),
    ...(["PLANNING", "PAUSED", "REWORK"].includes(order.status)
      ? [
          db.order.update({
            where: { id: order.id },
            data: {
              status: "IN_PROGRESS",
              startedAt: order.startedAt ?? new Date(),
            },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/app/contractor/orders/${order.id}`);
  return actionOk();
}

export async function completeStage(input: {
  orderId: string;
  stageId: string;
  note?: string;
}): Promise<ActionResult> {
  const user = await requireRole("CONTRACTOR");
  const order = await getOwnOrder(user.id, input.orderId);
  if (!order) return actionError("Заказ не найден");

  const stage = order.stages.find((s) => s.id === input.stageId);
  if (!stage) return actionError("Этап не найден");
  if (stage.status !== "IN_PROGRESS") {
    return actionError("Сначала начните этап");
  }

  await db.$transaction([
    db.orderStage.update({
      where: { id: stage.id },
      data: { status: "DONE", completedAt: new Date() },
    }),
    ...(input.note?.trim()
      ? [
          db.stageEvidence.create({
            data: {
              stageId: stage.id,
              type: "NOTE",
              note: input.note.trim(),
              createdById: user.id,
            },
          }),
        ]
      : []),
    db.notification.create({
      data: {
        userId: order.customerId,
        kind: "ORDER",
        title: `Этап завершён: ${stage.name}`,
        body: `Заказ ${order.number}`,
        href: `/app/customer/orders/${order.id}`,
      },
    }),
  ]);

  revalidatePath(`/app/contractor/orders/${order.id}`);
  return actionOk();
}

export async function submitForAcceptance(
  orderId: string,
): Promise<ActionResult> {
  const user = await requireRole("CONTRACTOR");
  const order = await getOwnOrder(user.id, orderId);
  if (!order) return actionError("Заказ не найден");

  if (!["IN_PROGRESS", "REWORK"].includes(order.status)) {
    return actionError("Передать на приёмку можно заказ в работе");
  }
  const unfinished = order.stages.filter((s) => s.status !== "DONE");
  if (unfinished.length > 0) {
    return actionError(
      `Сначала завершите все этапы (осталось: ${unfinished.length})`,
    );
  }

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "AWAITING_ACCEPTANCE" },
    }),
    db.notification.create({
      data: {
        userId: order.customerId,
        kind: "ORDER",
        title: "Работы готовы к приёмке",
        body: `Заказ ${order.number}: исполнитель передал работы на проверку.`,
        href: `/app/customer/orders/${order.id}`,
      },
    }),
  ]);

  revalidatePath(`/app/contractor/orders/${orderId}`);
  return actionOk();
}

/* ------------------------------------------------------------------ */
/* Чаты исполнителя                                                    */
/* ------------------------------------------------------------------ */

export async function contractorSendOrderMessage(input: {
  orderId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await requireRole("CONTRACTOR");
  const body = input.body?.trim();
  if (!body) return actionError("Введите сообщение");

  const order = await getOwnOrder(user.id, input.orderId);
  if (!order) return actionError("Заказ не найден");

  const threads = await db.chatThread.findMany({
    where: { orderId: order.id, kind: "ORDER" },
  });

  let thread = threads[0];
  if (!thread) {
    thread = await db.chatThread.create({
      data: { kind: "ORDER", orderId: order.id },
    });
  }

  await db.message.create({
    data: { threadId: thread.id, authorId: user.id, body },
  });

  await db.notification.create({
    data: {
      userId: order.customerId,
      kind: "CHAT",
      title: `Новое сообщение по заказу ${order.number}`,
      body: body.slice(0, 120),
      href: `/app/customer/orders/${order.id}`,
    },
  });

  revalidatePath(`/app/contractor/orders/${order.id}`);
  return actionOk();
}

export async function contractorSendOfferMessage(input: {
  offerId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);
  if (!org) return actionError("Компания не найдена");

  const body = input.body?.trim();
  if (!body) return actionError("Введите сообщение");

  const offer = await db.offer.findFirst({
    where: { id: input.offerId, organizationId: org.id },
    include: { request: true, threads: true },
  });
  if (!offer) return actionError("Отклик не найден");

  let thread = offer.threads[0];
  if (!thread) {
    thread = await db.chatThread.create({
      data: { kind: "OFFER", offerId: offer.id, requestId: offer.requestId },
    });
  }

  await db.message.create({
    data: { threadId: thread.id, authorId: user.id, body },
  });

  await db.notification.create({
    data: {
      userId: offer.request.customerId,
      kind: "CHAT",
      title: "Новое сообщение по заявке",
      body: `«${offer.request.title}»`,
      href: `/app/customer/requests/${offer.requestId}`,
    },
  });

  revalidatePath("/app/contractor/offers");
  return actionOk();
}

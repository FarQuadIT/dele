"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

const DEFAULT_STAGES = [
  "Выезд и диагностика",
  "Выполнение работ",
  "Проверка и сдача",
];

/**
 * Мок-флоу «договор + предоплата»: конвертирует заявку с выбранным
 * исполнителем в заказ. Платёж имитируется (SUCCEEDED сразу).
 */
export async function convertRequestToOrder(
  requestId: string,
): Promise<ActionResult<{ orderId: string }>> {
  const user = await requireRole("CUSTOMER");

  const request = await db.request.findFirst({
    where: { id: requestId, customerId: user.id },
    include: {
      acceptedOffer: { include: { organization: true } },
      facility: true,
    },
  });
  if (!request) return actionError("Заявка не найдена");
  if (request.status !== "CONTRACTOR_SELECTED" || !request.acceptedOffer) {
    return actionError("Сначала выберите исполнителя");
  }

  const offer = request.acceptedOffer;

  const schedule =
    offer.paymentSchedule &&
    typeof offer.paymentSchedule === "object" &&
    !Array.isArray(offer.paymentSchedule)
      ? (offer.paymentSchedule as { prepayment?: number })
      : null;
  const prepaymentShare = schedule?.prepayment ?? 0.3;
  const prepaymentAmount = Math.round(offer.priceTotal * prepaymentShare);

  const stages =
    Array.isArray(offer.stagesPlan) && offer.stagesPlan.length > 0
      ? (offer.stagesPlan as string[])
      : DEFAULT_STAGES;

  try {
    const year = new Date().getFullYear();
    const count = await db.order.count();
    const number = `DELE-${year}-${String(count + 143).padStart(4, "0")}`;

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          number,
          requestId: request.id,
          offerId: offer.id,
          customerId: user.id,
          organizationId: offer.organizationId,
          facilityId: request.facilityId,
          status: "PLANNING",
          priceTotal: offer.priceTotal,
          prepaymentAmount,
          scheduledStartAt: request.desiredDateFrom,
          scheduledEndAt: request.desiredDateTo,
          addressRevealed: true,
          participants: {
            create: [{ userId: offer.authorId, roleNote: "Ответственный" }],
          },
          stages: {
            create: stages.map((name, i) => ({
              index: i + 1,
              name,
              status: "PENDING" as const,
            })),
          },
          contract: {
            create: {
              terms: {
                subject: request.title,
                totalRub: Math.round(offer.priceTotal / 100),
                warrantyMonths: offer.warrantyMonths ?? null,
                contractor: offer.organization.name,
              },
              signedByCustomerAt: new Date(),
              signedByContractorAt: new Date(),
            },
          },
          payments: {
            create: [
              {
                kind: "PREPAYMENT",
                status: "SUCCEEDED",
                amount: prepaymentAmount,
                externalId: `pay_mock_${Date.now()}`,
                idempotencyKey: `${request.id}-prepayment`,
                paidAt: new Date(),
              },
              {
                kind: "FINAL",
                status: "PENDING",
                amount: offer.priceTotal - prepaymentAmount,
                idempotencyKey: `${request.id}-final`,
              },
            ],
          },
        },
      });

      await tx.request.update({
        where: { id: request.id },
        data: { status: "CONVERTED" },
      });

      await tx.notification.create({
        data: {
          userId: offer.authorId,
          kind: "ORDER",
          title: "Договор подписан — заказ создан",
          body: `Заказ ${number} по заявке «${request.title}». Предоплата получена, можно приступать.`,
          href: "/app/contractor/orders",
        },
      });

      return created;
    });

    await db.auditEvent.create({
      data: {
        actorId: user.id,
        action: "order.create",
        entity: "Order",
        entityId: order.id,
        meta: { number, requestId: request.id },
      },
    });

    revalidatePath("/app/customer/requests");
    revalidatePath("/app/customer/orders");
    return actionOk({ orderId: order.id });
  } catch (error) {
    console.error("convertRequestToOrder failed:", error);
    return actionError("Не удалось создать заказ. Попробуйте ещё раз.");
  }
}

/** Приёмка работ заказчиком. */
export async function acceptWork(orderId: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const order = await db.order.findFirst({
    where: { id: orderId, customerId: user.id },
    include: { payments: true, request: { select: { title: true } } },
  });
  if (!order) return actionError("Заказ не найден");
  if (order.status !== "AWAITING_ACCEPTANCE") {
    return actionError("Работы ещё не переданы на приёмку");
  }

  const finalPending = order.payments.find(
    (p) => p.kind === "FINAL" && p.status === "PENDING" && p.amount > 0,
  );

  await db.order.update({
    where: { id: orderId },
    data: finalPending
      ? { status: "AWAITING_FINAL_PAYMENT" }
      : { status: "COMPLETED", completedAt: new Date() },
  });

  revalidatePath(`/app/customer/orders/${orderId}`);
  revalidatePath("/app/customer/orders");
  return actionOk();
}

const reworkSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(5, "Опишите, что нужно исправить").max(2000),
});

export async function requestRework(input: {
  orderId: string;
  reason: string;
}): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const parsed = reworkSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте форму",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const order = await db.order.findFirst({
    where: { id: parsed.data.orderId, customerId: user.id },
    include: {
      request: { select: { title: true } },
      participants: { select: { userId: true } },
    },
  });
  if (!order) return actionError("Заказ не найден");
  if (order.status !== "AWAITING_ACCEPTANCE") {
    return actionError("Вернуть на доработку можно только на приёмке");
  }

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "REWORK" },
    }),
    ...order.participants.map((p) =>
      db.notification.create({
        data: {
          userId: p.userId,
          kind: "ORDER",
          title: "Работы возвращены на доработку",
          body: `${order.number}: ${parsed.data.reason}`,
          href: "/app/contractor/orders",
        },
      }),
    ),
  ]);

  revalidatePath(`/app/customer/orders/${order.id}`);
  return actionOk();
}

/** Мок финальной оплаты: закрывает заказ. */
export async function payFinal(orderId: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const order = await db.order.findFirst({
    where: { id: orderId, customerId: user.id },
    include: { payments: true, participants: { select: { userId: true } } },
  });
  if (!order) return actionError("Заказ не найден");
  if (order.status !== "AWAITING_FINAL_PAYMENT") {
    return actionError("Финальная оплата сейчас не требуется");
  }

  const finalPayment = order.payments.find(
    (p) => p.kind === "FINAL" && p.status === "PENDING",
  );

  await db.$transaction([
    ...(finalPayment
      ? [
          db.payment.update({
            where: { id: finalPayment.id },
            data: {
              status: "SUCCEEDED",
              paidAt: new Date(),
              externalId: `pay_mock_${Date.now()}`,
            },
          }),
        ]
      : []),
    db.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    ...order.participants.map((p) =>
      db.notification.create({
        data: {
          userId: p.userId,
          kind: "PAYMENT",
          title: "Оплата получена — заказ закрыт",
          body: `${order.number}: финальный платёж прошёл успешно.`,
          href: "/app/contractor/orders",
        },
      }),
    ),
  ]);

  revalidatePath(`/app/customer/orders/${orderId}`);
  revalidatePath("/app/customer/orders");
  revalidatePath("/app/customer/payments");
  return actionOk();
}

const reviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().or(z.literal("")),
});

export async function submitReview(input: {
  orderId: string;
  rating: number;
  text?: string;
}): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return actionError("Проверьте форму отзыва");

  const order = await db.order.findFirst({
    where: { id: parsed.data.orderId, customerId: user.id },
    include: { reviews: true },
  });
  if (!order) return actionError("Заказ не найден");
  if (order.status !== "COMPLETED") {
    return actionError("Отзыв можно оставить после завершения заказа");
  }
  if (order.reviews.some((r) => r.direction === "CUSTOMER_TO_CONTRACTOR")) {
    return actionError("Отзыв уже оставлен");
  }

  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        orderId: order.id,
        direction: "CUSTOMER_TO_CONTRACTOR",
        authorId: user.id,
        targetOrgId: order.organizationId,
        rating: parsed.data.rating,
        text: parsed.data.text || null,
      },
    });

    const agg = await tx.review.aggregate({
      where: {
        targetOrgId: order.organizationId,
        direction: "CUSTOMER_TO_CONTRACTOR",
      },
      _avg: { rating: true },
      _count: true,
    });

    await tx.organization.update({
      where: { id: order.organizationId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count,
      },
    });
  });

  revalidatePath(`/app/customer/orders/${parsed.data.orderId}`);
  return actionOk();
}

/** Чат в рамках заказа. */
export async function sendOrderMessage(input: {
  orderId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const body = input.body?.trim();
  if (!body) return actionError("Введите сообщение");
  if (body.length > 4000) return actionError("Сообщение слишком длинное");

  const order = await db.order.findFirst({
    where: { id: input.orderId, customerId: user.id },
    include: {
      threads: true,
      participants: { select: { userId: true } },
    },
  });
  if (!order) return actionError("Заказ не найден");

  try {
    let thread = order.threads.find((t) => t.kind === "ORDER");
    if (!thread) {
      thread = await db.chatThread.create({
        data: { kind: "ORDER", orderId: order.id },
      });
    }

    await db.message.create({
      data: { threadId: thread.id, authorId: user.id, body },
    });

    await db.notification.createMany({
      data: order.participants.map((p) => ({
        userId: p.userId,
        kind: "CHAT" as const,
        title: `Новое сообщение по заказу ${order.number}`,
        body: body.slice(0, 120),
        href: "/app/contractor/orders",
      })),
    });

    revalidatePath(`/app/customer/orders/${order.id}`);
    return actionOk();
  } catch (error) {
    console.error("sendOrderMessage failed:", error);
    return actionError("Не удалось отправить сообщение");
  }
}

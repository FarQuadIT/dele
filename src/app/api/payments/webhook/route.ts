import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Идемпотентный вебхук платёжного шлюза (Phase 6).
 *
 * Повторный вызов с тем же `externalId` / `idempotencyKey`
 * не создаёт второй платёж и не меняет уже SUCCEEDED запись.
 *
 * В проде сюда добавится проверка подписи провайдера
 * (YooKassa / CloudPayments / Stripe).
 */

const webhookSchema = z.object({
  event: z.enum(["payment.succeeded", "payment.failed", "payment.cancelled"]),
  externalId: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
  amount: z.number().int().positive().optional(),
  failReason: z.string().max(500).optional(),
  paymentId: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  // 1) Ищем по externalId — уже обработанный вебхук
  const byExternal = await db.payment.findUnique({
    where: { externalId: payload.externalId },
  });
  if (byExternal) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      paymentId: byExternal.id,
      status: byExternal.status,
    });
  }

  // 2) Ищем целевой PENDING платёж по id или idempotencyKey
  const payment = payload.paymentId
    ? await db.payment.findUnique({ where: { id: payload.paymentId } })
    : payload.idempotencyKey
      ? await db.payment.findUnique({
          where: { idempotencyKey: payload.idempotencyKey },
        })
      : null;

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Уже финальный статус — идемпотентный ответ
  if (
    payment.status === "SUCCEEDED" ||
    payment.status === "REFUNDED" ||
    payment.status === "CANCELLED"
  ) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      paymentId: payment.id,
      status: payment.status,
    });
  }

  if (payload.event === "payment.succeeded") {
    if (payload.amount !== undefined && payload.amount !== payment.amount) {
      return NextResponse.json(
        { error: "Amount mismatch" },
        { status: 409 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          externalId: payload.externalId,
          paidAt: new Date(),
          failReason: null,
        },
      });

      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        include: { payments: true, participants: { select: { userId: true } } },
      });
      if (!order) return;

      // Финальный платёж закрывает заказ
      if (
        payment.kind === "FINAL" &&
        order.status === "AWAITING_FINAL_PAYMENT"
      ) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        for (const p of order.participants) {
          await tx.notification.create({
            data: {
              userId: p.userId,
              kind: "PAYMENT",
              title: "Оплата получена — заказ закрыт",
              body: `${order.number}: финальный платёж подтверждён шлюзом.`,
              href: "/app/contractor/orders",
            },
          });
        }
      }

      await tx.auditEvent.create({
        data: {
          action: "payment.webhook.succeeded",
          entity: "Payment",
          entityId: payment.id,
          meta: { externalId: payload.externalId, orderId: order.id },
        },
      });
    });

    return NextResponse.json({ ok: true, paymentId: payment.id, status: "SUCCEEDED" });
  }

  if (payload.event === "payment.failed") {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        externalId: payload.externalId,
        failReason: payload.failReason ?? "Отказ платёжного шлюза",
      },
    });
    await db.auditEvent.create({
      data: {
        action: "payment.webhook.failed",
        entity: "Payment",
        entityId: payment.id,
        meta: { externalId: payload.externalId },
      },
    });
    return NextResponse.json({ ok: true, paymentId: payment.id, status: "FAILED" });
  }

  // payment.cancelled
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "CANCELLED",
      externalId: payload.externalId,
    },
  });
  return NextResponse.json({ ok: true, paymentId: payment.id, status: "CANCELLED" });
}

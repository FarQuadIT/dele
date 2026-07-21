"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  createRequestSchema,
  type CreateRequestInput,
} from "@/lib/validation/request";

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createRequest(
  input: CreateRequestInput,
  mode: "draft" | "publish",
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("CUSTOMER");

  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте поля формы",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const data = parsed.data;

  const facility = await db.facility.findFirst({
    where: { id: data.facilityId, ownerId: user.id },
  });
  if (!facility) return actionError("Объект не найден");

  if (
    data.budgetMin !== undefined &&
    data.budgetMax !== undefined &&
    data.budgetMin > data.budgetMax
  ) {
    return actionError("Проверьте поля формы", {
      budgetMax: ["Максимум бюджета меньше минимума"],
    });
  }

  try {
    const request = await db.request.create({
      data: {
        customerId: user.id,
        facilityId: data.facilityId,
        systemId: data.systemId || null,
        equipmentId: data.equipmentId || null,
        type: data.type,
        status: mode === "publish" ? "PUBLISHED" : "DRAFT",
        title: data.title,
        description: data.description || null,
        urgency: data.type === "EMERGENCY" ? "EMERGENCY" : data.urgency,
        desiredDateFrom: parseDate(data.desiredDateFrom),
        desiredDateTo: parseDate(data.desiredDateTo),
        visitTimeNote: data.visitTimeNote || null,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        needsEstimate: data.needsEstimate,
        needsContract: data.needsContract,
        needsWarranty: data.needsWarranty,
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        publishedAt: mode === "publish" ? new Date() : null,
        expiresAt:
          mode === "publish"
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            : null,
      },
    });

    await db.auditEvent.create({
      data: {
        actorId: user.id,
        action: mode === "publish" ? "request.publish" : "request.draft",
        entity: "Request",
        entityId: request.id,
        meta: { title: request.title, type: request.type },
      },
    });

    revalidatePath("/app/customer/requests");
    return actionOk({ id: request.id });
  } catch (error) {
    console.error("createRequest failed:", error);
    return actionError("Не удалось создать заявку. Попробуйте ещё раз.");
  }
}

export async function publishRequest(id: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");
  const request = await db.request.findFirst({
    where: { id, customerId: user.id },
  });
  if (!request) return actionError("Заявка не найдена");
  if (request.status !== "DRAFT")
    return actionError("Опубликовать можно только черновик");

  await db.request.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath("/app/customer/requests");
  revalidatePath(`/app/customer/requests/${id}`);
  return actionOk();
}

export async function cancelRequest(id: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");
  const request = await db.request.findFirst({
    where: { id, customerId: user.id },
  });
  if (!request) return actionError("Заявка не найдена");
  if (request.status === "CONVERTED")
    return actionError("Заявка уже переведена в заказ");

  await db.request.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  revalidatePath("/app/customer/requests");
  revalidatePath(`/app/customer/requests/${id}`);
  return actionOk();
}

/** Выбор исполнителя: принимаем отклик, остальные отклоняем. */
export async function acceptOffer(offerId: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: {
      request: true,
      organization: { select: { name: true } },
    },
  });
  if (!offer || offer.request.customerId !== user.id) {
    return actionError("Отклик не найден");
  }
  if (offer.status !== "SENT") {
    return actionError("Этот отклик уже нельзя принять");
  }
  if (offer.request.acceptedOfferId) {
    return actionError("Исполнитель по заявке уже выбран");
  }

  try {
    await db.$transaction([
      db.offer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      }),
      db.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: offerId },
          status: "SENT",
        },
        data: { status: "DECLINED" },
      }),
      db.request.update({
        where: { id: offer.requestId },
        data: { status: "CONTRACTOR_SELECTED", acceptedOfferId: offerId },
      }),
      db.notification.create({
        data: {
          userId: offer.authorId,
          kind: "OFFER",
          title: "Ваш отклик принят",
          body: `Заказчик выбрал «${offer.organization.name}» по заявке «${offer.request.title}». Следующий шаг — договор.`,
          href: "/app/contractor/offers",
        },
      }),
    ]);

    await db.auditEvent.create({
      data: {
        actorId: user.id,
        action: "offer.accept",
        entity: "Offer",
        entityId: offerId,
        meta: { requestId: offer.requestId },
      },
    });

    revalidatePath(`/app/customer/requests/${offer.requestId}`);
    revalidatePath("/app/customer/requests");
    return actionOk();
  } catch (error) {
    console.error("acceptOffer failed:", error);
    return actionError("Не удалось принять отклик");
  }
}

export async function declineOffer(offerId: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { request: true },
  });
  if (!offer || offer.request.customerId !== user.id) {
    return actionError("Отклик не найден");
  }
  if (offer.status !== "SENT") {
    return actionError("Этот отклик нельзя отклонить");
  }

  await db.offer.update({
    where: { id: offerId },
    data: { status: "DECLINED" },
  });
  revalidatePath(`/app/customer/requests/${offer.requestId}`);
  return actionOk();
}

const sendMessageSchema = z.object({
  offerId: z.string().min(1),
  body: z.string().min(1, "Введите сообщение").max(4000),
});

/** Чат заказчик <-> исполнитель в рамках отклика. */
export async function sendOfferMessage(input: {
  offerId: string;
  body: string;
}): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return actionError("Введите сообщение");

  const offer = await db.offer.findUnique({
    where: { id: parsed.data.offerId },
    include: { request: true, threads: true },
  });
  if (!offer || offer.request.customerId !== user.id) {
    return actionError("Отклик не найден");
  }

  try {
    let thread = offer.threads[0];
    if (!thread) {
      thread = await db.chatThread.create({
        data: {
          kind: "OFFER",
          offerId: offer.id,
          requestId: offer.requestId,
        },
      });
    }

    await db.message.create({
      data: {
        threadId: thread.id,
        authorId: user.id,
        body: parsed.data.body,
      },
    });

    await db.notification.create({
      data: {
        userId: offer.authorId,
        kind: "CHAT",
        title: "Новое сообщение по заявке",
        body: `«${offer.request.title}»`,
        href: "/app/contractor/offers",
      },
    });

    revalidatePath(`/app/customer/requests/${offer.requestId}`);
    return actionOk();
  } catch (error) {
    console.error("sendOfferMessage failed:", error);
    return actionError("Не удалось отправить сообщение");
  }
}

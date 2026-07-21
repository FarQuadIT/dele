"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

const idSchema = z.object({
  recommendationId: z.string().min(1),
});

export async function dismissRecommendation(
  recommendationId: string,
): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");
  const parsed = idSchema.safeParse({ recommendationId });
  if (!parsed.success) return actionError("Рекомендация не найдена");

  const rec = await db.serviceRecommendation.findFirst({
    where: {
      id: parsed.data.recommendationId,
      facility: { ownerId: user.id },
    },
  });
  if (!rec) return actionError("Рекомендация не найдена");

  await db.serviceRecommendation.update({
    where: { id: rec.id },
    data: { status: "DISMISSED" },
  });

  revalidatePath(`/app/customer/objects/${rec.facilityId}`);
  revalidatePath("/app/customer");
  return actionOk();
}

export async function postponeRecommendation(
  recommendationId: string,
): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");
  const parsed = idSchema.safeParse({ recommendationId });
  if (!parsed.success) return actionError("Рекомендация не найдена");

  const rec = await db.serviceRecommendation.findFirst({
    where: {
      id: parsed.data.recommendationId,
      facility: { ownerId: user.id },
    },
  });
  if (!rec) return actionError("Рекомендация не найдена");

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 30);

  await db.serviceRecommendation.update({
    where: { id: rec.id },
    data: { status: "POSTPONED", dueAt },
  });

  revalidatePath(`/app/customer/objects/${rec.facilityId}`);
  revalidatePath("/app/customer");
  return actionOk();
}

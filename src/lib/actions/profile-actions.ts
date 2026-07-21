"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Укажите имя").max(120),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export async function updateProfile(input: {
  name: string;
  phone?: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте поля формы",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  if (parsed.data.phone) {
    const existing = await db.user.findFirst({
      where: { phone: parsed.data.phone, id: { not: user.id } },
    });
    if (existing) {
      return actionError("Проверьте поля формы", {
        phone: ["Этот телефон уже используется"],
      });
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
    },
  });

  revalidatePath("/app", "layout");
  return actionOk();
}

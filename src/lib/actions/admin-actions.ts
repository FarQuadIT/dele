"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

const moderateSchema = z.object({
  organizationId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().max(500).optional().or(z.literal("")),
});

/** Модерация компании: подтвердить или отклонить с комментарием. */
export async function moderateOrganization(
  input: z.input<typeof moderateSchema>,
): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");

  const parsed = moderateSchema.safeParse(input);
  if (!parsed.success) return actionError("Некорректные данные");

  const org = await db.organization.findUnique({
    where: { id: parsed.data.organizationId },
    include: { members: { where: { role: "OWNER" }, take: 1 } },
  });
  if (!org) return actionError("Компания не найдена");

  await db.organization.update({
    where: { id: org.id },
    data: {
      verificationStatus: parsed.data.decision,
      verifiedAt: parsed.data.decision === "VERIFIED" ? new Date() : null,
      verificationNote: parsed.data.note || null,
    },
  });

  const owner = org.members[0];
  if (owner) {
    await db.notification.create({
      data: {
        userId: owner.userId,
        kind: "SYSTEM",
        title:
          parsed.data.decision === "VERIFIED"
            ? "Компания подтверждена"
            : "Компания отклонена модерацией",
        body:
          parsed.data.decision === "VERIFIED"
            ? `«${org.name}» прошла проверку — отклики на заявки открыты.`
            : `«${org.name}»: ${parsed.data.note || "проверьте данные и отправьте профиль повторно."}`,
        href: "/app/contractor/company",
      },
    });
  }

  await db.auditEvent.create({
    data: {
      actorId: admin.id,
      action:
        parsed.data.decision === "VERIFIED"
          ? "organization.verify"
          : "organization.reject",
      entity: "Organization",
      entityId: org.id,
      meta: { name: org.name, note: parsed.data.note || null },
    },
  });

  revalidatePath("/admin/companies");
  return actionOk();
}

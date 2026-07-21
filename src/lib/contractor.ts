import { db } from "@/lib/db";

/** Организация текущего исполнителя (первое членство). */
export async function getContractorOrg(userId: string) {
  const membership = await db.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  return membership
    ? { org: membership.organization, membership }
    : { org: null, membership: null };
}

import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;
/** За сколько дней до срока создаём напоминание. */
const LOOKAHEAD_DAYS = 30;

/**
 * Авто-рекомендации: по каждому оборудованию с регламентом
 * (serviceIntervalDays) создаёт напоминание о ТО, когда подходит срок.
 * Идемпотентно: активная авто-рекомендация на оборудование не дублируется.
 */
export async function ensureAutoRecommendations(facilityId: string) {
  const equipment = await db.equipment.findMany({
    where: { facilityId, serviceIntervalDays: { not: null } },
    select: {
      id: true,
      name: true,
      systemId: true,
      installedAt: true,
      lastServiceAt: true,
      serviceIntervalDays: true,
      createdAt: true,
      recommendations: {
        where: { status: "ACTIVE", createdByUserId: null, createdByOrgId: null },
        select: { id: true },
      },
    },
  });

  const now = Date.now();
  const toCreate = equipment.filter((eq) => {
    if (eq.recommendations.length > 0) return false;
    const base = eq.lastServiceAt ?? eq.installedAt ?? eq.createdAt;
    const dueAt = base.getTime() + eq.serviceIntervalDays! * DAY_MS;
    return dueAt - now <= LOOKAHEAD_DAYS * DAY_MS;
  });

  if (toCreate.length === 0) return;

  await db.serviceRecommendation.createMany({
    data: toCreate.map((eq) => {
      const base = eq.lastServiceAt ?? eq.installedAt ?? eq.createdAt;
      const dueAt = new Date(
        base.getTime() + eq.serviceIntervalDays! * DAY_MS,
      );
      const overdue = dueAt.getTime() < now;
      return {
        facilityId,
        equipmentId: eq.id,
        systemId: eq.systemId,
        title: `Плановое обслуживание: ${eq.name}`,
        reason: `Автоматически по регламенту — раз в ${eq.serviceIntervalDays} дн.${
          eq.lastServiceAt
            ? ` Последнее ТО: ${eq.lastServiceAt.toLocaleDateString("ru-RU")}.`
            : ""
        }`,
        severity: overdue ? ("IMPORTANT" as const) : ("ADVISORY" as const),
        status: "ACTIVE" as const,
        dueAt,
        lastServiceAt: eq.lastServiceAt,
      };
    }),
  });
}

import type { Metadata } from "next";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Журнал действий" };

/** Человекочитаемые названия действий журнала. */
const ACTION_LABEL: Record<string, string> = {
  "user.register": "Регистрация пользователя",
  "facility.create": "Создан объект",
  "facility.delete": "Удалён объект",
  "request.publish": "Опубликована заявка",
  "request.draft": "Черновик заявки",
  "offer.accept": "Принят отклик",
  "order.create": "Создан заказ",
  "organization.create": "Создана компания",
  "organization.verify": "Компания подтверждена",
  "organization.reject": "Компания отклонена",
};

export default async function AdminAuditPage() {
  await requireRole("ADMIN");

  const events = await db.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Журнал действий</h1>
      <p className="text-sm text-muted-foreground">
        Последние {events.length}{" "}
        {plural(events.length, "событие", "события", "событий")} — кто и что
        сделал на платформе.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium text-muted-foreground">Время</th>
              <th className="p-3 font-medium text-muted-foreground">Кто</th>
              <th className="p-3 font-medium text-muted-foreground">
                Действие
              </th>
              <th className="hidden p-3 font-medium text-muted-foreground md:table-cell">
                Сущность
              </th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  Журнал пуст
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-b last:border-b-0">
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {format(e.createdAt, "d.MM.yy HH:mm", { locale: ru })}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{e.actor?.name ?? "Система"}</p>
                    {e.actor && (
                      <p className="text-xs text-muted-foreground">
                        {e.actor.email}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">
                      {ACTION_LABEL[e.action] ?? e.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{e.action}</p>
                  </td>
                  <td className="hidden p-3 text-muted-foreground md:table-cell">
                    {e.entity}
                    <span className="ml-1 text-xs">
                      #{e.entityId.slice(-6)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  CabinetShell,
  type CabinetNavItem,
} from "@/components/cabinet/cabinet-shell";
import { NotificationsMenu } from "@/components/cabinet/notifications-menu";

const NAV: CabinetNavItem[] = [
  { href: "/app/contractor", label: "Обзор", icon: "dashboard", exact: true },
  { href: "/app/contractor/requests", label: "Новые заявки", icon: "inbox" },
  { href: "/app/contractor/offers", label: "Мои отклики", icon: "listChecks" },
  { href: "/app/contractor/orders", label: "Заказы", icon: "package" },
  { href: "/app/contractor/calendar", label: "Календарь", icon: "calendar" },
  { href: "/app/contractor/finance", label: "Финансы", icon: "wallet" },
  { href: "/app/contractor/reviews", label: "Отзывы", icon: "star" },
  { href: "/app/contractor/team", label: "Сотрудники", icon: "users" },
  { href: "/app/contractor/company", label: "Компания", icon: "building" },
  { href: "/app/contractor/settings", label: "Настройки", icon: "settings" },
];

export default async function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("CONTRACTOR");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <CabinetShell
      title="Кабинет исполнителя"
      items={NAV}
      user={user}
      notificationsSlot={<NotificationsMenu items={notifications} />}
    >
      {children}
    </CabinetShell>
  );
}

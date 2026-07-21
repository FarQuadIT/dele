import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  CabinetShell,
  type CabinetNavItem,
} from "@/components/cabinet/cabinet-shell";
import { NotificationsMenu } from "@/components/cabinet/notifications-menu";

const NAV: CabinetNavItem[] = [
  { href: "/admin", label: "Дашборд", icon: "gauge", exact: true },
  { href: "/admin/users", label: "Пользователи", icon: "users" },
  { href: "/admin/companies", label: "Компании", icon: "building" },
  { href: "/admin/requests", label: "Заявки", icon: "clipboard" },
  { href: "/admin/orders", label: "Заказы", icon: "package" },
  { href: "/admin/payments", label: "Платежи", icon: "creditCard" },
  { href: "/admin/control", label: "Контроль", icon: "shield" },
  { href: "/admin/services", label: "Услуги DELE", icon: "briefcase" },
  { href: "/admin/dictionaries", label: "Справочники", icon: "file" },
  { href: "/admin/audit", label: "Журнал", icon: "listChecks" },
  { href: "/admin/settings", label: "Настройки", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <CabinetShell
      title="Панель администратора"
      items={NAV}
      user={user}
      notificationsSlot={<NotificationsMenu items={notifications} />}
    >
      {children}
    </CabinetShell>
  );
}

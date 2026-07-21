import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  CabinetShell,
  type CabinetNavItem,
} from "@/components/cabinet/cabinet-shell";
import { NotificationsMenu } from "@/components/cabinet/notifications-menu";

const NAV: CabinetNavItem[] = [
  { href: "/app/customer", label: "Обзор", icon: "dashboard", exact: true },
  { href: "/app/customer/objects", label: "Объекты", icon: "building" },
  { href: "/app/customer/requests", label: "Заявки", icon: "clipboard" },
  { href: "/app/customer/orders", label: "Заказы", icon: "package" },
  { href: "/app/customer/messages", label: "Сообщения", icon: "message" },
  { href: "/app/customer/payments", label: "Платежи", icon: "wallet" },
  { href: "/app/customer/settings", label: "Настройки", icon: "settings" },
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("CUSTOMER");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <CabinetShell
      title="Кабинет заказчика"
      items={NAV}
      user={user}
      notificationsSlot={<NotificationsMenu items={notifications} />}
    >
      {children}
    </CabinetShell>
  );
}

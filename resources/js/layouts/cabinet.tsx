import {CabinetShell, type CabinetNavItem} from '@/components/cabinet/cabinet-shell';
import {NotificationsMenu,type NotificationItem} from '@/components/cabinet/notifications-menu';
import {usePage} from '@inertiajs/react';
import type {ReactNode} from 'react';
const customerNav:CabinetNavItem[]=[
  { href: "/app/customer", label: "Обзор", icon: "dashboard", exact: true },
  { href: "/app/customer/objects", label: "Объекты", icon: "building" },
  { href: "/app/customer/requests", label: "Заявки", icon: "clipboard" },
  { href: "/app/customer/orders", label: "Заказы", icon: "package" },
  { href: "/app/customer/messages", label: "Сообщения", icon: "message" },
  { href: "/app/customer/payments", label: "Платежи", icon: "wallet" },
  { href: "/app/customer/settings", label: "Настройки", icon: "settings" },
];
const contractorNav:CabinetNavItem[]=[
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
const adminNav:CabinetNavItem[]=[
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
export function CabinetLayout({children}:{children:ReactNode}) {
 const {auth,notifications}=usePage<{auth:{user:{name:string;email:string;role:string}},notifications:NotificationItem[]}>().props;
 const role=auth.user.role;
 return <CabinetShell title={role==='ADMIN'?'Администрирование':role==='CONTRACTOR'?'Кабинет исполнителя':'Кабинет заказчика'} user={auth.user} items={role==='ADMIN'?adminNav:role==='CONTRACTOR'?contractorNav:customerNav} notificationsSlot={<NotificationsMenu items={notifications}/>}>{children}</CabinetShell>;
}

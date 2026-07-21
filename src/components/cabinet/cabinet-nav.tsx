"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  HardHat,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Имя иконки строкой — чтобы серверные лейауты могли передавать конфиг без функций. */
const ICONS = {
  home: Home,
  building: Building2,
  clipboard: ClipboardList,
  package: Package,
  message: MessageSquare,
  wallet: Wallet,
  settings: Settings,
  bell: Bell,
  gauge: Gauge,
  users: Users,
  shield: ShieldCheck,
  file: FileText,
  inbox: Inbox,
  listChecks: ListChecks,
  calendar: Calendar,
  creditCard: CreditCard,
  star: Star,
  wrench: Wrench,
  hardhat: HardHat,
  dashboard: LayoutDashboard,
  briefcase: Briefcase,
} satisfies Record<string, LucideIcon>;

export type CabinetNavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  exact?: boolean;
};

export function CabinetNav({ items }: { items: CabinetNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

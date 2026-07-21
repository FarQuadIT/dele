import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { CabinetNav, type CabinetNavItem } from "./cabinet-nav";
import { UserMenu } from "./user-menu";

export type { CabinetNavItem };

export function CabinetShell({
  title,
  items,
  user,
  notificationsSlot,
  children,
}: {
  title: string;
  items: CabinetNavItem[];
  user: { name?: string | null; email?: string | null };
  notificationsSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-1">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <Link href="/" className="text-lg font-black tracking-widest text-primary">
            DELE
          </Link>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
        <CabinetNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="md:hidden">
            <Link href="/" className="font-black tracking-widest text-primary">
              DELE
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {notificationsSlot}
            <ThemeToggle />
            <UserMenu name={user.name ?? "Пользователь"} email={user.email ?? ""} />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Сотрудники" };

const ROLE_LABEL = {
  OWNER: "Владелец",
  MANAGER: "Менеджер",
  EMPLOYEE: "Сотрудник",
} as const;

export default async function TeamPage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  const members = org
    ? await db.organizationMember.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, email: true } } },
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Сотрудники</h1>
      <p className="text-sm text-muted-foreground">
        Команда компании и роли доступа. Приглашения по e-mail — на этапе
        интеграций.
      </p>

      {members.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Users className="size-10 text-muted-foreground" />
          <p className="font-medium">Сначала создайте компанию</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {members.map((m) => (
            <Card key={m.id} className="shadow-card">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {(m.user.name ?? "?")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.user.name ?? "Без имени"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {m.position ?? m.user.email}
                  </p>
                </div>
                <Badge
                  variant={m.role === "OWNER" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {ROLE_LABEL[m.role]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

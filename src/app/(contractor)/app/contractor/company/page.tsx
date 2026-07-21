import type { Metadata } from "next";
import { BadgeCheck, Clock, ShieldAlert, XCircle } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyForm } from "@/components/contractor/company-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Компания" };

const STATUS_VIEW = {
  VERIFIED: {
    icon: BadgeCheck,
    tone: "border-success/40 bg-success/8 text-success",
    title: "Компания проверена",
    text: "Вы получаете заявки и можете отправлять отклики.",
  },
  PENDING: {
    icon: Clock,
    tone: "border-warning/40 bg-warning/8 text-warning",
    title: "Профиль на модерации",
    text: "Обычно проверка занимает 1–2 рабочих дня. Отклики станут доступны после подтверждения.",
  },
  UNVERIFIED: {
    icon: ShieldAlert,
    tone: "border-border bg-muted/50 text-muted-foreground",
    title: "Профиль не отправлен на проверку",
    text: "Заполните данные компании — и отправьте профиль на модерацию.",
  },
  REJECTED: {
    icon: XCircle,
    tone: "border-destructive/40 bg-destructive/8 text-destructive",
    title: "Профиль отклонён",
    text: "Проверьте замечания модератора и обновите данные.",
  },
} as const;

export default async function CompanyPage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  const status = STATUS_VIEW[org?.verificationStatus ?? "UNVERIFIED"];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Профиль компании</h1>
      <p className="text-sm text-muted-foreground">
        Эти данные видят заказчики в ваших откликах.
      </p>

      <div
        className={cn(
          "mt-6 flex items-start gap-3 rounded-2xl border p-4",
          status.tone,
        )}
      >
        <status.icon className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">{status.title}</p>
          <p className="mt-0.5 text-sm opacity-80">{status.text}</p>
          {org?.verificationNote && (
            <p className="mt-1.5 rounded-lg bg-background/60 p-2 text-sm">
              Комментарий модератора: {org.verificationNote}
            </p>
          )}
        </div>
      </div>

      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">
            {org ? "Данные компании" : "Новая компания"}
          </CardTitle>
          <CardDescription>
            Название, ИНН и специализации участвуют в проверке.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm
            isNew={!org}
            defaults={{
              name: org?.name ?? "",
              inn: org?.inn ?? "",
              description: org?.description ?? "",
              phone: org?.phone ?? "",
              email: org?.email ?? "",
              website: org?.website ?? "",
              specializations: Array.isArray(org?.specializations)
                ? (org.specializations as string[])
                : [],
              regionsServed: Array.isArray(org?.regionsServed)
                ? (org.regionsServed as string[]).join(", ")
                : "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}

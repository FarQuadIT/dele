import type {Facility,ChatThread,Payment,Order,OrganizationMember,Review,Organization} from '@/types/models';
import Link from "@/compat/link";
import { MessagesSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export default function AccountPage({threads,user}:{threads:ChatThread[];user:{id:string}}) {
  const items = threads
    .filter((t) => t.messages.length > 0)
    .map((t) => {
      const last = t.messages[0];
      const isOrder = t.kind === "ORDER" && t.order;
      const title = isOrder
        ? `${t.order!.request.title} — ${t.order!.organization.name}`
        : t.offer
          ? `${t.offer.request.title} — ${t.offer.organization.name}`
          : (t.request?.title ?? "Диалог");
      const href = isOrder
        ? `/app/customer/orders/${t.order!.id}`
        : t.request
          ? `/app/customer/requests/${t.request.id}`
          : t.offer
            ? `/app/customer/requests/${t.offer.request.id}`
            : "/app/customer/requests";
      return {
        id: t.id,
        title,
        href,
        kind: t.kind,
        last,
        lastAt: last.createdAt,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Сообщения</h1>
      <p className="text-sm text-muted-foreground">
        Все диалоги по заявкам и заказам.
      </p>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <MessagesSquare className="size-10 text-muted-foreground" />
          <p className="font-medium">Диалогов пока нет</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Чаты появляются, когда исполнители откликаются на ваши заявки.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((t) => (
            <Link key={t.id} href={t.href} className="block">
              <Card className="shadow-card transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <MessagesSquare className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{t.title}</p>
                      <Badge variant="outline" className="shrink-0">
                        {t.kind === "ORDER" ? "заказ" : "заявка"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {t.last.author.id === user.id
                        ? "Вы: "
                        : `${t.last.author.name ?? ""}: `}
                      {t.last.body}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(t.lastAt, {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

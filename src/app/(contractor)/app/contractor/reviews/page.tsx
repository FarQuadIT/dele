import type { Metadata } from "next";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { getContractorOrg } from "@/lib/contractor";
import { Card, CardContent } from "@/components/ui/card";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Отзывы" };

export default async function ReviewsPage() {
  const user = await requireRole("CONTRACTOR");
  const { org } = await getContractorOrg(user.id);

  const reviews = org
    ? await db.review.findMany({
        where: { targetOrgId: org.id, direction: "CUSTOMER_TO_CONTRACTOR" },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true } },
          order: { select: { request: { select: { title: true } } } },
        },
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Отзывы</h1>
          <p className="text-sm text-muted-foreground">
            Рейтинг влияет на доверие заказчиков и позицию в откликах.
          </p>
        </div>
        {org && org.ratingCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-card">
            <Star className="size-5 fill-warning text-warning" />
            <span className="text-2xl font-bold">
              {org.ratingAvg.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              {org.ratingCount}{" "}
              {plural(org.ratingCount, "отзыв", "отзыва", "отзывов")}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Star className="size-10 text-muted-foreground" />
          <p className="font-medium">Отзывов пока нет</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Отзывы появляются после завершения заказов.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="shadow-card">
              <CardContent className="space-y-2 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {r.author.name ?? "Заказчик"}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {r.order.request.title}
                    </span>
                  </p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "size-4",
                          n <= r.rating
                            ? "fill-warning text-warning"
                            : "text-border",
                        )}
                      />
                    ))}
                  </div>
                </div>
                {r.text && <p className="text-sm leading-relaxed">{r.text}</p>}
                <p className="text-xs text-muted-foreground">
                  {format(r.createdAt, "d MMMM yyyy", { locale: ru })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

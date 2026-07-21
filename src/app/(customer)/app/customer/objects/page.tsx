import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FacilityFormDialog } from "@/components/customer/facility-form-dialog";
import { FacilityDeleteButton } from "@/components/customer/facility-delete-button";
import { facilityTypeLabels } from "@/lib/validation/facility";

export const metadata: Metadata = { title: "Объекты" };

export default async function ObjectsPage() {
  const user = await requireRole("CUSTOMER");

  const facilities = await db.facility.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      systems: true,
      _count: { select: { requests: true, orders: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Объекты</h1>
          <p className="text-sm text-muted-foreground">
            Ваши дома, квартиры и помещения с цифровыми профилями.
          </p>
        </div>
        <FacilityFormDialog />
      </div>

      {facilities.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Building2 className="size-10 text-muted-foreground" />
          <p className="font-medium">Пока нет ни одного объекта</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Добавьте первый объект — и начните вести его цифровой профиль.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {facilities.map((f) => (
            <Card
              key={f.id}
              className="relative shadow-card transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">
                      <Link
                        href={`/app/customer/objects/${f.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {f.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1">
                      <MapPin className="size-3.5 shrink-0" />
                      {f.address}
                    </CardDescription>
                  </div>
                  <div className="relative z-10">
                    <FacilityDeleteButton id={f.id} title={f.title} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    {facilityTypeLabels[f.type]}
                  </Badge>
                  {f.area && <Badge variant="outline">{f.area} м²</Badge>}
                  {f.floorsCount && (
                    <Badge variant="outline">
                      {f.floorsCount}{" "}
                      {f.floorsCount === 1 ? "этаж" : "этажа(ей)"}
                    </Badge>
                  )}
                  {f.buildYear && (
                    <Badge variant="outline">{f.buildYear} г.</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Систем: {f.systems.length} · Заявок: {f._count.requests} ·
                    Заказов: {f._count.orders}
                  </span>
                  <ArrowRight className="size-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

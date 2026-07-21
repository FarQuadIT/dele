import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { ensureAutoRecommendations } from "@/lib/recommendations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { facilityTypeLabels } from "@/lib/validation/facility";
import { FacilityTabs } from "@/components/customer/facility/facility-tabs";

export const metadata: Metadata = { title: "Объект" };

export default async function FacilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; eq?: string }>;
}) {
  const user = await requireRole("CUSTOMER");
  const { id } = await params;
  const { tab, eq } = await searchParams;

  // Авто-рекомендации по регламенту ТО (идемпотентно)
  await ensureAutoRecommendations(id);

  const facility = await db.facility.findFirst({
    where: { id, ownerId: user.id },
    include: {
      buildings: {
        orderBy: { createdAt: "asc" },
        include: {
          floors: {
            orderBy: { number: "asc" },
            include: { zones: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
      systems: {
        orderBy: { createdAt: "asc" },
        include: { subsystems: true },
      },
      equipment: {
        orderBy: { createdAt: "asc" },
        include: {
          system: { select: { id: true, type: true, name: true } },
          subsystem: { select: { id: true, name: true } },
          zone: {
            select: {
              id: true,
              name: true,
              floor: {
                select: {
                  id: true,
                  number: true,
                  name: true,
                  building: { select: { id: true, name: true } },
                },
              },
            },
          },
          versions: {
            orderBy: { version: "desc" },
            include: { author: { select: { name: true } } },
          },
          documents: {
            include: { versions: { orderBy: { version: "desc" }, take: 1 } },
          },
          recommendations: { where: { status: "ACTIVE" } },
        },
      },
      documents: {
        orderBy: { updatedAt: "desc" },
        include: {
          versions: { orderBy: { version: "desc" } },
          equipment: { select: { name: true } },
        },
      },
      recommendations: {
        orderBy: [{ severity: "desc" }, { dueAt: "asc" }],
        include: {
          equipment: { select: { id: true, name: true } },
          system: { select: { type: true, name: true } },
        },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        include: {
          equipment: { select: { id: true, name: true } },
          author: { select: { name: true } },
          authorOrg: { select: { name: true } },
        },
      },
      orders: {
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          request: { select: { title: true } },
          organization: { select: { name: true } },
        },
      },
    },
  });

  if (!facility) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/app/customer/objects">
          <ArrowLeft className="size-4" />
          Все объекты
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {facility.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {facility.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{facilityTypeLabels[facility.type]}</Badge>
          {facility.area && <Badge variant="outline">{facility.area} м²</Badge>}
          {facility.buildYear && (
            <Badge variant="outline">{facility.buildYear} г.</Badge>
          )}
        </div>
      </div>

      <FacilityTabs
        facility={facility}
        defaultTab={tab}
        initialEquipmentId={eq}
      />
    </main>
  );
}

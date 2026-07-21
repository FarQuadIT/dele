import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { RequestWizard } from "@/components/customer/requests/request-wizard";

export const metadata: Metadata = { title: "Новая заявка" };

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    facility?: string;
    equipment?: string;
    type?: string;
  }>;
}) {
  const user = await requireRole("CUSTOMER");
  const params = await searchParams;

  const facilities = await db.facility.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      address: true,
      systems: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, type: true },
      },
      equipment: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, systemId: true },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-8">
      <RequestWizard
        facilities={facilities}
        initialFacilityId={params.facility}
        initialEquipmentId={params.equipment}
        initialType={params.type}
        contactDefaults={{ name: user.name ?? "", phone: "" }}
      />
    </main>
  );
}

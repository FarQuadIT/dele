import type {Facility,ChatThread,Payment,Order,OrganizationMember,Review,Organization} from '@/types/models';
import Link from "@/compat/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { facilityTypeLabels } from "@/lib/validation/facility";
import { FacilityTabs } from "@/components/customer/facility/facility-tabs";


export default function AccountPage({facility,tab,eq}:{facility:Facility;tab?:string;eq?:string}) {
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

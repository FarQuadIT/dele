import type {Request as ServiceRequest,Facility} from '@/types/models';
import { RequestWizard } from "@/components/customer/requests/request-wizard";


export default function NewRequestPage({facilities,params,user}:{facilities:Facility[];params:{facility?:string;equipment?:string;type?:string};user:{name:string}}) {
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

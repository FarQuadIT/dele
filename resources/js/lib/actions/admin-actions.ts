import {postAction} from '@/actions/http';
export const moderateOrganization=(input:{organizationId:string;decision:'VERIFIED'|'REJECTED';note?:string})=>postAction('/actions/company/moderate',input);

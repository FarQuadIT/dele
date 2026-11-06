import {postAction} from '@/actions/http';
export const requestInspection=(orderId:string)=>postAction('/actions/inspections/request',{orderId});
export const openDispute=(input:{orderId:string;subject:string;description?:string})=>postAction('/actions/disputes/open',input);
export const concludeInspection=(input:{inspectionId:string;passed:boolean;conclusion:string})=>postAction('/actions/inspections/conclude',input);
export const resolveDispute=(input:{disputeId:string;outcome:'RESOLVED_CUSTOMER'|'RESOLVED_CONTRACTOR'|'RESOLVED_COMPROMISE';resolution:string})=>postAction('/actions/disputes/resolve',input);

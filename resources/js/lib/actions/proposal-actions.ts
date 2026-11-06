import {postAction} from '@/actions/http';
export const proposeProfileChange=(input:{orderId:string;equipmentId:string;changes:Record<string,unknown>;comment?:string})=>postAction<{proposalId:string}>('/actions/proposals/create',input);
export const decideProfileChange=(input:{proposalId:string;decision:'APPROVED'|'REJECTED'|'CLARIFICATION';decisionComment?:string})=>postAction('/actions/proposals/decide',input);

import {postAction} from '@/actions/http';
export const upsertOrganization=(input:{name:string;inn?:string;description?:string;phone?:string;email?:string;website?:string;specializations?:string[];regionsServed?:string})=>postAction<{id:string}>('/actions/company',input);

export const submitOffer=(input:{requestId:string;priceTotal:string|number;priceMaterials?:string|number;isEstimate:boolean;durationDays?:string|number;warrantyMonths?:string|number;comment?:string;stagesPlan?:string})=>postAction<{id:string}>('/actions/contractor/offers/create',input);
export const withdrawOffer=(offerId:string)=>postAction('/actions/contractor/offers/withdraw',{offerId});
export const contractorSendOfferMessage=(input:{offerId:string;body:string})=>postAction('/actions/contractor/offers/message',input);
export const contractorSendOrderMessage=(input:{orderId:string;body:string})=>postAction('/actions/contractor/orders/message',input);
export const startStage=(input:{orderId:string;stageId:string})=>postAction('/actions/contractor/stages/start',input);
export const completeStage=(input:{orderId:string;stageId:string;note?:string})=>postAction('/actions/contractor/stages/complete',input);
export const submitForAcceptance=(orderId:string)=>postAction('/actions/contractor/orders/submit',{orderId});

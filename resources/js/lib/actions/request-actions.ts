import {postAction} from '@/actions/http';
import type {CreateRequestInput} from '@/lib/validation/request';
export const createRequest=(input:CreateRequestInput,mode:'draft'|'publish')=>postAction<{id:string}>('/actions/requests/create',{...input,mode});
export const publishRequest=(id:string)=>postAction('/actions/requests/publish',{id});
export const cancelRequest=(id:string)=>postAction('/actions/requests/cancel',{id});
export const acceptOffer=(offerId:string)=>postAction('/actions/offers/accept',{offerId});
export const declineOffer=(offerId:string)=>postAction('/actions/offers/decline',{offerId});
export const sendOfferMessage=(input:{offerId:string;body:string})=>postAction('/actions/offers/message',input);

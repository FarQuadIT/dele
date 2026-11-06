import {postAction} from '@/actions/http';
export const convertRequestToOrder=(id:string)=>postAction<{orderId:string}>('/actions/orders/create',{id});

export const acceptWork=(orderId:string)=>postAction('/actions/orders/accept',{orderId});
export const requestRework=(input:{orderId:string;reason:string})=>postAction('/actions/orders/rework',input);
export const payFinal=(orderId:string)=>postAction('/actions/orders/pay',{orderId});
export const submitReview=(input:{orderId:string;rating:number;text?:string})=>postAction('/actions/orders/review',input);
export const sendOrderMessage=(input:{orderId:string;body:string})=>postAction('/actions/orders/message',input);

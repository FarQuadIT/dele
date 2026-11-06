import {postAction} from '@/actions/http';
export const dismissRecommendation=(recommendationId:string)=>postAction('/actions/recommendations/dismiss',{recommendationId});
export const postponeRecommendation=(recommendationId:string)=>postAction('/actions/recommendations/postpone',{recommendationId});

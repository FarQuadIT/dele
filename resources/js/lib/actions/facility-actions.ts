import {postAction} from '@/actions/http';
import type {CreateFacilityInput} from '@/lib/validation/facility';
export const createFacility=(input:CreateFacilityInput)=>postAction<{id:string}>('/actions/facilities/create',input);
export const deleteFacility=(id:string)=>postAction('/actions/facilities/delete',{id});

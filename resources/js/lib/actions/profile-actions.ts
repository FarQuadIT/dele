import {postAction} from '@/actions/http';
export const updateProfile=(input:{name:string;phone?:string})=>postAction('/actions/profile',input);

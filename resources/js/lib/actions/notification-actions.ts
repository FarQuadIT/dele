import {postAction} from '@/actions/http';
export const markAllNotificationsRead=()=>postAction('/actions/notifications/read',{});

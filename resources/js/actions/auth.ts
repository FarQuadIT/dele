import type { ActionResult } from '@/lib/action-result';
async function send<T>(url:string, body:unknown): Promise<ActionResult<T>> {
  try {
    const response=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''},body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok) return {ok:false,error:data.message ?? 'Не удалось выполнить запрос',fieldErrors:data.errors};
    // Laravel rotates the session/CSRF token at login; the next navigation loads fresh markup.
    return data;
  } catch { return {ok:false,error:'Нет связи с сервером. Попробуйте ещё раз.'}; }
}
export const loginUser=(input:{email:string;password:string})=>send<{home:string}>('/auth/login',input);
export const registerUser=(input:{name:string;email:string;password:string;phone?:string;role:'CUSTOMER'|'CONTRACTOR'})=>send('/auth/register',input);

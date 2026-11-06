import type {ActionResult} from '@/lib/action-result';
export async function postAction<T=undefined>(url:string,body:unknown):Promise<ActionResult<T>> {
  try {
    const response=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-TOKEN':document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''},body:JSON.stringify(body)});
    const data=await response.json();
    return response.ok?data:{ok:false,error:data.message ?? 'Не удалось выполнить запрос',fieldErrors:data.errors};
  }catch{return {ok:false,error:'Нет связи с сервером. Попробуйте ещё раз.'};}
}

export async function signOutAction() {
  const response=await fetch('/auth/logout',{method:'POST',headers:{Accept:'application/json','X-CSRF-TOKEN':document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''}});
  if(response.ok) window.location.assign('/');
}

/// <reference types="vite/client" />
import { createInertiaApp, usePage } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { SiteHeader } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';
import { LenisProvider } from '@/components/public/lenis-provider';
import '../css/app.css';
import {CabinetLayout} from '@/layouts/cabinet';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
function PublicLayout({children}:{children:ReactNode}) {
  const { auth }=usePage<{auth:{user:null|{name:string;role:string}}}>().props;
  const user=auth.user;
  const home=user?.role==='ADMIN'?'/admin':user?.role==='CONTRACTOR'?'/app/contractor':'/app/customer';
  return <LenisProvider><SiteHeader authState={user?{name:user.name,homeHref:home}:null}/><div className="flex flex-1 flex-col">{children}</div><SiteFooter/></LenisProvider>;
}
createInertiaApp({
  title: title => title ? `${title} — DELE` : 'DELE — все инженерные системы дома под контролем',
  resolve: async name => {
    const pages=import.meta.glob<{default: React.ComponentType & {layout?:(page:ReactNode)=>ReactNode}}>('./pages/**/*.tsx');
    const load=pages[`./pages/${name}.tsx`];
    if(!load) throw new Error(`Unknown page: ${name}`);
    const page=await load();
    if(name.startsWith('public/')) page.default.layout=(p:ReactNode)=><PublicLayout>{p}</PublicLayout>;
    else page.default.layout=(p:ReactNode)=><CabinetLayout>{p}</CabinetLayout>;
    return page;
  },
  setup({el,App,props}) { createRoot(el).render(<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><App {...props}/><Toaster position="top-center" richColors/></ThemeProvider>); },
});

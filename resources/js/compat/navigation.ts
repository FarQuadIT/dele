import { router, usePage } from '@inertiajs/react';
export const usePathname = () => usePage().url.split('?')[0];
export const useSearchParams = () => new URLSearchParams(usePage().url.split('?')[1] ?? '');
export const useRouter = () => ({ push: (url: string, options?: {scroll?:boolean}) => router.visit(url,{preserveScroll:options?.scroll===false}), replace: (url: string, options?: {scroll?:boolean}) => router.visit(url, {replace:true,preserveScroll:options?.scroll===false}), refresh: () => router.reload(), back: () => history.back() });

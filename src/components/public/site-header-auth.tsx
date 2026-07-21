import { SiteHeader } from "@/components/public/site-header";
import { auth, roleHome } from "@/lib/auth";

/**
 * Читает сессию отдельно от статической оболочки лендинга (см. Next.js
 * «instant navigation»): оборачивается в <Suspense> в layout, поэтому
 * не превращает статичные публичные страницы в полностью динамические.
 */
export async function SiteHeaderAuth() {
  const session = await auth();
  const authState = session?.user
    ? {
        name: session.user.name ?? session.user.email ?? "Аккаунт",
        homeHref: roleHome(session.user.role),
      }
    : null;

  return <SiteHeader authState={authState} />;
}

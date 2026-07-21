import { Suspense } from "react";
import { LenisProvider } from "@/components/public/lenis-provider";
import { SiteHeader } from "@/components/public/site-header";
import { SiteHeaderAuth } from "@/components/public/site-header-auth";
import { SiteFooter } from "@/components/public/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LenisProvider>
      <Suspense fallback={<SiteHeader authState={null} />}>
        <SiteHeaderAuth />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </LenisProvider>
  );
}

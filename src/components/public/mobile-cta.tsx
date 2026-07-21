"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/** Закреплённая нижняя CTA на мобильных: появляется после первого экрана. */
export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 p-3 backdrop-blur-md transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Button asChild className="w-full" size="lg">
        <Link
          href="/register?role=customer&source=landing&section=mobile-cta"
          onClick={() =>
            track({ name: "hero_customer_cta_click" }, { section: "mobile-cta" })
          }
        >
          Создать цифровой профиль
        </Link>
      </Button>
    </div>
  );
}

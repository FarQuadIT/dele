"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { track } from "@/lib/analytics";

export function FinalCtaSection() {
  return (
    <section id="registration" className="scroll-mt-20 py-24">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-float md:px-16">
            {/* Декоративные пятна */}
            <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-teal/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-white/10 blur-3xl" />

            <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Начните с одного объекта. Возьмите под контроль все его системы.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-pretty opacity-85">
              Создайте цифровой профиль самостоятельно или пригласите
              специалиста, который поможет собрать сведения об оборудовании и
              документах.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link
                  href="/register?role=customer&source=landing&section=final-cta"
                  onClick={() =>
                    track({ name: "hero_customer_cta_click" }, { section: "final-cta" })
                  }
                >
                  Создать профиль объекта
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
              >
                <Link
                  href="/register?role=contractor&source=landing&section=final-cta"
                  onClick={() => track({ name: "business_registration_click" }, { section: "final-cta" })}
                >
                  Я представляю компанию
                </Link>
              </Button>
            </div>
            <p className="relative mt-5 text-sm opacity-70">
              Бесплатная регистрация. Профиль можно заполнять постепенно.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

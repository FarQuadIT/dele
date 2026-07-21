"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const HouseCanvas = dynamic(() => import("./house-canvas"), { ssr: false });

const SYSTEM_STATUS = [
  { name: "Вода", status: "Работает", tone: "ok", dot: "bg-system-water" },
  { name: "Отопление", status: "ТО через 18 дней", tone: "warn", dot: "bg-system-heat" },
  { name: "Вентиляция", status: "Требует внимания", tone: "alert", dot: "bg-system-air" },
  { name: "Электричество", status: "Работает", tone: "ok", dot: "bg-system-electric" },
] as const;

/** Подпись слоя, появляющаяся в своём диапазоне прокрутки. */
function LayerCallout({
  progress,
  range,
  className,
  title,
  text,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
  title: string;
  text: string;
}) {
  const [start, end] = range;
  const fadeSpan = Math.min(0.06, (end - start) / 3);
  const opacity = useTransform(
    progress,
    [start, start + fadeSpan, end - fadeSpan, end],
    [0, 1, 1, 0],
  );
  const y = useTransform(progress, [start, start + fadeSpan], [14, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className={cn(
        "pointer-events-none absolute z-10 max-w-56 rounded-xl border bg-card/85 p-3.5 shadow-float backdrop-blur-md",
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </motion.div>
  );
}

function StatusCard({
  name,
  status,
  tone,
  dot,
  delay,
}: (typeof SYSTEM_STATUS)[number] & { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card/85 px-3.5 py-2.5 shadow-card backdrop-blur-md"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className={cn("size-2.5 rounded-full", dot)} />
        {name}
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          tone === "ok" && "text-success",
          tone === "warn" && "text-warning",
          tone === "alert" && "text-destructive",
        )}
      >
        {status}
      </span>
    </motion.div>
  );
}

export function HeroSection() {
  const wrapperRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const cinematic = isDesktop === true && !reduceMotion;

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });
  const still = useMotionValue(0);
  const progress = cinematic ? smooth : still;

  // Затухание вводного текста при старте «разбора»
  const introOpacity = useTransform(smooth, [0, 0.09], [1, 0]);
  const introY = useTransform(smooth, [0, 0.09], [0, -28]);
  const introPointer = useTransform(smooth, (v) =>
    v > 0.06 ? ("none" as const) : ("auto" as const),
  );
  const statusOpacity = useTransform(smooth, [0, 0.08], [1, 0]);
  const hintOpacity = useTransform(smooth, [0, 0.05], [1, 0]);
  const finalOpacity = useTransform(smooth, [0.8, 0.9], [0, 1]);
  const finalY = useTransform(smooth, [0.8, 0.9], [24, 0]);
  const finalPointer = useTransform(smooth, (v) =>
    v > 0.82 ? ("auto" as const) : ("none" as const),
  );

  useEffect(() => {
    track({ name: "landing_view" });
  }, []);

  const intro = (
    <div className="relative z-10 flex max-w-xl flex-col items-start gap-6">
      <p className="rounded-full border bg-card/70 px-3.5 py-1 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur">
        Цифровое управление инженерными системами объекта
      </p>
      <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
        Все системы вашего дома — под&nbsp;контролем.
        <span className="text-primary"> Без папок, звонков и авралов.</span>
      </h1>
      <p className="max-w-lg text-pretty text-base text-muted-foreground sm:text-lg">
        Храните документы и сведения об оборудовании, следите за сроками
        обслуживания, вызывайте специалистов и сохраняйте всю историю работ в
        одном цифровом профиле.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg" className="shadow-float">
          <Link
            href="/register?role=customer&source=landing&section=hero"
            onClick={() => track({ name: "hero_customer_cta_click" }, { section: "hero" })}
          >
            Создать цифровой профиль
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-card/70 backdrop-blur">
          <Link
            href="/register?role=customer&source=landing&section=hero&next=/app/customer/requests"
            onClick={() => track({ name: "hero_profile_assistance_click" }, { section: "hero" })}
          >
            Заказать помощь специалиста
          </Link>
        </Button>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {[
          "Документы и оборудование в одном месте",
          "Напоминания о плановом обслуживании",
          "Исполнители уже знают, с какой системой предстоит работать",
        ].map((b) => (
          <li key={b} className="flex items-center gap-2">
            <Check className="size-4 text-teal" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );

  const statusCards = (
    <div className="flex w-64 flex-col gap-2.5">
      {SYSTEM_STATUS.map((s, i) => (
        <StatusCard key={s.name} {...s} delay={0.5 + i * 0.12} />
      ))}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-1 text-center text-xs text-muted-foreground"
      >
        Объект: Загородный дом · живой статус систем
      </motion.p>
    </div>
  );

  // Мобильный/уменьшенный вариант: статичная сцена без прокрутки-скраба
  if (isDesktop === false || reduceMotion) {
    return (
      <section id="hero" className="relative overflow-hidden pt-28 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_20%,oklch(0.95_0.03_190/60%),transparent_70%)]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 md:px-6">
          {intro}
          <div className="relative h-105 w-full sm:h-120">
            {isDesktop !== null && <HouseCanvas progress={still} />}
            <div className="absolute right-2 bottom-2 sm:right-6 sm:bottom-6">
              {statusCards}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" ref={wrapperRef} className="relative h-[420vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_72%_30%,oklch(0.95_0.03_190/55%),transparent_70%)]" />

        {/* 3D-сцена на весь вьюпорт; дом стартует справа от текста */}
        <div className="absolute inset-0">
          {isDesktop && <HouseCanvas progress={progress} sideOffset={-5.2} />}
        </div>

        {/* Вводный слой: заголовок + CTA слева, статусы справа */}
        <motion.div
          style={{ opacity: introOpacity, y: introY, pointerEvents: introPointer }}
          className="absolute inset-0"
        >
          <div className="mx-auto flex h-full w-full max-w-6xl items-center px-6">
            {intro}
            <motion.div
              style={{ opacity: statusOpacity }}
              className="absolute right-8 bottom-14 hidden xl:block"
            >
              {statusCards}
            </motion.div>
          </div>
        </motion.div>

        {/* Подписи слоёв по мере «разбора» */}
        <LayerCallout
          progress={smooth}
          range={[0.13, 0.33]}
          className="right-[12%] top-[16%]"
          title="Кровля и дымоход"
          text="Материалы, узлы примыканий, сроки ревизии — всё зафиксировано в профиле."
        />
        <LayerCallout
          progress={smooth}
          range={[0.24, 0.46]}
          className="left-[10%] top-[30%]"
          title="Второй этаж"
          text="Зоны и помещения с привязкой оборудования: кондиционеры, тёплые полы, датчики."
        />
        <LayerCallout
          progress={smooth}
          range={[0.36, 0.58]}
          className="right-[10%] top-[52%]"
          title="Первый этаж и котельная"
          text="Котёл, насосная группа, коллекторы — с паспортами и историей обслуживания."
        />
        <LayerCallout
          progress={smooth}
          range={[0.5, 0.72]}
          className="left-[12%] top-[62%]"
          title="Инженерный скелет"
          text="Вода, отопление, вентиляция и электрика видны как единая живая система."
        />

        {/* Финальный слой: кульминация «это цифровой профиль» */}
        <motion.div
          style={{ opacity: finalOpacity, y: finalY, pointerEvents: finalPointer }}
          className="absolute inset-x-0 bottom-16 z-10"
        >
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Это и есть цифровой профиль вашего дома
            </h2>
            <p className="text-pretty text-muted-foreground">
              Каждая часть здания и каждая система — с документами, оборудованием
              и историей работ.
            </p>
            <Button asChild size="lg" className="shadow-float">
              <a href="#digital-profile">Посмотреть, как он устроен</a>
            </Button>
          </div>
        </motion.div>

        {/* Хинт прокрутки */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-5 z-10 flex justify-center"
        >
          <div className="flex items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <ArrowDown className="size-3.5 animate-bounce" />
            Прокрутите — дом разберётся на системы
          </div>
        </motion.div>
      </div>
    </section>
  );
}

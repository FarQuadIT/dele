"use client";

import dynamic from "next/dynamic";
import { useMotionValue, useSpring } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Layers3 } from "lucide-react";

const MiniHouseCanvas = dynamic(() => import("./mini-house-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Загружаем 3D-модель…
    </div>
  ),
});

/**
 * Интерактивная версия hero-виджета: пользователь сам «разбирает» дом
 * ползунком и видит инженерные слои объекта.
 */
export function FacilityHouseWidget() {
  const raw = useMotionValue(0);
  const progress = useSpring(raw, { stiffness: 120, damping: 24, mass: 0.6 });
  const [value, setValue] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const v = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      raw.set(v);
      setValue(v);
    },
    [raw],
  );

  return (
    <div className="relative h-105 overflow-hidden rounded-2xl border bg-gradient-to-b from-secondary/50 to-background">
      <MiniHouseCanvas progress={progress} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 p-4">
        <Layers3 className="size-4 text-primary" />
        <p className="text-sm font-medium">
          {value < 0.15
            ? "Дом в сборе"
            : value < 0.7
              ? "Разбираем по слоям"
              : "Инженерный скелет"}
        </p>
      </div>

      {/* Слайдер «Разобрать дом» */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div
          ref={trackRef}
          role="slider"
          aria-label="Разобрать дом по слоям"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value * 100)}
          tabIndex={0}
          className="group relative h-8 cursor-pointer touch-none select-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) setFromClientX(e.clientX);
          }}
          onKeyDown={(e) => {
            const step = 0.1;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              const v = Math.min(1, value + step);
              raw.set(v);
              setValue(v);
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              const v = Math.max(0, value - step);
              raw.set(v);
              setValue(v);
            }
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-75"
              style={{ width: `${value * 100}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-md transition-transform group-hover:scale-110"
            style={{ left: `${value * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Фасад</span>
          <span>Слои</span>
          <span>Системы</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrackerStage = {
  name: string;
  status: "DONE" | "IN_PROGRESS" | "PENDING";
  meta?: string;
};

/**
 * Анимированный трекер этапов заказа (как трекинг доставки).
 * Используется на лендинге (#work-control) и в карточке заказа (Phase 3.8).
 */
export function StageTracker({
  stages,
  className,
  animated = true,
}: {
  stages: TrackerStage[];
  className?: string;
  animated?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const animate = animated && !reduceMotion;

  return (
    <ol className={cn("relative flex flex-col gap-0", className)}>
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        return (
          <li key={stage.name} className="relative flex gap-4">
            {/* Линия к следующему этапу */}
            {!isLast && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 bg-border">
                {(stage.status === "DONE" ||
                  stage.status === "IN_PROGRESS") && (
                  <motion.span
                    initial={animate ? { scaleY: 0 } : false}
                    whileInView={{ scaleY: stage.status === "DONE" ? 1 : 0.45 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.18 + 0.2,
                      ease: "easeOut",
                    }}
                    className="block h-full w-full origin-top bg-primary"
                  />
                )}
              </span>
            )}

            {/* Узел */}
            <motion.span
              initial={animate ? { scale: 0.4, opacity: 0 } : false}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
                delay: i * 0.18,
              }}
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                stage.status === "DONE" &&
                  "border-primary bg-primary text-primary-foreground",
                stage.status === "IN_PROGRESS" &&
                  "border-primary bg-card text-primary",
                stage.status === "PENDING" &&
                  "border-border bg-card text-muted-foreground",
              )}
            >
              {stage.status === "DONE" ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    stage.status === "IN_PROGRESS"
                      ? "animate-pulse bg-primary"
                      : "bg-border",
                  )}
                />
              )}
            </motion.span>

            {/* Текст */}
            <div className={cn("pb-7", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium leading-8",
                  stage.status === "PENDING" && "text-muted-foreground",
                )}
              >
                {stage.name}
                {stage.status === "IN_PROGRESS" && (
                  <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    сейчас
                  </span>
                )}
              </p>
              {stage.meta && (
                <p className="text-xs text-muted-foreground">{stage.meta}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

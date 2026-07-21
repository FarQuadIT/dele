"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  active: boolean;
};

export function OrdersCalendar({
  items,
  hrefBase = "/app/customer/orders",
}: {
  items: CalendarItem[];
  hrefBase?: string;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const parsed = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        startDate: startOfDay(new Date(it.start)),
        endDate: startOfDay(new Date(it.end)),
      })),
    [items],
  );

  const itemsForDay = (day: Date) =>
    parsed.filter((it) =>
      isWithinInterval(day, { start: it.startDate, end: it.endDate }),
    );

  const selectedMonthItems = parsed.filter(
    (it) => isSameMonth(it.startDate, month) || isSameMonth(it.endDate, month),
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold capitalize">
          {format(month, "LLLL yyyy", { locale: ru })}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
          <span key={d} className="text-[11px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const dayItems = itemsForDay(day);
          const hasActive = dayItems.some((it) => it.active);
          const hasAny = dayItems.length > 0;
          return (
            <div
              key={day.toISOString()}
              title={dayItems.map((it) => it.title).join(", ")}
              className={cn(
                "relative mx-auto flex size-8 items-center justify-center rounded-full text-xs",
                !isSameMonth(day, month) && "text-muted-foreground/40",
                isToday(day) && "ring-1 ring-primary",
                hasActive && "bg-primary font-semibold text-primary-foreground",
                !hasActive && hasAny && "bg-secondary font-medium",
              )}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>

      {selectedMonthItems.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t pt-3">
          {selectedMonthItems.slice(0, 4).map((it) => (
            <Link
              key={it.id}
              href={`${hrefBase}/${it.id}`}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  it.active ? "bg-primary" : "bg-muted-foreground/40",
                )}
              />
              <span className="min-w-0 flex-1 truncate">{it.title}</span>
              <span className="shrink-0 text-muted-foreground">
                {isSameDay(it.startDate, it.endDate)
                  ? format(it.startDate, "d.MM")
                  : `${format(it.startDate, "d.MM")}–${format(it.endDate, "d.MM")}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

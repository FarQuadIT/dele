"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, FileText, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { documentCategoryLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { DocItem } from "./types";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function FacilityDocuments({ documents }: { documents: DocItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <FileText className="size-8 text-muted-foreground" />
        <p className="font-medium">Документов пока нет</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Паспорта оборудования, схемы и акты будут появляться здесь по мере
          работ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((d) => {
        const open = openId === d.id;
        return (
          <Card key={d.id} className="overflow-hidden py-0 shadow-card">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : d.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {documentCategoryLabels[d.category]}
                  {d.equipment ? ` · ${d.equipment.name}` : ""} · обновлён{" "}
                  {format(d.updatedAt, "d MMM yyyy", { locale: ru })}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                v{d.currentVersion}
              </Badge>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <CardContent className="border-t bg-muted/30 py-3">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                      Версии
                    </p>
                    <ul className="space-y-1.5">
                      {d.versions.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">
                            {v.fileName}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            v{v.version}
                            {v.fileSize ? ` · ${formatSize(v.fileSize)}` : ""} ·{" "}
                            {format(v.createdAt, "d.MM.yyyy")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

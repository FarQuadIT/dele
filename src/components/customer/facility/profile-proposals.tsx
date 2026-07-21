"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { decideProfileChange } from "@/lib/actions/proposal-actions";
import type { ProposalItem } from "./types";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Ожидает решения",
  APPROVED: "Принято",
  REJECTED: "Отклонено",
  CLARIFICATION: "Уточнение",
};

export function ProfileProposals({ items }: { items: ProposalItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        Предложений об изменении профиля пока нет.
        Исполнитель может предложить обновления после работ —
        вы подтвердите или отклоните их здесь.
      </div>
    );
  }

  async function decide(
    proposalId: string,
    decision: "APPROVED" | "REJECTED" | "CLARIFICATION",
  ) {
    setPendingId(proposalId);
    const result = await decideProfileChange({
      proposalId,
      decision,
      decisionComment: comment[proposalId] ?? "",
    });
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      decision === "APPROVED"
        ? "Изменения приняты"
        : decision === "REJECTED"
          ? "Изменения отклонены"
          : "Запрошено уточнение",
    );
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {items.map((p) => {
        const changes = (p.changes ?? {}) as Record<string, unknown>;
        return (
          <Card key={p.id} className="shadow-card">
            <CardContent className="space-y-3 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {p.equipment?.name ?? "Оборудование"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.authorOrg?.name ?? p.author.name} ·{" "}
                    {format(p.createdAt, "d MMM yyyy, HH:mm", { locale: ru })}
                  </p>
                </div>
                <Badge variant="secondary">
                  {STATUS_LABEL[p.status] ?? p.status}
                </Badge>
              </div>

              {p.comment && (
                <p className="text-sm text-muted-foreground">{p.comment}</p>
              )}

              <dl className="grid gap-1.5 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-2">
                {Object.entries(changes).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground">{key}</dt>
                    <dd className="font-medium">
                      {value === null || value === undefined
                        ? "—"
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>

              {p.status === "PENDING" && (
                <div className="space-y-2 border-t pt-3">
                  <Textarea
                    placeholder="Комментарий к решению (необязательно)"
                    value={comment[p.id] ?? ""}
                    onChange={(e) =>
                      setComment((c) => ({ ...c, [p.id]: e.target.value }))
                    }
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={pendingId === p.id}
                      onClick={() => decide(p.id, "APPROVED")}
                    >
                      <Check className="size-3.5" />
                      Подтвердить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingId === p.id}
                      onClick={() => decide(p.id, "CLARIFICATION")}
                    >
                      <MessageSquare className="size-3.5" />
                      Уточнить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pendingId === p.id}
                      onClick={() => decide(p.id, "REJECTED")}
                    >
                      <X className="size-3.5" />
                      Отклонить
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

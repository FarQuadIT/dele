"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { moderateOrganization } from "@/lib/actions/admin-actions";
import type { OrgVerificationStatus } from "@/generated/prisma/enums";

export function CompanyModeration({
  organizationId,
  status,
}: {
  organizationId: string;
  status: OrgVerificationStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  async function decide(decision: "VERIFIED" | "REJECTED") {
    setPending(true);
    const result = await moderateOrganization({
      organizationId,
      decision,
      note: decision === "REJECTED" ? note : "",
    });
    setPending(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success(
      decision === "VERIFIED" ? "Компания подтверждена" : "Компания отклонена",
    );
    setRejectOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "VERIFIED" && (
        <Button size="sm" disabled={pending} onClick={() => decide("VERIFIED")}>
          <ShieldCheck className="size-4" />
          Подтвердить
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          <ShieldX className="size-4" />
          Отклонить
        </Button>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Отклонить компанию</DialogTitle>
            <DialogDescription>
              Владелец получит уведомление с причиной — он сможет исправить
              данные и отправить профиль повторно.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Например: не подтверждён ИНН, нет описания услуг…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => decide("REJECTED")}
            >
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

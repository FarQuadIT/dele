"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sendOrderMessage } from "@/lib/actions/order-actions";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
};

export function OrderChat({
  orderId,
  currentUserId,
  messages: serverMessages,
}: {
  orderId: string;
  currentUserId: string;
  messages: ChatMessage[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const serverCount = serverMessages.length;
  useEffect(() => {
    setOptimistic([]);
  }, [serverCount]);

  const messages = [...serverMessages, ...optimistic];

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setBody("");
    setOptimistic((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        body: text,
        createdAt: new Date(),
        authorId: currentUserId,
        authorName: "Вы",
      },
    ]);
    const result = await sendOrderMessage({ orderId, body: text });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      setOptimistic((prev) => prev.slice(0, -1));
      setBody(text);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="size-4 text-primary" />
          Чат по заказу
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={listRef}
          className="max-h-80 space-y-3 overflow-y-auto pr-1"
        >
          {messages.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Сообщений пока нет.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.authorId === currentUserId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted",
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-semibold">
                      {m.authorName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDistanceToNow(m.createdAt, {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-end gap-2 border-t pt-3">
          <Textarea
            rows={2}
            placeholder="Написать исполнителю…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="min-h-0 resize-none"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={sending || body.trim().length === 0}
            aria-label="Отправить"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

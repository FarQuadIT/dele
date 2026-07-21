"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertOrganization } from "@/lib/actions/contractor-actions";
import { systemTypeLabels } from "@/lib/labels";

const SPECIALIZATIONS = [
  "WATER",
  "DRAINAGE",
  "HEATING",
  "AIR",
  "ELECTRICITY",
  "AUTOMATION",
] as const;

export function CompanyForm({
  defaults,
  isNew,
}: {
  defaults: {
    name: string;
    inn: string;
    description: string;
    phone: string;
    email: string;
    website: string;
    specializations: string[];
    regionsServed: string;
  };
  isNew: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const result = await upsertOrganization(form);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      if (result.fieldErrors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(result.fieldErrors)) flat[k] = v[0];
        setErrors(flat);
      }
      return;
    }
    toast.success(
      isNew
        ? "Компания создана и отправлена на модерацию"
        : "Профиль компании обновлён",
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Название компании</Label>
          <Input
            id="name"
            placeholder="ООО «Инженерные системы»"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="inn">ИНН</Label>
          <Input
            id="inn"
            placeholder="7712345678"
            value={form.inn}
            onChange={(e) => patch({ inn: e.target.value })}
          />
          {errors.inn && (
            <p className="text-sm text-destructive">{errors.inn}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">О компании</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Чем занимаетесь, какой опыт, что умеете лучше всего…"
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Специализации</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {SPECIALIZATIONS.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary/50"
            >
              <Checkbox
                checked={form.specializations.includes(s)}
                onCheckedChange={(v) =>
                  patch({
                    specializations:
                      v === true
                        ? [...form.specializations, s]
                        : form.specializations.filter((x) => x !== s),
                  })
                }
              />
              {systemTypeLabels[s]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            placeholder="+7 495 000-00-00"
            value={form.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="orgEmail">E-mail</Label>
          <Input
            id="orgEmail"
            placeholder="hello@company.ru"
            value={form.email}
            onChange={(e) => patch({ email: e.target.value })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website">Сайт</Label>
          <Input
            id="website"
            placeholder="https://company.ru"
            value={form.website}
            onChange={(e) => patch({ website: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="regions">Регионы работы (через запятую)</Label>
          <Input
            id="regions"
            placeholder="Москва, Московская область"
            value={form.regionsServed}
            onChange={(e) => patch({ regionsServed: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending
          ? "Сохраняем…"
          : isNew
            ? "Создать и отправить на проверку"
            : "Сохранить изменения"}
      </Button>
    </form>
  );
}

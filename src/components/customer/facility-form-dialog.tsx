"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFacility } from "@/lib/actions/facility-actions";
import {
  createFacilitySchema,
  facilityTypeLabels,
  facilityTypeValues,
  type CreateFacilityFormInput,
  type CreateFacilityInput,
} from "@/lib/validation/facility";

export function FacilityFormDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const form = useForm<CreateFacilityFormInput, unknown, CreateFacilityInput>({
    resolver: zodResolver(createFacilitySchema),
    defaultValues: {
      title: "",
      type: "HOUSE",
      address: "",
      region: "",
      description: "",
    },
  });

  async function onSubmit(values: CreateFacilityInput) {
    setPending(true);
    const result = await createFacility(values);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof CreateFacilityInput, {
            message: messages[0],
          });
        }
      }
      return;
    }

    toast.success("Объект создан");
    setOpen(false);
    form.reset();
    router.refresh();
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Добавить объект
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый объект</DialogTitle>
          <DialogDescription>
            Дом, квартира или коммерческое помещение — профиль можно заполнять
            постепенно.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Загородный дом"
              {...form.register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Тип объекта</Label>
            <Select
              defaultValue="HOUSE"
              onValueChange={(v) =>
                form.setValue("type", v as CreateFacilityInput["type"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {facilityTypeValues.map((t) => (
                  <SelectItem key={t} value={t}>
                    {facilityTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              placeholder="Московская обл., ..."
              {...form.register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="area">Площадь, м²</Label>
              <Input
                id="area"
                type="number"
                step="0.1"
                placeholder="214"
                {...form.register("area")}
              />
              {errors.area && (
                <p className="text-xs text-destructive">
                  {errors.area.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="floorsCount">Этажей</Label>
              <Input
                id="floorsCount"
                type="number"
                placeholder="2"
                {...form.register("floorsCount")}
              />
              {errors.floorsCount && (
                <p className="text-xs text-destructive">
                  {errors.floorsCount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildYear">Год</Label>
              <Input
                id="buildYear"
                type="number"
                placeholder="2019"
                {...form.register("buildYear")}
              />
              {errors.buildYear && (
                <p className="text-xs text-destructive">
                  {errors.buildYear.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Особенности объекта, материалы, инженерия..."
              {...form.register("description")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Создаём..." : "Создать объект"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

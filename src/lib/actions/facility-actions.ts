"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import {
  createFacilitySchema,
  type CreateFacilityInput,
} from "@/lib/validation/facility";

export async function createFacility(
  input: CreateFacilityInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("CUSTOMER");

  const parsed = createFacilitySchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте поля формы",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;

  try {
    const facility = await db.facility.create({
      data: {
        ownerId: user.id,
        title: data.title,
        type: data.type,
        address: data.address,
        region: data.region || null,
        area: data.area ?? null,
        floorsCount: data.floorsCount ?? null,
        buildYear: data.buildYear ?? null,
        description: data.description || null,
      },
    });

    await db.auditEvent.create({
      data: {
        actorId: user.id,
        action: "facility.create",
        entity: "Facility",
        entityId: facility.id,
        meta: { title: facility.title },
      },
    });

    revalidatePath("/app/customer/objects");
    return actionOk({ id: facility.id });
  } catch (error) {
    console.error("createFacility failed:", error);
    return actionError("Не удалось создать объект. Попробуйте ещё раз.");
  }
}

export async function deleteFacility(id: string): Promise<ActionResult> {
  const user = await requireRole("CUSTOMER");

  const facility = await db.facility.findUnique({ where: { id } });
  if (!facility || facility.ownerId !== user.id) {
    return actionError("Объект не найден");
  }

  const ordersCount = await db.order.count({ where: { facilityId: id } });
  if (ordersCount > 0) {
    return actionError("Нельзя удалить объект, по которому есть заказы");
  }

  try {
    await db.facility.delete({ where: { id } });
    await db.auditEvent.create({
      data: {
        actorId: user.id,
        action: "facility.delete",
        entity: "Facility",
        entityId: id,
        meta: { title: facility.title },
      },
    });
    revalidatePath("/app/customer/objects");
    return actionOk();
  } catch (error) {
    console.error("deleteFacility failed:", error);
    return actionError("Не удалось удалить объект");
  }
}

"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { roleHome, signIn } from "@/lib/auth";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";

const registerSchema = z.object({
  name: z.string().min(2, "Укажите имя").max(100),
  email: z.string().email("Некорректная почта"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{10,18}$/, "Некорректный телефон")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "Минимум 8 символов").max(72),
  role: z.enum(["CUSTOMER", "CONTRACTOR"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(
  input: RegisterInput,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Проверьте поля формы",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const { name, email, phone, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return actionError("Пользователь с такой почтой уже зарегистрирован", {
      email: ["Почта уже используется"],
    });
  }

  if (phone) {
    const phoneTaken = await db.user.findUnique({ where: { phone } });
    if (phoneTaken) {
      return actionError("Этот номер телефона уже используется", {
        phone: ["Номер уже используется"],
      });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash,
      role,
    },
  });

  await db.auditEvent.create({
    data: {
      actorId: user.id,
      action: "user.register",
      entity: "User",
      entityId: user.id,
      meta: { role },
    },
  });

  return actionOk();
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<ActionResult<{ home: string }>> {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return actionError("Неверная почта или пароль");
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { role: true },
  });
  return actionOk({ home: roleHome(user?.role ?? "CUSTOMER") });
}

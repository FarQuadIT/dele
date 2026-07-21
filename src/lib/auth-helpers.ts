import { redirect } from "next/navigation";
import { auth, roleHome } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/enums";

/** Авторитетная проверка сессии. Гостя отправляет на вход. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Авторитетная проверка роли. Чужую роль отправляет в её кабинет. */
export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role !== role) redirect(roleHome(user.role));
  return user;
}

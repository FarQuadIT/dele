import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  CONTRACTOR: "/app/contractor",
  CUSTOMER: "/app/customer",
};

/**
 * Лёгкая оптимистичная защита маршрутов (не security boundary!).
 * Авторитетная проверка — в лейаутах кабинетов через requireRole.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const area = pathname.startsWith("/app/customer")
    ? "CUSTOMER"
    : pathname.startsWith("/app/contractor")
      ? "CONTRACTOR"
      : pathname.startsWith("/admin")
        ? "ADMIN"
        : null;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!area && !isAuthPage) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  // Гость в защищённой зоне -> на вход с возвратом
  if (area && !token) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Чужая роль -> в свой кабинет
  if (area && token && token.role !== area) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[token.role as string] ?? "/", req.nextUrl),
    );
  }

  // Авторизованный на /login|/register -> в свой кабинет
  if (isAuthPage && token) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[token.role as string] ?? "/", req.nextUrl),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/login", "/register"],
};

import { NextResponse } from "next/server";
import { COOKIE_NAME, isValidSession } from "./lib/panel-auth";

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // La pantalla d entrada i el seu endpoint han de ser accessibles sense sessio.
  if (pathname === "/panel/entrar" || pathname === "/api/panel/entrar") {
    return NextResponse.next();
  }

  const secret = process.env.PANEL_SECRET;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (await isValidSession(cookie, secret)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/panel/entrar";
  url.search = pathname === "/panel" ? "" : `?seguent=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/panel/:path*", "/api/panel/:path*"],
};

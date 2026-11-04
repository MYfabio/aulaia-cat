import { NextResponse } from "next/server";
import { COOKIE_NAME } from "../../../../lib/panel-auth";

/** Public real de la peticio: dins del contenidor request.url apunta a localhost. */
function baseUrl(request) {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/panel/entrar", baseUrl(request)), { status: 303 });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

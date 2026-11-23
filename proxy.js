import { NextResponse } from "next/server";
import { COOKIE_NAME, rolDeSessio, clauDemoConfigurada } from "./lib/panel-auth";
import { esBotBloquejat } from "./lib/bots";

const PANELL = /^\/(api\/)?panel(\/|$)/;

/**
 * La demo nomes mira. De tot /api/panel nomes pot cridar la sortida: la resta
 * desa, envia correus o exporta dades reals. Les pagines nomes les pot demanar
 * (GET), i totes treuen les dades de lib/panell-fonts.js, que a la demo les
 * dona inventades.
 */
function aturarDemo(request, pathname) {
  const api = pathname.startsWith("/api/");
  if (api && pathname === "/api/panel/sortir") return null;
  // La vista prèvia d'un lot només calcula i no desa res: la demo també la pot veure.
  if (api && pathname === "/api/panel/altes-lot/vista") return null;
  if (!api && (request.method === "GET" || request.method === "HEAD")) return null;

  // Un formulari del panell: es torna a la pagina d on venia, amb l avis.
  // Una crida feta amb fetch rep el 403 i el text.
  const volPagina = (request.headers.get("accept") || "").includes("text/html");
  if (!volPagina) {
    return NextResponse.json(
      { error: "Això és la demostració: es pot mirar tot, però no es desa ni s'envia res." },
      { status: 403 }
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = "/panel";
  url.search = "";
  try {
    const origen = new URL(request.headers.get("referer") || "");
    // De l adreça d origen nomes se n aprofiten el cami i els filtres, i nomes si
    // es del panell: la redireccio va sempre a aquest mateix lloc, mai a fora.
    if (/^\/panel(\/[a-z/]*)?$/.test(origen.pathname)) {
      url.pathname = origen.pathname;
      url.search = origen.search;
    }
  } catch {}
  url.searchParams.set("demo", "lectura");
  return NextResponse.redirect(url, { status: 303 });
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // Bots que copien el web per entrenar IA i programes de copia sencera (lib/bots.js).
  // robots.txt queda obert perque hi llegeixin que no poden entrar, i /api/ tambe:
  // hi criden els servidors de les altres apps i cap d'aquests bots hi te res a fer.
  if (pathname !== "/robots.txt" && !pathname.startsWith("/api/") && esBotBloquejat(request.headers.get("user-agent"))) {
    return new NextResponse("Accés no permès.\n", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }

  if (!PANELL.test(pathname)) {
    return NextResponse.next();
  }

  // La pantalla d entrada i el seu endpoint han de ser accessibles sense sessio.
  if (pathname === "/panel/entrar" || pathname === "/api/panel/entrar") {
    return NextResponse.next();
  }
  // L entrada amb Google (anar a Google i tornar): tampoc te sessio abans d entrar.
  if (pathname === "/api/panel/google/inici" || pathname === "/api/panel/google/retorn") {
    return NextResponse.next();
  }
  const secret = process.env.PANEL_SECRET;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const rol = await rolDeSessio(cookie, secret, clauDemoConfigurada());

  if (rol === "admin") {
    return NextResponse.next();
  }
  if (rol === "demo") {
    return aturarDemo(request, pathname) || NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/panel/entrar";
  url.search = pathname === "/panel" ? "" : `?seguent=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Tot menys els fitxers interns de Next: el filtre de bots ha de cobrir pagines i imatges.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

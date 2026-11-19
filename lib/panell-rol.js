import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, rolDeSessio, clauDemoConfigurada } from "./panel-auth";

/**
 * Qui esta mirant el panell en aquesta peticio: "admin", "demo" o null.
 * Es llegeix de la cookie signada, no de cap capçalera que pugui enviar el client.
 */
export async function rolPanell() {
  const galeta = (await cookies()).get(COOKIE_NAME)?.value;
  return rolDeSessio(galeta, process.env.PANEL_SECRET, clauDemoConfigurada());
}

export async function esAdmin() {
  return (await rolPanell()) === "admin";
}

export async function esDemo() {
  return (await rolPanell()) === "demo";
}

export const TEXT_NOMES_LECTURA = "Això és la demostració: es pot mirar tot, però no es desa ni s'envia res.";

/**
 * Per a les rutes d /api/panel que desen, envien o exporten: torna la resposta
 * de rebuig si qui crida no es l administrador, o null si pot continuar.
 * El proxy ja ho atura abans; aixo es la segona tanca, per si mai canvia.
 */
export async function nomesAdmin() {
  if (await esAdmin()) return null;
  return NextResponse.json({ error: TEXT_NOMES_LECTURA }, { status: 403 });
}

import "server-only";
import apps from "../data/apps.json";

const API = "https://api.resend.com/emails";

/**
 * Enviament de correu amb Resend.
 * Mentre el domini no estigui verificat, RESEND_FROM pot ser
 * onboarding@resend.dev, que Resend deixa fer servir per a proves.
 */
export async function enviarCorreu({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY");
  const from = process.env.RESEND_FROM || "aulaia.cat <onboarding@resend.dev>";

  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text, reply_to: "hola@aulaia.cat" }),
  });

  if (!res.ok) {
    const cos = await res.text().catch(() => "");
    throw new Error(`Resend ha respost ${res.status}: ${cos.slice(0, 200)}`);
  }
  return res.json();
}

export async function enviarCorreuValidacio(solicitud) {
  const app = apps.find(a => a.slug === solicitud.app);
  const nom = app?.nom || solicitud.app;
  const enllac = app?.url ? `\n\nHi pots accedir aquí: ${app.url}` : "";
  const enConstruccio = app && app.estat !== "produccio";

  const text = [
    `Hola ${solicitud.contacte_nom},`,
    "",
    `Hem validat la sol·licitud d'accés de ${solicitud.centre} a ${nom}.`,
    enConstruccio
      ? `\n${nom} encara està en construcció. T'avisarem personalment quan estigui llest perquè el vostre centre sigui dels primers a provar-lo.`
      : `Ja podeu començar a fer-lo servir amb aquest mateix correu (${solicitud.contacte_email}).${enllac}`,
    "",
    "Si tens qualsevol dubte, respon a aquest correu i te'l resolem.",
    "",
    "Fabio Martínez",
    "aulaia.cat",
  ].join("\n");

  return enviarCorreu({
    to: solicitud.contacte_email,
    subject: `Accés validat a ${nom} · aulaia.cat`,
    text,
  });
}

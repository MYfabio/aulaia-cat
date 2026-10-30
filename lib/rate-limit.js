import "server-only";
import { contarSolicitudesPorIp, contarSolicitudesPorEmail } from "./db";

/**
 * Anti-spam: limita solicitudes por IP y por email.
 *
 * Límites:
 * - Max 5 solicitudes/hora por IP
 * - Max 3 solicitudes/hora por email
 */

export async function validarRateLimit(ip, email) {
  const errors = [];

  // Limitar por IP (máximo 5 por hora)
  const ipCount = await contarSolicitudesPorIp(ip);
  if (ipCount > 5) {
    errors.push("ip-limit");
  }

  // Limitar por email (máximo 3 por hora)
  const emailCount = await contarSolicitudesPorEmail(email);
  if (emailCount > 3) {
    errors.push("email-limit");
  }

  return {
    ok: errors.length === 0,
    errors,
    ipCount,
    emailCount,
  };
}

/** Extraer IP real (considerando proxies) */
export function extraerIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/** Validar email para detectar dominios chatarra */
export function validarEmailReal(email) {
  // Dominios descartables comunes
  const dominiosDescartables = [
    "tempmail", "guerrillamail", "mailinator", "throwaway",
    "yopmail", "temp-mail", "10minutemail", "mailnesia"
  ];

  const domain = email.split("@")[1]?.toLowerCase() || "";

  // Comprobar si el dominio está en la lista negra
  const esDescartable = dominiosDescartables.some(d => domain.includes(d));

  return !esDescartable;
}

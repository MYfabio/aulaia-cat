import "server-only";
import apps from "../data/apps.json";

/**
 * URLs de provisioning para cada app.
 * Cada app debe tener un endpoint POST /api/provisioning/usuari
 * que crei un usuari donat email, nom, centre i rol.
 */
const ENDPOINTS = {
  // Exemple: "radio-escolar": "https://www.radioescolar.cat/api/provisioning/usuari",
};

/**
 * Crea un usuari a l app solicitada.
 * S appella automaticament quan es valida una solicitud d alta.
 */
export async function crearUsuariAlApp(solicitud) {
  const app = apps.find(a => a.slug === solicitud.app);
  if (!app) {
    return { ok: false, motiu: "app-no-trobada" };
  }

  // Si l app no té endpoint de provisioning, retornem que no es pot fer
  const endpoint = ENDPOINTS[solicitud.app];
  if (!endpoint) {
    console.log(`Provisioning no configurat per ${solicitud.app}`);
    return { ok: false, motiu: "provisioning-no-configurat" };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PROVISIONING_SECRET || ""}`,
      },
      body: JSON.stringify({
        email: solicitud.contacte_email,
        nom: solicitud.contacte_nom,
        centre: solicitud.centre,
        rol: solicitud.contacte_rol,
        localitat: solicitud.localitat,
        codiCentre: solicitud.codi_centre,
      }),
    });

    if (!res.ok) {
      const error = await res.text().catch(() => "");
      console.error(
        `Provisioning ${solicitud.app}: ${res.status} ${error.slice(0, 100)}`
      );
      return {
        ok: false,
        motiu: "provisioning-error",
        status: res.status,
      };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    console.error(`Provisioning ${solicitud.app}: ${e.message}`);
    return { ok: false, motiu: "provisioning-exception", error: e.message };
  }
}

/**
 * Registra l intent de provisioning a la base de dades.
 * Util per seguiment i debugging.
 */
export async function registrarProvisioning(solicitudId, appSlug, resultat) {
  // TODO: Guardar a taula de provisioning_log si volem auditar
  console.log(
    `Provisioning [${solicitudId}@${appSlug}]: ${resultat.ok ? "OK" : resultat.motiu}`
  );
}

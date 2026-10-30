import Inici, { metadataInici } from "../../../components/Inici";

export const metadata = metadataInici("es");

// El nombre de centres es llegeix de la base: una vegada per hora, no a cada visita.
export const revalidate = 3600;

export default function InicioEs() {
  return <Inici lang="es" />;
}

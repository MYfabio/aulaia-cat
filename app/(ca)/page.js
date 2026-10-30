import Inici, { metadataInici } from "../../components/Inici";

export const metadata = metadataInici("ca");

// El nombre de centres es llegeix de la base: cada deu minuts, no a cada visita.
export const revalidate = 600;

export default function Home() {
  return <Inici lang="ca" />;
}

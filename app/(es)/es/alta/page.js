import { Alta, metadataAlta } from "../../../../components/Alta";

export const metadata = metadataAlta("es");

export default function Page({ searchParams }) {
  return <Alta lang="es" searchParams={searchParams} />;
}

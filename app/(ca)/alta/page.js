import { Alta, metadataAlta } from "../../../components/Alta";

export const metadata = metadataAlta("ca");

export default function Page({ searchParams }) {
  return <Alta lang="ca" searchParams={searchParams} />;
}

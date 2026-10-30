import { BlogIndex, metadataBlog } from "../../../../components/Blog";

export const metadata = metadataBlog("es");

export default function Page() {
  return <BlogIndex lang="es" />;
}

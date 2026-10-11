import { BlogIndex, metadataBlog } from "../../../components/Blog";

export const metadata = metadataBlog("ca");

export default function Page() {
  return <BlogIndex lang="ca" />;
}

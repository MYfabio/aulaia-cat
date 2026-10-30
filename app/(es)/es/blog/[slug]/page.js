import { BlogArticle, metadataArticle } from "../../../../../components/Blog";
import { llistarArticles } from "../../../../../lib/blog";

export function generateStaticParams() {
  return llistarArticles("es").map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return metadataArticle("es", slug);
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <BlogArticle lang="es" slug={slug} />;
}

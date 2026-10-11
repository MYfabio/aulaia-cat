import { BlogArticle, metadataArticle } from "../../../../components/Blog";
import { llistarArticles } from "../../../../lib/blog";

export function generateStaticParams() {
  return llistarArticles("ca").map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return metadataArticle("ca", slug);
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <BlogArticle lang="ca" slug={slug} />;
}

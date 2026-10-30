import FitxaApp, { metadataFitxa } from "../../../../components/FitxaApp";
import apps from "../../../../data/apps.json";

export function generateStaticParams() { return apps.map(a => ({ slug: a.slug })); }

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return metadataFitxa("ca", slug);
}

export default async function AppLanding({ params }) {
  const { slug } = await params;
  return <FitxaApp lang="ca" slug={slug} />;
}

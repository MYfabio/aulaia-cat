import { redirect } from "next/navigation";

// El formulari de contacte no enviava res: ara tot passa pel formulari d'alta, que desa i avisa.
export default async function Page({ searchParams }) {
  const sp = await searchParams;
  redirect("/alta" + (typeof sp?.app === "string" ? "?app=" + encodeURIComponent(sp.app) : ""));
}

import apps from "../data/apps.json";
export default function sitemap(){const base="https://aulaia.cat";const now=new Date().toISOString();return [{url:base,lastModified:now,priority:1},{url:base+"/contacte",lastModified:now,priority:0.8},...apps.map(a=>({url:base+"/apps/"+a.slug,lastModified:now,priority:0.9}))];}

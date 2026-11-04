"use client";
import { usePathname } from "next/navigation";

export default function PanelSortir() {
  const ruta = usePathname();
  if (ruta === "/panel/entrar") return null;
  return (
    <form
      method="post"
      action="/api/panel/sortir"
      style={{ display: "flex", justifyContent: "flex-end", padding: "0.6rem var(--pad)", borderBottom: "1px solid var(--rule)" }}
    >
      <button type="submit" className="btn" style={{ padding: "0.35rem 0.9rem", background: "transparent", color: "var(--ink)", borderColor: "var(--rule)" }}>
        Sortir del panell
      </button>
    </form>
  );
}

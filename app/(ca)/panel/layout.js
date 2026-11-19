import PanelShell from "./PanelShell";
import { esDemo } from "../../../lib/panell-rol";

export default async function PanelLayout({ children }) {
  // A la demostracio el marc ho diu a cada pantalla: ningu ha de prendre les xifres per reals.
  return <PanelShell demo={await esDemo()}>{children}</PanelShell>;
}

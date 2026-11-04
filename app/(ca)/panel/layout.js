import PanelSortir from "./PanelSortir";

export default function PanelLayout({ children }) {
  return (
    <>
      <PanelSortir />
      {children}
    </>
  );
}

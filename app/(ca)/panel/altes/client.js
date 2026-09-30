"use client";

export function BotoEnviarResum({ comptesPendent }) {
  const handleClick = async () => {
    const confirma = confirm(
      `Enviar resum de ${comptesPendent} sol·licituds pendents a fabio.martinez@escolaindustrial.org?`
    );
    if (!confirma) return;

    try {
      const res = await fetch("/api/panel/enviaresum", {
        method: "POST",
        headers: { Authorization: "Bearer panel" }
      });
      const data = await res.json();

      if (res.ok) {
        alert(data.missatge || "Resum enviat correctament");
      } else {
        alert("Error: " + (data.error || "No s'ha pogut enviar"));
      }
    } catch (e) {
      alert("Error de connexió: " + e.message);
    }
  };

  if (comptesPendent === 0) return null;

  return (
    <button onClick={handleClick} className="btn btn-primary" style={{ marginLeft: "1rem" }}>
      Enviar resum per email
    </button>
  );
}

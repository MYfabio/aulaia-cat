import { NextResponse } from "next/server";
import { verificarEmail } from "../../../lib/db";
import { escaparHtml } from "../../../lib/html.mjs";

/**
 * Endpoint de verificación de email.
 * URL: /api/verif?token=XXXXX
 *
 * Redirige a la página de éxito o de error.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || token.length !== 32) {
    return NextResponse.redirect(new URL("/alta?error=token", request.url), { status: 303 });
  }

  try {
    const resultado = await verificarEmail(token);

    if (!resultado) {
      // Token no válido o ya verificado
      return NextResponse.redirect(new URL("/alta?error=token", request.url), { status: 303 });
    }

    // El nom del centre i el correu els ha escrit qui ha omplert el formulari
    // public: sense escapar, un nom com <svg onload=...> s executaria en aquest
    // domini, que es el mateix del panell.
    const centre = escaparHtml(resultado.centre);
    const correu = escaparHtml(resultado.contacte_email);

    // Éxito: mostrar página de confirmación
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email verificat · aulaia.cat</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 600px;
      margin: 60px auto;
      padding: 20px;
      color: #333;
    }
    .checkmark {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #4CAF50;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 35px;
    }
    h1 {
      text-align: center;
      margin: 0 0 10px;
    }
    p {
      text-align: center;
      margin: 10px 0;
      line-height: 1.6;
    }
    .info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="checkmark">✓</div>
  <h1>Email verificat!</h1>
  <p>Gràcies per verificar la teva adreça.</p>

  <div class="info">
    <strong>${centre}</strong><br>
    ${correu}
  </div>

  <p>
    Revisem cada petició a mà per assegurar-nos que el centre queda ben configurat des del primer dia.
    Et respondrem als propers dies al correu que ens has indicat.
  </p>

  <p>
    <a href="/">Tornar a aulaia.cat</a>
  </p>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("Error al verificar email:", error.message);
    return NextResponse.redirect(new URL("/alta?error=error", request.url), { status: 303 });
  }
}

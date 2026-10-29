const SWAGGER = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14";

const pagina = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Grão Raro, API</title>
<link rel="stylesheet" href="${SWAGGER}/swagger-ui.min.css">
</head>
<body>
<div id="api"></div>
<script src="${SWAGGER}/swagger-ui-bundle.min.js"></script>
<script>SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#api", deepLinking: true, tryItOutEnabled: true, withCredentials: true });</script>
</body>
</html>`;

export function GET() {
  return new Response(pagina, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

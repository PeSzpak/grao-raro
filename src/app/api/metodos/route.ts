import { listarMetodos } from "@/repositories/catalogo";

export async function GET() {
  return Response.json(await listarMetodos());
}

import { especificacao } from "@/lib/openapi";

export function GET() {
  return Response.json(especificacao);
}

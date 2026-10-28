import { connection } from "next/server";
import { pool } from "@/db/client";

export async function GET() {
  await connection();
  try {
    await pool.query("SELECT 1");
    return Response.json({ status: "ok", banco: "ok" });
  } catch {
    return Response.json({ status: "erro", banco: "indisponivel" }, { status: 503 });
  }
}

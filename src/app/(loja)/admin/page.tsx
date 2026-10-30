import type { Metadata } from "next";
import { Admin } from "@/components/admin";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

export default function PaginaAdmin() {
  return (
    <main className="pagina">
      <Admin />
    </main>
  );
}

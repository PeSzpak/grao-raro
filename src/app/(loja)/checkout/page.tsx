import type { Metadata } from "next";
import { Checkout } from "@/components/checkout";

export const metadata: Metadata = { title: "Pagamento" };

export default function PaginaCheckout() {
  return (
    <main className="pagina">
      <Checkout />
    </main>
  );
}

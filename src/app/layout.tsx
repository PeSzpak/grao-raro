import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { Sacola } from "@/components/sacola";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"], weight: ["400", "600", "800"] });

export const metadata: Metadata = {
  title: { default: "Grão Raro", template: "%s · Grão Raro" },
  description: "Cafés de fazenda nomeada, com altitude, processo e notas na etiqueta, e o que você precisa para preparar cada um.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={schibsted.variable}>
      <body>
        <p className="faixa-academica">Projeto acadêmico do Senac. Os pedidos não são enviados e os pagamentos de teste são estornados.</p>
        <Sacola>{children}</Sacola>
      </body>
    </html>
  );
}

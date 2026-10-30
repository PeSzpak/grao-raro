import { Cabecalho } from "@/components/cabecalho";
import { Rodape } from "@/components/rodape";

export default function LayoutLoja({ children }: LayoutProps<"/">) {
  return (
    <>
      <Cabecalho />
      {children}
      <Rodape />
    </>
  );
}

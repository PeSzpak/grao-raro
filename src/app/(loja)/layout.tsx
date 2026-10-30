import { Cabecalho } from "@/components/cabecalho";

export default function LayoutLoja({ children }: LayoutProps<"/">) {
  return (
    <>
      <Cabecalho />
      {children}
    </>
  );
}

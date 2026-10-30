import Image from "next/image";
import Link from "next/link";
import { foto, unsplash } from "@/lib/vitrine";
import { Marca } from "./marca";

export function Rodape() {
  const imagem = foto("metodo-v60");
  return (
    <footer className="rodape">
      <div className="rodape-foto">
        <Image src={unsplash(imagem.url, 1200, 900)} alt="Café passando no filtro" fill sizes="(max-width: 860px) 100vw, 50vw" />
      </div>
      <div className="rodape-menu">
        <Link href="/" aria-label="Grão Raro, página inicial">
          <Marca tamanho={44} />
        </Link>
        <nav aria-label="Rodapé">
          <Link href="/cafes">Cafés</Link>
          <Link href="/equipamentos">Equipamentos</Link>
          <Link href="/metodos">Métodos de preparo</Link>
          <Link href="/produto/amostra-degustacao">Amostra de R$ 5</Link>
          <a href="/docs">API e Swagger</a>
        </nav>
        <div className="rodape-blocos">
          <p>
            Trabalho da disciplina de APIs RESTful do Senac. Pagamentos pela conta real do Asaas, com Pix, crédito e débito.
          </p>
          <p>
            Fotos do Unsplash, com o crédito de cada uma na página do produto. A foto ao lado é de {imagem.credito.replace("Foto: ", "")}.
          </p>
        </div>
        <p className="rodape-legal">Preços ilustrativos, inspirados nos de mercado. Nenhum pedido é enviado.</p>
      </div>
    </footer>
  );
}

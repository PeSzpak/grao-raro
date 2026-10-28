// Conteúdo do seed. Preços ilustrativos, em centavos.

export const CATEGORIAS = [
  { slug: "cafes", nome: "Cafés" },
  { slug: "equipamentos", nome: "Equipamentos" },
  { slug: "acessorios", nome: "Acessórios" },
] as const;

type Categoria = (typeof CATEGORIAS)[number]["slug"];

export type ProdutoSeed = {
  slug: string;
  categoria: Categoria;
  nome: string;
  subtitulo: string;
  descricao: string;
  origem?: string;
  produtor?: string;
  variedade?: string;
  processo?: string;
  altitudeM?: string;
  notasSensoriais?: string[];
  peso: string;
  precoCentavos: number;
  estoque: number;
  destaque?: boolean;
  pagamentoRealLiberado?: boolean;
};

export const PRODUTOS: ProdutoSeed[] = [
  {
    slug: "geisha-esmeralda-panama",
    categoria: "cafes",
    nome: "Geisha Hacienda La Esmeralda",
    subtitulo: "Boquete, Panamá",
    descricao:
      "A fazenda da família Peterson apresentou o Geisha no leilão Best of Panama de 2004 e mudou o preço do café especial a partir dali. Lote lavado das encostas do vulcão Barú. Xícara leve, quase chá, com jasmim no aroma e bergamota no final.",
    origem: "Panamá",
    produtor: "Família Peterson",
    variedade: "Geisha",
    processo: "Lavado",
    altitudeM: "1.600 – 1.800 m",
    notasSensoriais: ["jasmim", "bergamota", "pêssego branco"],
    peso: "100 g",
    precoCentavos: 129000,
    estoque: 6,
    destaque: true,
  },
  {
    slug: "gesha-village-etiopia",
    categoria: "cafes",
    nome: "Gesha Village, lote Oma",
    subtitulo: "Bench Maji, Etiópia",
    descricao:
      "Plantado em 2011 a partir de sementes coletadas na floresta de Gori Gesha, perto de onde a variedade foi identificada nos anos 1930. Secagem natural em camas suspensas. Mais encorpado que o Geisha panamenho, com fruta vermelha madura.",
    origem: "Etiópia",
    produtor: "Rachel Samuel e Adam Overton",
    variedade: "Gesha 1931",
    processo: "Natural",
    altitudeM: "1.900 – 2.100 m",
    notasSensoriais: ["morango", "flor de laranjeira", "mel"],
    peso: "100 g",
    precoCentavos: 68000,
    estoque: 10,
    destaque: true,
  },
  {
    slug: "black-ivory-tailandia",
    categoria: "cafes",
    nome: "Black Ivory Coffee",
    subtitulo: "Chiang Saen, Tailândia",
    descricao:
      "Arábica tailandês que passa pelo sistema digestivo de elefantes resgatados da Golden Triangle Asian Elephant Foundation, que recebe parte da venda. São necessários cerca de 33 kg de cereja para 1 kg de café. Acidez baixíssima e amargor quase nulo.",
    origem: "Tailândia",
    produtor: "Blake Dinkin",
    variedade: "Arábica tailandês",
    processo: "Fermentação natural em elefantes",
    altitudeM: "1.200 m",
    notasSensoriais: ["cacau", "malte", "tamarindo"],
    peso: "35 g",
    precoCentavos: 98000,
    estoque: 4,
  },
  {
    slug: "jamaica-blue-mountain",
    categoria: "cafes",
    nome: "Jamaica Blue Mountain",
    subtitulo: "Wallenford Estate, Jamaica",
    descricao:
      "Denominação protegida: só leva o nome o café plantado nas paróquias de St. Andrew, St. Thomas, Portland e St. Mary, acima de 910 m. Exportado em barris de madeira desde o século XIX. Corpo médio, doce e muito limpo.",
    origem: "Jamaica",
    produtor: "Wallenford Estate",
    variedade: "Typica",
    processo: "Lavado",
    altitudeM: "910 – 1.700 m",
    notasSensoriais: ["chocolate ao leite", "nozes", "erva-doce"],
    peso: "250 g",
    precoCentavos: 52000,
    estoque: 12,
    destaque: true,
  },
  {
    slug: "kona-extra-fancy-havai",
    categoria: "cafes",
    nome: "Kona Extra Fancy",
    subtitulo: "Encosta do Hualālai, Havaí",
    descricao:
      "Extra Fancy é a classificação mais alta de Kona: grãos grandes, com no máximo 10 defeitos por amostra de 300 g. Cultivado em solo vulcânico, com nuvens toda tarde que fazem sombra natural.",
    origem: "Havaí, EUA",
    produtor: "Cooperativa de Kona",
    variedade: "Kona Typica",
    processo: "Lavado",
    altitudeM: "150 – 900 m",
    notasSensoriais: ["açúcar mascavo", "macadâmia", "laranja"],
    peso: "250 g",
    precoCentavos: 38000,
    estoque: 14,
  },
  {
    slug: "santa-helena-bourbon",
    categoria: "cafes",
    nome: "Santa Helena Green Tipped Bourbon",
    subtitulo: "Ilha de Santa Helena, Atlântico Sul",
    descricao:
      "Plantado em 1733 pela Companhia das Índias Orientais com sementes do Iêmen, numa ilha a 1.900 km da costa da África. A produção cabe em poucas toneladas por ano.",
    origem: "Santa Helena",
    produtor: "Pequenos produtores da ilha",
    variedade: "Bourbon de ponta verde",
    processo: "Lavado",
    altitudeM: "400 – 600 m",
    notasSensoriais: ["caramelo", "limão-siciliano", "especiarias"],
    peso: "250 g",
    precoCentavos: 69000,
    estoque: 5,
  },
  {
    slug: "el-paraiso-lychee-colombia",
    categoria: "cafes",
    nome: "Finca El Paraíso Lychee",
    subtitulo: "Cauca, Colômbia",
    descricao:
      "Diego Bermúdez fermenta a cereja em tanques fechados e depois aplica choque térmico, alternando água quente e fria. O resultado é um café que lembra lichia e rosa já no moedor.",
    origem: "Colômbia",
    produtor: "Diego Bermúdez",
    variedade: "Castillo",
    processo: "Duplo anaeróbico com choque térmico",
    altitudeM: "1.930 m",
    notasSensoriais: ["lichia", "rosa", "uva verde"],
    peso: "200 g",
    precoCentavos: 34000,
    estoque: 18,
  },
  {
    slug: "nyeri-aa-quenia",
    categoria: "cafes",
    nome: "Nyeri AA",
    subtitulo: "Monte Quênia, Quênia",
    descricao:
      "AA é a peneira 17/18, os grãos maiores do Quênia, vendidos no leilão semanal de Nairóbi. Variedades SL28 e SL34, plantadas no solo vermelho das encostas do Monte Quênia. Acidez alta e marcante.",
    origem: "Quênia",
    produtor: "Cooperativas de Nyeri",
    variedade: "SL28 e SL34",
    processo: "Lavado",
    altitudeM: "1.700 – 1.900 m",
    notasSensoriais: ["groselha", "tomate maduro", "toranja"],
    peso: "250 g",
    precoCentavos: 21000,
    estoque: 20,
  },
  {
    slug: "sul-de-minas-bourbon-amarelo",
    categoria: "cafes",
    nome: "Bourbon Amarelo, microlote",
    subtitulo: "Carmo de Minas, Brasil",
    descricao:
      "Da Serra da Mantiqueira, região com mais lotes premiados no Cup of Excellence Brasil. O Bourbon Amarelo amadurece devagar em altitude e chega à xícara doce, com corpo cremoso.",
    origem: "Brasil",
    produtor: "Produtores da Mantiqueira de Minas",
    variedade: "Bourbon Amarelo",
    processo: "Cereja descascado",
    altitudeM: "1.100 – 1.400 m",
    notasSensoriais: ["rapadura", "damasco", "chocolate"],
    peso: "250 g",
    precoCentavos: 14000,
    estoque: 30,
  },
  {
    slug: "amostra-degustacao",
    categoria: "cafes",
    nome: "Amostra de degustação",
    subtitulo: "20 g do Bourbon Amarelo",
    descricao:
      "Uma dose pra conhecer a casa: 20 g do microlote de Carmo de Minas, o bastante pra um V60 de 300 ml.",
    origem: "Brasil",
    variedade: "Bourbon Amarelo",
    processo: "Cereja descascado",
    notasSensoriais: ["rapadura", "damasco"],
    peso: "20 g",
    precoCentavos: 500,
    estoque: 200,
    pagamentoRealLiberado: true,
  },

  {
    slug: "hario-v60",
    categoria: "equipamentos",
    nome: "Hario V60 02 cerâmica",
    subtitulo: "Para 1 a 4 xícaras",
    descricao:
      "Cone de 60 graus com nervuras em espiral e um furo único na base. A vazão depende só da mão de quem serve, por isso é o método das competições de filtrado. A cerâmica segura bem a temperatura.",
    peso: "Cerâmica Arita, Japão",
    precoCentavos: 21900,
    estoque: 15,
  },
  {
    slug: "chemex",
    categoria: "equipamentos",
    nome: "Chemex clássica 6 xícaras",
    subtitulo: "Vidro borossilicato com gola de madeira",
    descricao:
      "Desenhada pelo químico Peter Schlumbohm em 1941 e no acervo do MoMA. O filtro de papel é 20% a 30% mais grosso que os comuns e segura óleos e partículas finas. Xícara limpa e clara.",
    peso: "Capacidade 900 ml",
    precoCentavos: 39900,
    estoque: 10,
  },
  {
    slug: "kalita-wave",
    categoria: "equipamentos",
    nome: "Kalita Wave 185 inox",
    subtitulo: "Fundo plano com três furos",
    descricao:
      "O fundo plano e os três furos deixam a extração mais uniforme e menos sensível ao jeito de despejar. Um bom primeiro filtrado para quem está começando.",
    peso: "Para 2 a 4 xícaras",
    precoCentavos: 27900,
    estoque: 8,
  },
  {
    slug: "aeropress",
    categoria: "equipamentos",
    nome: "AeroPress Original",
    subtitulo: "Imersão com pressão manual",
    descricao:
      "Criada em 2005 por Alan Adler, o mesmo inventor do frisbee Aerobie. Leve e inquebrável, é o método de viagem por excelência e tem campeonato mundial próprio.",
    peso: "Inclui 350 filtros",
    precoCentavos: 32900,
    estoque: 12,
  },
  {
    slug: "prensa-francesa",
    categoria: "equipamentos",
    nome: "Prensa francesa Bodum Chambord",
    subtitulo: "8 xícaras, 1 litro",
    descricao:
      "O desenho de 1958 que virou referência. Filtro de malha metálica: o óleo do café passa para a xícara, e o corpo fica denso.",
    peso: "Capacidade 1 l",
    precoCentavos: 34900,
    estoque: 9,
  },
  {
    slug: "moka-bialetti",
    categoria: "equipamentos",
    nome: "Bialetti Moka Express",
    subtitulo: "6 xícaras, alumínio",
    descricao:
      "Alfonso Bialetti lançou em 1933. O vapor da água empurra o café pela borra até a parte de cima. Café forte e encorpado no fogão, sem eletricidade.",
    peso: "Capacidade 300 ml",
    precoCentavos: 29900,
    estoque: 11,
  },
  {
    slug: "sifao",
    categoria: "equipamentos",
    nome: "Sifão Hario Technica",
    subtitulo: "Cafeteira a vácuo, 5 xícaras",
    descricao:
      "A água sobe por pressão de vapor, encontra o café na câmara de cima e desce quando o fogo é desligado. Método do século XIX, com xícara limpa e um preparo que vira espetáculo à mesa.",
    peso: "Com queimador a álcool",
    precoCentavos: 89900,
    estoque: 3,
  },
  {
    slug: "clever-dripper",
    categoria: "equipamentos",
    nome: "Clever Dripper",
    subtitulo: "Imersão com filtro de papel",
    descricao:
      "Uma válvula na base segura a água até a cafeteira ser apoiada na xícara. Tem o corpo da prensa francesa e a limpeza do filtro de papel, com pouca técnica.",
    peso: "Capacidade 500 ml",
    precoCentavos: 18900,
    estoque: 10,
  },

  {
    slug: "moedor-manual",
    categoria: "acessorios",
    nome: "Moedor manual Comandante C40",
    subtitulo: "Mós cônicas de aço nitrogenado",
    descricao:
      "Fabricado na Alemanha. A moagem uniforme é o que mais muda a xícara depois do próprio café, e o C40 vai do espresso à prensa francesa só com o ajuste de cliques.",
    peso: "Capacidade 40 g",
    precoCentavos: 249000,
    estoque: 4,
  },
  {
    slug: "chaleira-bico-ganso",
    categoria: "acessorios",
    nome: "Chaleira Fellow Stagg EKG",
    subtitulo: "Elétrica, controle de 1 °C",
    descricao:
      "Bico fino para controlar a vazão no V60 e na Chemex, e controle de temperatura grau a grau. Mantém a água quente por até 60 minutos.",
    peso: "Capacidade 900 ml",
    precoCentavos: 129000,
    estoque: 5,
  },
  {
    slug: "balanca-cafe",
    categoria: "acessorios",
    nome: "Balança Acaia Pearl",
    subtitulo: "Precisão de 0,1 g com timer",
    descricao:
      "Pesa café e água ao mesmo tempo que cronometra. Repetir uma receita depende de medir, e medir colherada não funciona.",
    peso: "Até 2 kg",
    precoCentavos: 119000,
    estoque: 6,
  },
  {
    slug: "filtros-papel",
    categoria: "acessorios",
    nome: "Filtros de papel V60 02",
    subtitulo: "100 unidades, sem branqueamento",
    descricao: "Filtros cônicos de papel natural. Escalde antes de usar para tirar o gosto de papel.",
    peso: "100 unidades",
    precoCentavos: 3900,
    estoque: 60,
  },
  {
    slug: "xicaras-porcelana",
    categoria: "acessorios",
    nome: "Par de xícaras de porcelana",
    subtitulo: "180 ml, esmalte fosco",
    descricao:
      "Boca larga para o aroma chegar antes do gole e parede grossa para segurar a temperatura. Feitas à mão em Cunha, SP.",
    peso: "2 unidades",
    precoCentavos: 16900,
    estoque: 16,
  },
];

export type MetodoSeed = {
  slug: string;
  nome: string;
  resumo: string;
  dificuldade: "facil" | "media" | "dificil";
  tempoMin: number;
  proporcao: string;
  moagem: string;
  temperaturaC: string;
  kit: string[];
};

export const METODOS_PREPARO: MetodoSeed[] = [
  {
    slug: "v60",
    nome: "Hario V60",
    resumo: "Filtrado de despejo contínuo. Realça acidez e aroma, ideal para Geisha e cafés lavados.",
    dificuldade: "media",
    tempoMin: 3,
    proporcao: "15 g para 250 ml",
    moagem: "Média-fina, como sal refinado",
    temperaturaC: "92 – 94 °C",
    kit: ["hario-v60", "filtros-papel", "chaleira-bico-ganso", "balanca-cafe", "moedor-manual"],
  },
  {
    slug: "chemex",
    nome: "Chemex",
    resumo: "Filtro grosso, xícara muito limpa. Bom para servir várias pessoas de uma vez.",
    dificuldade: "media",
    tempoMin: 5,
    proporcao: "40 g para 650 ml",
    moagem: "Média-grossa, como sal grosso",
    temperaturaC: "93 – 95 °C",
    kit: ["chemex", "chaleira-bico-ganso", "balanca-cafe", "moedor-manual"],
  },
  {
    slug: "aeropress",
    nome: "AeroPress",
    resumo: "Imersão curta com pressão. Perdoa erros, rende em qualquer lugar.",
    dificuldade: "facil",
    tempoMin: 2,
    proporcao: "17 g para 220 ml",
    moagem: "Média",
    temperaturaC: "85 – 90 °C",
    kit: ["aeropress", "balanca-cafe", "moedor-manual"],
  },
  {
    slug: "prensa-francesa",
    nome: "Prensa francesa",
    resumo: "Imersão total com filtro de metal. Corpo denso, ótima para naturais e cafés brasileiros.",
    dificuldade: "facil",
    tempoMin: 5,
    proporcao: "30 g para 500 ml",
    moagem: "Grossa, como pimenta moída na hora",
    temperaturaC: "94 °C",
    kit: ["prensa-francesa", "balanca-cafe", "moedor-manual"],
  },
  {
    slug: "moka",
    nome: "Moka italiana",
    resumo: "Café forte no fogão, entre o filtrado e o espresso.",
    dificuldade: "facil",
    tempoMin: 5,
    proporcao: "18 g para 180 ml",
    moagem: "Fina, mais grossa que a do espresso",
    temperaturaC: "Água já quente na base",
    kit: ["moka-bialetti", "moedor-manual"],
  },
  {
    slug: "espresso",
    nome: "Espresso",
    resumo: "9 bar de pressão por 25 a 30 segundos. Concentrado, com crema.",
    dificuldade: "dificil",
    tempoMin: 1,
    proporcao: "18 g para 36 g de bebida",
    moagem: "Fina",
    temperaturaC: "93 °C",
    kit: ["moedor-manual", "balanca-cafe"],
  },
  {
    slug: "cold-brew",
    nome: "Cold brew",
    resumo: "Extração a frio por 12 a 18 horas. Doce, sem amargor, rende um concentrado para a semana.",
    dificuldade: "facil",
    tempoMin: 720,
    proporcao: "100 g para 1 l",
    moagem: "Grossa",
    temperaturaC: "Água fria ou em temperatura ambiente",
    kit: ["prensa-francesa", "balanca-cafe", "moedor-manual"],
  },
  {
    slug: "sifao",
    nome: "Sifão",
    resumo: "Vácuo e vapor. Xícara limpa e aromática, preparo que chama atenção à mesa.",
    dificuldade: "dificil",
    tempoMin: 6,
    proporcao: "20 g para 300 ml",
    moagem: "Média",
    temperaturaC: "Controlada pela chama",
    kit: ["sifao", "balanca-cafe", "moedor-manual"],
  },
];

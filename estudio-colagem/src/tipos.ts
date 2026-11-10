/**
 * Formato do roteiro de um vídeo-colagem.
 *
 * Um roteiro é um JSON em `roteiros/<id>.json`. Cada arquivo vira uma
 * composição no Remotion Studio, com o mesmo `id`.
 *
 * Coordenadas: pixels do quadro (1080 x 1920 por padrão), medidas no CENTRO
 * de cada camada. Tempos: segundos, contados a partir do início da cena.
 */

export type Entrada = 'colar' | 'deslizar' | 'pop' | 'corte';
export type Saida = 'arrancar' | 'sumir';
export type PosicaoFita =
  | 'topo'
  | 'base'
  | 'esquerda'
  | 'direita'
  | 'cantos'
  | 'canto-esq'
  | 'canto-dir'
  /** Posição livre, em % da caixa da figura (0–100), com rotação em graus. */
  | {x: number; y: number; rot?: number};
export type Som = 'papel' | 'fita' | 'carimbo' | 'rabisco' | 'maquina' | 'nenhum';

interface CamadaBase {
  /** Segundo (dentro da cena) em que a camada é colada. Se omitido, entra em sequência automática. */
  entra?: number;
  /** Segundo (dentro da cena) em que a camada sai. Se omitido, fica até o fim da cena. */
  sai?: number;
  saida?: Saida;
  x: number;
  y: number;
  /** Rotação final em graus (positivo = horário). */
  rotacao?: number;
  /** Som de efeito na entrada. Padrão depende do tipo. */
  som?: Som;
  /** De onde a camada vem quando entrada = "deslizar". */
  direcao?: 'esquerda' | 'direita' | 'cima' | 'baixo';
}

export interface CamadaRecorte extends CamadaBase {
  tipo: 'recorte';
  /** Caminho dentro de public/ (ex.: "recortes/mosquito.svg"). PNG com transparência ou SVG. */
  src: string;
  largura: number;
  entrada?: Entrada;
  /** Borda de "tesoura" gerada na hora (px). 0 desliga — use 0 se o PNG já veio do recortar.py com borda. */
  borda?: number;
  corBorda?: string;
  fita?: PosicaoFita[];
  /** Balanço leve enquanto está parado (como papel solto). Padrão: true. */
  flutuar?: boolean;
  /** Espelhar horizontalmente. */
  espelhar?: boolean;
}

export type EstiloTexto = 'tarja' | 'resgate' | 'maquina' | 'marcador' | 'etiqueta';

export interface CamadaTexto extends CamadaBase {
  tipo: 'texto';
  texto: string;
  estilo: EstiloTexto;
  /** Corpo da fonte em px. */
  tamanho?: number;
  /** Largura máxima da caixa de texto em px (quebra linhas). */
  largura?: number;
  /** Cor de fundo (tarja/etiqueta) ou da tinta (marcador). */
  cor?: string;
  corTexto?: string;
  entrada?: Entrada;
}

export interface CamadaRabisco extends CamadaBase {
  tipo: 'rabisco';
  forma: 'circulo' | 'seta' | 'sublinhado' | 'x' | 'check';
  largura: number;
  altura: number;
  cor?: string;
  espessura?: number;
  /** Duração do traço em segundos. */
  duracao?: number;
  /** Para setas: inverter o sentido horizontal. */
  espelhar?: boolean;
}

export interface CamadaCarimbo extends CamadaBase {
  tipo: 'carimbo';
  texto: string;
  tamanho?: number;
  cor?: string;
}

export type Camada = CamadaRecorte | CamadaTexto | CamadaRabisco | CamadaCarimbo;

export interface Fundo {
  /** Cor do papel. */
  cor?: string;
  /** Imagem de fundo opcional (cobre o quadro). Caminho dentro de public/. */
  imagem?: string;
  /** Pauta/quadriculado de caderno. */
  padrao?: 'liso' | 'pautado' | 'quadriculado' | 'jornal' | 'papelao';
}

export interface Cena {
  /** Nome livre, só para organização. */
  nome?: string;
  duracao: number;
  fundo?: Fundo;
  transicao?: 'rasgo' | 'folha' | 'corte';
  camera?: 'aproximar' | 'parada' | 'mao';
  camadas: Camada[];
}

export interface Estilo {
  papel: string;
  tinta: string;
  destaque: string;
  agua: string;
  marcaTexto: string;
  /** Desenhos por segundo. 12 = "animação em dois", cara de stop-motion. */
  passosPorSegundo: number;
  /** Intensidade do grão de filme (0 a 1). */
  grao: number;
  /** Tremor de stop-motion em px a cada desenho. */
  tremor: number;
  sons: boolean;
}

export interface Roteiro {
  id: string;
  titulo: string;
  formato?: {largura?: number; altura?: number; fps?: number};
  estilo?: Partial<Estilo>;
  audio?: {narracao?: string; trilha?: string; volumeTrilha?: number};
  /** Créditos de imagens/sons usados (vão para a legenda do post). Não aparece no vídeo. */
  creditos?: string[];
  /** Link ou título da matéria de origem. */
  materia?: string;
  cenas: Cena[];
}

export const ESTILO_PADRAO: Estilo = {
  papel: '#EFE6D3',
  tinta: '#161514',
  destaque: '#D62828',
  agua: '#2F6DB5',
  marcaTexto: '#F4D23C',
  passosPorSegundo: 12,
  grao: 0.5,
  tremor: 1.2,
  sons: true,
};

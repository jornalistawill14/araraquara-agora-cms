import {createContext, useContext} from 'react';
import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {ESTILO_PADRAO, type Estilo} from '../tipos';

export const EstiloContexto = createContext<Estilo>(ESTILO_PADRAO);
export const useEstilo = () => useContext(EstiloContexto);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Tempo "em degraus": a animação só muda a cada N quadros, como em stop-motion.
 * Com 24 fps e 12 desenhos/s, cada pose dura 2 quadros ("animação em dois").
 */
export const usePasso = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {passosPorSegundo} = useEstilo();
  const passo = Math.max(1, Math.round(fps / passosPorSegundo));
  const indice = Math.floor(frame / passo);
  return {quadro: indice * passo, indice, passo, fps, frameReal: frame};
};

/** Número pseudoaleatório determinístico entre -1 e 1. */
export const aleatorio = (semente: string | number) => random(String(semente)) * 2 - 1;

/** Pequeno deslocamento que muda a cada desenho — o "tremor" do stop-motion. */
export const tremor = (semente: string, indice: number, amplitude: number) => ({
  x: aleatorio(`${semente}-x-${indice}`) * amplitude,
  y: aleatorio(`${semente}-y-${indice}`) * amplitude,
  r: aleatorio(`${semente}-r-${indice}`) * amplitude * 0.25,
});

export interface Pose {
  visivel: boolean;
  escala: number;
  rotacao: number;
  dx: number;
  dy: number;
  /** 0 = encostado no papel; 1 = erguido (sombra longa e difusa). */
  elevacao: number;
  opacidade: number;
}

const POSE_PARADA: Pose = {visivel: true, escala: 1, rotacao: 0, dx: 0, dy: 0, elevacao: 0.12, opacidade: 1};
const INVISIVEL: Pose = {...POSE_PARADA, visivel: false, opacidade: 0};

/**
 * Pose de entrada. `t` = segundos desde o momento de entrar.
 * "colar": a figura cai da mão, bate no papel, achata e assenta (o "tapa" da colagem).
 */
export const poseEntrada = (
  entrada: string,
  t: number,
  semente: string,
  direcao: string | undefined,
  largura: number,
  altura: number,
): Pose => {
  if (t < 0) return INVISIVEL;
  const lado = aleatorio(`${semente}-lado`) >= 0 ? 1 : -1;

  if (entrada === 'corte') return POSE_PARADA;

  if (entrada === 'pop') {
    const p = t / 0.25;
    return {
      ...POSE_PARADA,
      escala: interpolate(p, [0, 0.5, 1], [0.2, 1.12, 1], clamp),
      rotacao: interpolate(p, [0, 1], [-10 * lado, 0], clamp),
      elevacao: interpolate(p, [0, 1], [0.6, 0.12], clamp),
    };
  }

  if (entrada === 'deslizar') {
    const p = t / 0.55;
    const dist = Math.max(largura, altura) * 1.6 + 900;
    const e = Easing.out(Easing.cubic)(Math.min(1, Math.max(0, p)));
    const v = {
      esquerda: [-dist, 0],
      direita: [dist, 0],
      cima: [0, -dist],
      baixo: [0, dist],
    }[direcao ?? 'esquerda'] ?? [-dist, 0];
    const assentar = interpolate(p, [0.85, 1, 1.25], [1.04, 0.98, 1], clamp);
    return {
      ...POSE_PARADA,
      dx: v[0] * (1 - e),
      dy: v[1] * (1 - e),
      rotacao: interpolate(p, [0, 1], [9 * lado, 0], clamp),
      escala: p < 0.85 ? 1.04 : assentar,
      elevacao: interpolate(p, [0, 0.85, 1.2], [0.7, 0.6, 0.12], clamp),
    };
  }

  // colar (padrão)
  const p = t / 0.34;
  return {
    ...POSE_PARADA,
    escala: interpolate(p, [0, 0.45, 0.75, 1], [1.34, 0.95, 1.015, 1], clamp),
    rotacao: interpolate(p, [0, 0.45, 0.75, 1], [8 * lado, -1.6 * lado, 0.5 * lado, 0], clamp),
    dy: interpolate(p, [0, 0.45, 1], [-40, 0, 0], clamp),
    elevacao: interpolate(p, [0, 0.45, 0.75, 1], [1, 0.05, 0.18, 0.12], clamp),
  };
};

/** Pose de saída. `t` = segundos desde o momento de sair. */
export const poseSaida = (saida: string | undefined, t: number, semente: string): Pose | null => {
  if (t < 0) return null;
  if (saida === 'arrancar') {
    const p = t / 0.3;
    if (p >= 1) return INVISIVEL;
    const lado = aleatorio(`${semente}-saida`) >= 0 ? 1 : -1;
    return {
      ...POSE_PARADA,
      escala: interpolate(p, [0, 0.3, 1], [1, 1.12, 1.25], clamp),
      rotacao: interpolate(p, [0, 1], [0, 25 * lado], clamp),
      dx: interpolate(p, [0.3, 1], [0, 1400 * lado], clamp),
      dy: interpolate(p, [0, 1], [0, -500], clamp),
      elevacao: interpolate(p, [0, 0.3], [0.12, 1], clamp),
    };
  }
  return INVISIVEL;
};

/** Combina entrada, flutuação e saída numa pose só. */
export const combinarPose = (entrada: Pose, saida: Pose | null): Pose => {
  if (!saida) return entrada;
  if (!saida.visivel) return saida;
  return {
    visivel: entrada.visivel,
    escala: entrada.escala * saida.escala,
    rotacao: entrada.rotacao + saida.rotacao,
    dx: entrada.dx + saida.dx,
    dy: entrada.dy + saida.dy,
    elevacao: Math.max(entrada.elevacao, saida.elevacao),
    opacidade: Math.min(entrada.opacidade, saida.opacidade),
  };
};

/** Sombra projetada conforme a elevação do papel. */
export const sombra = (elevacao: number) => {
  const dist = 3 + elevacao * 34;
  const desfoque = 2 + elevacao * 30;
  const alfa = 0.42 - elevacao * 0.17;
  return `drop-shadow(${dist * 0.55}px ${dist}px ${desfoque}px rgba(20, 14, 6, ${alfa.toFixed(3)}))`;
};

/**
 * Borda irregular (rasgada/recortada à mão) para usar em clip-path.
 * Gera um polígono em % que contorna a caixa com pequenas irregularidades.
 */
export const bordaIrregular = (semente: string, intensidade = 1.2, pontosPorLado = 9) => {
  const pts: string[] = [];
  const j = (k: string) => aleatorio(`${semente}-${k}`) * intensidade;
  for (let i = 0; i <= pontosPorLado; i++) pts.push(`${(i / pontosPorLado) * 100}% ${Math.abs(j(`t${i}`)) * 2}%`);
  for (let i = 1; i <= pontosPorLado; i++) pts.push(`${100 - Math.abs(j(`r${i}`))}% ${(i / pontosPorLado) * 100}%`);
  for (let i = pontosPorLado - 1; i >= 0; i--) pts.push(`${(i / pontosPorLado) * 100}% ${100 - Math.abs(j(`b${i}`)) * 2}%`);
  for (let i = pontosPorLado - 1; i >= 1; i--) pts.push(`${Math.abs(j(`l${i}`))}% ${(i / pontosPorLado) * 100}%`);
  return `polygon(${pts.join(', ')})`;
};

export const segundos = (s: number, fps: number) => Math.round(s * fps);

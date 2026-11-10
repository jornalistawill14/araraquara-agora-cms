import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import type {Entrada, Saida, Som} from '../tipos';
import {
  combinarPose,
  poseEntrada,
  poseSaida,
  sombra,
  tremor,
  usePasso,
  useEstilo,
  segundos,
  type Pose,
} from '../lib/tempo';

export interface InfoPeca {
  /** Segundos (em degraus) desde que a peça entrou. */
  t: number;
  pose: Pose;
  indice: number;
}

interface Props {
  id: string;
  x: number;
  y: number;
  rotacao?: number;
  entra: number;
  sai?: number;
  saida?: Saida;
  entrada: Entrada;
  direcao?: string;
  /** Tamanho aproximado, usado para calcular de onde a peça desliza. */
  largura: number;
  altura?: number;
  comSombra?: boolean;
  flutuar?: boolean;
  som?: Som;
  children: (info: InfoPeca) => React.ReactNode;
}

const VOLUMES: Record<string, number> = {papel: 0.7, fita: 0.45, carimbo: 0.9, rabisco: 0.35, maquina: 0.4};

/**
 * Peça de colagem: cuida de tempo, pose (entrada/saída), tremor de stop-motion,
 * sombra e som. O conteúdo visual vem do filho (render prop).
 */
export const Peca: React.FC<Props> = ({
  id,
  x,
  y,
  rotacao = 0,
  entra,
  sai,
  saida,
  entrada,
  direcao,
  largura,
  altura,
  comSombra = true,
  flutuar = false,
  som = 'nenhum',
  children,
}) => {
  const {quadro, indice, fps} = usePasso();
  const estilo = useEstilo();
  const tempo = quadro / fps;
  const t = tempo - entra;

  const pEntrada = poseEntrada(entrada, t, id, direcao, largura, altura ?? largura);
  const pSaida = sai !== undefined ? poseSaida(saida ?? 'sumir', tempo - sai, id) : null;
  const pose = combinarPose(pEntrada, pSaida);

  const tocarSom = estilo.sons && som !== 'nenhum' && t > -1;
  const audio = tocarSom ? (
    <Sequence from={segundos(entra, fps)} durationInFrames={segundos(som === 'maquina' ? 2.5 : 1.2, fps)} layout="none">
      <Html5Audio src={staticFile(`sons/${som}.wav`)} volume={VOLUMES[som] ?? 0.5} />
    </Sequence>
  ) : null;

  if (!pose.visivel) return audio;

  const tr = tremor(id, indice, estilo.tremor);
  const balanco = flutuar && t > 0.5 ? Math.sin(t * 1.6 + (id.length % 7)) * 0.45 : 0;

  return (
    <>
      {audio}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: [
            'translate(-50%, -50%)',
            `translate(${pose.dx + tr.x}px, ${pose.dy + tr.y}px)`,
            `rotate(${rotacao + pose.rotacao + tr.r + balanco}deg)`,
            `scale(${pose.escala})`,
          ].join(' '),
          filter: comSombra ? sombra(pose.elevacao) : undefined,
          opacity: pose.opacidade,
        }}
      >
        {children({t, pose, indice})}
      </div>
    </>
  );
};

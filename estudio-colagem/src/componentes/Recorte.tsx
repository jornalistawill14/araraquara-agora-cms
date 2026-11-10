import React from 'react';
import {Html5Audio, Img, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {CamadaRecorte, PosicaoFita} from '../tipos';
import {aleatorio, segundos, useEstilo} from '../lib/tempo';
import {Peca} from './Peca';

/**
 * Filtro SVG que cria, na hora, a borda branca irregular de figura recortada
 * à tesoura em volta de qualquer PNG transparente ou SVG.
 */
export const FiltroTesoura: React.FC<{id: string; raio: number; cor: string; semente: number}> = ({
  id,
  raio,
  cor,
  semente,
}) => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius={raio} result="dilatado" />
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves={2} seed={semente} result="ruido" />
        <feDisplacementMap
          in="dilatado"
          in2="ruido"
          scale={raio * 1.25}
          xChannelSelector="R"
          yChannelSelector="G"
          result="irregular"
        />
        <feFlood floodColor={cor} result="cor" />
        <feComposite in="cor" in2="irregular" operator="in" result="borda" />
        <feMerge>
          <feMergeNode in="borda" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

type PosicaoNomeada = Exclude<PosicaoFita, 'cantos' | {x: number; y: number; rot?: number}>;
type PosicaoUnica = Exclude<PosicaoFita, 'cantos'>;

const POSICOES: Record<PosicaoNomeada, {left: string; top: string; rot: number}> = {
  topo: {left: '50%', top: '3%', rot: -3},
  base: {left: '50%', top: '97%', rot: 4},
  esquerda: {left: '3%', top: '45%', rot: 84},
  direita: {left: '97%', top: '55%', rot: -86},
  'canto-esq': {left: '11%', top: '10%', rot: -42},
  'canto-dir': {left: '89%', top: '10%', rot: 40},
};

const resolverPosicao = (p: PosicaoUnica) =>
  typeof p === 'string' ? POSICOES[p] : {left: `${p.x}%`, top: `${p.y}%`, rot: p.rot ?? 0};

/** Pedaço de fita crepe com pontas serrilhadas. */
export const Fita: React.FC<{posicao: PosicaoUnica; semente: string; t: number; largura: number}> = ({
  posicao,
  semente,
  t,
  largura,
}) => {
  if (t < 0) return null;
  const base = resolverPosicao(posicao);
  const rot = base.rot + aleatorio(`${semente}-rot`) * 7;
  const escala = interpolate(t, [0, 0.12, 0.2], [1.3, 0.97, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const w = Math.max(110, Math.min(230, largura * 0.32));
  const dentes = 6;
  const esquerda = Array.from({length: dentes + 1}, (_, i) => `${i % 2 ? 4 : 0}% ${(i / dentes) * 100}%`);
  const direita = Array.from({length: dentes + 1}, (_, i) => `${i % 2 ? 96 : 100}% ${100 - (i / dentes) * 100}%`);
  return (
    <div
      style={{
        position: 'absolute',
        left: base.left,
        top: base.top,
        width: w,
        height: w * 0.27,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${escala})`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.04)), repeating-linear-gradient(90deg, rgba(120,100,60,0.05) 0 2px, transparent 2px 7px), rgba(232, 221, 186, 0.86)',
        clipPath: `polygon(${[...esquerda, ...direita].join(', ')})`,
      }}
    />
  );
};

export const Recorte: React.FC<{camada: CamadaRecorte; id: string; entra: number}> = ({camada, id, entra}) => {
  const borda = camada.borda ?? 12;
  const filtroId = `tesoura-${id}`;
  const semente = Math.floor(Math.abs(aleatorio(id)) * 1000);
  const fitas: PosicaoUnica[] = (camada.fita ?? []).flatMap((f): PosicaoUnica[] => (f === 'cantos' ? ['canto-esq', 'canto-dir'] : [f]));
  const duracaoEntrada = camada.entrada === 'deslizar' ? 0.6 : 0.34;
  const estilo = useEstilo();
  const {fps} = useVideoConfig();
  const atrasoFita = duracaoEntrada + 0.17;

  return (
    <>
    {estilo.sons && fitas.length > 0 ? (
      <Sequence from={segundos(entra + atrasoFita, fps)} durationInFrames={segundos(1, fps)} layout="none">
        <Html5Audio src={staticFile('sons/fita.wav')} volume={0.4} />
      </Sequence>
    ) : null}
    <Peca
      id={id}
      x={camada.x}
      y={camada.y}
      rotacao={camada.rotacao}
      entra={entra}
      sai={camada.sai}
      saida={camada.saida}
      entrada={camada.entrada ?? 'colar'}
      direcao={camada.direcao}
      largura={camada.largura}
      flutuar={camada.flutuar ?? true}
      som={camada.som ?? 'papel'}
    >
      {({t}) => (
        <div style={{position: 'relative', width: camada.largura}}>
          {borda > 0 ? <FiltroTesoura id={filtroId} raio={borda} cor={camada.corBorda ?? '#FBF8F1'} semente={semente} /> : null}
          <Img
            src={staticFile(camada.src)}
            style={{
              display: 'block',
              width: camada.largura,
              filter: borda > 0 ? `url(#${filtroId})` : undefined,
              transform: camada.espelhar ? 'scaleX(-1)' : undefined,
            }}
          />
          {fitas.map((f, i) => (
            <Fita key={i} posicao={f} semente={`${id}-fita-${i}`} t={t - atrasoFita - i * 0.09} largura={camada.largura} />
          ))}
        </div>
      )}
    </Peca>
    </>
  );
};

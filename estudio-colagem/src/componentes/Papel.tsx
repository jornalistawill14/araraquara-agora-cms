import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import type {Fundo} from '../tipos';
import {useEstilo, usePasso} from '../lib/tempo';

const PADROES: Record<string, string | undefined> = {
  pautado:
    'linear-gradient(90deg, transparent 0 118px, rgba(214,40,40,0.35) 118px 121px, transparent 121px), repeating-linear-gradient(180deg, transparent 0 62px, rgba(70,110,170,0.22) 62px 64px)',
  quadriculado:
    'repeating-linear-gradient(0deg, rgba(70,110,170,0.16) 0 2px, transparent 2px 54px), repeating-linear-gradient(90deg, rgba(70,110,170,0.16) 0 2px, transparent 2px 54px)',
  jornal:
    'repeating-linear-gradient(90deg, transparent 0 322px, var(--papel) 322px 352px), repeating-linear-gradient(180deg, rgba(30,30,30,0.075) 0 5px, transparent 5px 13px)',
  papelao: 'repeating-linear-gradient(180deg, rgba(90,60,20,0.08) 0 9px, transparent 9px 17px)',
};

/** Folha de papel: cor, fibras, manchas e vinheta. */
export const Papel: React.FC<{fundo?: Fundo; semente: number}> = ({fundo, semente}) => {
  const e = useEstilo();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: fundo?.cor ?? e.papel}}>
      {fundo?.imagem ? <Img src={staticFile(fundo.imagem)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : null}
      {fundo?.padrao && PADROES[fundo.padrao] ? (
        <AbsoluteFill style={{backgroundImage: PADROES[fundo.padrao], ['--papel' as string]: fundo?.cor ?? e.papel}} />
      ) : null}
      <svg width={width} height={height} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
        <filter id={`fibras-${semente}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.7 0.35" numOctaves={3} seed={semente} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.18  0 0 0 0.45 -0.1" />
        </filter>
        <filter id={`manchas-${semente}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves={3} seed={semente + 7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.2  0 0 0 0.55 -0.27" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#fibras-${semente})`} />
        <rect width="100%" height="100%" filter={`url(#manchas-${semente})`} />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(70,45,15,0.16) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Grão de filme que "ferve" a cada desenho, por cima de tudo. */
export const Grao: React.FC = () => {
  const e = useEstilo();
  const {indice} = usePasso();
  const {width, height} = useVideoConfig();
  if (e.grao <= 0) return null;
  const semente = indice % 24;
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: e.grao * 0.5, mixBlendMode: 'multiply', pointerEvents: 'none'}}>
      <filter id={`grao-${semente}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={semente} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.17  0 0 0 0 0.12  0 0 0 0.9 -0.3" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grao-${semente})`} />
    </svg>
  );
};

/** Zonas onde a interface do Instagram cobre o vídeo (valores aproximados, para revisão). */
export const Guias: React.FC = () => {
  const {width, height} = useVideoConfig();
  const faixa = (style: React.CSSProperties, rotulo: string) => (
    <div
      style={{
        position: 'absolute',
        background: 'rgba(255,0,80,0.18)',
        border: '3px dashed rgba(255,0,80,0.8)',
        color: 'rgba(160,0,50,0.9)',
        fontFamily: 'sans-serif',
        fontSize: 28,
        padding: 10,
        ...style,
      }}
    >
      {rotulo}
    </div>
  );
  const topo = Math.round(height * 0.14);
  const base = Math.round(height * 0.25);
  const direita = Math.round(width * 0.12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {faixa({left: 0, top: 0, width, height: topo}, 'topo: nome do perfil / áudio')}
      {faixa({left: 0, bottom: 0, width, height: base}, 'base: legenda e botões')}
      {faixa({right: 0, top: topo, width: direita, height: height - topo - base}, 'ícones')}
    </AbsoluteFill>
  );
};

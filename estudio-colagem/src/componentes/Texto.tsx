import React from 'react';
import {interpolate} from 'remotion';
import type {CamadaTexto} from '../tipos';
import {aleatorio, bordaIrregular, poseEntrada, sombra, useEstilo} from '../lib/tempo';
import {Peca} from './Peca';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const FONTE_TITULO = "'Anton', 'Impact', sans-serif";
export const FONTE_MAQUINA = "'Special Elite', 'Courier New', monospace";
export const FONTE_MARCADOR = "'Permanent Marker', 'Comic Sans MS', cursive";

/** Tarjas empilhadas: cada linha é uma tira de papel colada em sequência. */
const Tarja: React.FC<{camada: CamadaTexto; id: string; t: number}> = ({camada, id, t}) => {
  const e = useEstilo();
  const linhas = camada.texto.split('\n');
  const tamanho = camada.tamanho ?? 110;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tamanho * 0.08}}>
      {linhas.map((linha, i) => {
        const pose = poseEntrada('colar', t - i * 0.17, `${id}-${i}`, undefined, 600, 120);
        if (!pose.visivel) return <div key={i} style={{height: tamanho * 1.15}} />;
        return (
          <div
            key={i}
            style={{
              transform: `rotate(${aleatorio(`${id}-r${i}`) * 2.2 + pose.rotacao}deg) scale(${pose.escala}) translateY(${pose.dy}px)`,
              filter: sombra(pose.elevacao),
            }}
          >
            <div
              style={{
                background: camada.cor ?? e.tinta,
                color: camada.corTexto ?? e.papel,
                fontFamily: FONTE_TITULO,
                fontSize: tamanho,
                lineHeight: 1.05,
                padding: '0.1em 0.32em 0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                clipPath: bordaIrregular(`${id}-b${i}`, 1.1),
              }}
            >
              {linha}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** "Bilhete de resgate": cada palavra recortada de um impresso diferente. */
const Resgate: React.FC<{camada: CamadaTexto; id: string; t: number}> = ({camada, id, t}) => {
  const e = useEstilo();
  const tamanho = camada.tamanho ?? 96;
  const variantes = [
    {bg: '#FFFFFF', fg: e.tinta, font: FONTE_TITULO, caixa: true},
    {bg: e.destaque, fg: '#FFFFFF', font: FONTE_TITULO, caixa: true},
    {bg: '#F6EFDC', fg: e.tinta, font: FONTE_MAQUINA, caixa: false},
    {bg: e.tinta, fg: '#FFFFFF', font: FONTE_TITULO, caixa: true},
    {bg: e.marcaTexto, fg: e.tinta, font: FONTE_TITULO, caixa: true},
  ];
  const linhas = camada.texto.split('\n').map((l) => l.split(/\s+/).filter(Boolean));
  let k = 0;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: tamanho * 0.12, width: camada.largura ?? 940}}>
      {linhas.map((palavras, li) => (
        <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: tamanho * 0.12}}>
          {palavras.map((p) => {
            const n = k++;
            const v = variantes[Math.floor(Math.abs(aleatorio(`${id}-v${n}`)) * 997 + n) % variantes.length];
            const pose = poseEntrada('colar', t - n * 0.1, `${id}-p${n}`, undefined, 300, 120);
            const escalaFonte = 1 + aleatorio(`${id}-s${n}`) * 0.1;
            return (
              <div
                key={n}
                style={{
                  visibility: pose.visivel ? 'visible' : 'hidden',
                  transform: `translateY(${aleatorio(`${id}-y${n}`) * tamanho * 0.08 + pose.dy}px) rotate(${aleatorio(`${id}-r${n}`) * 5 + pose.rotacao}deg) scale(${pose.escala})`,
                  filter: sombra(pose.elevacao),
                }}
              >
                <div
                  style={{
                    background: v.bg,
                    color: v.fg,
                    fontFamily: v.font,
                    fontSize: tamanho * escalaFonte * (v.font === FONTE_MAQUINA ? 0.92 : 1),
                    lineHeight: 1.08,
                    padding: '0.08em 0.22em 0.04em',
                    textTransform: v.caixa ? 'uppercase' : 'none',
                    clipPath: bordaIrregular(`${id}-c${n}`, 2.2, 5),
                  }}
                >
                  {p}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Tira de papel datilografada, letra por letra. */
const Maquina: React.FC<{camada: CamadaTexto; id: string; t: number}> = ({camada, id, t}) => {
  const e = useEstilo();
  const tamanho = camada.tamanho ?? 58;
  const atraso = 0.3;
  const letras = Math.max(0, Math.floor((t - atraso) * 24));
  const visivel = camada.texto.slice(0, letras);
  const resto = camada.texto.slice(letras);
  return (
    <div
      style={{
        background: camada.cor ?? '#F7F1E1',
        color: camada.corTexto ?? e.tinta,
        fontFamily: FONTE_MAQUINA,
        fontSize: tamanho,
        lineHeight: 1.25,
        padding: '0.45em 0.7em',
        width: camada.largura,
        whiteSpace: 'pre-wrap',
        clipPath: bordaIrregular(`${id}-m`, 1.4, 12),
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 1.24em, rgba(80,110,160,0.10) 1.24em 1.27em)',
      }}
    >
      <span>{visivel}</span>
      <span style={{opacity: 0}}>{resto}</span>
    </div>
  );
};

/** Escrita de pincel atômico, revelada da esquerda para a direita. */
const Marcador: React.FC<{camada: CamadaTexto; id: string; t: number}> = ({camada, t}) => {
  const e = useEstilo();
  const tamanho = camada.tamanho ?? 90;
  const linhas = camada.texto.split('\n');
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      {linhas.map((l, i) => {
        const p = interpolate(t - i * 0.4, [0, 0.45], [0, 100], clamp);
        return (
          <div
            key={i}
            style={{
              fontFamily: FONTE_MARCADOR,
              fontSize: tamanho,
              lineHeight: 1.1,
              color: camada.cor ?? e.destaque,
              whiteSpace: 'nowrap',
              clipPath: `inset(-20% ${100 - p}% -20% -5%)`,
              mixBlendMode: 'multiply',
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

/** Etiqueta de rotuladora (Dymo): letras em relevo numa fita plástica. */
const Etiqueta: React.FC<{camada: CamadaTexto}> = ({camada}) => {
  const e = useEstilo();
  const tamanho = camada.tamanho ?? 60;
  return (
    <div
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.18)), ${camada.cor ?? e.destaque}`,
        color: camada.corTexto ?? '#FFFFFF',
        fontFamily: FONTE_TITULO,
        fontSize: tamanho,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '0.12em 0.6em 0.08em',
        borderRadius: tamanho * 0.12,
        whiteSpace: 'nowrap',
        textShadow: '0 1px 0 rgba(255,255,255,0.45), 0 -1px 0 rgba(0,0,0,0.35)',
      }}
    >
      {camada.texto}
    </div>
  );
};

export const Texto: React.FC<{camada: CamadaTexto; id: string; entra: number}> = ({camada, id, entra}) => {
  // Tarja e resgate animam cada pedaço; o conjunto só "aparece".
  const porPedaco = camada.estilo === 'tarja' || camada.estilo === 'resgate';
  const entradaGrupo = porPedaco || camada.estilo === 'marcador' ? 'corte' : camada.entrada ?? 'colar';
  const somPadrao = camada.estilo === 'maquina' ? 'maquina' : camada.estilo === 'marcador' ? 'rabisco' : 'papel';
  return (
    <Peca
      id={id}
      x={camada.x}
      y={camada.y}
      rotacao={camada.rotacao}
      entra={entra}
      sai={camada.sai}
      saida={camada.saida}
      entrada={entradaGrupo}
      direcao={camada.direcao}
      largura={camada.largura ?? 800}
      comSombra={!porPedaco && camada.estilo !== 'marcador'}
      som={camada.som ?? somPadrao}
    >
      {({t}) => {
        switch (camada.estilo) {
          case 'tarja':
            return <Tarja camada={camada} id={id} t={t} />;
          case 'resgate':
            return <Resgate camada={camada} id={id} t={t} />;
          case 'maquina':
            return <Maquina camada={camada} id={id} t={t} />;
          case 'marcador':
            return <Marcador camada={camada} id={id} t={t} />;
          case 'etiqueta':
            return <Etiqueta camada={camada} />;
          default:
            return null;
        }
      }}
    </Peca>
  );
};

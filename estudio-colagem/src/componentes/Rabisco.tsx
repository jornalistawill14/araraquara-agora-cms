import React from 'react';
import {interpolate} from 'remotion';
import type {CamadaCarimbo, CamadaRabisco} from '../tipos';
import {aleatorio, useEstilo} from '../lib/tempo';
import {Peca} from './Peca';
import {FONTE_TITULO} from './Texto';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Converte uma lista de pontos num caminho suave (curvas pelos pontos médios). */
const suave = (pts: [number, number][]) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const u = pts[pts.length - 1];
  return `${d} L ${u[0].toFixed(1)} ${u[1].toFixed(1)}`;
};

/** Desenha formas "à mão", com pequenas imperfeições determinísticas. */
export const caminhoRabisco = (forma: CamadaRabisco['forma'], w: number, h: number, s: string, espelhar = false) => {
  const j = (k: string, a: number) => aleatorio(`${s}-${k}`) * a;
  const pad = 14;
  switch (forma) {
    case 'circulo': {
      const pts: [number, number][] = [];
      const inicio = -Math.PI * 0.62 + j('a0', 0.3);
      const voltas = Math.PI * 2 * 1.13;
      const n = 28;
      for (let i = 0; i <= n; i++) {
        const a = inicio + (i / n) * voltas;
        const r = 1 + j(`r${i}`, 0.035) + (i / n) * 0.05;
        pts.push([w / 2 + Math.cos(a) * (w / 2 - pad) * r, h / 2 + Math.sin(a) * (h / 2 - pad) * r * 0.97]);
      }
      return suave(pts);
    }
    case 'sublinhado': {
      const a: [number, number][] = [];
      for (let i = 0; i <= 8; i++) a.push([pad + (i / 8) * (w - 2 * pad), h * 0.45 + j(`u${i}`, h * 0.12) - (i / 8) * h * 0.1]);
      const b: [number, number][] = [];
      for (let i = 0; i <= 6; i++) b.push([w * 0.85 - (i / 6) * w * 0.7, h * 0.68 + j(`v${i}`, h * 0.1)]);
      return `${suave(a)} ${suave(b).replace('M', 'L')}`;
    }
    case 'seta': {
      const x0 = espelhar ? w - pad : pad;
      const x1 = espelhar ? pad : w - pad;
      const p0: [number, number] = [x0, h - pad];
      const p1: [number, number] = [x1, pad + h * 0.08];
      const c: [number, number] = [x0 + (x1 - x0) * 0.15, pad + j('c', 20)];
      const pts: [number, number][] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push([
          (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0],
          (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1] + j(`s${i}`, 3),
        ]);
      }
      const dx = p1[0] - pts[14][0];
      const dy = p1[1] - pts[14][1];
      const ang = Math.atan2(dy, dx);
      const tam = Math.min(w, h) * 0.22 + 20;
      const ponta = (da: number) => [p1[0] - Math.cos(ang + da) * tam, p1[1] - Math.sin(ang + da) * tam];
      const a = ponta(0.5);
      const b = ponta(-0.5);
      return `${suave(pts)} M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    }
    case 'x':
      return `M ${pad} ${pad + j('x1', 8)} L ${w - pad} ${h - pad} M ${w - pad + j('x2', 8)} ${pad} L ${pad} ${h - pad + j('x3', 8)}`;
    case 'check':
      return suave([
        [pad, h * 0.55],
        [w * 0.22, h * 0.72],
        [w * 0.38, h - pad],
        [w * 0.6, h * 0.5],
        [w - pad, pad],
      ]);
    default:
      return '';
  }
};

export const Rabisco: React.FC<{camada: CamadaRabisco; id: string; entra: number}> = ({camada, id, entra}) => {
  const e = useEstilo();
  const d = caminhoRabisco(camada.forma, camada.largura, camada.altura, id, camada.espelhar);
  const dur = camada.duracao ?? 0.5;
  return (
    <Peca
      id={id}
      x={camada.x}
      y={camada.y}
      rotacao={camada.rotacao}
      entra={entra}
      sai={camada.sai}
      saida={camada.saida}
      entrada="corte"
      largura={camada.largura}
      comSombra={false}
      som={camada.som ?? 'rabisco'}
    >
      {({t}) => {
        const p = interpolate(t, [0, dur], [0, 1], clamp);
        return (
          <svg width={camada.largura} height={camada.altura} style={{overflow: 'visible', mixBlendMode: 'multiply'}}>
            <path
              d={d}
              pathLength={1}
              fill="none"
              stroke={camada.cor ?? e.destaque}
              strokeWidth={camada.espessura ?? 12}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1 1"
              strokeDashoffset={1 - p}
              opacity={0.92}
            />
          </svg>
        );
      }}
    </Peca>
  );
};

/** Carimbo de tinta, com falhas de impressão. */
export const Carimbo: React.FC<{camada: CamadaCarimbo; id: string; entra: number}> = ({camada, id, entra}) => {
  const e = useEstilo();
  const tamanho = camada.tamanho ?? 90;
  const cor = camada.cor ?? e.destaque;
  const filtro = `falhas-${id}`;
  return (
    <Peca
      id={id}
      x={camada.x}
      y={camada.y}
      rotacao={camada.rotacao ?? -11}
      entra={entra}
      sai={camada.sai}
      saida={camada.saida}
      entrada="corte"
      largura={tamanho * 4}
      comSombra={false}
      som={camada.som ?? 'carimbo'}
    >
      {({t}) => {
        const escala = interpolate(t, [0, 0.08, 0.16], [1.5, 0.96, 1], clamp);
        return (
          <>
            <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
              <defs>
                <filter id={filtro} x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={Math.floor(Math.abs(aleatorio(id)) * 99)} result="n" />
                  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -4.2 2.75" result="m" />
                  <feComposite in="SourceGraphic" in2="m" operator="in" />
                </filter>
              </defs>
            </svg>
            <div
              style={{
                transform: `scale(${escala})`,
                border: `${tamanho * 0.08}px solid ${cor}`,
                borderRadius: tamanho * 0.14,
                color: cor,
                fontFamily: FONTE_TITULO,
                fontSize: tamanho,
                lineHeight: 1.05,
                letterSpacing: '0.06em',
                padding: '0.06em 0.3em 0.02em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                filter: `url(#${filtro})`,
                opacity: 0.9,
                mixBlendMode: 'multiply',
              }}
            >
              {camada.texto}
            </div>
          </>
        );
      }}
    </Peca>
  );
};

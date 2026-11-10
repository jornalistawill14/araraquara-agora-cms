import React from 'react';
import {AbsoluteFill, continueRender, delayRender, Easing, Html5Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Carimbo, Rabisco} from './componentes/Rabisco';
import {Grao, Guias, Papel} from './componentes/Papel';
import {Recorte} from './componentes/Recorte';
import {Texto} from './componentes/Texto';
import {aleatorio, EstiloContexto, segundos, tremor, usePasso} from './lib/tempo';
import {ESTILO_PADRAO, type Cena, type Roteiro} from './tipos';

// ---------------------------------------------------------------- fontes
const FONTES = [
  {familia: 'Anton', arquivo: 'fontes/anton-latin-400-normal.woff2'},
  {familia: 'Special Elite', arquivo: 'fontes/special-elite-latin-400-normal.woff2'},
  {familia: 'Permanent Marker', arquivo: 'fontes/permanent-marker-latin-400-normal.woff2'},
];
let fontesPedidas = false;
const carregarFontes = () => {
  if (fontesPedidas || typeof document === 'undefined') return;
  fontesPedidas = true;
  const espera = delayRender('Carregando fontes');
  Promise.all(
    FONTES.map(async (f) => {
      const face = new FontFace(f.familia, `url('${staticFile(f.arquivo)}') format('woff2')`);
      await face.load();
      document.fonts.add(face);
    }),
  )
    .catch((err) => console.error('Falha ao carregar fontes', err))
    .finally(() => continueRender(espera));
};
carregarFontes();

// ---------------------------------------------------------------- tempo das cenas
const DURACAO_TRANSICAO = {rasgo: 0.5, folha: 0.36, corte: 0} as const;

export const planejarCenas = (roteiro: Roteiro, fps: number) => {
  let cursor = 0;
  return roteiro.cenas.map((cena, i) => {
    const transicao = i === 0 ? 'corte' : cena.transicao ?? 'rasgo';
    const sobreposicao = segundos(DURACAO_TRANSICAO[transicao], fps);
    const inicio = Math.max(0, cursor - sobreposicao);
    const duracao = segundos(cena.duracao, fps) + (inicio === cursor ? 0 : sobreposicao);
    cursor = inicio + duracao;
    return {cena, inicio, duracao, transicao, atrasoTransicao: DURACAO_TRANSICAO[transicao]};
  });
};

export const duracaoTotal = (roteiro: Roteiro, fps: number) => {
  const plano = planejarCenas(roteiro, fps);
  const ultimo = plano[plano.length - 1];
  return Math.max(1, ultimo ? ultimo.inicio + ultimo.duracao : 1);
};

// ---------------------------------------------------------------- uma cena
/** Polígono de papel rasgado para a borda de cima. */
const rasgo = (semente: string, largura: number, altura: number, base: number) => {
  const pts: string[] = [];
  const passo = 26;
  for (let x = 0; x <= largura + passo; x += passo) {
    const y = base + Math.abs(aleatorio(`${semente}-${x}`)) * 26 + Math.sin(x / 140) * 6;
    pts.push(`${Math.min(x, largura)}px ${y.toFixed(1)}px`);
  }
  pts.push(`${largura}px ${altura + 200}px`, `0px ${altura + 200}px`);
  return `polygon(${pts.join(', ')})`;
};

const ConteudoCena: React.FC<{cena: Cena; indice: number; atraso: number; duracao: number}> = ({cena, indice, atraso, duracao}) => {
  const {quadro, indice: passo} = usePasso();
  const progresso = quadro / Math.max(1, duracao);
  const camera = cena.camera ?? 'aproximar';
  const escala = camera === 'aproximar' ? 1 + 0.045 * progresso : 1;
  const mao = camera === 'mao' ? tremor(`cam-${indice}`, passo, 3) : {x: 0, y: 0, r: 0};

  let auto = atraso + 0.2;
  const camadas = cena.camadas.map((c, j) => {
    const entra = c.entra ?? auto;
    auto = entra + (c.tipo === 'texto' ? 0.55 : 0.45);
    const id = `c${indice}-l${j}`;
    if (c.tipo === 'recorte') return <Recorte key={id} id={id} camada={c} entra={entra} />;
    if (c.tipo === 'texto') return <Texto key={id} id={id} camada={c} entra={entra} />;
    if (c.tipo === 'rabisco') return <Rabisco key={id} id={id} camada={c} entra={entra} />;
    if (c.tipo === 'carimbo') return <Carimbo key={id} id={id} camada={c} entra={entra} />;
    return null;
  });

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${mao.x}px, ${mao.y}px) rotate(${mao.r}deg) scale(${escala})`,
        transformOrigin: '50% 45%',
      }}
    >
      <Papel fundo={cena.fundo} semente={indice * 13 + 3} />
      {camadas}
    </AbsoluteFill>
  );
};

const CenaComTransicao: React.FC<{cena: Cena; indice: number; transicao: 'rasgo' | 'folha' | 'corte'; atraso: number; duracao: number}> = ({
  cena,
  indice,
  transicao,
  atraso,
  duracao,
}) => {
  const {quadro, fps} = usePasso();
  const {width, height} = useVideoConfig();
  const T = segundos(atraso, fps);
  const ativo = transicao !== 'corte' && quadro < T;
  const conteudo = <ConteudoCena cena={cena} indice={indice} atraso={atraso} duracao={duracao} />;
  if (!ativo) return conteudo;

  const p = Easing.out(Easing.cubic)(Math.min(1, quadro / T));
  if (transicao === 'folha') {
    const lado = aleatorio(`folha-${indice}`) >= 0 ? 1 : -1;
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${interpolate(p, [0, 0.6, 1], [1.12, 0.985, 1])}) rotate(${interpolate(p, [0, 0.6, 1], [3 * lado, -0.6 * lado, 0])}deg)`,
          filter: `drop-shadow(0 ${interpolate(p, [0, 1], [40, 6])}px ${interpolate(p, [0, 1], [40, 8])}px rgba(0,0,0,0.4))`,
        }}
      >
        {conteudo}
      </AbsoluteFill>
    );
  }

  // rasgo: a folha nova sobe de baixo, com a borda de cima rasgada à mão
  const y = (1 - p) * (height + 80);
  return (
    <AbsoluteFill style={{transform: `translateY(${y}px)`, filter: 'drop-shadow(0 -14px 22px rgba(20,12,4,0.38))'}}>
      <AbsoluteFill style={{background: '#FBF8F1', clipPath: rasgo(`fibra-${indice}`, width, height, 0)}} />
      <AbsoluteFill style={{clipPath: rasgo(`rasgo-${indice}`, width, height, 16)}}>{conteudo}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- vídeo inteiro
export type PropsColagem = {roteiro: Roteiro; mostrarGuias: boolean};

export const Colagem: React.FC<PropsColagem> = ({roteiro, mostrarGuias}) => {
  const {fps} = useVideoConfig();
  const estilo = {...ESTILO_PADRAO, ...roteiro.estilo};
  const plano = planejarCenas(roteiro, fps);
  return (
    <EstiloContexto.Provider value={estilo}>
      <AbsoluteFill style={{backgroundColor: estilo.papel, overflow: 'hidden'}}>
        {plano.map(({cena, inicio, duracao, transicao, atrasoTransicao}, i) => (
          <Sequence key={i} from={inicio} durationInFrames={duracao} name={cena.nome ?? `Cena ${i + 1}`}>
            <CenaComTransicao cena={cena} indice={i} transicao={transicao} atraso={atrasoTransicao} duracao={duracao} />
          </Sequence>
        ))}
        <Grao />
        {roteiro.audio?.narracao ? <Html5Audio src={staticFile(roteiro.audio.narracao)} /> : null}
        {roteiro.audio?.trilha ? <Html5Audio src={staticFile(roteiro.audio.trilha)} volume={roteiro.audio.volumeTrilha ?? 0.2} /> : null}
        {mostrarGuias ? <Guias /> : null}
      </AbsoluteFill>
    </EstiloContexto.Provider>
  );
};

# Estúdio Colagem — Araraquara Agora

Fábrica de vídeos verticais na estética de **colagem animada**: ilustrações e fotos
recortadas que vão sendo "coladas" no papel, com fita crepe, retícula de jornal,
texto recortado, rabiscos de pincel atômico e movimento de stop-motion.

Cada vídeo é um **roteiro em JSON**, e o motor (Remotion + React) transforma o
roteiro em MP4 1080×1920. Quem escreve o roteiro pode ser uma pessoa ou o Claude,
seguindo a skill `/video-colagem` (`.claude/skills/video-colagem/SKILL.md`).

```
pauta ─► roteiro editorial ─► lista de recortes ─► recortar.py ─► roteiro JSON ─► render ─► Vyra (voz, legenda) ─► post
          (aprovação)          (aprovação)
```

## Começo rápido

```bash
cd estudio-colagem
npm install
npm run studio                          # abre o Remotion Studio no navegador (pré-visualização ao vivo)
npm run render -- demo-agua-parada      # gera saida/demo-agua-parada.mp4 + folha de contato
npm run render -- demo-agua-parada --rascunho   # metade da resolução, mais rápido
```

Requisitos: Node 18+ e ffmpeg. Para o `recortar.py`, Python 3.10+ com `pip install pillow numpy`.

## O que tem aqui

| Caminho | O que é |
|---|---|
| `ESTILO.md` | **bíblia visual**: paleta, fontes, tempos, regras de composição e ética |
| `roteiros/*.json` | um arquivo por vídeo, que aparece sozinho no Studio |
| `src/tipos.ts` | formato do roteiro, comentado campo a campo |
| `src/Colagem.tsx` | montagem: cenas, transições, áudio |
| `src/lib/tempo.ts` | stop-motion (12 desenhos/s), tremor, animação de "colar", sombra |
| `src/componentes/` | `Recorte` (borda de tesoura + fita), `Texto` (tarja, resgate, máquina, marcador, etiqueta), `Rabisco` (círculo, seta, sublinhado, X, check), `Carimbo`, `Papel` (fundo, grão, guias) |
| `scripts/recortar.py` | prepara fotos: remove fundo, P&B, meio-tom, duotone, borda de tesoura |
| `scripts/render.mjs` | renderiza e gera a folha de contato para revisão |
| `material-bruto/` | originais (fotos, ilustrações) antes do tratamento |
| `public/recortes/`, `public/fotos/` | recortes prontos: o **banco de recortes** que cresce a cada vídeo |
| `public/fontes/` | Anton (OFL), Special Elite e Permanent Marker (Apache 2.0) |
| `public/sons/` | efeitos **provisórios** sintetizados (papel, fita, carimbo, rabisco, máquina) |

## Anatomia de um roteiro

```json
{
  "id": "2026-11-dengue-trabiju",
  "titulo": "Dengue em Trabiju",
  "materia": "https://www.araraquaraagora.com/...",
  "creditos": ["Foto: Prefeitura de Trabiju (divulgação)"],
  "cenas": [
    {
      "duracao": 3.5,
      "fundo": {"padrao": "jornal"},
      "camadas": [
        {"tipo": "recorte", "src": "recortes/mosquito.svg", "x": 515, "y": 760, "largura": 820, "rotacao": -6,
         "fita": [{"x": 52, "y": 17, "rot": -14}]},
        {"tipo": "texto", "estilo": "tarja", "texto": "ÁGUA PARADA", "x": 540, "y": 1190, "tamanho": 132},
        {"tipo": "carimbo", "texto": "ALERTA", "x": 745, "y": 405}
      ]
    },
    {"duracao": 4, "transicao": "rasgo", "camadas": ["..."]}
  ]
}
```

- **Camadas:** `recorte`, `texto` (estilos `tarja`, `resgate`, `maquina`, `marcador`, `etiqueta`),
  `rabisco` (`circulo`, `seta`, `sublinhado`, `x`, `check`) e `carimbo`.
- **Entradas:** `colar` (padrão), `deslizar`, `pop`, `corte`. **Saídas:** `arrancar`, `sumir`.
- **Transições de cena:** `rasgo` (padrão), `folha`, `corte`. **Câmera:** `aproximar` (padrão), `mao`, `parada`.
- **Fundos:** `cor`, `imagem`, `padrao` (`liso`, `pautado`, `quadriculado`, `jornal`, `papelao`).
- Sem `entra`, as camadas entram em sequência automática, a cada 0,45 a 0,55 s.

## Preparar fotos

```bash
python3 -I scripts/recortar.py material-bruto/foto.jpg -o public/fotos/foto.png --meiotom 8 --brilho 1.2
python3 -I scripts/recortar.py material-bruto/pessoa.png -o public/recortes/pessoa.png --pb --borda 14
python3 -I scripts/recortar.py material-bruto/pessoa.jpg -o public/recortes/pessoa.png --remover-fundo --pb   # requer rembg
```

Fotos tratadas já saem com borda: use `"borda": 0` no roteiro. Ilustrações em SVG
ou PNG transparente recebem a borda na hora (`"borda": 12`).

## Revisão

- `npm run render` gera `saida/<id>-contato.jpg`, com 2 quadros por segundo numa folha só.
- Para ver as faixas que a interface do Instagram cobre, use
  `npx remotion still src/index.ts <id> saida/guias.png --frame=100 --props='{"mostrarGuias":true}'`.
  No Studio, ligue `mostrarGuias` no painel de props.

## Licenças e custos

- **Remotion**: gratuito para pessoas físicas, organizações sem fins lucrativos e empresas
  com até 3 funcionários. Acima disso é preciso uma *Company License*.
  Consulte [remotion.dev/license](https://remotion.dev/license), o
  [FAQ da licença](https://www.remotion.dev/docs/license/faq) e [os termos](https://www.remotion.dev/terms) antes de usar comercialmente.
- **Fontes**: Anton (SIL OFL 1.1), Special Elite e Permanent Marker (Apache 2.0), via Fontsource.
- **Sons**: os de `public/sons/` foram sintetizados com ffmpeg e são livres, mas provisórios.
  Substitua por foley gravado ou por sons do catálogo do Vyra.
- **Demo**: ilustrações e a "foto" do telhado foram desenhadas para o teste.
  Não existe matéria real por trás do demo.

## Próximos passos sugeridos

1. Calibrar `ESTILO.md` com prints do vídeo de referência (pasta `referencias/`, uso interno).
2. Trocar a paleta provisória pelas cores da marca e incluir o logotipo na cena de assinatura.
3. Montar o banco de recortes de Araraquara (prédios, praças, ícones de serviço público) em `public/recortes/`.
4. Legenda sincronizada com a narração direto no Remotion (`@remotion/captions` + transcrição).
5. Gravar foley real: papel, fita, tesoura, carimbo e máquina de escrever.

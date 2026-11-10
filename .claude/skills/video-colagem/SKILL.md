---
name: video-colagem
description: >
  Produz vídeos verticais (Reels, TikTok, Shorts) do Araraquara Agora na estética de
  colagem animada: ilustrações e fotos recortadas sendo coladas no papel, fita crepe,
  retícula de jornal, texto recortado e movimento de stop-motion a 12 desenhos por segundo.
  Use quando o usuário pedir "vídeo colagem", "vídeo recortado", "estética de colagem",
  "explicativo animado", "transformar a matéria em vídeo" nessa linguagem, ou abrir uma
  sessão dizendo que vai fazer um vídeo desse tipo.
---

# Sessão de vídeo-colagem

O motor fica em `estudio-colagem/` (Remotion + React). Um vídeo é um arquivo
`estudio-colagem/roteiros/<id>.json`. As regras visuais estão em
`estudio-colagem/ESTILO.md`. **Leia o ESTILO.md antes de escrever qualquer roteiro.**
O formato do JSON está tipado e comentado em `estudio-colagem/src/tipos.ts`.

Trabalhe em etapas e **peça aprovação ao fim das etapas 2 e 3**. Se o usuário aprovar
uma versão, só refaça o que ele pedir.

## Etapa 0 — Preparar o ambiente (1 vez por sessão)

```bash
cd estudio-colagem && npm install
```

Numa sessão na nuvem o Remotion não consegue baixar o navegador. O `npm run render`
já encontra o Chromium local. Para `npx remotion still` direto, exporte antes:
`export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell`.

## Etapa 1 — Briefing (5 perguntas, numa mensagem só)

1. Qual é a pauta? (link da matéria do portal, texto ou release)
2. Qual é a mensagem em **uma frase** e o que a pessoa deve fazer ou saber ao fim?
3. Que duração? (15, 30 ou 45 s)
4. Vai ter narração? (voz do repórter, voz gerada no Vyra, ou só texto na tela)
5. Que material temos? (fotos próprias, de assessoria, acervo, ou só ilustração)

Se o usuário já deu tudo isso, pule as perguntas.

## Etapa 2 — Roteiro editorial (aprovação 1)

Apresente uma tabela: `cena | segundos | texto na tela | figuras | transição`.

- **Gancho (0 a 3 s):** a figura principal colada nos primeiros 0,2 s, mais uma frase de no máximo 4 palavras.
- **Desenvolvimento:** de 2 a 4 cenas, cada uma com 1 ideia e no máximo 8 palavras na tela.
- **Fecho:** a ação ou consequência e depois a assinatura (marca + araraquaraagora.com).
- Dados, nomes e números vêm **só** da matéria ou da fonte. Nunca invente.
- Com narração: escreva o texto falado (cerca de 2,5 palavras por segundo) ao lado de cada cena.

## Etapa 3 — Lista de recortes (aprovação 2)

Para cada figura, diga de onde ela vem e que tratamento vai receber:

| Origem | Como |
|---|---|
| Foto própria ou de assessoria | o usuário envia ou aponta o link, e ela vai para `material-bruto/` |
| Ilustração simples (objeto, ícone, seta, mapa esquemático) | desenhe em SVG chapado em `public/recortes/`, com a paleta do ESTILO.md |
| Ilustração complexa | geração por IA (Higgsfield, Canva ou Vyra `generate`). **Gasta créditos: diga o preço e peça um sim antes** |
| Remoção de fundo | `rembg` local (`--remover-fundo`) ou as ferramentas Canva `remove-background`, Higgsfield `remove_background` ou Vyra `removeBackground` (créditos: pergunte antes) |

Respeite a seção 8 do ESTILO.md (ética): IA nunca representa pessoa real ou "flagrante",
e nenhuma montagem pode ser lida como registro de fato.

## Etapa 4 — Preparar os recortes

```bash
# foto → P&B com borda de tesoura
python3 -I scripts/recortar.py material-bruto/x.jpg -o public/recortes/x.png --pb --borda 14
# foto → retícula de jornal (meio-tom)
python3 -I scripts/recortar.py material-bruto/x.jpg -o public/fotos/x.png --meiotom 8 --brilho 1.2
# duotone vermelho, só para a foto-chave
python3 -I scripts/recortar.py material-bruto/x.jpg -o public/fotos/x-red.png --meiotom 7 --tinta "#D62828"
```

Abra (Read) cada PNG gerado para conferir antes de usar. SVGs não precisam de
preparo: o motor faz a borda na hora (`"borda": 12`).

## Etapa 5 — Escrever o roteiro JSON

Crie `roteiros/<id>.json`, com `id` só de letras minúsculas, números e hífens, ex. `2026-11-dengue-trabiju`.
Ele aparece sozinho no Studio, sem registro manual. Regras:

- Coordenadas `x`/`y` = **centro** da camada, em px de 1080×1920. Conteúdo importante entre
  y = 280 e y = 1430 e com x até 940 (zonas seguras do Reels). Se o post for virar anúncio, use y até 1240.
- `entra` em segundos desde o início da cena. Deixe pelo menos 0,45 s depois de uma transição `rasgo`
  e de 0,35 a 0,6 s entre colagens.
- Ordem no array = ordem de empilhamento (o último fica por cima).
- Preencha `materia` e `creditos`.
- Use `roteiros/demo-agua-parada.json` como modelo de sintaxe.

Valide com `npx tsc --noEmit` e `python3 -c "import json;json.load(open('roteiros/<id>.json'))"`.

## Etapa 6 — Rascunho, revisão e final

```bash
npm run render -- <id> --rascunho     # metade da resolução, rápido
```

Abra (Read) `saida/<id>-rascunho-contato.jpg` e confira:

- [ ] Nenhum texto importante nas faixas de interface (para conferir, rode um `still` com `--props='{"mostrarGuias":true}'`)
- [ ] Todo texto legível na folha de contato reduzida (se não se lê lá, não se lê no celular)
- [ ] Nada colado a 0° e nenhuma figura cortada sem intenção pela borda do quadro
- [ ] Fita em cima da figura, não no ar
- [ ] No máximo 8 palavras por cena e grafia idêntica à da matéria

Para conferir um movimento específico, extraia os quadros:
`ffmpeg -i saida/<id>-rascunho.mp4 -vf "select='between(n\,40\,52)',scale=270:-1,tile=6x2" -frames:v 1 -vsync 0 saida/zoom.jpg`.

Depois: `npm run render -- <id>`, que gera `saida/<id>.mp4` (1080×1920, H.264) e envie o arquivo ao usuário.

## Etapa 7 — Finalização (narração, legenda e música)

**Caminho A (padrão), no Vyra**, o editor que a redação já usa:
`createProject` → `uploadFiles` com o MP4 → `generate` com `kind: voiceover` (a partir de cerca de 3 créditos,
**peça antes**) ou a voz do repórter → `addCaptions` → sons do catálogo (`listSounds`)
→ `exportProject`. Siga as instruções do servidor Vyra.

**Caminho B, no próprio Remotion:** coloque `public/audio/narracao.mp3` (e a trilha) e
preencha `"audio": {"narracao": "audio/narracao.mp3", "trilha": "audio/trilha.mp3", "volumeTrilha": 0.2}`.
Ajuste as durações das cenas às frases da narração.

## Etapa 8 — Guardar

Faça commit do roteiro, dos recortes novos em `public/` e do material bruto que puder
ser versionado (não versione fotos de terceiros sem licença). O banco de recortes
cresce a cada vídeo: antes de desenhar ou gerar algo, procure em `public/recortes/`.

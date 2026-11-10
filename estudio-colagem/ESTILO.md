# Bíblia visual — vídeos em colagem

Este arquivo define a estética em números, para que todo vídeo saia com a mesma
cara, seja quem for (pessoa ou Claude) que monte o roteiro. Os valores marcados
com ⚙️ já são o padrão do motor (`src/tipos.ts` e `src/lib/tempo.ts`). Os demais
são regras de composição para quem escreve o roteiro.

> **Status:** a primeira versão foi calibrada pela descrição "ilustração + figura
> sendo colada". Quando houver prints da referência em `referencias/`, revise as
> seções 2, 4 e 5 contra eles.

## 1. Formato

| Item | Valor |
|---|---|
| Quadro | 1080 × 1920 (9:16) ⚙️ |
| Quadros por segundo | 24 ⚙️ |
| Desenhos por segundo | 12, ou seja, cada pose dura 2 quadros, a "animação em dois" do stop-motion ⚙️ |
| Duração | 15 a 45 s. Cada cena dura de 2,5 a 5 s |
| Zonas seguras (Reels) | evitar os 14% de cima (~270 px), os 25% de baixo (~480 px) e os 12% da direita (~130 px). Ligue `mostrarGuias` no Studio para ver as faixas. **Se o vídeo for impulsionado como anúncio**, a Meta pede 35% livres embaixo (~670 px) |

## 2. Paleta

Paleta provisória. **Troque pelas cores oficiais da marca** em `estilo` no roteiro
ou em `ESTILO_PADRAO`.

| Papel | Cor | Uso |
|---|---|---|
| papel | `#EFE6D3` | fundo padrão (creme) ⚙️ |
| tinta | `#161514` | tarjas, contornos, retícula ⚙️ |
| destaque | `#D62828` | carimbos, rabiscos, palavra-chave ⚙️ |
| água | `#2F6DB5` | ilustrações, dados ⚙️ |
| marca-texto | `#F4D23C` | um recorte de destaque por cena, no máximo ⚙️ |
| borda de recorte | `#FBF8F1` | a "sobra" de papel em volta das figuras ⚙️ |

Regra: cada cena usa no máximo **papel + tinta + 1 cor**. O vermelho é para o que
importa e não pode virar decoração.

## 3. Tipografia

| Fonte | Papel na cena | Corpo mínimo |
|---|---|---|
| **Anton** (tarja, resgate, etiqueta, carimbo) | manchete da cena, 1 a 4 palavras | 100 px |
| **Special Elite** (máquina de escrever) | contexto, dado, citação, fonte | 50 px |
| **Permanent Marker** (pincel atômico) | comentário, ênfase, "olha isso" | 64 px |

- Máximo de **8 palavras na tela por cena** e de 2 famílias de fonte por cena.
- Texto sempre em cima de papel (tarja/tira). Nunca direto sobre foto em retícula.
- Números e nomes próprios vão escritos exatamente como na matéria.

## 4. Recortes

- **Borda de tesoura:** de 10 a 16 px, off-white, irregular ⚙️ (`borda` no roteiro).
  Fotos tratadas pelo `recortar.py` já saem com borda: use `"borda": 0`.
- **Rotação:** entre ±2° e ±8°. Nada fica a 0°, porque papel colado à mão nunca sai reto.
- **Sombra:** curta quando está colado e longa quando está "no ar" ⚙️.
- **Fita crepe:** em 1 de cada 2 ou 3 recortes. Em figuras irregulares, posicione a fita
  sobre a figura com `{"x": %, "y": %, "rot": graus}`.
- **Fotos:** P&B (`--pb`) ou meio-tom (`--meiotom 7..10`). Use duotone vermelho
  (`--tinta "#D62828"`) só para a foto-chave do vídeo.
- **Ilustrações:** chapadas, com poucas cores, de preferência em SVG (escala sem perder qualidade).
- **Escala:** a figura principal ocupa de 60% a 85% da largura. As secundárias, de 20% a 45%.

## 5. Movimento

| Ação | Como é | Duração |
|---|---|---|
| **colar** (padrão) | chega a 134% com sombra longa → bate a 95% → 101,5% → 100%. Gira 8° → −1,6° → 0,5° → 0° | 0,34 s (4 desenhos) ⚙️ |
| **deslizar** | entra pela borda como se fosse empurrado pela mão e assenta | 0,55 s ⚙️ |
| **pop** | cresce de 20% a 112% e assenta. Use em ícones pequenos | 0,25 s ⚙️ |
| **arrancar** (saída) | ergue, gira e sai voando | 0,3 s ⚙️ |
| tremor | 1 a 1,5 px por desenho em tudo, o que dá o "fervor" de stop-motion | ⚙️ |
| flutuar | balanço de ±0,45° nos recortes parados | ⚙️ |
| câmera | aproximação de 4,5% ao longo da cena (`aproximar`). Use `mao` para tensão e `parada` na assinatura | ⚙️ |

**Ritmo:**
- A primeira figura cola nos primeiros 0,2 s do vídeo.
- O gancho tem que estar legível até 1,5 s.
- Entre uma colagem e outra, de 0,35 a 0,6 s. Mais rápido que isso vira ruído.
- No máximo 5 colagens novas por cena.

## 6. Transições

| Transição | Quando usar |
|---|---|
| `rasgo` (0,5 s) | mudança de assunto ou de bloco ⚙️ padrão |
| `folha` (0,36 s) | continuação do mesmo assunto, com uma folha nova colada por cima |
| `corte` | ritmo rápido, lista, contagem |

## 7. Som

- Cada colagem tem um "tapa" de papel. A fita tem o som de rasgar, o carimbo um baque
  e o texto datilografado as teclas ⚙️. **Os sons atuais são provisórios (sintetizados).**
  Troque por foley gravado (papel, fita, tesoura e carimbo de verdade) ou por sons do catálogo do Vyra.
- Música uns 6 dB abaixo da narração. Sem narração, a música conduz e os efeitos marcam as colagens.

## 8. Ética de colagem jornalística (inegociável)

1. **Colagem é ilustração, não registro.** Nunca monte uma cena que possa ser lida como
   fato, por exemplo colar uma pessoa real num lugar onde ela não esteve ou juntar duas pessoas que não se encontraram.
2. **Imagem gerada por IA** pode virar objeto, textura ou ícone. Não pode virar pessoa real,
   local real identificável nem "flagrante". Na dúvida, não use.
3. **Foto de pessoa real**: só com origem conhecida (produção própria, assessoria com
   autorização ou acervo com licença). Registre o crédito em `creditos` no roteiro ou na legenda do post.
4. **Dados na tela** precisam ter a fonte citada na própria cena (tira de máquina de
   escrever, 50 px) ou na legenda do post.
5. O tom gráfico (carimbo "ALERTA", vermelho) acompanha a gravidade real do fato.

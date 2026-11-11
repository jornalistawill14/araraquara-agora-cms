# Arte: "Agora é Patrimônio" — Trabiju

Card de feed (1080 × 1350) sobre as leis que tornaram patrimônio histórico, cultural e material de Trabiju
dois quadros da E.E. "Alfredo Evangelista Nogueira": o quadro dos **Diplomandos de 1955 do Grupo Escolar de Trabiju**
e a pintura **"Mapa Geral do Brasil"**.

| Arquivo | O que é |
|---|---|
| `saida/patrimonio-trabiju-feed.png` | A arte final. |
| `index.html` | A arte em HTML/CSS. Paleta tirada do próprio mural. |
| `preparar_fotos.py` | Recorta a logo e enquadra o mural. Documenta tudo o que foi feito nas imagens. |
| `render.js` | Gera o PNG com o Chromium do Playwright. |

## Fidelidade das imagens

- **Fotos dos quadros**: entram como foram tiradas. Só são redimensionadas para caber na moldura, sem filtro de cor, nitidez ou contraste.
- **Mural "Mapa Geral do Brasil"**: é uma pintura real e não pode ser alterada. A foto só é enquadrada num recorte retangular que contém a pintura inteira. O script confere que os pixels do recorte são idênticos aos do original. Por isso o início da data da câmera ("23/10/2…") continua visível, pequeno, no canto inferior direito, como na foto.
- **Logo da Prefeitura**: recortada da arte oficial na resolução original (703 × 185) e exibida em 1:1 sobre um fundo branco igual ao dela.

## Como gerar de novo

```bash
cd artes-estaticas/patrimonio-trabiju
python3 -I preparar_fotos.py   # precisa de pillow, numpy, scipy
node render.js
```

## Checagem pendente

A arte oficial data a pintura de **1942**. Mas o mapa pintado mostra os territórios do Amapá, do Rio Branco e do Guaporé,
criados pelo Decreto-Lei 5.812, de 13/09/1943. Não mostra Ponta Porã nem Iguaçu, extintos em 1946.
O Guaporé passou a se chamar Rondônia em 1956 (Lei 2.731).
Essa é a divisão do país entre 1946 e 1956. Vale conferir a data no texto da lei municipal.

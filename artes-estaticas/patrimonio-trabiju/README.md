# Arte: "Agora é Patrimônio" — Trabiju

Card de feed (1080 × 1350) sobre as leis que tornaram patrimônio histórico, cultural e imaterial de Trabiju
dois quadros da E.E. "Alfredo Evangelista Nogueira": o quadro dos **Diplomandos de 1955 do Grupo Escolar de Trabiju**
e a pintura **"Mapa Geral do Brasil"**.

| Arquivo | O que é |
|---|---|
| `saida/patrimonio-trabiju-feed.png` | Versão final. A data da câmera impressa no canto do mural foi apagada (só os dígitos). |
| `saida/patrimonio-trabiju-feed-mural-cru.png` | A mesma arte com a foto do mural sem nenhum pixel alterado (a data aparece). |
| `index.html` | A arte em HTML/CSS. Paleta tirada do próprio mural. |
| `preparar_fotos.py` | Recorta a logo, enquadra o mural e apaga a data da câmera. Documenta tudo o que foi feito nas imagens. |
| `render.js` | Gera os PNGs com o Chromium do Playwright. |

## Fidelidade das imagens

- **Fotos dos quadros**: entram como foram tiradas. Só são redimensionadas para caber na moldura, sem filtro de cor, nitidez ou contraste.
- **Mural**: na versão final, só os pixels da data "23/10/2026 10:35" mudaram, num canto do piso pintado. São 2.066 pixels, 0,108% da foto. A pintura e o mapa ficam intactos.
- **Logo da Prefeitura**: recortada da arte oficial na resolução original (703 × 185) e exibida em 1:1 sobre um fundo branco igual ao dela.

## Como gerar de novo

```bash
cd artes-estaticas/patrimonio-trabiju
python3 -I preparar_fotos.py   # precisa de pillow, numpy, scipy, opencv-python-headless
node render.js                 # versão final
node render.js cru             # versão com a foto do mural crua
```

## Checagem pendente

A arte oficial data a pintura de **1942**. Mas o mapa pintado mostra os territórios do Amapá, do Rio Branco e do Guaporé,
criados pelo Decreto-Lei 5.812, de 13/09/1943. Não mostra Ponta Porã nem Iguaçu, extintos em 1946.
O Guaporé passou a se chamar Rondônia em 1956 (Lei 2.731).
Essa é a divisão do país entre 1946 e 1956. Vale conferir a data no texto da lei municipal.

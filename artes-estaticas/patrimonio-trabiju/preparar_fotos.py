"""Prepara as imagens da arte "Patrimônio de Trabiju" a partir dos arquivos originais.

O que este script faz, e só isso:

1. Logo da Prefeitura: recorta o bloco brasão + nome + coração da arte oficial
   (fotos/originais/arte-prefeitura.jpg) e pinta de branco apenas a faixa da onda
   dourada/azul que encostava no topo do recorte. Os pixels da logo não mudam.
2. Mural "Mapa Geral do Brasil": é uma pintura real e NÃO pode ser alterada.
   A foto é só enquadrada (recorte retangular). A pintura ocupa x 153-1414 e
   y 75-1562 da foto original, e a caixa abaixo a contém inteira, com margem.
   Nenhum pixel é retocado, nem mesmo a data que a câmera imprimiu no canto.
3. Quadro "Diplomandos de 1955": usado inteiro, sem corte nem ajuste.

Nenhum filtro de cor, nitidez ou contraste é aplicado em nenhuma foto.

Uso: python3 -I preparar_fotos.py   (rodar dentro desta pasta)
"""

import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

AQUI = Path(__file__).resolve().parent
ORIG = AQUI / "fotos" / "originais"
SAIDA = AQUI / "fotos"


def logo():
    arte = Image.open(ORIG / "arte-prefeitura.jpg").convert("RGB")
    caixa = (206, 1192, 926, 1392)
    px = np.asarray(arte.crop(caixa)).copy()
    nao_branco = px.astype(int).min(axis=2) < 244
    rotulos, _ = ndimage.label(nao_branco)
    # componentes que tocam a borda do recorte = pedaços da onda decorativa
    borda = set(np.unique(rotulos[0, :])) | set(np.unique(rotulos[:, 0])) | set(np.unique(rotulos[:, -1]))
    borda.discard(0)
    onda = np.isin(rotulos, list(borda))
    resto = nao_branco & ~onda
    apagar = ndimage.binary_dilation(onda, iterations=3) & ~ndimage.binary_dilation(resto, iterations=1)
    px[apagar] = 255
    Image.fromarray(px).crop((5, 13, 708, 198)).save(SAIDA / "logo-prefeitura-trabiju.png")


def mural():
    foto = Image.open(ORIG / "mural-mapa-geral-do-brasil.jpg")
    caixa = (148, 70, 1416, 1568)  # pintura inteira (x 153-1414, y 75-1562) + fundo branco da foto
    foto.crop(caixa).save(SAIDA / "mural-mapa-geral-do-brasil.png")


def diplomandos():
    shutil.copyfile(ORIG / "quadro-diplomandos-1955.jpg", SAIDA / "quadro-diplomandos-1955.jpg")


if __name__ == "__main__":
    logo()
    mural()
    diplomandos()
    print("ok")

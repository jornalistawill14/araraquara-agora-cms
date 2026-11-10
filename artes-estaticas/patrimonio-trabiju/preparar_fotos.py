"""Prepara as imagens da arte "Patrimônio de Trabiju" a partir dos arquivos originais.

O que este script faz, e só isso:

1. Logo da Prefeitura: recorta o bloco brasão + nome + coração da arte oficial
   (fotos/originais/arte-prefeitura.jpg) e pinta de branco apenas a faixa da onda
   dourada/azul que encostava no topo do recorte. Os pixels da logo não mudam.
2. Mural "Mapa Geral do Brasil": enquadra o mural (o fundo branco da foto continua
   branco) e gera duas versões:
     - mural-sem-data.png: apaga só os dígitos da data da câmera "23/10/2026 10:35",
       que a câmera imprimiu sobre o piso pintado no canto inferior direito;
     - mural-cru.png: a foto sem nenhum pixel alterado (só o enquadramento).
3. Quadro "Diplomandos de 1955": usado inteiro, sem corte nem ajuste.

Nenhum filtro de cor, nitidez ou contraste é aplicado em nenhuma foto.

Uso: python3 -I preparar_fotos.py   (rodar dentro desta pasta)
"""

import shutil
from pathlib import Path

import cv2
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
    foto = np.asarray(Image.open(ORIG / "mural-mapa-geral-do-brasil.jpg").convert("RGB")).copy()
    caixa = (148, 70, 1422, 1568)  # mural inteiro + margem do fundo branco

    cru = foto[caixa[1]:caixa[3], caixa[0]:caixa[2]]
    Image.fromarray(cru).save(SAIDA / "mural-cru.png")

    # --- data da câmera: só a faixa x 1318-1545, y 1508-1552 da foto original ---
    x0, y0, x1, y1 = 1318, 1508, 1545, 1552
    trecho = foto[y0:y1, x0:x1].copy()
    cinza = cv2.cvtColor(trecho, cv2.COLOR_RGB2GRAY).astype(int)
    fundo_local = cv2.medianBlur(cv2.cvtColor(trecho, cv2.COLOR_RGB2GRAY), 21).astype(int)
    # dígitos sobre o piso pintado: bem mais claros que o entorno
    digitos_sobre_mural = (cinza - fundo_local) > 12
    # borda do mural medida na foto: x <= 1414 e y <= 1556; além disso é fundo branco
    yy, xx = np.mgrid[y0:y1, x0:x1]
    fora_do_mural = (xx > 1414) | (yy > 1556)
    mascara_mural = digitos_sobre_mural & ~fora_do_mural
    mascara_mural = ndimage.binary_dilation(mascara_mural, iterations=3)
    # o fundo branco também entra na máscara, para o preenchimento usar só a cor do piso
    mascara = ((mascara_mural | fora_do_mural).astype(np.uint8)) * 255
    limpo = cv2.inpaint(trecho, mascara, 4, cv2.INPAINT_TELEA)
    limpo[fora_do_mural] = 255  # dígitos sobre o fundo branco viram fundo branco
    foto[y0:y1, x0:x1] = limpo

    sem_data = foto[caixa[1]:caixa[3], caixa[0]:caixa[2]]
    Image.fromarray(sem_data).save(SAIDA / "mural-sem-data.png")


def diplomandos():
    shutil.copyfile(ORIG / "quadro-diplomandos-1955.jpg", SAIDA / "quadro-diplomandos-1955.jpg")


if __name__ == "__main__":
    logo()
    mural()
    diplomandos()
    print("ok")

#!/usr/bin/env python3
"""
Prepara uma imagem para virar "recorte de colagem".

Pega uma foto/ilustração (de preferência PNG já sem fundo) e aplica, na ordem:
  1. remoção de fundo (opcional, se o pacote `rembg` estiver instalado);
  2. tratamento de impresso: preto e branco, contraste, meio-tom (retícula de jornal)
     e/ou duotone (tinta colorida sobre papel);
  3. borda branca irregular, como se tivesse sido recortada à tesoura;
  4. corte das sobras transparentes.

Exemplos:
  python3 scripts/recortar.py material-bruto/prefeito.png -o public/recortes/prefeito.png --pb --borda 14
  python3 scripts/recortar.py material-bruto/rua.jpg -o public/fotos/rua.png --meiotom 9 --largura 1000
  python3 scripts/recortar.py material-bruto/rua.jpg -o public/fotos/rua-vermelha.png --meiotom 7 --tinta "#D62828"
  python3 scripts/recortar.py material-bruto/pessoa.jpg -o public/recortes/pessoa.png --remover-fundo --pb

Depois, no roteiro, use o arquivo com "borda": 0 (a borda já está no PNG).

Dependências: Pillow e numpy  (pip install pillow numpy)
Opcional:      rembg           (pip install "rembg[cpu]")  — para --remover-fundo
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps


def hex_rgb(cor: str) -> tuple[int, int, int]:
    cor = cor.lstrip("#")
    return tuple(int(cor[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def ruido_suave(largura: int, altura: int, escala: float, semente: int) -> np.ndarray:
    """Ruído de baixa frequência entre -1 e 1 (grade aleatória ampliada com interpolação bicúbica)."""
    rng = np.random.default_rng(semente)
    gw = max(2, int(largura / escala) + 2)
    gh = max(2, int(altura / escala) + 2)
    grade = Image.fromarray(((rng.random((gh, gw)) * 255).astype(np.uint8)), "L")
    grande = grade.resize((largura, altura), Image.BICUBIC)
    return np.asarray(grande, dtype=np.float32) / 127.5 - 1.0


def remover_fundo(img: Image.Image) -> Image.Image:
    try:
        from rembg import remove  # type: ignore
    except ImportError:
        sys.exit(
            "Para --remover-fundo instale o rembg (pip install \"rembg[cpu]\") "
            "ou remova o fundo antes (Canva, Higgsfield, Vyra ou remove.bg) e passe o PNG transparente."
        )
    return remove(img)


def meio_tom(cinza: Image.Image, celula: int, angulo: float = 45.0) -> Image.Image:
    """Retícula de pontos (jornal). Recebe 'L' e devolve 'L' (0 = tinta, 255 = papel)."""
    sobre = 3  # superamostragem para pontos lisos
    w, h = cinza.size
    girada = cinza.rotate(angulo, expand=True, resample=Image.BICUBIC, fillcolor=255)
    gw, gh = girada.size
    pix = np.asarray(girada, dtype=np.float32) / 255.0
    saida = Image.new("L", (gw * sobre, gh * sobre), 255)
    d = ImageDraw.Draw(saida)
    for y in range(0, gh, celula):
        for x in range(0, gw, celula):
            bloco = pix[y : y + celula, x : x + celula]
            if bloco.size == 0:
                continue
            escuro = 1.0 - float(bloco.mean())
            if escuro < 0.04:
                continue
            r = (celula / 2) * math.sqrt(escuro) * 1.42 * sobre
            cx = (x + celula / 2) * sobre
            cy = (y + celula / 2) * sobre
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    saida = saida.resize((gw, gh), Image.LANCZOS)
    volta = saida.rotate(-angulo, expand=True, resample=Image.BICUBIC, fillcolor=255)
    vw, vh = volta.size
    esq, topo = (vw - w) // 2, (vh - h) // 2
    return volta.crop((esq, topo, esq + w, topo + h))


def borda_tesoura(alfa: Image.Image, raio: int, semente: int, irregular: float) -> Image.Image:
    """Máscara da borda: alfa dilatado + contorno irregular."""
    tam = raio * 2 + 1
    dilatado = alfa.point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(tam if tam % 2 else tam + 1))
    if irregular <= 0:
        return dilatado
    w, h = dilatado.size
    a = np.asarray(dilatado, dtype=np.float32)
    dx = ruido_suave(w, h, 38, semente) * raio * irregular
    dy = ruido_suave(w, h, 38, semente + 1) * raio * irregular
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    sx = np.clip(xx + dx, 0, w - 1).astype(np.int32)
    sy = np.clip(yy + dy, 0, h - 1).astype(np.int32)
    deslocado = a[sy, sx]
    # nunca deixa a borda "morder" a figura
    final = np.maximum(deslocado, np.asarray(alfa, dtype=np.float32))
    return Image.fromarray(final.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.6))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("entrada")
    ap.add_argument("-o", "--saida", required=True)
    ap.add_argument("--largura", type=int, default=0, help="redimensiona para esta largura (px) antes de tratar")
    ap.add_argument("--remover-fundo", action="store_true")
    ap.add_argument("--pb", action="store_true", help="preto e branco")
    ap.add_argument("--contraste", type=float, default=1.2)
    ap.add_argument("--brilho", type=float, default=1.0, help="> 1 clareia (útil antes do meio-tom)")
    ap.add_argument("--meiotom", type=int, default=0, help="tamanho da célula da retícula em px (ex.: 7 a 12)")
    ap.add_argument("--tinta", default="#161514", help="cor da tinta no P&B/meio-tom (duotone)")
    ap.add_argument("--papel", default="#F4EEDF", help="cor do papel no meio-tom")
    ap.add_argument("--borda", type=int, default=14, help="espessura da borda branca (0 = sem borda)")
    ap.add_argument("--cor-borda", default="#FBF8F1")
    ap.add_argument("--irregular", type=float, default=0.55, help="0 = borda lisa; 1 = bem torta")
    ap.add_argument("--semente", type=int, default=7)
    a = ap.parse_args()

    img = Image.open(a.entrada)
    img = ImageOps.exif_transpose(img).convert("RGBA")
    if a.largura and img.width != a.largura:
        img = img.resize((a.largura, round(img.height * a.largura / img.width)), Image.LANCZOS)
    if a.remover_fundo:
        img = remover_fundo(img).convert("RGBA")

    alfa = img.getchannel("A")
    rgb = img.convert("RGB")

    if a.pb or a.meiotom:
        cinza = ImageOps.grayscale(rgb)
        cinza = ImageEnhance.Brightness(cinza).enhance(a.brilho)
        cinza = ImageEnhance.Contrast(cinza).enhance(a.contraste)
        if a.meiotom:
            cinza = meio_tom(cinza, a.meiotom)
            rgb = ImageOps.colorize(cinza, black=hex_rgb(a.tinta), white=hex_rgb(a.papel))
        else:
            rgb = ImageOps.colorize(cinza, black=hex_rgb(a.tinta), white=(250, 248, 242), mid=(128, 126, 122))

    figura = rgb.convert("RGBA")
    figura.putalpha(alfa)

    if a.borda > 0:
        margem = a.borda * 3
        tela = Image.new("RGBA", (figura.width + margem * 2, figura.height + margem * 2), (0, 0, 0, 0))
        alfa_tela = Image.new("L", tela.size, 0)
        alfa_tela.paste(alfa, (margem, margem))
        mascara = borda_tesoura(alfa_tela, a.borda, a.semente, a.irregular)
        papel = Image.new("RGBA", tela.size, hex_rgb(a.cor_borda) + (255,))
        # leve textura no papel da borda
        ruido = (ruido_suave(tela.width, tela.height, 3, a.semente + 9) * 6).astype(np.int16)
        p = np.asarray(papel, dtype=np.int16)
        p[..., :3] = np.clip(p[..., :3] + ruido[..., None], 0, 255)
        papel = Image.fromarray(p.astype(np.uint8), "RGBA")
        papel.putalpha(mascara)
        tela.alpha_composite(papel)
        tela.alpha_composite(figura, (margem, margem))
        figura = tela

    caixa = figura.getchannel("A").getbbox()
    if caixa:
        figura = figura.crop(caixa)

    Path(a.saida).parent.mkdir(parents=True, exist_ok=True)
    figura.save(a.saida, optimize=True)
    print(f"ok: {a.saida} ({figura.width}x{figura.height})")


if __name__ == "__main__":
    main()

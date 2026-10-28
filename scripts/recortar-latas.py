"""Recorta o fundo branco das fotos de produto para os banners da home.

As fotos do ERP (storage `produtos/padrao/*.webp`) vêm sem transparência, em fundo
branco. No banner azul a lata precisa aparecer recortada, como nos banners do Zé.
O recorte é por preenchimento a partir das bordas: tudo que é quase branco e está
ligado à borda vira transparente; a lata (que tem contorno mais escuro) fica.

Uso (precisa de Pillow e NumPy; numa venv à parte):
    python -I scripts/recortar-latas.py imperio_latao_473ml amstel_lager_latao_473ml ...

Gera `public/banners/latas/<nome>.png` (altura 480 px, cortado rente à lata) e
atualiza `src/data/recortes.json` ({"<nome>": "<nome>.png"}), que o banner usa
para saber quais produtos têm recorte. Confira cada PNG antes de commitar: lata
muito clara (prata, branca) pode perder um pedaço da borda.
"""

import io
import json
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "public" / "banners" / "latas"
MANIFESTO = RAIZ / "src" / "data" / "recortes.json"
URL = "https://dkbvmqnrdgnhiyhtgsjy.supabase.co/storage/v1/object/public/produtos/padrao/{}.webp"
QUASE_BRANCO = 244  # menor canal >= isto conta como fundo
ALTURA = 480


def fundo_ligado_a_borda(quase_branco: np.ndarray) -> np.ndarray:
    fundo = np.zeros_like(quase_branco)
    fundo[0, :] = quase_branco[0, :]
    fundo[-1, :] = quase_branco[-1, :]
    fundo[:, 0] = quase_branco[:, 0]
    fundo[:, -1] = quase_branco[:, -1]
    while True:
        cresceu = fundo.copy()
        cresceu[1:, :] |= fundo[:-1, :]
        cresceu[:-1, :] |= fundo[1:, :]
        cresceu[:, 1:] |= fundo[:, :-1]
        cresceu[:, :-1] |= fundo[:, 1:]
        cresceu &= quase_branco
        if (cresceu == fundo).all():
            return fundo
        fundo = cresceu


def recortar(nome: str) -> Path:
    with urllib.request.urlopen(URL.format(nome), timeout=30) as resposta:
        imagem = Image.open(io.BytesIO(resposta.read())).convert("RGB")
    rgb = np.asarray(imagem).astype(np.int16)
    menor = rgb.min(axis=2)
    fundo = fundo_ligado_a_borda(menor >= QUASE_BRANCO)

    alfa = np.where(fundo, 0, 255).astype(np.float32)
    # borda de 1 px suavizada: quanto mais branco, mais transparente (sem serrilhado)
    vizinho = np.zeros_like(fundo)
    vizinho[1:, :] |= fundo[:-1, :]
    vizinho[:-1, :] |= fundo[1:, :]
    vizinho[:, 1:] |= fundo[:, :-1]
    vizinho[:, :-1] |= fundo[:, 1:]
    anel = vizinho & ~fundo
    alfa[anel] = np.clip((255 - menor[anel]) / (255 - QUASE_BRANCO + 20) * 255, 60, 255)

    rgba = np.dstack([rgb.astype(np.uint8), alfa.astype(np.uint8)])
    recorte = Image.fromarray(rgba, "RGBA")
    caixa = recorte.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not caixa:
        raise SystemExit(f"{nome}: nada sobrou depois do recorte")
    recorte = recorte.crop(caixa)
    largura = round(recorte.width * ALTURA / recorte.height)
    recorte = recorte.resize((largura, ALTURA), Image.LANCZOS)

    SAIDA.mkdir(parents=True, exist_ok=True)
    destino = SAIDA / f"{nome}.png"
    recorte.save(destino, optimize=True)
    return destino


def main() -> None:
    nomes = sys.argv[1:]
    if not nomes:
        raise SystemExit(__doc__)
    manifesto = json.loads(MANIFESTO.read_text()) if MANIFESTO.exists() else {}
    for nome in nomes:
        destino = recortar(nome)
        manifesto[nome] = destino.name
        print(f"{nome}: {destino.relative_to(RAIZ)} ({destino.stat().st_size // 1024} KB)")
    MANIFESTO.write_text(json.dumps(dict(sorted(manifesto.items())), indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()

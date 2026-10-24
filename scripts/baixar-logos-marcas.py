#!/usr/bin/env python3
"""Baixa o logo de cada marca a partir do artigo dela na Wikipédia (a imagem do
infobox) para public/marcas/ e grava o manifesto src/data/marcas-logos.json.

Uso: python3 -I scripts/baixar-logos-marcas.py "Brahma=en:Brahma (beer)" "Skol=en:Skol" …
Formato de cada argumento: "<marca>=<wiki>:<título do artigo>" (wiki = en, pt, de…).
Só aceita .svg e .png; tags <script> e atributos on* de SVG são removidos.
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PASTA = os.path.join(RAIZ, 'public', 'marcas')
MANIFESTO = os.path.join(RAIZ, 'src', 'data', 'marcas-logos.json')
UA = 'casadosfundos-cardapio/1.0 (logos das marcas vendidas; contato pelo site)'


def slug(texto):
    s = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def pegar(url, tentativas=3):
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and i < tentativas - 1:
                time.sleep(3)
                continue
            raise


def imagens_do_artigo(wiki, titulo):
    url = f'https://{wiki}.wikipedia.org/w/api.php?' + urllib.parse.urlencode(
        {'action': 'query', 'prop': 'images', 'imlimit': 50, 'titles': titulo, 'redirects': 1, 'format': 'json'}
    )
    paginas = json.loads(pegar(url)).get('query', {}).get('pages', {})
    return [im['title'] for p in paginas.values() for im in p.get('images', [])]


def escolher(marca, titulos):
    # ícones da própria Wikipédia (Commons-logo, Wiki letter…) não contam
    uteis = [t for t in titulos if t.lower().endswith(('.svg', '.png')) and not re.search(r'commons|wiki|edit-|flag of|icon', t, re.I)]
    chave = slug(marca).split('-')[0]
    logos = [t for t in uteis if 'logo' in t.lower()]
    com_marca = [t for t in logos if chave in slug(t)] or logos or [t for t in uteis if chave in slug(t)]
    svgs = [t for t in com_marca if t.lower().endswith('.svg')]
    return (svgs or com_marca or [None])[0]


def baixar(wiki, titulo, destino):
    nome = titulo.split(':', 1)[1]
    dados = pegar(f'https://{wiki}.wikipedia.org/wiki/Special:FilePath/' + urllib.parse.quote(nome))
    if destino.endswith('.svg'):
        texto = dados.decode('utf-8', 'ignore')
        texto = re.sub(r'<script.*?</script>', '', texto, flags=re.S | re.I)
        texto = re.sub(r'\son[a-z]+="[^"]*"', '', texto, flags=re.I)
        dados = texto.encode('utf-8')
    with open(destino, 'wb') as f:
        f.write(dados)


def main():
    os.makedirs(PASTA, exist_ok=True)
    manifesto = json.load(open(MANIFESTO, encoding='utf-8')) if os.path.exists(MANIFESTO) else {}
    for arg in sys.argv[1:]:
        marca, _, alvo = arg.partition('=')
        wiki, _, artigo = alvo.partition(':')
        try:
            titulo = escolher(marca, imagens_do_artigo(wiki, artigo))
            if not titulo:
                print(f'{marca}: nenhum logo no artigo {wiki}:{artigo}')
                continue
            ext = '.svg' if titulo.lower().endswith('.svg') else '.png'
            arquivo = slug(marca) + ext
            baixar(wiki, titulo, os.path.join(PASTA, arquivo))
        except Exception as e:  # noqa: BLE001
            print(f'{marca}: erro ({type(e).__name__}: {e})')
            continue
        manifesto[marca] = {
            'arquivo': arquivo,
            'fonte': f'https://{wiki}.wikipedia.org/wiki/' + titulo.replace(' ', '_'),
        }
        print(f'{marca}: {arquivo}  ←  {wiki}:{titulo}')
        time.sleep(4)  # a Wikipédia devolve 429 com pedidos seguidos
    os.makedirs(os.path.dirname(MANIFESTO), exist_ok=True)
    with open(MANIFESTO, 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write('\n')


if __name__ == '__main__':
    main()

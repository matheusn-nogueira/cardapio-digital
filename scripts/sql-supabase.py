#!/usr/bin/env python3
"""Roda um arquivo .sql no Supabase da loja pela API de gestão.

Uso: python3 -I scripts/sql-supabase.py supabase/cardapio_push.sql

O SUPABASE_ACCESS_TOKEN vem do .env.local do pdv-balcao (mesmo token dos
outros scripts da loja); o valor nunca é impresso.
"""
import json
import os
import sys
import urllib.request

REF = 'dkbvmqnrdgnhiyhtgsjy'
ENV_PDV = os.path.expanduser('~/Pessoal/pdv-balcao/.env.local')


def token():
    with open(ENV_PDV, encoding='utf-8') as f:
        for linha in f:
            k, _, v = linha.strip().partition('=')
            if k.strip() == 'SUPABASE_ACCESS_TOKEN':
                return v.strip().strip('"').strip("'")
    sys.exit('SUPABASE_ACCESS_TOKEN não encontrado no .env.local do pdv-balcao')


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sql = open(sys.argv[1], encoding='utf-8').read()
    req = urllib.request.Request(
        f'https://api.supabase.com/v1/projects/{REF}/database/query',
        data=json.dumps({'query': sql}).encode(),
        headers={'Authorization': f'Bearer {token()}', 'Content-Type': 'application/json',
                 'User-Agent': 'casadosfundos-cardapio/1.0'},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        print(f'{sys.argv[1]}: aplicado (HTTP {r.status})', r.read().decode()[:300])


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Configura o aviso de status do pedido por push (uma vez, ou para trocar o segredo).

1. Gera um segredo novo e grava no Vault do banco (cardapio_push_webhook).
2. Grava os segredos da Edge Function: VAPID_* (do .env.local deste repo) e o
   mesmo segredo do webhook.
3. Publica a Edge Function cardapio-push-pedido (sem verificação de JWT: quem
   autentica é o segredo).

Uso: python3 -I scripts/configurar-push-pedido.py
Nada é impresso além do andamento. O token da API vem do .env.local do pdv-balcao.
"""
import json
import os
import secrets
import subprocess
import tempfile
import urllib.request

REF = 'dkbvmqnrdgnhiyhtgsjy'
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def ler_env(caminho):
    env = {}
    with open(caminho, encoding='utf-8') as f:
        for linha in f:
            k, _, v = linha.strip().partition('=')
            if k and not k.startswith('#'):
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


TOKEN = ler_env(os.path.expanduser('~/Pessoal/pdv-balcao/.env.local'))['SUPABASE_ACCESS_TOKEN']
LOCAL = ler_env(os.path.join(RAIZ, '.env.local'))


def sql(query):
    req = urllib.request.Request(
        f'https://api.supabase.com/v1/projects/{REF}/database/query',
        data=json.dumps({'query': query}).encode(),
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json', 'User-Agent': 'casadosfundos-cardapio/1.0'},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def main():
    segredo = secrets.token_hex(32)
    existe = sql("select id from vault.secrets where name = 'cardapio_push_webhook'")
    if existe:
        sql(f"select vault.update_secret('{existe[0]['id']}', '{segredo}')")
    else:
        sql(f"select vault.create_secret('{segredo}', 'cardapio_push_webhook')")
    print('1/3 segredo do webhook gravado no Vault')

    env = {**os.environ, 'SUPABASE_ACCESS_TOKEN': TOKEN}
    with tempfile.NamedTemporaryFile('w', suffix='.env', delete=False) as f:
        f.write(f"VAPID_PUBLIC_KEY={LOCAL['VAPID_PUBLIC_KEY']}\n")
        f.write(f"VAPID_PRIVATE_KEY={LOCAL['VAPID_PRIVATE_KEY']}\n")
        f.write(f'CARDAPIO_PUSH_WEBHOOK={segredo}\n')
        temporario = f.name
    try:
        subprocess.run(['supabase', 'secrets', 'set', '--env-file', temporario, '--project-ref', REF],
                       env=env, cwd=RAIZ, check=True, stdout=subprocess.DEVNULL)
    finally:
        os.remove(temporario)
    print('2/3 segredos da Edge Function gravados')

    subprocess.run(['supabase', 'functions', 'deploy', 'cardapio-push-pedido', '--project-ref', REF,
                    '--use-api', '--no-verify-jwt'], env=env, cwd=RAIZ, check=True)
    print('3/3 Edge Function publicada')


if __name__ == '__main__':
    main()

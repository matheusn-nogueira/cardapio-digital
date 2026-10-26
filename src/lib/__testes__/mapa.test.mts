import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pontoNaGrade, tilesDoMapa } from '../mapa.ts';

// a loja (Avenida Pirpirituba, 532, Realengo): no zoom 16 cai no tile 24863 × 37050
test('ponto da loja na grade de tiles do OpenStreetMap', () => {
  const { x, y } = pontoNaGrade(-22.8896641, -43.4222775, 16);
  assert.equal(Math.floor(x), 24863);
  assert.equal(Math.floor(y), 37050);
});

test('os tiles cobrem a moldura inteira e o ponto fica no meio', () => {
  const largura = 340;
  const altura = 160;
  const tiles = tilesDoMapa(-22.8896641, -43.4222775, 16, largura, altura);
  // cobertura: algum tile começa à esquerda/acima de 0 e algum termina depois da borda
  assert.ok(tiles.some((t) => t.esquerda <= 0) && tiles.some((t) => t.esquerda + 256 >= largura));
  assert.ok(tiles.some((t) => t.topo <= 0) && tiles.some((t) => t.topo + 256 >= altura));
  assert.ok(tiles.length <= 6);
  assert.ok(tiles.every((t) => t.url.startsWith('https://tile.openstreetmap.org/16/')));
});

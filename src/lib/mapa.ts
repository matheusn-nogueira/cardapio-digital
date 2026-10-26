// Mapa estático da loja com os quadradinhos (tiles) do OpenStreetMap: só imagens, que carregam
// em qualquer celular, sem chave e sem iframe. O ponto da loja fica no centro da moldura.
// Módulo puro para poder ser testado com `node --test`.

export const TAMANHO_TILE = 256;

export interface TileNaTela {
  url: string;
  /** posição do canto do tile dentro da moldura, em px */
  esquerda: number;
  topo: number;
}

/** Posição do ponto na grade de tiles do zoom z (fração = ponto dentro do tile). */
export function pontoNaGrade(lat: number, lng: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  };
}

/** Tiles que cobrem uma moldura largura × altura com o ponto bem no meio. */
export function tilesDoMapa(lat: number, lng: number, z: number, largura: number, altura: number): TileNaTela[] {
  const { x, y } = pontoNaGrade(lat, lng, z);
  // canto da moldura em px da grade
  const x0 = x * TAMANHO_TILE - largura / 2;
  const y0 = y * TAMANHO_TILE - altura / 2;
  const tiles: TileNaTela[] = [];
  for (let ty = Math.floor(y0 / TAMANHO_TILE); ty * TAMANHO_TILE < y0 + altura; ty++) {
    for (let tx = Math.floor(x0 / TAMANHO_TILE); tx * TAMANHO_TILE < x0 + largura; tx++) {
      tiles.push({
        url: `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`,
        esquerda: Math.round(tx * TAMANHO_TILE - x0),
        topo: Math.round(ty * TAMANHO_TILE - y0),
      });
    }
  }
  return tiles;
}

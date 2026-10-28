// Telas de iPhone com imagem de abertura própria (o iOS só usa a imagem do tamanho exato).
// Pontos e escala de cada aparelho, do SE ao 16 Pro Max; aparelho fora da lista abre em branco.
export const TELAS_IPHONE = [
  { largura: 440, altura: 956, escala: 3 }, // 16 Pro Max
  { largura: 402, altura: 874, escala: 3 }, // 16 Pro
  { largura: 430, altura: 932, escala: 3 }, // 14 Pro Max, 15/16 Plus e Pro Max
  { largura: 393, altura: 852, escala: 3 }, // 14 Pro, 15, 16
  { largura: 428, altura: 926, escala: 3 }, // 12/13 Pro Max, 14 Plus
  { largura: 390, altura: 844, escala: 3 }, // 12, 13, 14
  { largura: 375, altura: 812, escala: 3 }, // X, XS, 11 Pro, 12/13 mini
  { largura: 414, altura: 896, escala: 2 }, // XR, 11
  { largura: 375, altura: 667, escala: 2 }, // 6 a 8, SE
] as const;

/** Lista para `appleWebApp.startupImage` do Next. */
export function imagensDeAbertura() {
  return TELAS_IPHONE.map((t) => ({
    url: `/abertura?t=${t.largura * t.escala}x${t.altura * t.escala}`,
    media: `(device-width: ${t.largura}px) and (device-height: ${t.altura}px) and (-webkit-device-pixel-ratio: ${t.escala}) and (orientation: portrait)`,
  }));
}

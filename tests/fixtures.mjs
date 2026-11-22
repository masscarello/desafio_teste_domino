// Mãos fixas para cenários determinísticos (jogador 0 sempre tem o 6-6).

/** Jogador 0 bate na 7ª jogada; jogador 1 fica com o 2-0 (2 pontos). */
export const BATIDA = [
  [[6, 6], [6, 4], [4, 4], [4, 1], [1, 1], [1, 0], [0, 0]],
  [[6, 5], [5, 5], [5, 3], [3, 3], [3, 2], [2, 2], [2, 0]],
];
/** Sequência de jogadas que leva à batida do jogador 0. */
export const ROTEIRO_BATIDA = [
  [0, [6, 6], 'direita'], [1, [6, 5], 'direita'], [0, [6, 4], 'esquerda'], [1, [5, 5], 'direita'],
  [0, [4, 4], 'esquerda'], [1, [5, 3], 'direita'], [0, [4, 1], 'esquerda'], [1, [3, 3], 'direita'],
  [0, [1, 1], 'esquerda'], [1, [3, 2], 'direita'], [0, [1, 0], 'esquerda'], [1, [2, 2], 'direita'],
  [0, [0, 0], 'esquerda'],
];

/** Depois de 6-6 e 6-5 ninguém tem 6 nem 5: o jogo tranca. Jogador 0 fica com 18 pontos e o 1 com 24. */
export const TRANCADO = [
  [[6, 6], [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
  [[6, 5], [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 4]],
];

/** Mesmo bloqueio, mas os dois terminam com 27 pontos na mão. */
export const EMPATE = [
  [[6, 6], [4, 4], [3, 4], [2, 3], [1, 4], [0, 2], [0, 0]],
  [[6, 5], [1, 2], [1, 3], [2, 2], [2, 4], [3, 3], [0, 4]],
];

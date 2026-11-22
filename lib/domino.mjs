/**
 * Dominó para 2 jogadores — variante "bloqueado" (sem compra), com estado
 * imutável e um REDUTOR de ações: proximo = aplicar(estado, acao).
 *
 * Regras adotadas:
 *  - 28 peças (0-0 a 6-6); cada jogador recebe 7 e 14 ficam "dormindo" (fora do jogo);
 *  - começa quem tem a maior bucha (6-6, 5-5, ...); sem bucha, a peça de maior soma;
 *    a primeira jogada precisa ser essa peça;
 *  - jogador que não tem peça que encaixe PASSA (só pode passar nesse caso);
 *  - batida: quem fica sem peças vence a rodada e marca a soma das peças do adversário;
 *  - jogo trancado (os dois passam seguidos): vence quem tiver menos pontos na mão
 *    e marca os pontos do adversário; com pontos iguais a rodada empata (0 pontos);
 *  - a partida tem várias rodadas e termina quando alguém chega a 50 pontos.
 */

export const PONTOS_PARA_VENCER = 50;

export const ACAO = Object.freeze({ JOGAR: 'JOGAR', PASSAR: 'PASSAR' });
export const FASE = Object.freeze({ JOGANDO: 'jogando', FIM_DA_RODADA: 'fim_da_rodada', FIM_DA_PARTIDA: 'fim_da_partida' });

/** Representação de peça: [a, b] com a <= b. */
export const normalizar = ([a, b]) => (a <= b ? [a, b] : [b, a]);
export const chave = (p) => normalizar(p).join('-');
export const soma = (p) => p[0] + p[1];
export const ehBucha = (p) => p[0] === p[1];
export const somaDaMao = (mao) => mao.reduce((s, p) => s + soma(p), 0);

export function todasAsPecas() {
  const pecas = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) pecas.push([a, b]);
  return pecas;
}

/** Gerador pseudoaleatório xorshift32. */
export function xorshift(semente) {
  let x = (semente >>> 0) || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

export function embaralhar(pecas, rng) {
  const copia = pecas.map((p) => [...p]);
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Peça que inicia a rodada: maior bucha nas mãos ou, sem bucha, a de maior soma (desempate pelo maior lado). */
export function pecaInicial(maos) {
  const candidatas = maos.flatMap((mao, jogador) => mao.map((peca) => ({ jogador, peca })));
  const buchas = candidatas.filter((c) => ehBucha(c.peca));
  const lista = buchas.length ? buchas : candidatas;
  return lista.reduce((melhor, c) => {
    const [sa, sm] = [soma(c.peca), soma(melhor.peca)];
    if (sa !== sm) return sa > sm ? c : melhor;
    return Math.max(...c.peca) > Math.max(...melhor.peca) ? c : melhor;
  });
}

function validarMaos(maos) {
  if (maos.length !== 2 || maos.some((m) => m.length !== 7)) throw new Error('Cada um dos 2 jogadores deve ter 7 peças');
  const vistas = new Set();
  for (const p of maos.flat()) {
    if (!Array.isArray(p) || p.length !== 2 || p.some((v) => !Number.isInteger(v) || v < 0 || v > 6)) {
      throw new Error('Peça inválida');
    }
    const k = chave(p);
    if (vistas.has(k)) throw new Error(`Peça repetida: ${k}`);
    vistas.add(k);
  }
}

/**
 * Cria uma rodada.
 * @param {object} cfg
 * @param {number} [cfg.semente] sorteio reprodutível
 * @param {number[][][]} [cfg.maos] mãos fixas (testes)
 * @param {[number, number]} [cfg.placar=[0,0]] placar acumulado da partida
 * @param {number} [cfg.rodada=1]
 */
export function novaRodada({ semente = 1, maos, placar = [0, 0], rodada = 1 } = {}) {
  let maosIniciais = maos;
  let dormindo = [];
  if (!maosIniciais) {
    const pecas = embaralhar(todasAsPecas(), xorshift(semente));
    maosIniciais = [pecas.slice(0, 7), pecas.slice(7, 14)];
    dormindo = pecas.slice(14);
  } else {
    validarMaos(maosIniciais);
    const usadas = new Set(maosIniciais.flat().map(chave));
    dormindo = todasAsPecas().filter((p) => !usadas.has(chave(p)));
  }
  const inicio = pecaInicial(maosIniciais);
  return Object.freeze({
    rodada,
    fase: FASE.JOGANDO,
    maos: maosIniciais.map((m) => m.map(normalizar)),
    dormindo,
    mesa: [], // sequência de peças já orientadas: [[a,b],[b,c],...]
    vez: inicio.jogador,
    obrigatoria: normalizar(inicio.peca),
    passesSeguidos: 0,
    placar: [...placar],
    resultado: null,
    historico: [],
  });
}

export const pontas = (estado) => (estado.mesa.length ? [estado.mesa[0][0], estado.mesa.at(-1)[1]] : null);

/** Lista de jogadas possíveis para o jogador da vez: [{ peca, lado }]. */
export function jogadasPossiveis(estado, jogador = estado.vez) {
  if (estado.fase !== FASE.JOGANDO || jogador !== estado.vez) return [];
  const mao = estado.maos[jogador];
  if (!estado.mesa.length) {
    return mao.filter((p) => chave(p) === chave(estado.obrigatoria)).map((peca) => ({ peca, lado: 'direita' }));
  }
  const [esq, dir] = pontas(estado);
  const lista = [];
  for (const peca of mao) {
    if (peca.includes(esq)) lista.push({ peca, lado: 'esquerda' });
    if (peca.includes(dir)) lista.push({ peca, lado: 'direita' });
  }
  return lista;
}

function encerrarRodada(estado, vencedor, motivo) {
  const perdedor = vencedor === null ? null : 1 - vencedor;
  const pontos = vencedor === null ? 0 : somaDaMao(estado.maos[perdedor]);
  const placar = [...estado.placar];
  if (vencedor !== null) placar[vencedor] += pontos;
  const fimDaPartida = placar.some((p) => p >= PONTOS_PARA_VENCER);
  return {
    ...estado,
    placar,
    fase: fimDaPartida ? FASE.FIM_DA_PARTIDA : FASE.FIM_DA_RODADA,
    resultado: { vencedor, motivo, pontos, campeao: fimDaPartida ? (placar[0] > placar[1] ? 0 : 1) : null },
  };
}

/** Redutor principal. Nunca altera o estado recebido. */
export function aplicar(estado, acao) {
  if (estado.fase !== FASE.JOGANDO) throw new Error('A rodada já terminou');
  if (acao.jogador !== estado.vez) throw new Error(`Não é a vez do jogador ${acao.jogador}`);
  const j = acao.jogador;
  const possiveis = jogadasPossiveis(estado, j);

  if (acao.tipo === ACAO.PASSAR) {
    if (possiveis.length) throw new Error('Não pode passar tendo jogada');
    const passesSeguidos = estado.passesSeguidos + 1;
    let prox = { ...estado, vez: 1 - j, passesSeguidos, historico: [...estado.historico, { j, tipo: ACAO.PASSAR }] };
    if (passesSeguidos === 2) {
      const [a, b] = prox.maos.map(somaDaMao);
      prox = encerrarRodada(prox, a === b ? null : a < b ? 0 : 1, 'trancado');
    }
    return Object.freeze(prox);
  }

  if (acao.tipo !== ACAO.JOGAR) throw new Error(`Ação desconhecida: ${acao.tipo}`);
  const peca = normalizar(acao.peca);
  const lado = acao.lado ?? 'direita';
  if (!estado.maos[j].some((p) => chave(p) === chave(peca))) throw new Error('O jogador não tem essa peça');
  if (!estado.mesa.length && chave(peca) !== chave(estado.obrigatoria)) {
    throw new Error(`A primeira peça deve ser ${chave(estado.obrigatoria)}`);
  }
  const encaixes = possiveis.filter((x) => chave(x.peca) === chave(peca));
  if (!encaixes.length) throw new Error(`A peça ${chave(peca)} não encaixa`);
  if (!encaixes.some((x) => x.lado === lado)) throw new Error(`A peça ${chave(peca)} não encaixa no lado ${lado}`);

  let mesa;
  if (!estado.mesa.length) mesa = [peca];
  else if (lado === 'esquerda') {
    const esq = estado.mesa[0][0];
    mesa = [peca[1] === esq ? peca : [peca[1], peca[0]], ...estado.mesa];
  } else {
    const dir = estado.mesa.at(-1)[1];
    mesa = [...estado.mesa, peca[0] === dir ? peca : [peca[1], peca[0]]];
  }
  const maos = estado.maos.map((m, i) => (i === j ? m.filter((p) => chave(p) !== chave(peca)) : m));
  let prox = {
    ...estado, mesa, maos, vez: 1 - j, passesSeguidos: 0,
    historico: [...estado.historico, { j, tipo: ACAO.JOGAR, peca, lado }],
  };
  if (!maos[j].length) prox = encerrarRodada(prox, j, 'batida');
  return Object.freeze(prox);
}

/** Estratégia simples: joga a peça de maior soma (bucha primeiro em caso de empate); se não tiver, passa. */
export function jogadaAutomatica(estado) {
  const opcoes = jogadasPossiveis(estado);
  if (!opcoes.length) return { tipo: ACAO.PASSAR, jogador: estado.vez };
  const melhor = opcoes.reduce((m, o) =>
    soma(o.peca) > soma(m.peca) || (soma(o.peca) === soma(m.peca) && ehBucha(o.peca) && !ehBucha(m.peca)) ? o : m);
  return { tipo: ACAO.JOGAR, jogador: estado.vez, peca: melhor.peca, lado: melhor.lado };
}

/** Joga uma partida inteira (várias rodadas) automaticamente. */
export function simularPartida(semente = 1, limiteRodadas = 100) {
  let estado = novaRodada({ semente });
  const rodadas = [];
  while (true) {
    while (estado.fase === FASE.JOGANDO) estado = aplicar(estado, jogadaAutomatica(estado));
    rodadas.push(estado);
    if (estado.fase === FASE.FIM_DA_PARTIDA || rodadas.length >= limiteRodadas) return { final: estado, rodadas };
    estado = novaRodada({ semente: semente * 1000 + rodadas.length, placar: estado.placar, rodada: estado.rodada + 1 });
  }
}

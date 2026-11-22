import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  novaRodada, aplicar, simularPartida, todasAsPecas, chave, somaDaMao,
  ACAO, FASE, PONTOS_PARA_VENCER,
} from '../../lib/domino.mjs';
import { BATIDA, ROTEIRO_BATIDA, TRANCADO, EMPATE } from '../fixtures.mjs';

const jogar = (j, peca, lado = 'direita') => ({ tipo: ACAO.JOGAR, jogador: j, peca, lado });
const passar = (j) => ({ tipo: ACAO.PASSAR, jogador: j });

function bloquear(maos, placar) {
  let r = novaRodada({ maos, placar });
  r = aplicar(r, jogar(0, [6, 6]));
  r = aplicar(r, jogar(1, [6, 5]));
  r = aplicar(r, passar(0));
  return aplicar(r, passar(1));
}

test('Fim da rodada', async (t) => {
  await t.test('TC-21 batida: jogador 0 fica sem peças e marca os pontos do adversário', () => {
    let r = novaRodada({ maos: BATIDA });
    for (const [j, peca, lado] of ROTEIRO_BATIDA) r = aplicar(r, jogar(j, peca, lado));
    assert.equal(r.fase, FASE.FIM_DA_RODADA);
    assert.deepEqual(r.resultado, { vencedor: 0, motivo: 'batida', pontos: 2, campeao: null });
    assert.deepEqual(r.placar, [2, 0]);
    assert.equal(r.mesa.length, 13);
  });

  await t.test('TC-22 trancado: vence quem tem menos pontos na mão (18 x 24)', () => {
    const r = bloquear(TRANCADO);
    assert.deepEqual(r.maos.map(somaDaMao), [18, 24]);
    assert.deepEqual(r.resultado, { vencedor: 0, motivo: 'trancado', pontos: 24, campeao: null });
  });

  await t.test('TC-23 trancado com pontos iguais: empate e ninguém pontua', () => {
    const r = bloquear(EMPATE);
    assert.deepEqual(r.maos.map(somaDaMao), [27, 27]);
    assert.equal(r.resultado.vencedor, null);
    assert.deepEqual(r.placar, [0, 0]);
  });

  await t.test('TC-24 nenhuma ação é aceita depois que a rodada termina', () => {
    const r = bloquear(TRANCADO);
    assert.throws(() => aplicar(r, passar(r.vez)), /já terminou/);
  });
});

test('Partida até 50 pontos (integração)', async (t) => {
  await t.test('TC-25 o placar acumula entre rodadas e a partida acaba ao chegar a 50', () => {
    const r = bloquear(TRANCADO, [30, 10]); // 30 + 24 = 54
    assert.equal(PONTOS_PARA_VENCER, 50);
    assert.deepEqual(r.placar, [54, 10]);
    assert.equal(r.fase, FASE.FIM_DA_PARTIDA);
    assert.equal(r.resultado.campeao, 0);
  });

  await t.test('TC-26 abaixo de 50 pontos a partida continua', () => {
    const r = bloquear(TRANCADO, [25, 0]); // 49
    assert.equal(r.fase, FASE.FIM_DA_RODADA);
    assert.equal(r.resultado.campeao, null);
  });

  await t.test('TC-27 200 partidas automáticas terminam, conservam as 28 peças e têm um campeão com 50+', () => {
    for (let s = 1; s <= 200; s++) {
      const { final, rodadas } = simularPartida(s);
      assert.equal(final.fase, FASE.FIM_DA_PARTIDA, `semente ${s}`);
      assert.ok(final.placar[final.resultado.campeao] >= 50);
      for (const r of rodadas) {
        const pecas = [...r.mesa, ...r.maos.flat(), ...r.dormindo].map(chave);
        assert.deepEqual(pecas.sort(), todasAsPecas().map(chave).sort());
        for (let i = 1; i < r.mesa.length; i++) assert.equal(r.mesa[i - 1][1], r.mesa[i][0], 'mesa encadeada');
      }
    }
  });

  await t.test('TC-28 o placar final é a soma dos pontos de cada rodada', () => {
    const { final, rodadas } = simularPartida(77);
    const total = [0, 0];
    for (const r of rodadas) if (r.resultado.vencedor !== null) total[r.resultado.vencedor] += r.resultado.pontos;
    assert.deepEqual(final.placar, total);
  });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todasAsPecas, embaralhar, xorshift, chave, normalizar, soma, somaDaMao, ehBucha, pecaInicial, novaRodada } from '../../lib/domino.mjs';
import { BATIDA } from '../fixtures.mjs';

test('Peças do dominó', async (t) => {
  await t.test('TC-01 o jogo tem 28 peças diferentes, de 0-0 até 6-6', () => {
    const pecas = todasAsPecas();
    assert.equal(pecas.length, 28);
    assert.equal(new Set(pecas.map(chave)).size, 28);
    assert.deepEqual(pecas[0], [0, 0]);
    assert.deepEqual(pecas.at(-1), [6, 6]);
  });

  await t.test('TC-02 existem 7 buchas e a soma de todos os pontos é 168', () => {
    assert.equal(todasAsPecas().filter(ehBucha).length, 7);
    assert.equal(somaDaMao(todasAsPecas()), 168);
  });

  await t.test('TC-03 a peça 5-2 é a mesma que 2-5', () => {
    assert.deepEqual(normalizar([5, 2]), [2, 5]);
    assert.equal(chave([5, 2]), chave([2, 5]));
    assert.equal(soma([5, 2]), 7);
  });

  await t.test('TC-04 embaralhar mantém as 28 peças e é reprodutível pela semente', () => {
    const a = embaralhar(todasAsPecas(), xorshift(10));
    const b = embaralhar(todasAsPecas(), xorshift(10));
    assert.deepEqual(a, b);
    assert.deepEqual(a.map(chave).sort(), todasAsPecas().map(chave).sort());
    assert.notDeepEqual(a, todasAsPecas());
  });
});

test('Distribuição para 2 jogadores', async (t) => {
  await t.test('TC-05 cada jogador recebe 7 peças e 14 ficam dormindo', () => {
    const r = novaRodada({ semente: 5 });
    assert.deepEqual(r.maos.map((m) => m.length), [7, 7]);
    assert.equal(r.dormindo.length, 14);
    const todas = [...r.maos.flat(), ...r.dormindo].map(chave);
    assert.equal(new Set(todas).size, 28);
  });

  await t.test('TC-06 mãos fixas inválidas são rejeitadas', () => {
    assert.throws(() => novaRodada({ maos: [BATIDA[0], BATIDA[0]] }), /repetida/);
    assert.throws(() => novaRodada({ maos: [BATIDA[0].slice(1), BATIDA[1]] }), /7 peças/);
    assert.throws(() => novaRodada({ maos: [[[7, 1], ...BATIDA[0].slice(1)], BATIDA[1]] }), /inválida/);
  });
});

test('Quem começa', async (t) => {
  await t.test('TC-07 começa quem tem o 6-6', () => {
    assert.equal(pecaInicial([[[1, 2]], [[6, 6]]]).jogador, 1);
  });

  await t.test('TC-08 sem o 6-6, começa a maior bucha', () => {
    assert.deepEqual(pecaInicial([[[6, 5], [2, 2]], [[4, 4], [6, 4]]]), { jogador: 1, peca: [4, 4] });
  });

  await t.test('TC-09 sem bucha, começa a peça de maior soma (empate: maior lado)', () => {
    assert.deepEqual(pecaInicial([[[3, 4], [1, 2]], [[2, 5], [0, 1]]]), { jogador: 1, peca: [2, 5] });
    assert.deepEqual(pecaInicial([[[0, 6], [1, 2]], [[2, 4], [0, 1]]]), { jogador: 0, peca: [0, 6] });
  });

  await t.test('TC-10 a rodada guarda quem começa e qual peça é obrigatória', () => {
    const r = novaRodada({ maos: BATIDA });
    assert.equal(r.vez, 0);
    assert.deepEqual(r.obrigatoria, [6, 6]);
  });
});

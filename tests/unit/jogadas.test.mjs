import { test } from 'node:test';
import assert from 'node:assert/strict';
import { novaRodada, aplicar, jogadasPossiveis, pontas, ACAO } from '../../lib/domino.mjs';
import { BATIDA, TRANCADO } from '../fixtures.mjs';

const jogar = (j, peca, lado = 'direita') => ({ tipo: ACAO.JOGAR, jogador: j, peca, lado });
const passar = (j) => ({ tipo: ACAO.PASSAR, jogador: j });

test('Jogadas', async (t) => {
  await t.test('TC-11 a primeira jogada tem que ser a peça obrigatória', () => {
    const r = novaRodada({ maos: BATIDA });
    assert.throws(() => aplicar(r, jogar(0, [4, 4])), /primeira peça deve ser 6-6/);
    assert.deepEqual(jogadasPossiveis(r), [{ peca: [6, 6], lado: 'direita' }]);
  });

  await t.test('TC-12 encaixar na direita gira a peça para combinar com a ponta', () => {
    let r = aplicar(novaRodada({ maos: BATIDA }), jogar(0, [6, 6]));
    r = aplicar(r, jogar(1, [5, 6], 'direita'));
    assert.deepEqual(r.mesa, [[6, 6], [6, 5]]);
    assert.deepEqual(pontas(r), [6, 5]);
  });

  await t.test('TC-13 encaixar na esquerda gira a peça para combinar com a ponta', () => {
    let r = aplicar(novaRodada({ maos: BATIDA }), jogar(0, [6, 6]));
    r = aplicar(r, jogar(1, [6, 5], 'esquerda'));
    assert.deepEqual(r.mesa, [[5, 6], [6, 6]]);
    assert.deepEqual(pontas(r), [5, 6]);
  });

  await t.test('TC-14 peça que não encaixa é rejeitada', () => {
    let r = aplicar(novaRodada({ maos: BATIDA }), jogar(0, [6, 6]));
    assert.throws(() => aplicar(r, jogar(1, [3, 3])), /não encaixa/);
    r = aplicar(r, jogar(1, [6, 5], 'direita')); // pontas 6 e 5
    assert.throws(() => aplicar(r, jogar(0, [6, 4], 'direita')), /não encaixa no lado direita/);
  });

  await t.test('TC-15 não pode jogar fora da vez nem peça que não tem', () => {
    const r = aplicar(novaRodada({ maos: BATIDA }), jogar(0, [6, 6]));
    assert.throws(() => aplicar(r, jogar(0, [6, 4])), /Não é a vez/);
    assert.throws(() => aplicar(r, jogar(1, [6, 4])), /não tem essa peça/);
  });

  await t.test('TC-16 após jogar, a peça sai da mão e a vez passa', () => {
    const r = aplicar(novaRodada({ maos: BATIDA }), jogar(0, [6, 6]));
    assert.equal(r.maos[0].length, 6);
    assert.equal(r.vez, 1);
  });

  await t.test('TC-17 o redutor não altera o estado anterior', () => {
    const r0 = novaRodada({ maos: BATIDA });
    const r1 = aplicar(r0, jogar(0, [6, 6]));
    assert.equal(r0.mesa.length, 0);
    assert.equal(r0.maos[0].length, 7);
    assert.notEqual(r0, r1);
    assert.ok(Object.isFrozen(r1));
  });

  await t.test('TC-18 ação desconhecida é rejeitada', () => {
    assert.throws(() => aplicar(novaRodada({ maos: BATIDA }), { tipo: 'COMPRAR', jogador: 0 }), /desconhecida/);
  });
});

test('Passar a vez (sem compra)', async (t) => {
  await t.test('TC-19 não pode passar tendo jogada', () => {
    const r = aplicar(novaRodada({ maos: BATIDA }), jogar(0, [6, 6]));
    assert.throws(() => aplicar(r, passar(1)), /Não pode passar/);
  });

  await t.test('TC-20 sem peça que encaixe, o jogador passa e a vez troca', () => {
    let r = novaRodada({ maos: TRANCADO });
    r = aplicar(r, jogar(0, [6, 6]));
    r = aplicar(r, jogar(1, [6, 5]));
    assert.deepEqual(jogadasPossiveis(r), []);
    r = aplicar(r, passar(0));
    assert.equal(r.vez, 1);
    assert.equal(r.passesSeguidos, 1);
  });
});

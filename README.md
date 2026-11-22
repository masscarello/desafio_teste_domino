# desafio_teste_domino

## Especificação do desafio — Dominó (partida para 2 jogadores)

Casos de teste para uma **partida de Dominó para 2 jogadores**, escritos em JavaScript para testar JavaScript.

### Regras implementadas (`lib/domino.mjs`)

- Estado imutável e **redutor de ações**: `proximo = aplicar(estado, { tipo, jogador, ... })`.
- 28 peças (0-0 a 6-6). Cada jogador recebe 7 e **14 ficam dormindo** (variante bloqueada, sem compra).
- Começa quem tem a **maior bucha** (6-6, 5-5, ...); sem bucha, a peça de maior soma. A primeira jogada tem que ser essa peça.
- A peça é girada automaticamente para encaixar na ponta escolhida (esquerda ou direita).
- Só pode **passar** quem não tem peça que encaixe.
- **Batida:** quem fica sem peças vence a rodada e marca a soma da mão do adversário.
- **Jogo trancado** (os dois passam seguidos): vence quem tem menos pontos na mão; pontos iguais = empate (0 pontos).
- A partida tem várias rodadas e termina quando alguém chega a **50 pontos**.

---

## Estrutura do projeto

```
desafio_teste_domino/
├── lib/                 # código do jogo (ES Modules)
├── tests/
│   ├── fixtures.mjs     # dados fixos usados pelos testes
│   ├── unit/            # testes unitários (cada regra isolada)
│   └── integration/     # testes de integração (partidas completas)
└── package.json
```

Arquivos `.mjs`:

```
lib/domino.mjs
tests/fixtures.mjs
tests/integration/partida.test.mjs
tests/unit/jogadas.test.mjs
tests/unit/pecas.test.mjs
```

## Como executar os testes

Requisito: **Node.js 20 ou superior**. Não há dependências para instalar: os testes usam o executor nativo do Node (`node:test`) e `node:assert/strict`.

```bash
npm test                  # todos os testes
npm run test:unit         # só os unitários
npm run test:integration  # só os de integração
```

## Funcionamento dos casos de teste

- Os testes estão divididos em **unitários** (`tests/unit`), que verificam cada regra isoladamente, e de **integração** (`tests/integration`), que jogam partidas completas do início ao fim.
- Cada arquivo usa `test()` como grupo e `t.test()` como subteste. Cada caso tem um identificador **TC-xx** no nome.
- Os casos seguem o padrão **Arrange → Act → Assert** (preparar o cenário, executar a ação e conferir o resultado).
- Onde o jogo usa sorteio, os testes passam uma **semente** fixa (gerador pseudoaleatório) ou usam os cenários de `tests/fixtures.mjs`, então o resultado é sempre o mesmo em qualquer máquina.
- Situações de erro são verificadas com `assert.throws`, conferindo a mensagem ou o tipo do erro (`RangeError`, por exemplo).
- Os testes de integração rodam **dezenas ou centenas de partidas automáticas** para garantir que o jogo sempre termina de forma consistente.
- Ao rodar `npm test`, o Node mostra cada caso como `ok` (passou) ou `not ok` (falhou) e o total no final.

### Lista de casos de teste (28 casos)

| ID | Tipo | Grupo | O que é verificado |
|---|---|---|---|
| TC-01 | Unitário | Peças do dominó | o jogo tem 28 peças diferentes, de 0-0 até 6-6 |
| TC-02 | Unitário | Peças do dominó | existem 7 buchas e a soma de todos os pontos é 168 |
| TC-03 | Unitário | Peças do dominó | a peça 5-2 é a mesma que 2-5 |
| TC-04 | Unitário | Peças do dominó | embaralhar mantém as 28 peças e é reprodutível pela semente |
| TC-05 | Unitário | Distribuição para 2 jogadores | cada jogador recebe 7 peças e 14 ficam dormindo |
| TC-06 | Unitário | Distribuição para 2 jogadores | mãos fixas inválidas são rejeitadas |
| TC-07 | Unitário | Quem começa | começa quem tem o 6-6 |
| TC-08 | Unitário | Quem começa | sem o 6-6, começa a maior bucha |
| TC-09 | Unitário | Quem começa | sem bucha, começa a peça de maior soma (empate: maior lado) |
| TC-10 | Unitário | Quem começa | a rodada guarda quem começa e qual peça é obrigatória |
| TC-11 | Unitário | Jogadas | a primeira jogada tem que ser a peça obrigatória |
| TC-12 | Unitário | Jogadas | encaixar na direita gira a peça para combinar com a ponta |
| TC-13 | Unitário | Jogadas | encaixar na esquerda gira a peça para combinar com a ponta |
| TC-14 | Unitário | Jogadas | peça que não encaixa é rejeitada |
| TC-15 | Unitário | Jogadas | não pode jogar fora da vez nem peça que não tem |
| TC-16 | Unitário | Jogadas | após jogar, a peça sai da mão e a vez passa |
| TC-17 | Unitário | Jogadas | o redutor não altera o estado anterior |
| TC-18 | Unitário | Jogadas | ação desconhecida é rejeitada |
| TC-19 | Unitário | Passar a vez (sem compra) | não pode passar tendo jogada |
| TC-20 | Unitário | Passar a vez (sem compra) | sem peça que encaixe, o jogador passa e a vez troca |
| TC-21 | Integração | Fim da rodada | batida: jogador 0 fica sem peças e marca os pontos do adversário |
| TC-22 | Integração | Fim da rodada | trancado: vence quem tem menos pontos na mão (18 x 24) |
| TC-23 | Integração | Fim da rodada | trancado com pontos iguais: empate e ninguém pontua |
| TC-24 | Integração | Fim da rodada | nenhuma ação é aceita depois que a rodada termina |
| TC-25 | Integração | Partida até 50 pontos (integração) | o placar acumula entre rodadas e a partida acaba ao chegar a 50 |
| TC-26 | Integração | Partida até 50 pontos (integração) | abaixo de 50 pontos a partida continua |
| TC-27 | Integração | Partida até 50 pontos (integração) | 200 partidas automáticas terminam, conservam as 28 peças e têm um campeão com 50+ |
| TC-28 | Integração | Partida até 50 pontos (integração) | o placar final é a soma dos pontos de cada rodada |

## Colaborador(es)

| Nome | R.A. |
|---|---|
| Matheus De Oliveira Mascarello | 241207402 |

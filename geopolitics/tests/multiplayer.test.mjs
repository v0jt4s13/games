import test from 'node:test';
import assert from 'node:assert/strict';
import {newPoker, pokerApply, pokerOptions, pokerBotAction} from '../src/engines/poker.mjs';
import {newRummy, rummyApply, rummyBotAction} from '../src/engines/rummy.mjs';

const lcg = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const total = s => s.players.reduce((n, p) => n + p.stack, 0);
const inPot = s => s.players.reduce((n, p) => n + p.contributed, 0);

function pokerCards(s) {
  const ids = [...s.deck, ...s.burn, ...s.board, ...s.players.flatMap(p => p.cards)].map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'karta wystepuje dwa razy');
  assert.equal(ids.length, 52);
}

test('Poker 3 graczy: pozycje blindow i kolejnosc ruchow', () => {
  const s = newPoker(7, 3);
  assert.equal(s.players.length, 3);
  assert.equal(s.dealer, 0);                         // pierwszy dealer to miejsce 0, jak w grze dwuosobowej
  assert.deepEqual([s.players[1].bet, s.players[2].bet], [10, 20]);   // SB po lewej dealera, potem BB
  assert.equal(s.turn, 0);                           // przy trzech graczach pierwszy po BB to dealer
  assert.deepEqual(s.pending, [0, 1, 2]);
});

test('Poker 4 graczy: UTG zaczyna, spasowanie do jednego gracza oddaje pule', () => {
  let s = newPoker(11, 4);
  assert.equal(s.dealer, 0);
  assert.deepEqual([s.players[1].bet, s.players[2].bet, s.players[0].bet, s.players[3].bet], [10, 20, 0, 0]);
  assert.equal(s.turn, 3);                           // UTG = po BB
  for (const seat of [3, 0, 1]) { assert.equal(s.turn, seat); s = pokerApply(s, {type: 'fold'}); }
  assert.equal(s.phase, 'handEnd');
  assert.deepEqual(s.result.winners, [2]);           // wygrywa BB
  assert.equal(s.result.payout[2], 30);
  assert.equal(s.players[2].stack, 1010);
  assert.equal(total(s), 4000);
});

test('Poker: gracz bez zetonow odpada, nie dostaje kart i jest pomijany', () => {
  let s = newPoker(5, 4);
  s.phase = 'handEnd'; s.dealer = 0; s.players = [{stack: 1000}, {stack: 0}, {stack: 1000}, {stack: 1000}];
  s = pokerApply(s, {type: 'nextHand'});
  assert.equal(s.players[1].out, true);
  assert.equal(s.players[1].cards.length, 0);
  assert.equal(s.dealer, 2);                         // przycisk omija odpadnietego
  assert.deepEqual([s.players[3].bet, s.players[0].bet], [10, 20]);   // SB i BB tylko miedzy tymi w grze
  assert.ok(!s.pending.includes(1));
  assert.equal(s.turn, 2);
});

test('Poker: pule boczne przy trzech all-inach, suma zetonow bez zmian', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    let s = newPoker(seed, 3);
    s.phase = 'handEnd'; s.dealer = 2; s.players = [{stack: 100}, {stack: 500}, {stack: 1000}];
    s = pokerApply(s, {type: 'nextHand'});
    for (let i = 0; s.phase === 'play' && i < 20; i++) {
      const o = pokerOptions(s);
      s = pokerApply(s, o.canRaise ? {type: 'raise', amount: o.maxRaise} : {type: o.canCheck ? 'check' : 'call'});
    }
    assert.equal(s.phase, 'handEnd');
    assert.equal(s.board.length, 5);
    assert.equal(total(s), 1600);
    assert.equal(s.result.payout.reduce((a, b) => a + b, 0), inPot(s));    // cala pula rozdana, reszta stosow nietknieta
    pokerCards(s);
  }
});

test('Poker 3 i 4 graczy: pelne mecze z roznymi akcjami zachowuja zetony i karty', () => {
  for (const players of [3, 4]) {
    for (let seed = 1; seed <= 12; seed++) {
      const rnd = lcg(seed * 7919 + players);
      let s = newPoker(seed, players), steps = 0;
      while (s.phase !== 'over' && steps++ < 6000) {
        if (s.phase === 'handEnd') { assert.equal(total(s), 1000 * players); s = pokerApply(s, {type: 'nextHand'}); continue; }
        assert.equal(total(s) + inPot(s), 1000 * players, 'zetony znikaja');
        pokerCards(s);
        const p = s.players[s.turn];
        assert.ok(!p.folded && p.stack > 0 && !p.out, 'ruch gracza, ktory nie moze grac');
        const o = pokerOptions(s), roll = rnd();
        let a = pokerBotAction(s);
        if (roll < 0.25 && o.canRaise) a = {type: 'raise', amount: Math.min(o.maxRaise, o.minRaise + Math.floor(rnd() * 100))};
        else if (roll < 0.35 && o.canRaise) a = {type: 'raise', amount: o.maxRaise};
        else if (roll < 0.45) a = {type: o.canCheck ? 'check' : 'fold'};
        s = pokerApply(s, a);
      }
      assert.equal(s.phase, 'over', `mecz ${players} graczy (seed ${seed}) sie nie skonczyl`);
      assert.equal(s.players[s.winner].stack, 1000 * players);
    }
  }
});

test('Remik 3 i 4 graczy: tury po kolei, karty zachowane, partia sie konczy', () => {
  for (const players of [3, 4]) {
    for (let seed = 1; seed <= 6; seed++) {
      let s = newRummy(seed, players), steps = 0, previous = s.turn;
      assert.equal(s.players.length, players);
      assert.equal(s.maxTurns, 100 * players);
      while (s.phase !== 'over' && steps++ < 4000) {
        const cards = [...s.stock, ...s.discard, ...s.melds.flatMap(m => m.cards), ...s.players.flatMap(p => p.hand)];
        assert.equal(cards.length, 104); assert.equal(new Set(cards.map(c => c.id)).size, 104);
        const turn = s.turn;
        s = rummyApply(s, rummyBotAction(s));
        if (s.phase === 'draw') assert.equal(s.turn, (turn + 1) % players);    // po odrzuceniu tura idzie dalej
        else assert.equal(s.turn, turn);                                        // w trakcie tury ten sam gracz
        previous = turn;
      }
      assert.equal(s.phase, 'over');
      assert.equal(s.penalties.length, players);
      assert.ok(s.winner >= -1 && s.winner < players);
    }
  }
});

test('Remik: limit tur wybiera gracza z najmniejsza liczba punktow lub remis', () => {
  let s = newRummy(3, 3);
  s.phase = 'play'; s.turns = s.maxTurns - 1; s.turn = 1;
  const c = (rank, suit, i) => ({id: `x${i}`, rank, suit});
  s.players[0].hand = [c(1, 'S', 1), c(2, 'S', 2)];              // 3 pkt
  s.players[1].hand = [c(9, 'H', 3), c(9, 'D', 4)];              // 18 pkt (jedna zostanie odrzucona)
  s.players[2].hand = [c(13, 'C', 5), c(12, 'C', 6)];            // 20 pkt
  const end = rummyApply(s, {type: 'discard', id: 'x3'});
  assert.equal(end.phase, 'over'); assert.equal(end.winner, 0);
  s.players[2].hand = [c(1, 'D', 7), c(2, 'D', 8)];              // 3 pkt, remis z graczem 0
  assert.equal(rummyApply(s, {type: 'discard', id: 'x3'}).winner, -1);
});

test('Gra dwuosobowa zostaje bez zmian: 200 tur w Remiku, dwa miejsca w pokerze', () => {
  assert.equal(newRummy(1).maxTurns, 200);
  assert.equal(newPoker(1).players.length, 2);
  assert.throws(() => newPoker(1, 5), /od 2 do 4/);
  assert.throws(() => newRummy(1, 1), /od 2 do 4/);
});

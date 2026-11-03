import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {setActorNames} from '../src/engines/common.mjs';
import {viewFor} from '../server/views.mjs';

const runner = new URL('../server/runner.mjs', import.meta.url).pathname;
function call(req) {
  const r = spawnSync(process.execPath, [runner], {input: JSON.stringify(req), encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
const NAMES = ['Ala', 'Bartek'];
const flip = i => (i === 0 ? 1 : i === 1 ? 0 : i);
const seatIn = (x, seat, n) => (x >= 0 ? (x - seat + n) % n : x);       // real seat -> index in that seat's view

// Ids of cards that a seat must NOT see in its own view.
function secretIds(state, seat) {
  const ids = [];
  const add = list => (list || []).forEach(c => ids.push(c.id));
  state.players.forEach((p, i) => {
    if (i === seat) return;
    if (state.game === 'poker' && state.result?.showdown && !p.folded) return;     // shown at a showdown
    if (state.game === 'rummy' && state.phase === 'over') return;
    add(p.hand); add(p.cards);
  });
  if (state.game === 'geo') state.players.forEach(p => add(p.deck));
  else { add(state.deck); add(state.burn); add(state.stock); }
  return ids;
}

function checkViews(state) {
  for (const seat of [0, 1]) {
    const view = viewFor(state, seat), text = JSON.stringify(view);
    assert.ok(!('rng' in view), 'stan generatora wyciekl');
    for (const id of secretIds(state, seat)) assert.ok(!text.includes(`"${id}"`), `widok miejsca ${seat} zawiera ukryta karte ${id}`);
    // "me" is always seat 0 in the view
    if (state.phase === 'play' || state.phase === 'draw') assert.equal(view.turn === 0, state.turn === seat);
    const n = state.players.length;
    if (typeof state.winner === 'number') assert.equal(view.winner, seatIn(state.winner, seat, n));
    if (typeof state.dealer === 'number') assert.equal(view.dealer, seatIn(state.dealer, seat, n));
    // the seats are rotated: view seat i is real seat (seat + i) % n
    view.players.forEach((p, i) => {
      const real = state.players[(seat + i) % n];
      assert.equal(p.stack, real.stack); assert.equal((p.hand ?? p.cards ?? []).length, (real.hand ?? real.cards ?? []).length);
    });
    // own cards stay intact
    const own = state.players[seat];
    const ids = list => JSON.stringify((list ?? []).map(c => c.id));
    assert.equal(ids(view.players[0].hand ?? view.players[0].cards), ids(own.hand ?? own.cards));
  }
}

function playOut(game, opts = {}, maxSteps = 4000, names = NAMES) {
  let state = call({op: 'new', game, opts}).state;
  for (let step = 0; step < maxSteps && state.phase !== 'over'; step++) {
    checkViews(state);
    const aiSeats = state.players.map((_, i) => i);
    const r = call({op: 'auto', game, state, aiSeats, names});
    assert.ok(!r.error, r.error);
    if (r.moved) { state = r.state; continue; }
    // moves that belong to a human: confirm next round / hand
    const next = game === 'poker' && state.phase === 'handEnd' ? 'nextHand' : game === 'geo' && state.phase === 'roundEnd' ? 'nextRound' : null;
    assert.ok(next, `zacieta gra ${game} w fazie ${state.phase}`);
    const a = call({op: 'apply', game, state, seat: 0, action: {type: next}, names});
    assert.ok(!a.error, a.error);
    state = a.state;
  }
  return state;
}

test('Geopolitix AI vs AI konczy mecz, widoki nie ujawniaja ukrytych kart', () => {
  for (const [faction, opponent] of [['europe', 'america'], ['america', 'europe'], ['asia', 'europe'], ['europe', 'asia'], ['asia', 'america']]) {
    const s = playOut('geo', {faction, opponent});
    assert.deepEqual(s.players.map(p => p.faction), [faction, opponent]);
    assert.equal(s.phase, 'over');
    assert.ok(s.log.some(l => /wygrywa rundę|Remis/.test(l)));
    assert.ok(s.log.some(l => l.includes('Ala') || l.includes('Bartek')), 'log z prawdziwymi nazwami');
  }
});
test('Remik AI vs AI konczy partie', () => { assert.equal(playOut('rummy').phase, 'over'); });
test('Poker AI vs AI: rozdania przechodza, widoki szczelne', () => {
  let state = call({op: 'new', game: 'poker'}).state, hands = 0;
  for (let i = 0; i < 400 && state.phase !== 'over' && hands < 30; i++) {
    checkViews(state);
    if (state.phase === 'handEnd') { state = call({op: 'apply', game: 'poker', state, seat: 1, action: {type: 'nextHand'}, names: NAMES}).state; hands++; continue; }
    const r = call({op: 'auto', game: 'poker', state, aiSeats: [0, 1], names: NAMES});
    assert.ok(r.moved && !r.error, r.error); state = r.state;
  }
  assert.ok(hands >= 1);
});

test('ruch poza tura i nieznana akcja sa odrzucane', () => {
  const state = call({op: 'new', game: 'rummy'}).state;
  const other = flip(state.turn);
  assert.match(call({op: 'apply', game: 'rummy', state, seat: other, action: {type: 'draw', source: 'stock'}}).error, /nie Twoja tura/);
  assert.match(call({op: 'apply', game: 'rummy', state, seat: state.turn, action: {type: 'hack'}}).error, /Nieznana akcja/);
  assert.match(call({op: 'apply', game: 'rummy', state, seat: state.turn, action: null}).error, /Nieznana akcja/);
  assert.ok(call({op: 'apply', game: 'rummy', state, seat: state.turn, action: {type: 'draw', source: 'stock'}}).state);
});

test('wymiana kart w Geopolitix: miejsce pochodzi z serwera, mecz startuje po obu decyzjach', () => {
  let state = call({op: 'new', game: 'geo', opts: {faction: 'europe'}}).state;
  // the client tries to exchange for the other seat - the server overrides `seat`
  let r = call({op: 'apply', game: 'geo', state, seat: 1, action: {type: 'mulligan', ids: [], seat: 0}, names: NAMES});
  assert.deepEqual(r.state.mulliganDone, [false, true]);
  assert.equal(r.state.phase, 'mulligan');
  assert.match(call({op: 'apply', game: 'geo', state: r.state, seat: 1, action: {type: 'mulligan', ids: []}}).error, /już zatwierdzona/);
  r = call({op: 'apply', game: 'geo', state: r.state, seat: 0, action: {type: 'mulligan', ids: []}, names: NAMES});
  assert.equal(r.state.phase, 'play');
  // wrong card ids are rejected
  const fresh = call({op: 'new', game: 'geo'}).state;
  assert.match(call({op: 'apply', game: 'geo', state: fresh, seat: 0, action: {type: 'mulligan', ids: ['nope']}}).error, /maksymalnie 3/);
});

test('widok odbija miejsca: moje karty sa na miejscu 0, przeciwnik zakryty', () => {
  setActorNames(NAMES);
  const state = call({op: 'new', game: 'poker'}).state;
  const v1 = viewFor(state, 1);
  assert.deepEqual(v1.players[0].cards.map(c => c.id), state.players[1].cards.map(c => c.id));
  assert.ok(v1.players[1].cards.every(c => c.hidden));
  assert.equal(v1.dealer, flip(state.dealer));
  setActorNames(null);
});

test('Remik i Poker dla 3 i 4 graczy przez runner: pelne gry, szczelne widoki, obrot miejsc', () => {
  for (const players of [3, 4]) {
    const names = ['Ala', 'Bartek', 'Celina', 'Darek'].slice(0, players);
    assert.equal(playOut('rummy', {players}, 4000, names).phase, 'over');
    let state = call({op: 'new', game: 'poker', opts: {players}}).state, hands = 0;
    for (let i = 0; i < 1500 && state.phase !== 'over' && hands < 25; i++) {
      checkViews(state);
      if (state.phase === 'handEnd') { state = call({op: 'apply', game: 'poker', state, seat: 0, action: {type: 'nextHand'}, names}).state; hands++; continue; }
      const r = call({op: 'auto', game: 'poker', state, aiSeats: state.players.map((_, k) => k), names});
      assert.ok(r.moved && !r.error, r.error); state = r.state;
    }
    assert.ok(hands >= 1);
  }
});

test('widok 4 graczy: wlasne karty na miejscu 0, reszta zakryta, wyniki obrocone', () => {
  const state = call({op: 'new', game: 'poker', opts: {players: 4}}).state;
  for (let seat = 0; seat < 4; seat++) {
    const v = viewFor(state, seat);
    assert.deepEqual(v.players[0].cards.map(c => c.id), state.players[seat].cards.map(c => c.id));
    for (let i = 1; i < 4; i++) assert.ok(v.players[i].cards.every(c => c.hidden), `miejsce ${seat} widzi karty gracza ${i}`);
    assert.equal(v.turn, (state.turn - seat + 4) % 4);
  }
  // after a fold-out the pot goes to one seat; payouts and winners are rotated consistently
  let s = state;
  for (let k = 0; k < 3; k++) s = call({op: 'apply', game: 'poker', state: s, seat: s.turn, action: {type: 'fold'}}).state;
  assert.equal(s.phase, 'handEnd');
  const winner = s.result.winners[0];
  for (let seat = 0; seat < 4; seat++) {
    const v = viewFor(s, seat);
    assert.deepEqual(v.result.winners, [(winner - seat + 4) % 4]);
    assert.equal(v.result.payout[(winner - seat + 4) % 4], s.result.payout[winner]);
    assert.ok(v.players.slice(1).every(p => p.cards.every(c => c.hidden)), 'karty po spasowaniu pozostaja tajne');
  }
});

test('stol dla 5 graczy lub 1 gracza jest odrzucany', () => {
  assert.match(call({op: 'new', game: 'poker', opts: {players: 5}}).error, /od 2 do 4/);
  assert.match(call({op: 'new', game: 'rummy', opts: {players: 1}}).error, /od 2 do 4/);
});

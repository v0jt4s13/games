import test from 'node:test';
import assert from 'node:assert/strict';
import {newGeo, geoApply, geoActions} from '../src/engines/geopolitix.mjs';
import {deckFor, rows} from '../src/data/geopolitix.mjs';
import {viewFor} from '../server/views.mjs';

// A fresh match in the play phase, seat 0 on move, both hands empty so that each test chooses its cards.
function match() {
  let s = geoApply(newGeo('europe', 3), {type: 'mulligan', ids: []});
  s.phase = 'play'; s.turn = 0; s.players.forEach(p => { p.passed = false; p.hand = []; });
  return s;
}
const eu = pred => deckFor('europe', 0).find(pred), na = pred => deckFor('america', 1).find(pred);
// the decks differ (protect and draw exist only in America, move only in Europe): look in both for seat 0
const any = pred => deckFor('europe', 0).find(pred) || deckFor('america', 0).find(pred);
const plain = c => c.type === 'unit' && !c.hero && !c.immune && !c.effect && !c.protected;

test('karta wydarzenia zaznacza wiersz rywala, na ktory zadzialala', () => {
  const event = eu(c => c.type === 'event' && Array.isArray(c.row) && c.row.length), row = event.row[0];
  const s = match(); s.players[0].hand = [event]; s.players[1].board[row] = [na(c => plain(c))];
  const n = geoApply(s, {type: 'play', id: event.id, row});
  assert.deepEqual(n.lastPlay.rows, [[1, row]]);
  assert.equal(n.lastPlay.by, 0); assert.equal(n.lastPlay.name, event.name);
});

test('ochrona, wymiana i przesuniecie zaznaczaja wlasne wiersze', () => {
  const unit = eu(c => plain(c)), from = unit.row, to = rows.find(r => r !== from);
  const protect = any(c => c.effect === 'protect'), decoy = any(c => c.effect === 'decoy'), move = any(c => c.effect === 'move');
  const run = (card, action) => { const s = match(); s.players[0].hand = [card]; s.players[0].board[from] = [{...unit}]; return geoApply(s, action); };
  assert.deepEqual(run(protect, {type: 'play', id: protect.id, target: unit.id}).lastPlay.rows, [[0, from]]);
  assert.deepEqual(run(decoy, {type: 'play', id: decoy.id, target: unit.id}).lastPlay.rows, [[0, from]]);
  assert.deepEqual(run(move, {type: 'play', id: move.id, target: unit.id, row: to}).lastPlay.rows, [[0, from], [0, to]]);
});

test('oczyszczenie zaznacza wiersze z efektami, dobranie karty nie zaznacza zadnego', () => {
  const clear = any(c => c.effect === 'clear'), draw = any(c => c.effect === 'draw');
  const s = match(); s.players[0].hand = [clear]; s.players[0].events.economy = [{type: 'half'}];
  assert.deepEqual(geoApply(s, {type: 'play', id: clear.id}).lastPlay.rows, [[0, 'economy']]);
  const d = match(); d.players[0].hand = [draw]; d.players[0].deck = d.players[0].deck.length ? d.players[0].deck : [eu(plain)];
  assert.equal(geoApply(d, {type: 'play', id: draw.id}).lastPlay, null);
});

test('jednostka, pas i nowa runda czyszcza znacznik', () => {
  const event = eu(c => c.type === 'event' && Array.isArray(c.row) && c.row.length), row = event.row[0], unit = eu(c => plain(c));
  const s = match(); s.players[0].hand = [event, {...unit, id: 'extra-unit'}]; s.players[1].board[row] = [na(c => plain(c))];
  let n = geoApply(s, {type: 'play', id: event.id, row});
  assert.ok(n.lastPlay);
  n.turn = 0;
  assert.equal(geoApply(n, {type: 'play', id: 'extra-unit'}).lastPlay, null);
  assert.equal(geoApply(n, {type: 'pass'}).lastPlay, null);
});

test('widok drugiego gracza obraca miejsca w znaczniku', () => {
  const event = eu(c => c.type === 'event' && Array.isArray(c.row) && c.row.length), row = event.row[0];
  const s = match(); s.players[0].hand = [event]; s.players[1].board[row] = [na(c => plain(c))];
  const n = geoApply(s, {type: 'play', id: event.id, row});
  assert.deepEqual(viewFor(n, 0).lastPlay.rows, [[1, row]]);
  assert.deepEqual(viewFor(n, 1).lastPlay.rows, [[0, row]]);      // for seat 1 the struck side is "me"
  assert.equal(viewFor(n, 1).lastPlay.by, 1);
  assert.ok(geoActions(s, 0).some(a => a.id === event.id));       // the card was playable to begin with
});

// Per-player view of an authoritative game state (online play), for two to four seats.
//
// The UI always shows "me" as seat 0 and the others after me in table order. The server keeps one
// state; this module turns it into what ONE player may see:
//   1. redaction - the generator state, undrawn decks and every other player's cards never leave
//      the server (hidden cards become placeholders, so counts still render);
//   2. rotation - the seats are rotated so that the viewer becomes seat 0 (for two players this is
//      the old "swap"), keeping the clockwise order of the rest.
// Log lines carry real player names (see setActorNames in the runner), so they need no rotation.
import {rows} from '../src/data/geopolitix.mjs';

const rot = (list, k) => list.map((_, i) => list[(k + i) % list.length]);                 // new[i] = old[(k + i) % n]
const seatOf = (x, k, n) => (typeof x === 'number' && x >= 0 ? (x - k + n) % n : x);       // old index -> new index (keeps -1)
const hidden = (n, tag) => Array.from({length: n}, (_, i) => ({id: `hidden-${tag}-${i}`, rank: 1, suit: 'S', hidden: true}));

function rotateSeats(s, k) {
  const n = s.players.length;
  s.players = rot(s.players, k);
  for (const key of ['turn', 'dealer', 'winner']) if (typeof s[key] === 'number') s[key] = seatOf(s[key], k, n);
  if (Array.isArray(s.pending)) s.pending = s.pending.map(i => seatOf(i, k, n));
  return n;
}

function pokerView(s, seat) {
  delete s.rng; s.deck = []; s.burn = [];
  s.players.forEach((p, i) => {
    // at a showdown the cards of everyone who did not fold are shown
    if (i !== seat && !(s.result?.showdown && !p.folded)) p.cards = hidden(p.cards.length, `poker${i}`);
  });
  return s;
}
function pokerRotate(s, k) {
  const n = rotateSeats(s, k);
  if (s.result) {
    s.result.winner = seatOf(s.result.winner, k, n);
    if (s.result.winners) s.result.winners = s.result.winners.map(i => seatOf(i, k, n)).sort((a, b) => a - b);
    s.result.payout = rot(s.result.payout, k);
    if (s.result.hands) s.result.hands = rot(s.result.hands, k);
  }
}

function rummyView(s, seat) {
  delete s.rng; s.stock = hidden(s.stock.length, 'stock');
  if (s.phase !== 'over') s.players.forEach((p, i) => { if (i !== seat) p.hand = hidden(p.hand.length, `rummy${i}`); });
  return s;
}
function rummyRotate(s, k) {
  const n = rotateSeats(s, k);
  s.melds.forEach(m => { m.owner = seatOf(m.owner, k, n); });
  if (s.penalties) s.penalties = rot(s.penalties, k);
}

function geoView(s, seat) {
  delete s.rng;
  s.players.forEach((p, i) => {
    p.deck = hidden(p.deck.length, `deck${i}`);
    if (i !== seat) p.hand = hidden(p.hand.length, 'geo');
  });
  return s;
}
function geoRotate(s, k) {
  const n = rotateSeats(s, k);
  s.wins = rot(s.wins, k);
  if (s.mulliganDone) s.mulliganDone = rot(s.mulliganDone, k);
  s.history.forEach(h => { h.score = rot(h.score, k); });
  const owned = c => { if (typeof c.owner === 'number') c.owner = seatOf(c.owner, k, n); };
  for (const p of s.players) {
    p.hand.forEach(owned); p.grave.forEach(owned);
    for (const r of rows) p.board[r].forEach(owned);
  }
}

const GAMES = {poker: [pokerView, pokerRotate], rummy: [rummyView, rummyRotate], geo: [geoView, geoRotate]};

/** State as seen by `seat` (0..n-1). Pure: the input is not modified. */
export function viewFor(state, seat) {
  const game = GAMES[state.game];
  if (!game) throw new Error('Nieznana gra.');
  if (!Number.isInteger(seat) || seat < 0 || seat >= state.players.length) throw new Error('Nieznane miejsce.');
  const s = structuredClone(state);
  game[0](s, seat);
  if (seat !== 0) game[1](s, seat);
  return s;
}

/** Views of all seats, in seat order. */
export const viewsFor = state => state.players.map((_, seat) => viewFor(state, seat));

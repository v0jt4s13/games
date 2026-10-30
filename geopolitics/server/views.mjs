// Per-player view of an authoritative game state (online play).
//
// The engines are two-player and the UI always shows "me" as seat 0. The server keeps one
// state; this module turns it into what ONE player may see:
//   1. redaction - the generator state, undrawn decks and the opponent's cards never leave
//      the server (hidden cards become placeholders, so counts still render);
//   2. mirroring - for seat 1 the seats are swapped, so the UI keeps its "me = 0" convention.
// Log lines carry real player names (see setActorNames in the runner), so they need no mirroring.
import {rows} from '../src/data/geopolitix.mjs';

const flip = i => (i === 0 ? 1 : i === 1 ? 0 : i);
const hidden = (n, tag) => Array.from({length: n}, (_, i) => ({id: `hidden-${tag}-${i}`, rank: 1, suit: 'S', hidden: true}));

function mirrorSeats(s) {
  s.players.reverse();
  for (const key of ['turn', 'dealer', 'winner']) if (typeof s[key] === 'number') s[key] = flip(s[key]);
  if (Array.isArray(s.pending)) s.pending = s.pending.map(flip);
}

function pokerView(s, seat) {
  delete s.rng; s.deck = []; s.burn = [];
  const opp = s.players[1 - seat];
  if (!s.result?.showdown) opp.cards = hidden(opp.cards.length, 'poker');
  return s;
}
function pokerMirror(s) {
  mirrorSeats(s);
  if (s.result) {
    if (typeof s.result.winner === 'number') s.result.winner = flip(s.result.winner);
    s.result.payout = [...s.result.payout].reverse();
    if (s.result.hands) s.result.hands = [...s.result.hands].reverse();
  }
}

function rummyView(s, seat) {
  delete s.rng; s.stock = hidden(s.stock.length, 'stock');
  if (s.phase !== 'over') s.players[1 - seat].hand = hidden(s.players[1 - seat].hand.length, 'rummy');
  return s;
}
function rummyMirror(s) {
  mirrorSeats(s);
  s.melds.forEach(m => { m.owner = flip(m.owner); });
  if (s.penalties) s.penalties = [...s.penalties].reverse();
}

function geoView(s, seat) {
  delete s.rng;
  s.players.forEach((p, i) => {
    p.deck = hidden(p.deck.length, `deck${i}`);
    if (i !== seat) p.hand = hidden(p.hand.length, 'geo');
  });
  return s;
}
function geoMirror(s) {
  mirrorSeats(s);
  s.wins = [...s.wins].reverse();
  if (s.mulliganDone) s.mulliganDone = [...s.mulliganDone].reverse();
  s.history.forEach(h => { h.score = [...h.score].reverse(); });
  const owned = c => { if (typeof c.owner === 'number') c.owner = flip(c.owner); };
  for (const p of s.players) {
    p.hand.forEach(owned); p.grave.forEach(owned);
    for (const r of rows) p.board[r].forEach(owned);
  }
}

const GAMES = {poker: [pokerView, pokerMirror], rummy: [rummyView, rummyMirror], geo: [geoView, geoMirror]};

/** State as seen by `seat` (0 or 1). Pure: the input is not modified. */
export function viewFor(state, seat) {
  if (seat !== 0 && seat !== 1) throw new Error('Nieznane miejsce.');
  const game = GAMES[state.game];
  if (!game) throw new Error('Nieznana gra.');
  const s = structuredClone(state);
  game[0](s, seat);
  if (seat === 1) game[1](s);
  return s;
}

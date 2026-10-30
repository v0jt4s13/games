export function seed() {
  const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] || 1;
}
export function random(state) {
  let x = state.rng | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0; return state.rng / 4294967296;
}
export function shuffle(items, state) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random(state) * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export function note(s, message) { s.logSeq = (s.logSeq || 0) + 1; s.log = [...(s.log || []), message].slice(-60); }
// Local games call the seats "Ty" / "Komputer". Online games (server runner) set real player names
// before every engine call, so log lines are neutral and read correctly for both players.
let names = null;
export function setActorNames(list) { names = Array.isArray(list) && list.length === 2 ? list.map(String) : null; }
export const namesSet = () => names !== null;
export const actorName = p => names ? names[p] : (p === 0 ? 'Ty' : 'Komputer');
export const actorLower = p => names ? names[p] : (p === 0 ? 'Ty' : 'komputer');
export function playingDeck(copies = 1) {
  return Array.from({length: copies}, (_, copy) => ['S', 'H', 'D', 'C'].flatMap(suit =>
    Array.from({length: 13}, (_, i) => ({id: `${copy}-${suit}-${i+1}`, rank: i+1, suit})))).flat();
}
export const suitSymbol = {S:'♠', H:'♥', D:'♦', C:'♣'};
export const rankLabel = r => ({1:'A',11:'J',12:'Q',13:'K'}[r] || String(r));
export const cardLabel = c => rankLabel(c.rank) + suitSymbol[c.suit];
export function assert(condition, message) { if (!condition) throw new Error(message); }

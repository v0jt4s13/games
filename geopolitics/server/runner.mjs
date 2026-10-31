// Engine runner for the Python server: one JSON request on stdin, one JSON answer on stdout.
//   {op:'new',   game, opts}                          -> {state}
//   {op:'apply', game, state, seat, action, names}    -> {state}            (validated move of a seat)
//   {op:'auto',  game, state, aiSeats, names}         -> {state, moved, action?}  (one AI step, if due)
//   {op:'view',  game, state, seat}                   -> {view}
// 'new' takes opts {faction} (geo) or {players: 2..4} (rummy, poker).
// 'new', 'apply' and a moving 'auto' also return `views` (one per seat, in seat order).
// Errors are returned as {error} with exit code 0, so the server can show them to the player.
import {setActorNames} from '../src/engines/common.mjs';
import {newGeo, geoApply, geoBotAction} from '../src/engines/geopolitix.mjs';
import {newRummy, rummyApply, rummyBotAction} from '../src/engines/rummy.mjs';
import {newPoker, pokerApply, pokerBotAction} from '../src/engines/poker.mjs';
import {viewFor, viewsFor} from './views.mjs';

const ENGINES = {
  geo: {apply: geoApply, bot: geoBotAction, types: ['mulligan', 'nextRound', 'play', 'pass']},
  rummy: {apply: rummyApply, bot: rummyBotAction, types: ['draw', 'meld', 'layoff', 'discard']},
  poker: {apply: pokerApply, bot: pokerBotAction, types: ['nextHand', 'fold', 'check', 'call', 'raise']},
};
// Moves that do not belong to "whoever's turn it is": any seated human may confirm them.
const ANYONE = new Set(['nextRound', 'nextHand']);
const fail = message => { throw new Error(message); };

function engine(game) { return ENGINES[game] || fail('Nieznana gra.'); }

function playerMove(game, state, seat, raw) {
  const e = engine(game);
  if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string' || !e.types.includes(raw.type)) fail('Nieznana akcja.');
  const action = {...raw};
  if (action.type === 'mulligan') action.seat = seat;                  // the seat comes from the server, never the client
  else { delete action.seat; if (!ANYONE.has(action.type) && state.turn !== seat) fail('To nie Twoja tura.'); }
  return e.apply(state, action);
}

function aiStep(game, state, aiSeats) {
  const e = engine(game);
  if (state.phase === 'over') return {state, moved: false};
  if (game === 'geo' && state.phase === 'mulligan') {
    const seat = aiSeats.find(i => !(state.mulliganDone || [false, false])[i]);
    if (seat === undefined) return {state, moved: false};
    const action = {type: 'mulligan', ids: [], seat};
    return {state: e.apply(state, action), moved: true, action};
  }
  if (!['play', 'draw'].includes(state.phase) || !aiSeats.includes(state.turn)) return {state, moved: false};
  const action = e.bot(state);
  return {state: e.apply(state, action), moved: true, action};
}

function handle(req) {
  setActorNames(req.names || null);
  switch (req.op) {
    case 'new': {
      const opts = req.opts || {};
      if (req.game === 'geo') return {state: newGeo(opts.faction === 'america' ? 'america' : 'europe')};
      if (req.game === 'rummy') return {state: newRummy(undefined, opts.players || 2)};
      if (req.game === 'poker') return {state: newPoker(undefined, opts.players || 2)};
      return fail('Nieznana gra.');
    }
    case 'apply': return {state: playerMove(req.game, req.state, req.seat, req.action)};
    case 'auto': return aiStep(req.game, req.state, req.aiSeats || []);
    case 'view': return {view: viewFor(req.state, req.seat)};
    default: return fail('Nieznana operacja.');
  }
}

// Every state change ships both players' views, so the server stores them once and
// polling clients never need the engine.
function withViews(out) {
  if (out && out.state && (out.moved === undefined || out.moved)) out.views = viewsFor(out.state);
  return out;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  let out;
  try { out = withViews(handle(JSON.parse(input))); } catch (e) { out = {error: e.message || String(e)}; }
  process.stdout.write(JSON.stringify(out));
});

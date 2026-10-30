import {cardLabel, actorName} from './engines/common.mjs';
import {geoScores, geoPower} from './engines/geopolitix.mjs';
import {rows, rowLabels} from './data/geopolitix.mjs';
const phaseNames={mulligan:'wymiana kart',play:'zagrywanie',draw:'dobór',roundEnd:'koniec rundy',handEnd:'koniec rozdania',over:'koniec gry'};
const names={start:'Rozdanie kart',resume:'Początek szczegółowego zapisu',mulligan:'Wymiana kart',nextRound:'Następna runda',nextHand:'Następne rozdanie',play:'Zagranie karty',pass:'Pas do końca rundy',draw:'Dobór karty',meld:'Wyłożenie układów',layoff:'Dołożenie karty',discard:'Odrzucenie karty',fold:'Pas',check:'Czekanie',call:'Sprawdzenie',raise:'Podbicie'};
const label=c=>c.name||cardLabel(c);
const list=cards=>cards.map(c=>`${label(c)} [${c.id}]`).join(', ')||'brak';
export function publicSnapshot(s) {
 const out={Faza:phaseNames[s.phase]||s.phase,'Następny ruch':s.phase==='play'||s.phase==='draw'?actorName(s.turn):'oczekiwanie'};
 if(s.game==='geo') {
  out.Runda=s.round;out['Wygrane rundy']=s.wins.join(' : ');const scores=geoScores(s);
  s.players.forEach((p,i)=>{
   const who=actorName(i);out[`${who} / ręka`]=p.hand.length;out[`${who} / talia`]=p.deck.length;out[`${who} / cmentarz`]=p.grave.length;out[`${who} / pas`]=p.passed?'tak':'nie';
   for(const r of rows){out[`${who} / ${rowLabels[r]} / punkty`]=scores[i][r];out[`${who} / ${rowLabels[r]} / karty`]=p.board[r].map(c=>`${label(c)} [${c.id}]: ${c.power} → ${geoPower(s,i,r,c)}${c.protected?' (ochrona)':''}${c.sanction?' (sankcje)':''}`).join('; ')||'brak';out[`${who} / ${rowLabels[r]} / efekty`]=p.events[r].map(e=>e.type).join(', ')||'brak';}
  });
 } else if(s.game==='rummy') {
  out.Tura=s.turns+1;out['Stos zakryty']=s.stock.length;out['Stos odkryty']=s.discard.length;out['Wierzch stosu odkrytego']=s.discard.length?label(s.discard.at(-1)):'brak';out.Przetasowania=s.recycles;
  s.players.forEach((p,i)=>{out[`${actorName(i)} / ręka`]=p.hand.length;out[`${actorName(i)} / otwarcie 51`]=p.opened?'tak':'nie';});
  for(const m of s.melds)out[`Układ ${m.id} (${actorName(m.owner)})`]=list(m.cards);
  if(s.penalties)out['Punkty końcowe']=s.penalties.join(' : ');
 } else {
  out.Rozdanie=s.hand;out.Ulica=s.street;out.Dealer=actorName(s.dealer);out['Karty wspólne']=list(s.board);out['Pula / wpłaty rozdania']=s.players.reduce((n,p)=>n+p.contributed,0);out['Bieżący zakład']=s.currentBet;out['Ostatnie pełne podbicie']=s.lastRaise;
  s.players.forEach((p,i)=>{const who=actorName(i);out[`${who} / żetony`]=p.stack;out[`${who} / zakład ulicy`]=p.bet;out[`${who} / wpłaty rozdania`]=p.contributed;out[`${who} / pas`]=p.folded?'tak':'nie';if(s.result?.showdown)out[`${who} / odkryte karty`]=list(p.cards);});
  if(s.result){out['Wypłata brutto']=s.result.payout.join(' : ');if(s.result.hands)out['Układy końcowe']=s.result.hands.join(' / ');}
 }
 if(s.winner!==undefined)out.Wynik=s.winner===-1?'remis':`Wygrywa: ${actorName(s.winner)}`;
 return out;
}
function privateSnapshot(s) {return {rng:s.rng,hands:s.players.map((p,i)=>({player:actorName(i),cards:list(p.hand||p.cards)}))};}
function changed(before,after) {return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]!==after[k]).map(field=>({field,before:before[field]??'brak',after:after[field]??'brak'}));}
function makeEntry(before,after,action,kind='move') {
 const p=before?.turn??0;const system=['start','resume','nextRound','nextHand'].includes(action.type);const actor=system?'system':action.type==='mulligan'?0:p;
 const cards=before?.players.flatMap(x=>[...(x.hand||x.cards||[]),...(x.board?rows.flatMap(r=>x.board[r]):[])])||[];
 const played=cards.find(c=>c.id===action.id),target=cards.find(c=>c.id===action.target);
 const details=[];
 if(played){details.push(`Karta: ${label(played)} [${played.id}].`);if(played.desc)details.push(`Działanie: ${played.desc}`);}
 if(action.row)details.push(`Rząd docelowy: ${rowLabels[action.row]||action.row}${played?.type==='event'?' przeciwnika':''}.`);
 if(target)details.push(`Cel: ${label(target)} [${target.id}].`);
 if(action.source)details.push(`Źródło doboru: ${action.source==='stock'?'stos zakryty':'stos odkryty'}.`);
 if(action.groups)details.push(`Układy: ${action.groups.map(g=>g.map(id=>{const c=cards.find(c=>c.id===id);return c?`${label(c)} [${id}]`:id;}).join(', ')).join(' | ')}.`);
 if(action.meld)details.push(`Układ docelowy: ${action.meld}.`);
 if(action.amount!==undefined)details.push(`Łączny zakład: ${action.amount}.`);
 if(action.ids)details.push(`Liczba wymienianych kart: ${action.ids.length}.`);
 if(before&&kind==='move') {const count=(after.logSeq||0)-(before.logSeq||0);if(count>0)details.push(...after.log.slice(-count));}
 const b=before?publicSnapshot(before):{},a=publicSnapshot(after);
 const contextState=system?after:(before||after);
 return {seq:0,kind,actor,label:names[action.type]||action.type,context:after.game==='geo'?`Runda ${contextState.round}`:after.game==='rummy'?`Tura ${contextState.turns+1}`:`Rozdanie ${contextState.hand} · ${contextState.street}`,details,changes:changed(b,a),before:b,after:a,private:{before:before?privateSnapshot(before):null,after:privateSnapshot(after)}};
}
export function startTrace(s) {return {...s,trace:[{...makeEntry(null,s,{type:'start'}),seq:1}]};}
// Online play: the server owns the game. While a sink is set, a move is handed to it (sent over HTTP)
// and the state stays as it is until the next poll brings the server's version.
let moveSink=null;
export function setMoveSink(fn) {moveSink=fn;}
export function trackMove(state,action,reducer) {
 if(moveSink){moveSink(action);return state;}
 // Keep diagnostics out of engine clones and bot lookahead; entries are immutable.
 const {trace,...engineState}=state;
 const next=reducer(engineState,action);
 const history=trace||[{...makeEntry(null,state,{type:'resume'},'resume'),seq:1}];
 const entry=makeEntry(engineState,next,action);entry.seq=history.length+1;
 return {...next,trace:[...history,entry]};
}
export function exportTrace(state,includePrivate=false) {
 return {format:'przy-stole-trace-v1',game:state.game,containsHiddenCards:includePrivate,legacyLog:state.log,entries:(state.trace||[]).map(({private:secret,...entry})=>includePrivate?{...entry,private:secret}:entry)};
}

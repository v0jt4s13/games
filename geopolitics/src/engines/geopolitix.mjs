import {shuffle, random, seed, note, actorName, assert} from './common.mjs';
import {deckFor, rows} from '../data/geopolitix.mjs';
const emptyRows = () => Object.fromEntries(rows.map(r=>[r,[]]));
const immune = c => c.hero || c.immune || c.protected;
export function newGeo(faction='europe', rng=seed()) {
 const s={game:'geo',version:1,rng,phase:'mulligan',turn:0,round:1,wins:[0,0],history:[],log:[],players:[]};
 s.players=[faction,faction==='europe'?'america':'europe'].map((f,i)=>{
  const deck=shuffle(deckFor(f,i),s);return {faction:f,hand:deck.splice(0,21),deck,grave:[],board:emptyRows(),events:emptyRows(),passed:false};
 });return s;
}
export function geoPower(s,p,row,c) {
 const player=s.players[p], board=player.board[row], all=rows.flatMap(r=>player.board[r]);
 const effects=player.events[row];
 const silence=!immune(c)&&effects.some(e=>e.type==='silence');
 let n=c.power;
 if(!silence) {
  if(c.combo&&all.filter(x=>x.combo===c.combo).length>=3)n+=2;
  if(c.horseBonus)n+=all.filter(x=>x.horse).length;
  const i=board.findIndex(x=>x.id===c.id);
  n+=2*[board[i-1],board[i+1]].filter(x=>x?.aura).length;
 }
 if(!immune(c)) {
  if(c.sanction)n=Math.floor(n/2);
  if(effects.some(e=>e.type==='half'))n=Math.floor(n/2);
  if(c.electric&&effects.some(e=>e.type==='blackout'))n=1;
  if(effects.some(e=>e.type==='strike'))n=0;
 }
 return n;
}
export function geoScores(s) { return s.players.map((p,i)=>Object.fromEntries(rows.map(r=>[r,p.board[r].reduce((n,c)=>n+geoPower(s,i,r,c),0)]))); }
export function geoTotals(s) {return geoScores(s).map(scores=>Object.values(scores).reduce((a,b)=>a+b,0));}
export function geoActions(s,p=s.turn) {
 if(s.phase!=='play'||p!==s.turn||s.players[p].passed)return [];
 const player=s.players[p], enemy=s.players[1-p], out=[{type:'pass'}];
 for(const c of player.hand) {
  const base={type:'play',id:c.id};
  if(c.type==='event') {for(const row of c.row) if(enemy.board[row].some(x=>!immune(x)))out.push({...base,row});continue;}
  if(['decoy','protect','move'].includes(c.effect)) {
   for(const row of rows)for(const target of player.board[row]) {
    if(c.effect!=='protect'&&target.hero)continue;
    if(c.effect==='protect'&&immune(target))continue;
    if(c.effect==='move') {for(const dest of rows)if(dest!==row)out.push({...base,target:target.id,row:dest});}
    else out.push({...base,target:target.id});
   }continue;
  }
  if(c.effect==='bribe'&&!enemy.grave.some(x=>x.type==='unit'&&!x.hero))continue;
  if(c.effect==='clear'&&!rows.some(r=>player.events[r].length||player.board[r].some(x=>x.sanction)))continue;
  out.push(base);
 }
 return out;
}
function bury(s,c) {const cleaned={...c};delete cleaned.protected;delete cleaned.sanction;s.players[c.owner].grave.push(cleaned);}
function finishTurn(s,p) {
 if(s.players.every(x=>x.passed)) {
  const score=geoTotals(s);
  if(score[0]>=score[1])s.wins[0]++;
  if(score[1]>=score[0])s.wins[1]++;
  s.history.push({round:s.round,score});
  note(s,`Runda ${s.round}: ${score[0]} : ${score[1]}. ${score[0]===score[1]?'Remis; oboje otrzymują punkt.':score[0]>score[1]?'Wygrywasz rundę.':'Komputer wygrywa rundę.'}`);
  s.phase=Math.max(...s.wins)>=2?'over':'roundEnd';
  if(s.phase==='over')s.winner=s.wins[0]===s.wins[1]?-1:s.wins[0]>s.wins[1]?0:1;
  return;
 }
 // A temporary strike survives until after its target's next action, including scoring.
 for(const r of rows)s.players[p].events[r]=s.players[p].events[r].filter(e=>e.type!=='strike');
 s.turn=s.players[1-p].passed?p:1-p;
}
export function geoApply(state, action) {
 const s=structuredClone(state),p=s.turn,player=s.players[p],enemy=s.players[1-p];
 if(action.type==='mulligan') {
  assert(s.phase==='mulligan','Wymiana jest dostępna tylko przed meczem.');
  const ids=action.ids||[];assert(new Set(ids).size===ids.length&&ids.length<=3&&ids.every(id=>s.players[0].hand.some(c=>c.id===id)),'Wybierz maksymalnie 3 różne karty.');
  const h=s.players[0], removed=h.hand.filter(c=>ids.includes(c.id));
  h.hand=h.hand.filter(c=>!ids.includes(c.id));h.hand.push(...h.deck.splice(0,ids.length));h.deck=shuffle([...h.deck,...removed],s);
  s.phase='play';s.turn=random(s)<0.5?0:1;note(s,`Początek meczu. Zaczyna: ${actorName(s.turn)}.`);return s;
 }
 if(action.type==='nextRound') {
  assert(s.phase==='roundEnd','Runda jeszcze trwa.');
  for(const pl of s.players)for(const r of rows)for(const c of pl.board[r])bury(s,c);
  for(const pl of s.players){pl.board=emptyRows();pl.events=emptyRows();pl.passed=false;}
  s.round++;s.turn=(s.round-1)%2;s.phase='play';note(s,`Runda ${s.round}. Zachowujesz pozostałe karty na ręce; bez dodatkowego doboru.`);return s;
 }
 const legal=geoActions(s).some(a=>a.type===action.type&&a.id===action.id&&a.target===action.target&&a.row===action.row);
 assert(legal,'Ten ruch nie jest teraz dostępny.');
 if(action.type==='pass') {player.passed=true;note(s,`${actorName(p)}: pas.`);finishTurn(s,p);return s;}
 const index=player.hand.findIndex(c=>c.id===action.id),c=player.hand.splice(index,1)[0];
 note(s,`${actorName(p)}: ${c.name}.`);
 if(c.type==='event') {
  const row=action.row, targets=enemy.board[row].filter(x=>!immune(x));
  if(c.effect==='tornado') {
   const min=Math.min(...targets.map(x=>geoPower(s,1-p,row,x)));
   const victims=new Set(targets.filter(x=>geoPower(s,1-p,row,x)===min).map(x=>x.id));
   enemy.board[row]=enemy.board[row].filter(x=>{if(victims.has(x.id)){bury(s,x);return false;}return true;});
  } else if(c.effect==='sanction') {
   targets.sort((a,b)=>geoPower(s,1-p,row,b)-geoPower(s,1-p,row,a));if(targets[0])targets[0].sanction=true;
  } else if(!enemy.events[row].some(e=>e.type===c.effect))enemy.events[row].push({type:c.effect});
  bury(s,c);
 } else if(c.effect==='spy') {enemy.board[c.row].push(c);player.hand.push(...player.deck.splice(0,2));}
 else if(c.type==='unit') {
  player.board[c.row].push(c);
  if(c.muster){const pulled=player.deck.filter(x=>x.muster===c.muster);player.deck=player.deck.filter(x=>x.muster!==c.muster);player.board[c.row].push(...pulled);note(s,`Muster: przywołano ${pulled.length} kart z talii.`);}
 } else {
  if(c.effect==='draw')player.hand.push(...player.deck.splice(0,1));
  if(c.effect==='clear'){player.events=emptyRows();for(const r of rows)for(const x of player.board[r])delete x.sanction;}
  if(['decoy','protect','move'].includes(c.effect)) {
   const row=rows.find(r=>player.board[r].some(x=>x.id===action.target)),i=player.board[row].findIndex(x=>x.id===action.target),target=player.board[row][i];
   if(c.effect==='protect')target.protected=true;
   else {player.board[row].splice(i,1);if(c.effect==='decoy'){delete target.protected;delete target.sanction;player.hand.push(target);}else player.board[action.row].push(target);}
  }
  if(c.effect==='bribe') {const choices=enemy.grave.filter(x=>x.type==='unit'&&!x.hero),target=choices[Math.floor(random(s)*choices.length)];enemy.grave=enemy.grave.filter(x=>x.id!==target.id);player.board[target.row].push(target);}
  bury(s,c);
 }
 finishTurn(s,p);return s;
}
export function geoBotAction(state) {
 const {trace,...s}=state;
 const actions=geoActions(s),p=s.turn,[us,them]=[geoTotals(s)[p],geoTotals(s)[1-p]];
 if(actions.length===1)return actions[0];
 if(s.players[1-p].passed&&us>them)return {type:'pass'};
 if(!s.players[1-p].passed&&them-us>24&&s.players[p].hand.length<9&&s.wins[1-p]<1)return {type:'pass'};
 let best=actions[1],value=-Infinity;
 for(const a of actions.slice(1)) {
  const next=geoApply(s,a),scores=geoTotals(next);
  const v=scores[p]-scores[1-p]-(us-them)+2*(next.players[p].hand.length-s.players[p].hand.length+1);
  if(v>value){value=v;best=a;}
 }
 return best;
}

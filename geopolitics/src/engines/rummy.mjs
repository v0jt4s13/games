import {seed, shuffle, playingDeck, assert, note, actorName, cardLabel} from './common.mjs';
export const rummyValue=c=>Math.min(c.rank,10);
export function isMeld(cards) {
 if(cards.length<3)return false;
 const ranks=cards.map(c=>c.rank),suits=cards.map(c=>c.suit);
 if(new Set(ranks).size===1)return cards.length<=4&&new Set(suits).size===cards.length;
 if(new Set(suits).size!==1||new Set(ranks).size!==cards.length)return false;
 const sorted=[...ranks].sort((a,b)=>a-b);return sorted.every((n,i)=>i===0||n===sorted[i-1]+1);
}
export function meldCandidates(hand) {
 const result=[], seen=new Set();
 const add=cards=>{const key=cards.map(c=>c.id).sort().join('|');if(isMeld(cards)&&!seen.has(key)){seen.add(key);result.push(cards);}};
 for(let rank=1;rank<=13;rank++) {
  const groups=['S','H','D','C'].map(s=>hand.filter(c=>c.rank===rank&&c.suit===s)).filter(g=>g.length);
  const choose=(i,selected)=>{if(i===groups.length){add(selected);return;}choose(i+1,selected);for(const c of groups[i])choose(i+1,[...selected,c]);};
  if(groups.length>=3)choose(0,[]);
 }
 for(const suit of ['S','H','D','C']) {
  const ranks=Array.from({length:13},(_,i)=>hand.filter(c=>c.suit===suit&&c.rank===i+1));
  for(let start=0;start<11;start++) {
   const walk=(i,cards)=>{if(cards.length>=3)add(cards);if(i>=13||!ranks[i].length)return;for(const c of ranks[i])walk(i+1,[...cards,c]);};walk(start,[]);
  }
 }
 return result;
}
// Bounded by a 14-card hand. Disjoint set search finds combined openings >=51.
export function bestMelds(hand, minimum=0) {
 const index=new Map(hand.map((c,i)=>[c.id,i]));
 const candidates=meldCandidates(hand).map(cards=>({cards,mask:cards.reduce((m,c)=>m|(1<<index.get(c.id)),0),points:cards.reduce((n,c)=>n+rummyValue(c),0)}));
 const memo=new Map();
 function solve(mask) {
  if(memo.has(mask))return memo.get(mask);
  let best={points:0,cards:0,groups:[]};
  for(const c of candidates)if(!(mask&c.mask)) {
   const next=solve(mask|c.mask),candidate={points:next.points+c.points,cards:next.cards+c.cards.length,groups:[c.cards,...next.groups]};
   if(candidate.points>best.points||candidate.points===best.points&&candidate.cards>best.cards)best=candidate;
  }
  memo.set(mask,best);return best;
 }
 const result=solve(0);return result.points>=minimum?result.groups:[];
}
export function newRummy(rng=seed(),count=2) {
 assert(Number.isInteger(count)&&count>=2&&count<=4,'Remik obsługuje od 2 do 4 graczy.');
 // The turn limit scales with the table (100 discards per player; 200 for two players, as before).
 const s={game:'rummy',version:1,rng,phase:'draw',turn:0,players:[],melds:[],log:[],turns:0,recycles:0,maxTurns:100*count};
 const deck=shuffle(playingDeck(2),s);
 s.players=Array.from({length:count},()=>({hand:deck.splice(0,13),opened:false}));s.discard=deck.splice(0,1);s.stock=deck;note(s,'Dobierz kartę, wyłóż układy i zakończ turę odrzuceniem.');return s;
}
function endRummy(s,winner,reason) {
 s.phase='over';s.winner=winner;s.penalties=s.players.map(p=>p.hand.reduce((n,c)=>n+rummyValue(c),0));note(s,reason);
}
export function rummyApply(state,a) {
 const s=structuredClone(state),p=s.turn,player=s.players[p];
 assert(s.phase!=='over','Partia już się zakończyła.');
 if(a.type==='draw') {
  assert(s.phase==='draw','Kartę możesz dobrać raz na turę.');
  assert(['stock','discard'].includes(a.source),'Wybierz stos.');
  if(a.source==='stock'&&!s.stock.length) {
   if(s.discard.length<=1){endRummy(s,-1,'Brak kart do dobrania. Koniec partii.');return s;}
   const top=s.discard.pop();s.stock=shuffle(s.discard,s);s.discard=[top];s.recycles++;note(s,'Przetasowano stos odrzuconych kart.');
  }
  const source=a.source==='stock'?s.stock:s.discard;assert(source.length,'Stos jest pusty.');
  const card=source.pop();player.hand.push(card);s.phase='play';note(s,`${actorName(p)}: dobór ${a.source==='stock'?'ze stosu zakrytego':cardLabel(card)}.`);return s;
 }
 assert(s.phase==='play','Najpierw dobierz kartę.');
 if(a.type==='meld') {
  const groups=a.groups||[], ids=groups.flat();
  assert(groups.length>0&&new Set(ids).size===ids.length,'Wybierz różne karty do układów.');
  assert(ids.every(id=>player.hand.some(c=>c.id===id)),'Układ zawiera kartę spoza ręki.');
  const cards=groups.map(g=>g.map(id=>player.hand.find(c=>c.id===id)));
  assert(cards.every(isMeld),'Układ musi być sekwensem lub grupą różnych kolorów.');
  const points=cards.flat().reduce((n,c)=>n+rummyValue(c),0);
  assert(player.opened||points>=51,'Pierwsze wyłożenie musi mieć co najmniej 51 punktów łącznie.');
  assert(ids.length<player.hand.length,'Zostaw jedną kartę do końcowego odrzucenia.');
  player.hand=player.hand.filter(c=>!ids.includes(c.id));player.opened=true;
  for(const group of cards)s.melds.push({id:`meld-${s.turns}-${s.melds.length}`,owner:p,cards:group.sort((a,b)=>a.rank-b.rank)});
  note(s,`${actorName(p)}: wyłożenie ${ids.length} kart (${points} pkt).`);return s;
 }
 if(a.type==='layoff') {
  assert(player.opened,'Najpierw wyłóż własne układy za 51 punktów.');
  const meld=s.melds.find(m=>m.id===a.meld),card=player.hand.find(c=>c.id===a.id);
  assert(meld&&card&&isMeld([...meld.cards,card]),'Tej karty nie można dołożyć do wybranego układu.');
  assert(player.hand.length>1,'Ostatnią kartę odrzuć na stos.');
  player.hand=player.hand.filter(c=>c.id!==a.id);meld.cards.push(card);meld.cards.sort((a,b)=>a.rank-b.rank);note(s,`${actorName(p)}: dołożenie ${cardLabel(card)}.`);return s;
 }
 assert(a.type==='discard','Nieznana akcja.');
 const card=player.hand.find(c=>c.id===a.id);assert(card,'Wybierz jedną kartę do odrzucenia.');
 player.hand=player.hand.filter(c=>c.id!==a.id);s.discard.push(card);s.turns++;
 note(s,`${actorName(p)}: odrzuca ${cardLabel(card)}.`);
 if(!player.hand.length)endRummy(s,p,`${actorName(p)}: wszystkie karty wyłożone. Koniec partii!`);
 else if(s.turns>=(s.maxTurns||200)) {
  const points=s.players.map(x=>x.hand.reduce((n,c)=>n+rummyValue(c),0)),best=Math.min(...points),leaders=points.map((x,i)=>x===best?i:-1).filter(i=>i>=0);
  endRummy(s,leaders.length===1?leaders[0]:-1,`Limit ${s.maxTurns||200} tur: wygrywa mniejsza liczba punktów na ręce.`);
 } else {s.turn=(p+1)%s.players.length;s.phase='draw';}
 return s;
}
export function rummyBotAction(s) {
 const p=s.players[s.turn];
 if(s.phase==='draw') {
  const top=s.discard.at(-1),before=bestMelds(p.hand).flat().length,after=top?bestMelds([...p.hand,top]).flat().length:0;
  return {type:'draw',source:top&&(after>before||p.opened&&s.melds.some(m=>isMeld([...m.cards,top])))?'discard':'stock'};
 }
 const groups=bestMelds(p.hand,p.opened?0:51);
 if(groups.length&&groups.flat().length<p.hand.length)return {type:'meld',groups:groups.map(g=>g.map(c=>c.id))};
 if(p.opened&&p.hand.length>1)for(const c of p.hand)for(const m of s.melds)if(isMeld([...m.cards,c]))return {type:'layoff',id:c.id,meld:m.id};
 const usefulness=c=>p.hand.reduce((n,x)=>n+(x.id!==c.id?(x.rank===c.rank&&x.suit!==c.suit?5:x.suit===c.suit&&Math.abs(x.rank-c.rank)<=2?3:0):0),0)-rummyValue(c)*0.13;
 const discard=[...p.hand].sort((a,b)=>usefulness(a)-usefulness(b))[0];
 return {type:'discard',id:discard.id};
}

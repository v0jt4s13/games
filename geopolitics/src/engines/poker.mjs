import {seed,shuffle,playingDeck,assert,note,actorName,actorLower} from './common.mjs';
export const handNames=['Wysoka karta','Para','Dwie pary','Trójka','Strit','Kolor','Full','Kareta','Poker'];
export function compareRanks(a,b) {for(let i=0;i<Math.max(a.length,b.length);i++){const diff=(a[i]||0)-(b[i]||0);if(diff)return Math.sign(diff);}return 0;}
export function rankFive(cards) {
 const values=cards.map(c=>c.rank===1?14:c.rank).sort((a,b)=>b-a),counts=new Map();
 for(const n of values)counts.set(n,(counts.get(n)||0)+1);
 const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 const flush=cards.every(c=>c.suit===cards[0].suit),unique=[...new Set(values)];
 let straight=unique.length===5&&unique[0]-unique[4]===4?unique[0]:0;
 if(unique.join(',')==='14,5,4,3,2')straight=5;
 if(flush&&straight)return [8,straight];
 if(groups[0][1]===4)return [7,groups[0][0],groups[1][0]];
 if(groups[0][1]===3&&groups[1][1]===2)return [6,groups[0][0],groups[1][0]];
 if(flush)return [5,...values];if(straight)return [4,straight];
 if(groups[0][1]===3)return [3,...groups.map(g=>g[0])];
 if(groups[0][1]===2&&groups[1][1]===2)return [2,...groups.map(g=>g[0])];
 if(groups[0][1]===2)return [1,...groups.map(g=>g[0])];
 return [0,...values];
}
export function bestPokerHand(cards) {
 assert(cards.length>=5&&cards.length<=7,'Ocena wymaga 5-7 kart.');let best=null;
 function pick(start,chosen) {if(chosen.length===5){const rank=rankFive(chosen);if(!best||compareRanks(rank,best.rank)>0)best={rank,cards:chosen};return;}for(let i=start;i<cards.length;i++)pick(i+1,[...chosen,cards[i]]);}
 pick(0,[]);return {...best,name:best.rank[0]===8&&best.rank[1]===14?'Poker królewski':handNames[best.rank[0]]};
}
// Layered pots also handle an unmatched contribution (returned to its only owner).
export function distributePots(players,ranks,first=0) {
 const levels=[...new Set(players.map(p=>p.contributed).filter(Boolean))].sort((a,b)=>a-b),payout=players.map(()=>0);let previous=0;
 for(const level of levels) {
  const involved=players.map((p,i)=>({p,i})).filter(({p})=>p.contributed>=level),amount=(level-previous)*involved.length;previous=level;
  if(involved.length===1){payout[involved[0].i]+=amount;continue;}
  const eligible=involved.filter(({p})=>!p.folded).map(({i})=>i);assert(eligible.length,'Pula nie ma uprawnionego gracza.');
  let winners=[eligible[0]];
  for(const i of eligible.slice(1)){const cmp=compareRanks(ranks[i],ranks[winners[0]]);if(cmp>0)winners=[i];else if(!cmp)winners.push(i);}
  winners.sort((a,b)=>(a-first+players.length)%players.length-(b-first+players.length)%players.length);
  const share=Math.floor(amount/winners.length),rest=amount%winners.length;
  winners.forEach((i,j)=>payout[i]+=share+(j<rest?1:0));
 }
 return payout;
}
// Seats are numbered clockwise. Two to four players; a player with no chips drops out (`out`).
// With only two players left the usual heads-up rules apply: the dealer is the small blind and acts
// first before the flop, the other player acts first after it. With more players the small blind is
// left of the dealer and the player left of the big blind acts first before the flop.
export function newPoker(rng=seed(),count=2) {
 assert(Number.isInteger(count)&&count>=2&&count<=4,'Poker obsługuje od 2 do 4 graczy.');
 const s={game:'poker',version:1,rng,hand:0,dealer:count-1,log:[],players:Array.from({length:count},()=>({stack:1000})),phase:'handEnd'};return dealHand(s);
}
function pay(s,p,amount) {const pl=s.players[p],n=Math.min(pl.stack,amount);pl.stack-=n;pl.bet+=n;pl.contributed+=n;}
const ring=(s,from)=>s.players.map((_,k)=>(from+k)%s.players.length);            // seats clockwise, starting at `from`
const after=(s,seat,ok)=>ring(s,seat+1).find(i=>i!==seat&&ok(i));                  // next other seat satisfying `ok`
const ableToAct=(s,i)=>!s.players[i].folded&&s.players[i].stack>0;
function dealHand(state) {
 const s=structuredClone(state);assert(s.phase==='handEnd','Rozdanie jeszcze trwa.');
 const alive=s.players.map((p,i)=>p.stack>0?i:-1).filter(i=>i>=0);
 if(alive.length<2){s.phase='over';s.winner=alive[0];return s;}
 s.hand++;s.dealer=after(s,s.dealer,i=>s.players[i].stack>0);s.street='preflop';s.phase='play';s.board=[];s.burn=[];s.deck=shuffle(playingDeck(),s);s.result=null;
 s.players=s.players.map(p=>({stack:p.stack,bet:0,contributed:0,folded:p.stack===0,...(p.stack===0?{out:true}:{}),cards:[]}));
 const inHand=i=>!s.players[i].out,sb=alive.length===2?s.dealer:after(s,s.dealer,inHand),bb=after(s,sb,inHand);
 for(let n=0;n<2;n++)for(const p of ring(s,sb).filter(inHand))s.players[p].cards.push(s.deck.pop());
 pay(s,sb,10);pay(s,bb,20);s.currentBet=Math.max(...s.players.map(p=>p.bet));s.lastRaise=20;
 const first=after(s,bb,inHand);s.pending=ring(s,first).filter(i=>inHand(i)&&s.players[i].stack>0);s.turn=first;
 note(s,`Rozdanie ${s.hand}. Blindy 10 / 20. Dealer: ${actorName(s.dealer)}.`);
 const able=s.players.map((_,i)=>ableToAct(s,i)?i:-1).filter(i=>i>=0);
 if(able.length<2){
  if(!able.length||s.players[able[0]].bet>=s.currentBet)showdown(s);else{s.pending=[able[0]];s.turn=able[0];}
 } else s.turn=s.pending[0];
 return s;
}
export function pokerOptions(s,p=s.turn) {
 if(s.phase!=='play'||s.turn!==p)return null;
 const us=s.players[p],others=s.players.filter((x,i)=>i!==p&&!x.folded),toCall=Math.max(0,s.currentBet-us.bet);
 const max=Math.min(us.bet+us.stack,Math.max(...others.map(x=>x.bet+x.stack))),min=s.currentBet+s.lastRaise;
 return {toCall,call:Math.min(toCall,us.stack),canCheck:toCall===0,canRaise:others.some(x=>x.stack>0)&&max>s.currentBet,minRaise:Math.min(min,max),fullMin:min,maxRaise:max};
}
function addStreet(s) {
 s.burn.push(s.deck.pop());
 if(s.street==='preflop'){s.street='flop';s.board.push(...[s.deck.pop(),s.deck.pop(),s.deck.pop()]);}
 else if(s.street==='flop'){s.street='turn';s.board.push(s.deck.pop());}
 else if(s.street==='turn'){s.street='river';s.board.push(s.deck.pop());}
 s.players.forEach(p=>p.bet=0);s.currentBet=0;s.lastRaise=20;
 s.pending=ring(s,s.dealer+1).filter(i=>ableToAct(s,i));s.turn=s.pending[0];
 note(s,`Na stole: ${s.street}.`);
}
function showdown(s) {
 while(s.board.length<5)addStreet(s);
 const hands=s.players.map(p=>p.folded?null:bestPokerHand([...p.cards,...s.board]));
 const payout=distributePots(s.players,hands.map(h=>h&&h.rank),(s.dealer+1)%s.players.length);
 const live=hands.map((h,i)=>h?i:-1).filter(i=>i>=0);let winners=[live[0]];
 for(const i of live.slice(1)){const cmp=compareRanks(hands[i].rank,hands[winners[0]].rank);if(cmp>0)winners=[i];else if(!cmp)winners.push(i);}
 s.players.forEach((p,i)=>p.stack+=payout[i]);s.phase='handEnd';s.pending=[];
 s.result={winner:winners.length===1?winners[0]:-1,winners,payout,hands:hands.map(h=>h&&h.name),showdown:true};
 note(s,`Odkrycie: ${live.map(i=>`${i===0?actorName(0):actorLower(i)} - ${hands[i].name}`).join(', ')}. Wypłata: ${payout.join(' / ')}.`);
}
// After an action: who still has a decision (or is it showdown / next street)?
function settle(s) {
 const able=s.players.map((_,i)=>ableToAct(s,i)?i:-1).filter(i=>i>=0);
 // No further betting with fewer than two players able to act, once the outstanding call is settled.
 if(able.length<2){
  if(able.length===1&&s.players[able[0]].bet<s.currentBet){s.pending=[able[0]];s.turn=able[0];return s;}
  showdown(s);return s;
 }
 if(s.pending.length){s.turn=s.pending[0];return s;}
 if(s.street==='river')showdown(s);else addStreet(s);
 return s;
}
export function pokerApply(state,a) {
 if(a.type==='nextHand')return dealHand(state);
 const s=structuredClone(state),p=s.turn;assert(s.phase==='play','Rozdanie już się zakończyło.');
 const o=pokerOptions(s),pl=s.players[p];
 if(a.type==='fold') {
  pl.folded=true;s.pending=s.pending.filter(i=>i!==p);
  const left=s.players.map((x,i)=>x.folded?-1:i).filter(i=>i>=0);
  if(left.length>1){note(s,`${actorName(p)}: pas.`);return settle(s);}
  const w=left[0],pot=s.players.reduce((n,x)=>n+x.contributed,0);s.players[w].stack+=pot;
  s.result={winner:w,winners:[w],payout:s.players.map((_,i)=>i===w?pot:0),showdown:false};s.phase='handEnd';s.pending=[];note(s,`${actorName(p)}: pas. Pula ${pot} dla ${actorName(w)}.`);return s;
 }
 if(a.type==='check'){assert(o.canCheck,'Musisz sprawdzić zakład lub spasować.');note(s,`${actorName(p)}: czeka.`);}
 else if(a.type==='call'){assert(o.toCall>0,'Nie ma zakładu do sprawdzenia.');pay(s,p,o.call);note(s,`${actorName(p)}: sprawdza ${o.call}.`);}
 else if(a.type==='raise') {
  assert(o.canRaise&&Number.isInteger(a.amount)&&a.amount>=o.minRaise&&a.amount<=o.maxRaise,'Podaj legalny łączny zakład w tej rundzie licytacji.');
  const increase=a.amount-s.currentBet;pay(s,p,a.amount-pl.bet);s.currentBet=a.amount;if(increase>=s.lastRaise)s.lastRaise=increase;
  s.pending=ring(s,p+1).filter(i=>i!==p&&ableToAct(s,i));s.turn=s.pending[0];note(s,`${actorName(p)}: podbija do ${a.amount}.`);return s;
 } else throw new Error('Nieznana akcja.');
 s.pending=s.pending.filter(i=>i!==p);
 return settle(s);
}
export function pokerBotAction(s) {
 const p=s.turn,o=pokerOptions(s),cards=s.players[p].cards;
 let strength;
 if(s.board.length>=3)strength=bestPokerHand([...cards,...s.board]).rank[0];
 else {const ranks=cards.map(c=>c.rank===1?14:c.rank);strength=ranks[0]===ranks[1]?2:ranks.every(n=>n>=10)?1.5:Math.max(...ranks)>=12?1:0;}
 if(o.canRaise&&strength>=2&&s.players[p].bet===0) return {type:'raise',amount:Math.min(o.maxRaise,Math.max(o.minRaise,s.currentBet+40))};
 if(o.canCheck)return {type:'check'};
 if(o.toCall>Math.max(40,s.players[p].stack*(strength>=2?1:strength>=1?0.3:0.08)))return {type:'fold'};
 return {type:'call'};
}

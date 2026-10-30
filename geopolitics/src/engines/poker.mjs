import {seed,shuffle,playingDeck,assert,note,actorName} from './common.mjs';
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
export function newPoker(rng=seed()) {
 const s={game:'poker',version:1,rng,hand:0,dealer:1,log:[],players:[0,1].map(()=>({stack:1000})),phase:'handEnd'};return dealHand(s);
}
function pay(s,p,amount) {const pl=s.players[p],n=Math.min(pl.stack,amount);pl.stack-=n;pl.bet+=n;pl.contributed+=n;}
function dealHand(state) {
 const s=structuredClone(state);assert(s.phase==='handEnd','Rozdanie jeszcze trwa.');
 if(s.players.some(p=>p.stack===0)){s.phase='over';s.winner=s.players[0].stack>0?0:1;return s;}
 s.hand++;s.dealer=1-s.dealer;s.street='preflop';s.phase='play';s.board=[];s.burn=[];s.deck=shuffle(playingDeck(),s);s.result=null;
 s.players=s.players.map(p=>({stack:p.stack,bet:0,contributed:0,folded:false,cards:[]}));
 for(let n=0;n<2;n++)for(const p of [s.dealer,1-s.dealer])s.players[p].cards.push(s.deck.pop());
 pay(s,s.dealer,10);pay(s,1-s.dealer,20);s.currentBet=Math.max(...s.players.map(p=>p.bet));s.lastRaise=20;s.pending=[s.dealer,1-s.dealer].filter(p=>s.players[p].stack>0);s.turn=s.dealer;
 note(s,`Rozdanie ${s.hand}. Blindy 10 / 20. Dealer: ${actorName(s.dealer)}.`);
 if(s.players.some(p=>p.stack===0)){
  const active=s.players.findIndex(p=>p.stack>0);if(active<0||s.players[active].bet>=s.currentBet)showdown(s);else{s.pending=[active];s.turn=active;}
 }
 return s;
}
export function pokerOptions(s,p=s.turn) {
 if(s.phase!=='play'||s.turn!==p)return null;
 const us=s.players[p],other=s.players[1-p],toCall=Math.max(0,s.currentBet-us.bet);
 const max=Math.min(us.bet+us.stack,other.bet+other.stack),min=s.currentBet+s.lastRaise;
 return {toCall,call:Math.min(toCall,us.stack),canCheck:toCall===0,canRaise:other.stack>0&&max>s.currentBet,minRaise:Math.min(min,max),fullMin:min,maxRaise:max};
}
function addStreet(s) {
 s.burn.push(s.deck.pop());
 if(s.street==='preflop'){s.street='flop';s.board.push(...[s.deck.pop(),s.deck.pop(),s.deck.pop()]);}
 else if(s.street==='flop'){s.street='turn';s.board.push(s.deck.pop());}
 else if(s.street==='turn'){s.street='river';s.board.push(s.deck.pop());}
 s.players.forEach(p=>p.bet=0);s.currentBet=0;s.lastRaise=20;
 s.pending=[1-s.dealer,s.dealer].filter(p=>s.players[p].stack>0&&!s.players[p].folded);s.turn=s.pending[0];
 note(s,`Na stole: ${s.street}.`);
}
function showdown(s) {
 while(s.board.length<5)addStreet(s);
 const hands=s.players.map(p=>bestPokerHand([...p.cards,...s.board]));
 const payout=distributePots(s.players,hands.map(h=>h.rank),1-s.dealer);
 const comparison=compareRanks(hands[0].rank,hands[1].rank);
 s.players.forEach((p,i)=>p.stack+=payout[i]);s.phase='handEnd';s.pending=[];
 s.result={winner:comparison===0?-1:comparison>0?0:1,payout,hands: hands.map(h=>h.name),showdown:true};
 note(s,`Odkrycie: Ty - ${hands[0].name}, komputer - ${hands[1].name}. Wypłata: ${payout[0]} / ${payout[1]}.`);
}
export function pokerApply(state,a) {
 if(a.type==='nextHand')return dealHand(state);
 const s=structuredClone(state),p=s.turn;assert(s.phase==='play','Rozdanie już się zakończyło.');
 const o=pokerOptions(s),pl=s.players[p];
 if(a.type==='fold') {
  pl.folded=true;const pot=s.players.reduce((n,x)=>n+x.contributed,0);s.players[1-p].stack+=pot;
  s.result={winner:1-p,payout:s.players.map((_,i)=>i===p?0:pot),showdown:false};s.phase='handEnd';s.pending=[];note(s,`${actorName(p)}: pas. Pula ${pot} dla ${actorName(1-p)}.`);return s;
 }
 if(a.type==='check'){assert(o.canCheck,'Musisz sprawdzić zakład lub spasować.');note(s,`${actorName(p)}: czeka.`);}
 else if(a.type==='call'){assert(o.toCall>0,'Nie ma zakładu do sprawdzenia.');pay(s,p,o.call);note(s,`${actorName(p)}: sprawdza ${o.call}.`);}
 else if(a.type==='raise') {
  assert(o.canRaise&&Number.isInteger(a.amount)&&a.amount>=o.minRaise&&a.amount<=o.maxRaise,'Podaj legalny łączny zakład w tej rundzie licytacji.');
  const increase=a.amount-s.currentBet;pay(s,p,a.amount-pl.bet);s.currentBet=a.amount;if(increase>=s.lastRaise)s.lastRaise=increase;
  s.pending=[1-p];s.turn=1-p;note(s,`${actorName(p)}: podbija do ${a.amount}.`);return s;
 } else throw new Error('Nieznana akcja.');
 s.pending=s.pending.filter(i=>i!==p);
 // No further betting with a player all-in, once the outstanding call is settled.
 if(s.players.some(x=>x.stack===0)) {
  const active=s.players.findIndex(x=>x.stack>0);
  if(active<0||s.players[active].bet>=s.currentBet){showdown(s);return s;}
  s.pending=[active];
 }
 if(s.pending.length){s.turn=s.pending[0];return s;}
 if(s.street==='river')showdown(s);else addStreet(s);
 return s;
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

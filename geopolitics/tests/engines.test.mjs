import test from 'node:test';
import assert from 'node:assert/strict';
import {deckFor,rows,factions,defaultOpponent} from '../src/data/geopolitix.mjs';
import {newGeo,geoApply,geoActions,geoBotAction,geoTotals,geoPower} from '../src/engines/geopolitix.mjs';
import {newRummy,rummyApply,rummyBotAction,isMeld,bestMelds} from '../src/engines/rummy.mjs';
import {newPoker,pokerApply,pokerBotAction,pokerOptions,bestPokerHand,distributePots,compareRanks} from '../src/engines/poker.mjs';
const card=(rank,suit='S',copy=0)=>({id:`${copy}-${suit}-${rank}`,rank,suit});
const geoCards=s=>s.players.flatMap(p=>[...p.hand,...p.deck,...p.grave,...rows.flatMap(r=>p.board[r])]);
function conserveGeo(s){const cards=geoCards(s);assert.equal(cards.length,100);assert.equal(new Set(cards.map(c=>c.id)).size,100);}
test('Frakcje mają dokładnie 50 kart, unikalne instancje i opisy efektów',()=>{
 for(const f of factions){const d=deckFor(f,0);assert.equal(d.length,50);assert.equal(new Set(d.map(c=>c.id)).size,50);assert.equal(new Set(d.map(c=>c.key)).size,44);assert.ok(d.every(c=>c.name&&c.desc));}
});
test('Mulligan nie losuje odrzuconych kart ponownie i nie zmienia liczby kart',()=>{
 const s=newGeo('europe',12),ids=s.players[0].hand.slice(0,3).map(c=>c.id),n=geoApply(s,{type:'mulligan',ids});
 assert.equal(n.players[0].hand.length,21);assert.ok(ids.every(id=>!n.players[0].hand.some(c=>c.id===id)));conserveGeo(n);
 assert.throws(()=>geoApply(s,{type:'mulligan',ids:[ids[0],ids[0]]}));assert.equal(s.phase,'mulligan');
});
test('Blackout: technologia 1, historyczne jednostki i liderzy zachowują siłę',()=>{
 const s=newGeo();const d=deckFor('america',1);const cards=['ceo','cowboy','trump'].map(k=>d.find(c=>c.key===k));
 s.players[1].board.economy=cards;s.players[1].events.economy=[{type:'blackout'}];
 assert.deepEqual(cards.map(c=>geoPower(s,1,'economy',c)),[1,5,17]);cards[0].protected=true;assert.equal(geoPower(s,1,'economy',cards[0]),8);
});
test('Muster pobiera z talii, nie z ręki, i nie duplikuje kart',()=>{
 let s=geoApply(newGeo('europe',5),{type:'mulligan',ids:[]});s.turn=0;
 const p=s.players[0],series=[...p.hand,...p.deck].filter(c=>c.key==='blake');
 p.hand=p.hand.filter(c=>c.key!=='blake');p.deck=p.deck.filter(c=>c.key!=='blake');p.hand.push(...series.slice(0,2));p.deck.push(...series.slice(2));
 s=geoApply(s,{type:'play',id:series[0].id});assert.equal(s.players[0].board.defense.length,3);assert.ok(s.players[0].hand.some(c=>c.id===series[1].id));conserveGeo(s);
});
test('Pas jest trwały, a remis przyznaje punkt obu stronom',()=>{
 let s=geoApply(newGeo('europe',22),{type:'mulligan',ids:[]});s=geoApply(s,{type:'pass'});s=geoApply(s,{type:'pass'});
 assert.deepEqual(s.wins,[1,1]);assert.equal(s.phase,'roundEnd');s=geoApply(s,{type:'nextRound'});s=geoApply(s,{type:'pass'});s=geoApply(s,{type:'pass'});assert.equal(s.winner,-1);
});
test('Geopolitix: 30 pełnych deterministycznych meczów, zachowanie wszystkich kart',()=>{
 for(let seed=1;seed<=30;seed++) {let s=geoApply(newGeo(seed%2?'europe':'america',seed),{type:'mulligan',ids:[]});let steps=0;
 while(s.phase!=='over'&&steps++<250){s=geoApply(s,s.phase==='roundEnd'?{type:'nextRound'}:geoBotAction(s));conserveGeo(s);assert.ok(geoTotals(s).every(Number.isFinite));}
 assert.equal(s.phase,'over',`seed ${seed}`);}
});
test('Remik: sekwens, kolory, duplikaty, as niski',()=>{
 assert.ok(isMeld([card(1),card(2),card(3)]));assert.ok(isMeld([card(9,'H'),card(9,'D'),card(9,'C')]));
 assert.ok(!isMeld([card(12),card(13),card(1)]));assert.ok(!isMeld([card(9),card(9,'S',1),card(9,'D')]));
});
test('Remik: pierwsze wyłożenie sumuje kilka rozłącznych grup do 51',()=>{
 const hand=[card(11),card(12),card(13),card(9,'D'),card(10,'D'),card(11,'D'),card(2,'C')];
 const groups=bestMelds(hand,51);assert.equal(groups.length,2);
 let s=newRummy(2);s.phase='play';s.players[0].hand=hand;
 assert.throws(()=>rummyApply(s,{type:'meld',groups:[groups[0].map(c=>c.id)]}));
 s=rummyApply(s,{type:'meld',groups:groups.map(g=>g.map(c=>c.id))});assert.ok(s.players[0].opened);assert.equal(s.players[0].hand.length,1);
 s=rummyApply(s,{type:'discard',id:hand.at(-1).id});assert.equal(s.winner,0);
});
test('Remik: po recyklingu zostaje odkryta górna karta',()=>{
 const s=newRummy(3),top=card(7,'H');s.stock=[];s.discard=[card(1),card(2),top];
 const n=rummyApply(s,{type:'draw',source:'stock'});assert.deepEqual(n.discard,[top]);assert.equal(n.stock.length,1);
});
test('Remik: 10 pełnych partii, legalne akcje botów i zachowanie 104 kart',()=>{
 for(let seed=1;seed<=10;seed++){let s=newRummy(seed),steps=0;while(s.phase!=='over'&&steps++<1200){s=rummyApply(s,rummyBotAction(s));const cards=[...s.stock,...s.discard,...s.players.flatMap(p=>p.hand),...s.melds.flatMap(m=>m.cards)];assert.equal(cards.length,104);assert.equal(new Set(cards.map(c=>c.id)).size,104);}assert.equal(s.phase,'over');}
});
test('Poker: wheel, royal flush, full z dwóch trójek i kicker',()=>{
 assert.deepEqual(bestPokerHand([1,2,3,4,5].map(r=>card(r))).rank,[8,5]);
 assert.equal(bestPokerHand([10,11,12,13,1].map(r=>card(r,'H'))).name,'Poker królewski');
 assert.deepEqual(bestPokerHand([card(13),card(13,'H'),card(13,'D'),card(12),card(12,'H'),card(12,'D'),card(2)]).rank,[6,13,12]);
 assert.equal(compareRanks([1,10,14,8,6],[1,10,13,12,11]),1);
});
test('Poker: pule boczne, zwrot nadpłaty i nieparzysty żeton',()=>{
 assert.deepEqual(distributePots([{contributed:50},{contributed:100},{contributed:200}],[[2,10],[1,12],[0,14]]),[150,100,100]);
 assert.deepEqual(distributePots([{contributed:5},{contributed:5},{contributed:5,folded:true}],[[1,10],[1,10],[0]],1),[7,8,0]);
});
test('Poker heads-up: dealer gra pierwszy przed flopem, BB po flopie',()=>{
 let s=newPoker(5);assert.equal(s.turn,s.dealer);s=pokerApply(s,{type:'call'});assert.equal(s.turn,1-s.dealer);s=pokerApply(s,{type:'check'});assert.equal(s.street,'flop');assert.equal(s.turn,1-s.dealer);
});
test('Poker: all-in odsłania stół, nie gubi żetonów',()=>{
 let s=newPoker(10);s=pokerApply(s,{type:'raise',amount:pokerOptions(s).maxRaise});s=pokerApply(s,{type:'call'});assert.equal(s.phase,'handEnd');assert.equal(s.board.length,5);assert.equal(s.players.reduce((n,p)=>n+p.stack,0),2000);
});
test('Poker: 200 rozdań z różnymi akcjami, zachowanie kart i żetonów',()=>{
 for(let seed=1;seed<=20;seed++){let s=newPoker(seed);
 for(let hand=0;hand<10&&s.phase!=='over';hand++) {let steps=0;
 while(s.phase==='play'&&steps++<100){const o=pokerOptions(s),a=seed%3===0&&o.canRaise?{type:'raise',amount:o.maxRaise}:seed%3===1?{type:o.canCheck?'check':'call'}:pokerBotAction(s);s=pokerApply(s,a);const cards=[...s.deck,...s.burn,...s.board,...s.players.flatMap(p=>p.cards)];assert.equal(cards.length,52);assert.equal(new Set(cards.map(c=>c.id)).size,52);const money=s.players.reduce((n,p)=>n+p.stack+(s.phase==='play'?p.contributed:0),0);assert.equal(money,2000);}
 assert.equal(s.phase,'handEnd');s=pokerApply(s,{type:'nextHand'});}}
});

test('Geopolitix: każda para frakcji rozgrywa pełne mecze i zachowuje karty',()=>{
 for(const a of factions)for(const b of factions){if(a===b)continue;
  for(let seed=1;seed<=2;seed++){let s=geoApply(newGeo(a,seed,b),{type:'mulligan',ids:[]});let steps=0;
   assert.deepEqual(s.players.map(p=>p.faction),[a,b]);
   while(s.phase!=='over'&&steps++<250){s=geoApply(s,s.phase==='roundEnd'?{type:'nextRound'}:geoBotAction(s));conserveGeo(s);}
   assert.equal(s.phase,'over',`${a} vs ${b}, seed ${seed}`);}}
});
test('Geopolitix: bez przeciwnika obowiązuje dotychczasowe parowanie',()=>{
 assert.deepEqual(newGeo('europe',1).players.map(p=>p.faction),['europe','america']);
 assert.deepEqual(newGeo('america',1).players.map(p=>p.faction),['america','europe']);
 assert.equal(defaultOpponent('asia'),'europe');
});
test('Geopolitix: talia Azji ma 4 liderów, 2 serie po 4 kopie i komplet efektów',()=>{
 const d=deckFor('asia',0);assert.equal(d.filter(c=>c.hero).length,4);
 for(const k of ['border_patrol','trade_fleet'])assert.equal(d.filter(c=>c.muster===k).length,4);
 assert.equal(d.filter(c=>c.combo==='tech').length,6);assert.equal(d.filter(c=>c.type==='event').length,8);
 assert.equal(d.filter(c=>c.type==='special').length,5);assert.equal(d.filter(c=>c.effect==='spy').length,1);
 const others=new Set([...deckFor('europe',0),...deckFor('america',0)].map(c=>c.key));
 assert.deepEqual(d.map(c=>c.key).filter(k=>others.has(k)),[]);
});
test('Geopolitix: każda talia ma 4 liderów i ten sam klucz oznacza tę samą nazwę we wszystkich frakcjach',()=>{
 const names=new Map();
 for(const f of factions){const d=deckFor(f,0);assert.equal(d.filter(c=>c.hero).length,4,f);assert.equal(d.filter(c=>c.type==='event').length,8,f);
  assert.equal(d.filter(c=>c.muster).length,8,f);assert.equal(d.filter(c=>c.combo).length,f==='europe'?6:6,f);
  for(const c of d){if(names.has(c.key))assert.equal(names.get(c.key),c.name,`${f}: ${c.key}`);names.set(c.key,c.name);}}
});

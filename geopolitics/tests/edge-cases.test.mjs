import test from 'node:test';
import assert from 'node:assert/strict';
import {newGeo,geoApply,geoActions,geoBotAction,geoTotals} from '../src/engines/geopolitix.mjs';
import {newRummy,rummyApply,rummyBotAction} from '../src/engines/rummy.mjs';
import {newPoker,pokerApply,pokerOptions,pokerBotAction} from '../src/engines/poker.mjs';
function forceGeo(key){const s=geoApply(newGeo('europe',11),{type:'mulligan',ids:[]});s.turn=0;const p=s.players[0];const c=p.hand.find(c=>c.key===key)||p.deck.find(c=>c.key===key);if(!p.hand.includes(c)){p.deck=p.deck.filter(x=>x.id!==c.id);p.hand.push(c);}return [s,c];}
test('Szpieg przy ostatniej karcie dobiera tylko jedną i daje punkty rywalowi',()=>{
 const [s,c]=forceGeo('devil');s.players[0].grave.push(...s.players[0].deck.splice(1));const before=s.players[0].hand.length;
 const n=geoApply(s,{type:'play',id:c.id});assert.equal(n.players[0].hand.length,before);assert.equal(n.players[0].deck.length,0);assert.equal(geoTotals(n)[1],7);
});
test('Lider nie jest legalnym celem Krasnala',()=>{
 const [s,c]=forceGeo('gnome'),p=s.players[0],leader=[...p.deck,...p.hand].find(x=>x.hero);
 p.deck=p.deck.filter(x=>x.id!==leader.id);p.hand=p.hand.filter(x=>x.id!==leader.id);p.board[leader.row].push(leader);
 assert.ok(!geoActions(s).some(a=>a.id===c.id&&a.target===leader.id));assert.throws(()=>geoApply(s,{type:'play',id:c.id,target:leader.id}));
});
test('Remik blokuje odrzucenie przed doborem, podwójny dobór i dołożenie przed otwarciem',()=>{
 const s=newRummy(22);assert.throws(()=>rummyApply(s,{type:'discard',id:s.players[0].hand[0].id}));
 const n=rummyApply(s,{type:'draw',source:'stock'});assert.throws(()=>rummyApply(n,{type:'draw',source:'stock'}));assert.throws(()=>rummyApply(n,{type:'layoff',id:n.players[0].hand[0].id,meld:'missing'}));assert.equal(s.players[0].hand.length,13);
});
test('Poker: niepełny big blind all-in wymaga tylko dopłaty i zachowuje 2000 żetonów',()=>{
 let s=newPoker(44);s.phase='handEnd';s.dealer=0;s.players=[{stack:15},{stack:1985}];s=pokerApply(s,{type:'nextHand'});
 assert.equal(s.turn,1);assert.equal(pokerOptions(s).call,5);assert.equal(pokerOptions(s).canRaise,false);s=pokerApply(s,{type:'call'});assert.equal(s.phase,'handEnd');assert.equal(s.players.reduce((sum,p)=>sum+p.stack,0),2000);
});
test('Poker: nielegalne podbicie i czekanie nie zmieniają stanu',()=>{
 const s=newPoker(16),before=JSON.stringify(s);assert.throws(()=>pokerApply(s,{type:'raise',amount:21}));assert.throws(()=>pokerApply(s,{type:'check'}));assert.equal(JSON.stringify(s),before);
});
test('Boty nie uzależniają decyzji od zawartości zakrytej ręki przeciwnika',()=>{
 const g=geoApply(newGeo('europe',33),{type:'mulligan',ids:[]});g.turn=1;const g2=structuredClone(g);g2.players[0].hand.reverse();g2.players[0].hand=g2.players[0].hand.map(c=>({...c,power:999}));assert.deepEqual(geoBotAction(g),geoBotAction(g2));
 const r=newRummy(33);r.turn=1;const r2=structuredClone(r);r2.players[0].hand=r2.players[0].hand.map(c=>({...c,rank:13}));assert.deepEqual(rummyBotAction(r),rummyBotAction(r2));
 const p=newPoker(33),p2=structuredClone(p);p2.players[1-p.turn].cards=p2.players[1-p.turn].cards.map(c=>({...c,rank:1}));assert.deepEqual(pokerBotAction(p),pokerBotAction(p2));
});
test('Zapis i odczyt JSON zachowuje następny ruch oraz deterministyczne losowanie',()=>{
 const g=newGeo('europe',555),action={type:'mulligan',ids:g.players[0].hand.slice(0,3).map(c=>c.id)};assert.deepEqual(geoApply(g,action),geoApply(JSON.parse(JSON.stringify(g)),action));
 const r=newRummy(555);assert.deepEqual(rummyApply(r,{type:'draw',source:'stock'}),rummyApply(JSON.parse(JSON.stringify(r)),{type:'draw',source:'stock'}));
 const p=newPoker(555);assert.deepEqual(pokerApply(p,{type:'call'}),pokerApply(JSON.parse(JSON.stringify(p)),{type:'call'}));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {startTrace,trackMove,exportTrace} from '../src/trace.mjs';
import {newGeo,geoApply,geoBotAction} from '../src/engines/geopolitix.mjs';
import {newRummy,rummyApply,rummyBotAction} from '../src/engines/rummy.mjs';
import {newPoker,pokerApply} from '../src/engines/poker.mjs';
import {defaultBacks,loadBacks,validateBack,DEFAULT_BACK_URL} from '../src/cardBacks.mjs';
test('Ślad zapisuje konkretny ruch i przyrost punktów bez zmiany wyniku silnika',()=>{
 let s=startTrace(newGeo('europe',30));s=trackMove(s,{type:'mulligan',ids:[]},geoApply);
 const action=geoBotAction(s),{trace,...base}=s,plain=geoApply(base,action);
 const tracked=trackMove(s,action,geoApply),{trace:history,...actual}=tracked;
 assert.deepEqual(actual,plain);assert.equal(history.length,3);assert.equal(history[2].actor,s.turn);assert.ok(history[2].details.some(d=>d.startsWith('Karta:')));assert.ok(history[2].changes.some(c=>c.field.endsWith('punkty')));assert.equal(s.trace.length,2);
});
test('Publiczny eksport nie zawiera zakrytych kart ani generatora; diagnostyczny je zawiera',()=>{
 const s=startTrace(newPoker(33));const redacted=exportTrace(s),full=exportTrace(s,true);
 assert.equal(redacted.containsHiddenCards,false);assert.ok(!('private' in redacted.entries[0]));assert.ok(!JSON.stringify(redacted).includes('rng'));assert.ok(!JSON.stringify(redacted).includes('hands'));
 assert.ok(full.entries[0].private.after.hands[1].cards);assert.equal(full.entries[0].private.after.rng,s.rng);
});
test('Dobór ukrytej karty jest w śladzie prywatnym, jawny ślad zawiera zmianę liczników',()=>{
 let s=startTrace(newRummy(55));s.turn=1;const n=trackMove(s,{type:'draw',source:'stock'},rummyApply),e=n.trace.at(-1);
 assert.ok(e.changes.some(c=>c.field==='Komputer / ręka'&&c.before===13&&c.after===14));assert.ok(e.details.includes('Źródło doboru: stos zakryty.'));assert.notEqual(e.private.before.hands[1].cards,e.private.after.hands[1].cards);
});
test('Stary zapis rozpoczyna ślad od migawki, a błędny ruch go nie zmienia',()=>{
 const old=newRummy(88);delete old.logSeq;const saved=JSON.stringify(old);assert.throws(()=>trackMove(old,{type:'discard',id:'nope'},rummyApply));assert.equal(JSON.stringify(old),saved);
 const next=trackMove(old,{type:'draw',source:'stock'},rummyApply);assert.equal(next.trace[0].kind,'resume');assert.equal(next.trace[1].seq,2);assert.ok(next.trace[1].details.some(d=>d.includes('dobór')));
});
test('Historia powyżej 60 komunikatów zostaje kompletna po zapisie i odczycie',()=>{
 let s=startTrace(newRummy(9));for(let i=0;i<75;i++)s=trackMove(s,rummyBotAction(s),rummyApply);
 assert.equal(s.trace.length,76);assert.equal(s.log.length,60);assert.deepEqual(exportTrace(JSON.parse(JSON.stringify(s)),true),exportTrace(s,true));assert.equal(s.trace.at(-1).seq,76);
});
test('Poker zapisuje dopłatę, żetony, odkrycie stołu i wypłatę',()=>{
 let s=startTrace(newPoker(10));s=trackMove(s,{type:'raise',amount:1000},pokerApply);s=trackMove(s,{type:'call'},pokerApply);
 const e=s.trace.at(-1);assert.ok(e.changes.some(c=>c.field==='Wypłata brutto'));assert.ok(e.changes.some(c=>c.field==='Komputer / odkryte karty'));assert.ok(e.details.some(d=>d.startsWith('Odkrycie:')));
});
test('Rewersy mają niezależne konfiguracje i walidują protokół',()=>{
 const defaults=defaultBacks();assert.equal(defaults.rummy.url,DEFAULT_BACK_URL);assert.notEqual(defaults.rummy,defaults.poker);
 const saved={rummy:{url:'https://example.com/image.png',fit:'cover'},poker:{url:DEFAULT_BACK_URL,fit:'contain'}};
 assert.deepEqual(loadBacks({getItem:()=>JSON.stringify(saved)}),saved);assert.deepEqual(validateBack({url:''}),{url:'',fit:'contain'});
 for(const url of ['javascript:alert(1)','file:///etc/passwd','data:image/svg+xml,test','https://user:pass@example.com'])assert.throws(()=>validateBack({url}));
 assert.equal(loadBacks({getItem:()=>'{bad'}).poker.url,DEFAULT_BACK_URL);assert.equal(loadBacks({getItem:()=>JSON.stringify({rummy:{url:'javascript:foo'},poker:saved.rummy})}).poker.url,saved.rummy.url);
});

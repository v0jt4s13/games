import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {collectCardArt,cardArtScript} from '../scripts/card-art.mjs';
import {cardArtUrl} from '../src/cardArt.mjs';
import {deckFor} from '../src/data/geopolitix.mjs';
function fixture(fn){const root=mkdtempSync(join(tmpdir(),'geo-art-'));try{mkdirSync(join(root,'europe'));mkdirSync(join(root,'america'));fn(root);}finally{rmSync(root,{recursive:true,force:true});}}
test('Rejestr wykrywa PNG i JPEG, ignoruje obce nazwy oraz inne pliki',()=>fixture(root=>{
 for(const file of ['europe/tusk.png','europe/mermaid.jpeg','europe/not-a-card.png','europe/orban.txt','america/trump.jpg'])writeFileSync(join(root,file),'fixture');
 assert.deepEqual(collectCardArt(root),{'europe/tusk':'./cards/europe/tusk.png','europe/mermaid':'./cards/europe/mermaid.jpeg','america/trump':'./cards/america/trump.jpg'});
}));
test('Nowe pliki pojawiają się przy kolejnym skanowaniu; WebP ma pierwszeństwo',()=>fixture(root=>{
 assert.deepEqual(collectCardArt(root),{});writeFileSync(join(root,'europe/blackout.png'),'fixture');assert.equal(collectCardArt(root)['europe/blackout'],'./cards/europe/blackout.png');
 writeFileSync(join(root,'europe/blackout.webp'),'fixture');assert.equal(collectCardArt(root)['europe/blackout'],'./cards/europe/blackout.webp');assert.ok(cardArtScript(root).includes('__GEOPOLITIX_ART__'));
}));
test('Brak folderu lub ilustracji nie tworzy żądania do nieistniejącego pliku',()=>fixture(root=>{
 assert.deepEqual(collectCardArt(join(root,'missing')),{});assert.equal(cardArtUrl({faction:'europe',key:'orban'},{}),null);
}));
test('Wszystkie kopie serii korzystają z jednej ilustracji, także w zapisanej partii',()=>{
 const cards=JSON.parse(JSON.stringify(deckFor('europe',0))).filter(c=>c.key==='blake');const manifest={'europe/blake':'./cards/europe/blake.png'};
 assert.equal(cards.length,4);assert.ok(cards.every(c=>cardArtUrl(c,manifest)==='./cards/europe/blake.png'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext,Script} from 'node:vm';
import {readFile} from 'node:fs/promises';
test('Komponenty renderują wszystkie stoły i ukrywają rękę komputera',async()=>{
 const result=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
 import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
 import {BackContext} from './src/CardBackSettings';import {PlayingCard} from './src/ui';import TraceLog from './src/TraceLog';import {startTrace} from './src/trace.mjs';
 import Geo,{GeoCard} from './src/GeoGame';import {deckFor} from './src/data/geopolitix.mjs';import Rummy from './src/RummyGame';import Poker from './src/PokerGame';import {Rules} from './src/rules';
 import {newGeo,geoApply} from './src/engines/geopolitix.mjs';import {newRummy} from './src/engines/rummy.mjs';import {newPoker,pokerApply} from './src/engines/poker.mjs';
 globalThis.__GEOPOLITIX_ART__={'europe/tusk':'./cards/europe/tusk.png','europe/mermaid':'./cards/europe/mermaid.png'};
 const props={run:()=>{},setState:()=>{},paused:true};
 let poker=newPoker(5);const screens={geoSetup:render(<Geo {...props}/>),rummySetup:render(<Rummy {...props}/>),pokerSetup:render(<Poker {...props}/>),geo:render(<Geo {...props} state={newGeo('europe',5)}/>),geoPlay:render(<Geo {...props} state={geoApply(newGeo('europe',5),{type:'mulligan',ids:[]})}/>),rummy:render(<Rummy {...props} state={newRummy(5)}/>),poker:render(<Poker {...props} state={poker}/>),rules:['geo','rummy','poker'].map(game=>render(<Rules game={game}/>))};
 poker=pokerApply(poker,{type:'raise',amount:1000});poker=pokerApply(poker,{type:'call'});screens.showdown=render(<Poker {...props} state={poker}/>);screens.backs=render(<BackContext.Provider value={{rummy:{url:'https://example.com/rummy.png',fit:'contain'},poker:{url:'https://example.com/poker.jpg',fit:'cover'}}}><PlayingCard hidden backGame='rummy'/><PlayingCard hidden backGame='poker'/></BackContext.Provider>);screens.trace=render(<TraceLog state={startTrace(newPoker(7))}/>);screens.art=render(<GeoCard card={deckFor('europe',0).find(c=>c.key==='tusk')}/>);screens.artCompact=render(<GeoCard compact card={deckFor('europe',0).find(c=>c.key==='mermaid')}/>);screens.noArt=render(<GeoCard card={{faction:'europe',key:'unavailable',name:'Bez grafiki',power:5}}/>);module.exports=screens;
 `},bundle:true,platform:'node',format:'cjs',packages:'external',write:false});
 const context={module:{exports:{}},exports:{},require:createRequire(import.meta.url),console,process,structuredClone};runInNewContext(result.outputFiles[0].text,context);const screens=context.module.exports;
 assert.match(screens.backs,/https:\/\/example.com\/rummy.png/);assert.match(screens.backs,/https:\/\/example.com\/poker.jpg/);assert.match(screens.backs,/object-fit:cover/);assert.match(screens.poker,/logo-londynek-no-bg-150x50.png/);assert.match(screens.trace,/Dziennik testowy/);assert.ok(!screens.trace.includes('&quot;hands&quot;'));
 assert.match(screens.art,/cards\/europe\/tusk.png/);assert.match(screens.artCompact,/cards\/europe\/mermaid.png/);assert.ok(!screens.noArt.includes('<img'));
 assert.match(screens.geoSetup,/Rozdaj 21 kart/);assert.match(screens.rummySetup,/Rozdaj karty/);assert.match(screens.pokerSetup,/Usiądź do stołu/);
 assert.match(screens.geo,/Do wymiany/);assert.match(screens.geoPlay,/Pasuję do końca rundy/);assert.match(screens.rummy,/Dobierz ze stosu zakrytego/);
 assert.equal((screens.poker.match(/aria-label="Zakryta karta"/g)||[]).length,2);assert.equal((screens.showdown.match(/aria-label="Zakryta karta"/g)||[]).length,0);
 for(const html of Object.values(screens).flat()){assert.ok(!html.includes('NaN'));assert.ok(!html.includes('[object Object]'));}
});
test('Wersja bez serwera zawiera poprawne skrypty i komplet lokalnych zasobów',async()=>{
 const html=await readFile('dist/standalone.html','utf8');
 assert.ok(!html.includes('type="module"'));assert.ok(!/<script[^>]+src=/.test(html));
 const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,3);for(const [,source] of scripts)new Script(source);
 const manifestContext={};new Script(scripts[0][1]).runInNewContext(manifestContext);const manifest=manifestContext.__GEOPOLITIX_ART__;assert.ok(manifest&&typeof manifest==='object');for(const url of Object.values(manifest))assert.ok((await readFile(`dist/${url.replace(/^\.\//,'')}`)).length>0);
 assert.ok((await readFile('dist/geopolitix-cover.webp')).length>0);assert.ok((await readFile('dist/rules-geopolitix.pdf')).length>0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {readFile} from 'node:fs/promises';
import {catalogs, chooseLocale, translate, translateSystemText} from '../src/i18n-core.mjs';
import {deckFor, factions} from '../src/data/geopolitix.mjs';

test('PL/EN/CS: complete dictionaries and unchanged parameter contracts', () => {
  const placeholders = text => [...text.matchAll(/\{\d+\}/g)].map(m => m[0]).sort();
  for (const locale of ['en', 'cs']) {
    assert.deepEqual(Object.keys(catalogs[locale]).sort(), Object.keys(catalogs.pl).sort());
    for (const key of Object.keys(catalogs.pl)) {
      assert.ok(catalogs[locale][key].trim(), `${locale}: ${key}`);
      assert.deepEqual(placeholders(catalogs[locale][key]), placeholders(catalogs.pl[key]), `${locale}: ${key}`);
    }
  }
  for (const faction of factions) for (const card of deckFor(faction, 0)) {
    const description = card.desc.replace(/ Odporność na Blackout\.$/, '');
    assert.ok(Object.hasOwn(catalogs.en, description), description);
    assert.ok(Object.hasOwn(catalogs.cs, description), description);
  }
});

test('language preference and opaque user values', () => {
  assert.equal(chooseLocale('cs', ['en-GB']), 'cs');
  assert.equal(chooseLocale(null, ['de-DE', 'en-US']), 'en');
  assert.equal(chooseLocale('constructor', ['cs-CZ']), 'cs');
  assert.equal(chooseLocale(null, ['de']), 'pl');
  assert.equal(translate('en', 'Wygrywa {0}.', ['Komputer']), 'Komputer wins.');
  assert.equal(translate('cs', 'Wycisz: {0}', ['Nowa gra']), 'Ztlumit: Nowa gra');
  assert.equal(translate('en', 'Wygrywa {0}.', ['<img onerror=x> {1}']), '<img onerror=x> {1} wins.');
  assert.equal(translateSystemText('en', 'Ala: podbija do 50.'), 'Ala: raises to 50.');
  assert.equal(translateSystemText('cs', 'Nowa gra: podbija do 50.'), 'Nowa gra: zvyšuje na 50.');
  assert.equal(translateSystemText('en', 'Komputer wygrywa rundę.', ['Komputer']), 'Komputer wins the round.');
  assert.equal(translateSystemText('en', 'Ala: pas.: podbija do 50.', ['Ala: pas.']), 'Ala: pas.: raises to 50.');
  assert.equal(translateSystemText('en', 'Błąd serwera (503).'), 'Server error (503).');
  assert.equal(translateSystemText('cs', 'unrecognised diagnostic'), 'unrecognised diagnostic');
});

async function runtime({blocked = false, saved = 'pl'} = {}) {
  const bundle = await build({stdin: {resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react'; import {renderToStaticMarkup as render} from 'react-dom/server';
    import * as i18n from './src/i18n'; import LanguageSwitch from './src/LanguageSwitch';
    import Geo from './src/GeoGame'; import Rummy from './src/RummyGame'; import Poker from './src/PokerGame';
    import Chat from './src/online/Chat'; import {Rules,gameInfo} from './src/rules';
    import {newRummy} from './src/engines/rummy.mjs';
    import {newPoker} from './src/engines/poker.mjs';
    const game=newRummy(42,4); const before=JSON.stringify(game);
    const ended=newPoker(42,3); ended.phase='handEnd'; ended.players[1].folded=true;
    ended.result={winners:[0],showdown:true,hands:['Para',null,'Wysoka karta'],payout:[30,0,0]};
    const props={run:()=>{},setState:()=>{},paused:true};
    module.exports={...i18n, renderAll:()=>({
      switch:render(<LanguageSwitch/>), geo:render(<Geo {...props}/>),
      rummy:render(<Rummy {...props} state={game}/>), poker:render(<Poker {...props}/>),
      pokerResult:render(<Poker {...props} state={ended}/>),
      rules:['geo','rummy','poker'].map(game=>render(<Rules game={game}/>)),
      name:gameInfo.rummy.name, unchanged:JSON.stringify(game)===before,
      chat:render(<Chat tableId="test" messages={[{id:1,mine:false,name:'Nowa gra',text:'Zamknij',at:1}]} meta={{epoch:0,open:true,muted:false}} seats={[]} isHost={false} onChanged={()=>{}}/>)
    })};`}, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false});
  const values = new Map(saved ? [['games:language', saved]] : []), listeners = new Map();
  const document = {documentElement: {lang: ''}, title: ''};
  const context = {module: {exports: {}}, exports: {}, require: createRequire(import.meta.url), console, process, structuredClone,
    navigator: {languages: ['en-GB']}, document,
    window: {addEventListener: (name, listener) => listeners.set(name, listener)},
    localStorage: {getItem: key => {if(blocked)throw Error('blocked');return values.get(key)??null;}, setItem: (key, value) => {if(blocked)throw Error('blocked');values.set(key,value);}}};
  runInNewContext(bundle.outputFiles[0].text, context);
  return {api: context.module.exports, values, listeners, document};
}

test('switching languages preserves game data, translates screens and leaves chat untouched', async () => {
  const {api, values, listeners, document} = await runtime();
  for (const [locale, expected, draw] of [['en', 'Rummy', 'Draw face down'], ['cs', 'Žolíky', 'Dobrat zakrytou'], ['pl', 'Remik', 'Dobierz zakrytą']]) {
    api.setLocale(locale);
    const screens=api.renderAll();
    assert.equal(screens.name, expected);
    assert.match(screens.rummy, new RegExp(draw));
    assert.ok(screens.unchanged);
    assert.ok(screens.chat.includes('Nowa gra') && screens.chat.includes('Zamknij'));
    assert.equal(values.get('games:language'),locale);
    assert.equal(document.documentElement.lang,locale);
    assert.ok(screens.switch.includes('value="'+locale+'" lang="'+locale+'" selected=""'));
    assert.ok(!screens.pokerResult.includes(': null'));
    for (const html of [screens.geo,screens.rummy,screens.poker,screens.pokerResult,...screens.rules]) {
      assert.ok(!/\{\d+\}|undefined|\[object Object\]/.test(html));
    }
  }
  values.set('games:language','cs');listeners.get('storage')({key:'games:language'});
  assert.equal(api.getLocale(),'cs');assert.match(document.title,/Žolíky/);
  api.setLocale('de');assert.equal(api.getLocale(),'cs');
});

test('selection works when localStorage is unavailable', async () => {
  const {api,document} = await runtime({blocked:true});
  assert.equal(api.getLocale(),'en');api.setLocale('cs');
  assert.equal(api.getLocale(),'cs');assert.equal(document.documentElement.lang,'cs');
});

test('changing language does not key or remount the application or online table', async () => {
  const main=await readFile('src/main.tsx','utf8');
  assert.ok(main.includes('useLocale();'));
  assert.ok(!/key=\{(?:locale|language)/.test(main));
  assert.match(main, /OnlineTable key=\{routeParam\(\)\}/);
});

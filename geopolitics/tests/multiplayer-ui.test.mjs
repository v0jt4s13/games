import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';

test('Poker i Remik dla 3-4 graczy: stoly, nazwy, zakryte karty, wyniki', async () => {
  const result = await build({stdin: {resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import {renderToStaticMarkup as render} from 'react-dom/server';
    import Rummy from './src/RummyGame';
    import Poker from './src/PokerGame';
    import {OnlineContext} from './src/ui';
    import {newRummy} from './src/engines/rummy.mjs';
    import {newPoker, pokerApply} from './src/engines/poker.mjs';
    import {viewFor} from './server/views.mjs';
    import {setActorNames} from './src/engines/common.mjs';
    const props = {run: () => {}, setState: () => {}, paused: true};
    const screens = {};
    screens.pokerSetup = render(<Poker {...props}/>);
    screens.rummySetup = render(<Rummy {...props}/>);
    for (const n of [3, 4]) {
      screens['poker' + n] = render(<Poker {...props} state={newPoker(5, n)}/>);
      screens['rummy' + n] = render(<Rummy {...props} state={newRummy(5, n)}/>);
    }
    let fold = newPoker(9, 4); for (let i = 0; i < 3; i++) fold = pokerApply(fold, {type: 'fold'});
    screens.foldOut = render(<Poker {...props} state={fold}/>);
    // online: the view of seat 2 at a 4-player table, names in view order (me first)
    setActorNames(['Ala', 'Bartek', 'Celina', 'Darek']);
    const online = newPoker(3, 4), view = viewFor(online, 2);
    screens.onlinePoker = render(<OnlineContext.Provider value={{online: true, opponent: 'Darek', names: ['Celina', 'Darek', 'Ala', 'Bartek']}}><Poker {...props} state={view}/></OnlineContext.Provider>);
    const rummyView = viewFor(newRummy(3, 3), 1);
    screens.onlineRummy = render(<OnlineContext.Provider value={{online: true, opponent: 'Celina', names: ['Bartek', 'Celina', 'Ala']}}><Rummy {...props} state={rummyView}/></OnlineContext.Provider>);
    module.exports = screens;
  `}, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false});
  const context = {module: {exports: {}}, exports: {}, require: createRequire(import.meta.url), console, process, structuredClone};
  runInNewContext(result.outputFiles[0].text, context);
  const s = context.module.exports;
  const hidden = html => (html.match(/aria-label="Zakryta karta"/g) || []).length;

  assert.match(s.pokerSetup, /Liczba graczy/); assert.match(s.rummySetup, /Liczba graczy/);
  assert.match(s.pokerSetup, /Usiądź do stołu/); assert.match(s.rummySetup, /Rozdaj karty/);
  // local tables: every opponent is a computer with its own name and hidden cards
  assert.equal(hidden(s.poker3), 4); assert.equal(hidden(s.poker4), 6);
  for (const html of [s.poker3, s.poker4]) assert.match(html, /Komputer 2/);
  assert.match(s.poker4, /Komputer 3/); assert.ok(!/Komputer 3/.test(s.poker3));
  assert.match(s.poker4, /4 graczy/);
  assert.equal((s.rummy3.match(/class="player-line/g) || []).length, 2);
  assert.equal((s.rummy4.match(/class="player-line/g) || []).length, 3);
  assert.match(s.rummy4, /Tura 1 \/ 400/);
  // hand won by folds: pot goes to a named player, cards stay secret
  assert.match(s.foldOut, /Pula dla/); assert.match(s.foldOut, /Zakryte karty pozostają tajne/);
  assert.match(s.foldOut, /Wypłata: Ty \d+ · komputer \d+ · komputer 2 \d+ · komputer 3 \d+/);
  assert.match(s.foldOut, /Następne rozdanie/);
  // online views: real names in view order, other players' cards hidden
  for (const name of ['Darek', 'Ala', 'Bartek']) assert.match(s.onlinePoker, new RegExp(name));
  assert.ok(!/Komputer/.test(s.onlinePoker));
  assert.equal(hidden(s.onlinePoker), 6);
  assert.match(s.onlineRummy, /Celina/); assert.match(s.onlineRummy, /Ala/); assert.ok(!/Komputer/.test(s.onlineRummy));
  for (const html of Object.values(s)) { assert.ok(!html.includes('NaN')); assert.ok(!html.includes('[object Object]')); assert.ok(!html.includes('undefined')); }
});

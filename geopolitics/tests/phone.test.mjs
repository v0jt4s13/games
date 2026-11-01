import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';

test('Geopolitix na telefonie: plansza z samych grafik, statystyki w srodku, okno konca rundy', async () => {
  const result = await build({stdin: {resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import {renderToStaticMarkup as render} from 'react-dom/server';
    import Geo from './src/GeoGame';
    import {newGeo, geoApply} from './src/engines/geopolitix.mjs';
    globalThis.__GEOPOLITIX_ART__ = {};
    const props = {run: () => {}, setState: () => {}, paused: true};
    let s = geoApply(newGeo('europe', 5), {type: 'mulligan', ids: []});
    // play a few moves so that both boards have cards
    for (let i = 0; i < 6 && s.phase === 'play'; i++) {
      const hand = s.players[s.turn].hand.find(c => c.type === 'unit' && !c.effect);
      s = geoApply(s, hand ? {type: 'play', id: hand.id} : {type: 'pass'});
    }
    const cards = [0, 1].reduce((n, p) => n + Object.values(s.players[p].board).flat().length, 0);
    const names = [0, 1].flatMap(p => Object.values(s.players[p].board).flat()).map(c => c.name);
    const screens = {
      cards, names,
      mulligan: render(<Geo {...props} state={newGeo('europe', 5)}/>),
      play: render(<Geo {...props} state={s}/>),
      roundEnd: render(<Geo {...props} state={{...s, phase: 'roundEnd'}}/>),
      over: render(<Geo {...props} state={{...s, phase: 'over', winner: 0}}/>),
    };
    module.exports = screens;
  `}, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false});
  const phoneWindow = {matchMedia: () => ({matches: true, addEventListener() {}, removeEventListener() {}})};
  const run = window => { const context = {module: {exports: {}}, exports: {}, require: createRequire(import.meta.url), console, process, structuredClone, window}; runInNewContext(result.outputFiles[0].text, context); return context.module.exports; };
  const s = run(phoneWindow);

  // the board shows pictures only: one tile per card, no names or power numbers on it
  assert.ok(s.cards >= 4, 'test potrzebuje kart na planszy');
  assert.equal((s.play.match(/class="geo-tile /g) || []).length, s.cards);
  const board = s.play.slice(s.play.indexOf('geo-boards'), s.play.indexOf('geo-actionbar'));
  for (const name of s.names) assert.ok(!board.replace(/aria-label="[^"]*"/g, '').includes(name), `nazwa karty "${name}" na planszy`);
  // stats between the two boards: totals, round, wins, piles and row scores
  const stats = board.indexOf('geo-stats');
  assert.ok(board.indexOf('side-1') < stats && stats < board.indexOf('side-0'), 'statystyki maja byc miedzy planszami');
  for (const text of ['Runda 1', 'Ręka ', 'Talia ', 'Cm. ']) assert.ok(board.includes(text), text);
  // stats no longer list row scores or active effects; the row names sit on the board, on the right of each row
  for (const gone of ['Dypl.', 'Gosp.', 'Bezp.', 'stat-events']) assert.ok(!board.includes(gone), `${gone} zniknelo ze statystyk`);
  assert.equal((board.match(/class="geo-row-name"/g) || []).length, 6);
  for (const row of ['Dyplomacja', 'Gospodarka', 'Bezpieczeństwo']) assert.equal((board.match(new RegExp(`class="geo-row-name"[^>]*>${row}<`, 'g')) || []).length, 2, row);
  // a restored game does not glow: rows are marked only by a tactic played while the screen is open
  assert.ok(!s.play.includes('geo-row marked'));
  // one screen: no tactics column, hand section, round banner or log on the page; hand opens from the bar
  assert.ok(!s.play.includes('class="tactics"') && !s.play.includes('hand-section') && !s.play.includes('match-strip'));
  assert.match(s.play, /geo-actionbar"><button class="primary">Ręka <b>\d+<\/b>/);
  assert.match(s.play, /Pasuję do końca rundy/);
  // layers are closed during a normal move, the round-end window shows only at the end of a round
  assert.ok(!s.play.includes('geo-layer'));
  assert.ok(!s.play.includes('Następna runda'));
  assert.match(s.roundEnd, /geo-layer center[\s\S]*Runda zakończona: \d+ : \d+[\s\S]*Następna runda/);
  assert.match(s.over, /geo-layer center[\s\S]*Wygrywasz!/);
  assert.match(s.mulligan, /Wymiana kart <b>21<\/b>/);
  assert.ok(!s.mulligan.includes('Pasuję do końca rundy'));
  for (const html of [s.mulligan, s.play, s.roundEnd, s.over]) { assert.ok(!html.includes('NaN')); assert.ok(!html.includes('[object Object]')); }

  // on a wide screen nothing changes: the old desktop layout
  const wide = run({matchMedia: () => ({matches: false, addEventListener() {}, removeEventListener() {}})});
  assert.ok(!wide.play.includes('geo-phone-root') && wide.play.includes('class="tactics"') && wide.play.includes('hand-section'));
});

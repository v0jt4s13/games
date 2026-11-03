import {readdirSync} from 'node:fs';
import {join,extname} from 'node:path';
import {deckFor,factions} from '../src/data/geopolitix.mjs';
export const artworkExtensions=['.webp','.avif','.png','.jpg','.jpeg'];
export function collectCardArt(root='public/cards') {
 const result={};
 for(const faction of factions) {
  let files;try{files=readdirSync(join(root,faction),{withFileTypes:true}).filter(f=>f.isFile()).map(f=>f.name);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  const known=new Set(deckFor(faction,0).map(c=>c.key));
  files.sort((a,b)=>artworkExtensions.indexOf(extname(a).toLowerCase())-artworkExtensions.indexOf(extname(b).toLowerCase())||a.localeCompare(b));
  for(const file of files){const ext=extname(file),key=file.slice(0,-ext.length);if(!artworkExtensions.includes(ext.toLowerCase())||!known.has(key))continue;const id=`${faction}/${key}`;if(!result[id])result[id]=`./cards/${faction}/${encodeURIComponent(file)}`;}
 }
 return result;
}
export function cardArtScript(root) {return `globalThis.__GEOPOLITIX_ART__=${JSON.stringify(collectCardArt(root)).replaceAll('<','\\u003c')};`;}

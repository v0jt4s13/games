import { defineConfig } from 'vite';
import { cardArtScript } from './scripts/card-art.mjs';
import {join} from 'node:path';
let root=process.cwd();
export default defineConfig({base:'./', build:{target:'es2022'}, plugins:[{
 name:'geopolitix-card-art',
 configResolved(config){root=config.root;},
 transformIndexHtml(){return [{tag:'script',children:cardArtScript(join(root,'public/cards')),injectTo:'head-prepend'}];}
}]});

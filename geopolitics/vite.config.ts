import { defineConfig } from 'vite';
import { cardArtScript } from './scripts/card-art.mjs';
import {join} from 'node:path';
let root=process.cwd();
// Dev: the API lives in app_games/wsgi.py (python3 wsgi.py --port 8012); override with GAMES_API.
export default defineConfig({base:'./', build:{target:'es2022'}, server:{proxy:{'/api':{target:process.env.GAMES_API||'http://127.0.0.1:8012'}}}, plugins:[{
 name:'geopolitix-card-art',
 configResolved(config){root=config.root;},
 transformIndexHtml(){return [{tag:'script',children:cardArtScript(join(root,'public/cards')),injectTo:'head-prepend'}];}
}]});

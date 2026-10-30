export const DEFAULT_BACK_URL='https://assets-static.londynek.net/assets/images/logos/logo-londynek-no-bg-150x50.png';
export const BACKS_STORAGE='przy-stole-card-backs-v1';
export const defaultBacks=()=>({rummy:{url:DEFAULT_BACK_URL,fit:'contain'},poker:{url:DEFAULT_BACK_URL,fit:'contain'}});
export function validateBack(value) {
 const url=String(value?.url||'').trim();
 if(url){let parsed;try{parsed=new URL(url);}catch{throw new Error('Podaj pełny adres obrazka zaczynający się od https:// lub http://.');}
 if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('Dozwolone są adresy HTTP/HTTPS bez loginu i hasła.');}
 return {url,fit:value?.fit==='cover'?'cover':'contain'};
}
export function loadBacks(storage) {const defaults=defaultBacks();try{const saved=JSON.parse(storage.getItem(BACKS_STORAGE)||'{}');for(const game of ['rummy','poker']){try{if(saved[game])defaults[game]=validateBack(saved[game]);}catch{}}}catch{}return defaults;}

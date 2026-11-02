import {tr, useLocale, systemText} from "./i18n";
import LanguageSwitch from "./LanguageSwitch";
import React,{useState,useEffect,useRef,Component} from 'react';
import {createRoot} from 'react-dom/client';
import GeoGame from './GeoGame';
import RummyGame from './RummyGame';
import PokerGame from './PokerGame';
import {Icon,PlayingCard} from './ui';
import {Rules,gameInfo} from './rules';
import './style.css';
import CardBackSettings,{BackContext} from './CardBackSettings';
import {loadBacks,defaultBacks,BACKS_STORAGE} from './cardBacks.mjs';
import {startTrace,trackMove} from './trace.mjs';
import {OnlineHub,JoinPage} from './online/Hub';
import OnlineTable from './online/Table';
import {geoApply,geoBotAction} from './engines/geopolitix.mjs';
import {rummyApply,rummyBotAction} from './engines/rummy.mjs';
import {pokerApply,pokerBotAction} from './engines/poker.mjs';
const SAVE='przy-stole-v1';
function loadGames(){try{const data=JSON.parse(localStorage.getItem(SAVE)||'{}');return Object.fromEntries(['geo','rummy','poker'].filter(k=>{const s=data[k];const seats=k==='geo'?[2]:[2,3,4];return s&&s.version===1&&s.game===k&&Array.isArray(s.players)&&seats.includes(s.players.length)&&Array.isArray(s.log);}).map(k=>[k,data[k]]));}catch{return {};}}
function readRoute(){const h=location.hash.slice(1);if(h==='online')return 'online';if(h.startsWith('stol/'))return 'table';if(h.startsWith('dolacz/'))return 'join';return ({geopolitix:'geo',remik:'rummy',poker:'poker'} as any)[h]||'home';}
const routeParam=()=>{try{return decodeURIComponent(location.hash.slice(1).split('/').slice(1).join('/'));}catch{return '';}};
const slugs:any={geo:'geopolitix',rummy:'remik',poker:'poker'};
function Dialog({title,onClose,children}:any){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}} aria-labelledby="dialog-heading"><div className="dialog-header"><h2 id="dialog-heading">{title}</h2><button className="icon-button" aria-label={tr("Zamknij")} onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;}
class ErrorBoundary extends Component<any,any>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<section className="error-screen"><h2>{tr("Nie udało się odczytać tej rozgrywki.")}</h2><p>{tr("Możesz rozpocząć nową grę, aby wrócić do stołu.")}</p><button className="primary" onClick={()=>{this.props.reset();this.setState({error:false});}}>{tr("Rozpocznij od nowa")}</button></section>:this.props.children;}}
function App(){
 useLocale();
 const [backSettings,setBackSettings]=useState(()=>{try{return loadBacks(localStorage);}catch{return defaultBacks();}}),[showBacks,setShowBacks]=useState(false),[botPaused,setBotPaused]=useState(false),[backError,setBackError]=useState('');
 function saveBacks(value:any){setBackSettings(value);try{localStorage.setItem(BACKS_STORAGE,JSON.stringify(value));setBackError('');return true;}catch{setBackError(tr("Rewers zmieniony na tę sesję, ale nie udało się zapisać ustawień w przeglądarce."));return false;}}

 const [route,setRoute]=useState(readRoute),[games,setGames]=useState<any>(loadGames),[theme,setTheme]=useState(()=>document.documentElement.dataset.theme||'auto'),[rules,setRules]=useState<string|null>(null),[reset,setReset]=useState(false),[error,setError]=useState(''),[storageWarning,setStorageWarning]=useState('');
 useEffect(()=>{const change=()=>{setRoute(readRoute());setError('');setRules(null);setReset(false);window.scrollTo(0,0);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{try{localStorage.setItem(SAVE,JSON.stringify(games));setStorageWarning('');}catch{setStorageWarning(tr("Zapis lokalny jest niedostępny. Możesz grać, ale odświeżenie strony usunie postęp."));}},[games]);
 function cycleTheme(){const next=({auto:'light',light:'dark',dark:'auto'} as any)[theme];setTheme(next);if(next==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=next;try{localStorage.setItem('cards-theme',next);}catch{}}
 const setGame=(next:any)=>setGames((old:any)=>({...old,[route]:next&&!next.trace?startTrace(next):next}));
 const run=(fn:any)=>{try{const next=fn();setGame(next);setError('');return true;}catch(e:any){setError(e.message||'Ruch nie powiódł się. Spróbuj ponownie.');return false;}};
 const enter=(game:string)=>{location.hash=slugs[game];};
 const hasSave=(game:string)=>games[game]&&games[game].phase!=='over';
 const launchLabel=(game:string)=>hasSave(game)?tr("Wznów grę"):tr("Zagraj");
 const Current=route==='geo'?GeoGame:route==='rummy'?RummyGame:PokerGame;
 const engine:any={geo:[geoApply,geoBotAction],rummy:[rummyApply,rummyBotAction],poker:[pokerApply,pokerBotAction]};
 const canStep=games[route]?.turn>0&&['play','draw'].includes(games[route]?.phase);
 const stepBot=()=>run(()=>trackMove(games[route],engine[route][1](games[route]),engine[route][0]));
 return <BackContext.Provider value={backSettings}>
 <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>{tr("Przejdź do treści")}</a>
 <header className={`site-header ${route==='geo'?'compact':''}`}><a href="#" className="brand" aria-label={tr("Przy stole - wybór gry")}><span className="brand-mark"><Icon name="cards" size={25}/></span><span>{tr("Przy stole")}<span className="brand-sub">{tr("Dobra partia. W dobrym miejscu.")}</span></span></a><div className="header-actions"><LanguageSwitch/><button onClick={()=>setShowBacks(true)}><Icon name="cards"/><span>{tr("Rewersy")}</span></button>{['geo','rummy','poker'].includes(route)&&<button onClick={()=>setRules(route)}><Icon name="help"/><span>{tr("Zasady")}</span></button>}<button className="theme-switch" onClick={cycleTheme} aria-label={tr("Motyw: {0}. Zmień motyw.", [tr(({auto:'Auto',light:'Jasny',dark:'Ciemny'} as any)[theme])])}><Icon name={theme==='light'?'sun':theme==='dark'?'moon':'auto'}/><span>{({auto:'Auto',light:tr("Jasny"),dark:tr("Ciemny")} as any)[theme]}</span></button></div></header>
 <main id="main-content" tabIndex={-1} className={route==='geo'?'geo-route':''}>
 {storageWarning&&<div role="status" className="notice">{systemText(storageWarning)}</div>}
 {route==='online'?<OnlineHub/>:route==='table'?<OnlineTable key={routeParam()} id={routeParam()} onRules={setRules}/>:route==='join'?<JoinPage code={routeParam()}/>:route==='home'?<>
 <section className="lobby-intro"><div><h1>{tr("Znajdź swoją")}<br/><em>{tr("następną partię.")}</em></h1><p>{tr("Wielka strategia czy klasyczna talia?")}<br/>{tr("Wybierz swój stół. Komputer już czeka.")}</p></div><div className="lobby-note"><span className="online-dot"/>{tr("Graj we własnym tempie")}<span>{tr("Postęp zapisuje się na tym urządzeniu.")}</span></div></section>
 <section className="online-promo"><div><h2>{tr("Zagraj z kimś przy jednym stole")}</h2><p>{tr("Zaproś znajomego linkiem albo dodaj SI. Rozmowa tekstowa w komplecie.")}</p></div><a className="primary button-link" href="#online">{tr("Stół online ")}<Icon name="arrow"/></a></section>
 <div className="game-library"><article className="featured-game"><div className="cover-wrap"><img src="./geopolitix-cover.webp" alt={tr("Geopolitix: światowi przywódcy nad mapą świata")} width="768" height="1152" fetchPriority="high"/></div><div className="featured-copy"><div className="genre"><Icon name="globe"/>{tr("Strategia geopolityczna")}</div><h2>Geopolitix</h2><p>{tr("Sojusze mają swoją cenę.")}<br/>{tr("Każda karta zmienia układ sił.")}</p><ul className="game-facts"><li>{tr("Europe kontra North America")}</li><li>{tr("50 kart we frakcji")}</li><li>{tr("Do dwóch wygranych rund")}</li></ul><div className="featured-bottom"><button className="primary" onClick={()=>enter('geo')}>{launchLabel('geo')} <Icon name="arrow"/></button><button className="text-button" onClick={()=>setRules('geo')}>{tr("Poznaj zasady")}</button></div>{hasSave('geo')&&<small className="save-label">{tr("Zapisana partia · runda ")}{games.geo.round}</small>}</div></article>
 <div className="classic-games"><article className="classic-game rummy-tile"><div className="classic-top"><span>{tr("Klasyka układania")}</span><div className="mini-deck" aria-hidden="true">{[7,8,9].map(rank=><PlayingCard key={rank} card={{rank,suit:'H'}} small/>)}</div></div><h2>{tr("Remik")}</h2><p>{tr("Znajdź sekwencję. Ułóż plan.")}<br/>{tr("Wyłóż ostatnią kartę.")}</p><div className="tile-meta">{tr("2-4 graczy · 2 talie · próg 51 punktów")}</div><div className="tile-actions"><button className="primary" onClick={()=>enter('rummy')}>{launchLabel('rummy')} <Icon name="arrow"/></button><button className="text-button" onClick={()=>setRules('rummy')}>{tr("Zasady")}</button></div></article>
 <article className="classic-game poker-tile"><div className="classic-top"><span>Texas Hold’em</span><div className="mini-deck" aria-hidden="true"><PlayingCard card={{rank:1,suit:'S'}} small/><PlayingCard card={{rank:1,suit:'D'}} small/></div></div><h2>Poker</h2><p>{tr("Nie każda dobra decyzja")}<br/>{tr("zaczyna się od dobrej ręki.")}</p><div className="tile-meta">{tr("2-4 graczy · 1 000 żetonów · blindy 10 / 20")}</div><div className="tile-actions"><button className="primary" onClick={()=>enter('poker')}>{launchLabel('poker')} <Icon name="arrow"/></button><button className="text-button" onClick={()=>setRules('poker')}>{tr("Zasady")}</button></div></article></div>
 <article className="classic-game aetherii-tile"><img className="tile-cover" src="./aetherii-header.webp" alt="" width="1600" height="600" loading="lazy" decoding="async"/><h2>{tr("Kroniki Aetherii")}</h2><p>{tr("Buduj Strażnice, handluj surowcami i broń krainy przed najazdami. Rywalizuj o koronę, współpracując we wspólnej obronie.")}</p><div className="tile-meta">{tr("2-4 graczy · 4 frakcje · gra z SI lub znajomymi online")}</div><div className="tile-actions"><a className="primary button-link" href="/kroniki-aetherii/">{tr("Przejdź do Kronik Aetherii ")}<Icon name="arrow"/></a></div></article>
 </div><section className="lobby-footer"><span><Icon name="shield"/>{tr("Bez prawdziwych pieniędzy.")}</span><span>{tr("Cztery gry. Wybierz swoją.")}</span></section>
 </>:<><div className="game-heading"><div><a href="#" className="back-link"><Icon name="back"/>{tr("Wszystkie gry")}</a><h1>{gameInfo[route].name}</h1></div><button onClick={()=>setReset(true)} disabled={!games[route]}>{tr("Nowa gra")}</button></div>{error&&<div className="notice error" role="alert">{systemText(error)}<button onClick={()=>setError('')}>{tr("Zamknij komunikat")}</button></div>}
 <section className="test-controls" aria-label={tr("Sterowanie testowe")}><div><strong>{tr("Tryb testowy")}</strong><span>{botPaused?tr("Komputer czeka na pojedynczy ruch."):tr("Komputer wykonuje ruchy automatycznie.")}</span></div><button aria-pressed={botPaused} onClick={()=>setBotPaused(p=>!p)}>{botPaused?tr("Wznów komputer"):tr("Pauza komputera")}</button><button disabled={!botPaused||!canStep||!!rules||showBacks} onClick={stepBot}>{tr("Wykonaj jeden ruch komputera")}</button></section>
 <ErrorBoundary key={route} reset={()=>setGame(null)}><Current key={`${route}-${games[route]?'playing':'setup'}`} state={games[route]} setState={setGame} run={run} paused={!!rules||reset||showBacks||botPaused}/></ErrorBoundary>
 <div className="game-footer"><button className="text-button" onClick={()=>setRules(route)}>{tr("Zasady tej wersji")}</button><span>{tr("Gra lokalna przeciw komputerowi · automatyczny zapis")}</span></div></>}
 </main>
 {showBacks&&<Dialog title={tr("Rewersy kart")} onClose={()=>setShowBacks(false)}><CardBackSettings value={backSettings} onSave={saveBacks}/>{backError&&<p role="alert">{systemText(backError)}</p>}</Dialog>}
 {rules&&<Dialog title={tr("Jak grać: {0}", [gameInfo[rules].name])} onClose={()=>setRules(null)}><Rules game={rules}/></Dialog>}
 {reset&&<Dialog title={tr("Rozpocząć nową grę?")} onClose={()=>setReset(false)}><p>{tr("Bieżący zapis gry ")}{gameInfo[route].name}{tr(" zostanie zastąpiony. Zapisy pozostałych gier zostaną zachowane.")}</p><div className="action-row"><button onClick={()=>setReset(false)}>{tr("Wróć do partii")}</button><button className="primary" onClick={()=>{setGame(null);setReset(false);setError('');}}>{tr("Rozpocznij nową grę")}</button></div></Dialog>}
 </BackContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<App/>);

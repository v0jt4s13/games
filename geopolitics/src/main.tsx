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
import {geoApply,geoBotAction} from './engines/geopolitix.mjs';
import {rummyApply,rummyBotAction} from './engines/rummy.mjs';
import {pokerApply,pokerBotAction} from './engines/poker.mjs';
const SAVE='przy-stole-v1';
function loadGames(){try{const data=JSON.parse(localStorage.getItem(SAVE)||'{}');return Object.fromEntries(['geo','rummy','poker'].filter(k=>{const s=data[k];return s&&s.version===1&&s.game===k&&Array.isArray(s.players)&&s.players.length===2&&Array.isArray(s.log);}).map(k=>[k,data[k]]));}catch{return {};}}
function readRoute(){return ({geopolitix:'geo',remik:'rummy',poker:'poker'} as any)[location.hash.slice(1)]||'home';}
const slugs:any={geo:'geopolitix',rummy:'remik',poker:'poker'};
function Dialog({title,onClose,children}:any){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}} aria-labelledby="dialog-heading"><div className="dialog-header"><h2 id="dialog-heading">{title}</h2><button className="icon-button" aria-label="Zamknij" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;}
class ErrorBoundary extends Component<any,any>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<section className="error-screen"><h2>Nie udało się odczytać tej rozgrywki.</h2><p>Możesz rozpocząć nową grę, aby wrócić do stołu.</p><button className="primary" onClick={()=>{this.props.reset();this.setState({error:false});}}>Rozpocznij od nowa</button></section>:this.props.children;}}
function App(){
 const [backSettings,setBackSettings]=useState(()=>{try{return loadBacks(localStorage);}catch{return defaultBacks();}}),[showBacks,setShowBacks]=useState(false),[botPaused,setBotPaused]=useState(false),[backError,setBackError]=useState('');
 function saveBacks(value:any){setBackSettings(value);try{localStorage.setItem(BACKS_STORAGE,JSON.stringify(value));setBackError('');return true;}catch{setBackError('Rewers zmieniony na tę sesję, ale nie udało się zapisać ustawień w przeglądarce.');return false;}}

 const [route,setRoute]=useState(readRoute),[games,setGames]=useState<any>(loadGames),[theme,setTheme]=useState(()=>document.documentElement.dataset.theme||'auto'),[rules,setRules]=useState<string|null>(null),[reset,setReset]=useState(false),[error,setError]=useState(''),[storageWarning,setStorageWarning]=useState('');
 useEffect(()=>{const change=()=>{setRoute(readRoute());setError('');setRules(null);setReset(false);window.scrollTo(0,0);};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{try{localStorage.setItem(SAVE,JSON.stringify(games));setStorageWarning('');}catch{setStorageWarning('Zapis lokalny jest niedostępny. Możesz grać, ale odświeżenie strony usunie postęp.');}},[games]);
 function cycleTheme(){const next=({auto:'light',light:'dark',dark:'auto'} as any)[theme];setTheme(next);if(next==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=next;try{localStorage.setItem('cards-theme',next);}catch{}}
 const setGame=(next:any)=>setGames((old:any)=>({...old,[route]:next&&!next.trace?startTrace(next):next}));
 const run=(fn:any)=>{try{const next=fn();setGame(next);setError('');return true;}catch(e:any){setError(e.message||'Ruch nie powiódł się. Spróbuj ponownie.');return false;}};
 const enter=(game:string)=>{location.hash=slugs[game];};
 const hasSave=(game:string)=>games[game]&&games[game].phase!=='over';
 const launchLabel=(game:string)=>hasSave(game)?'Wznów grę':'Zagraj';
 const Current=route==='geo'?GeoGame:route==='rummy'?RummyGame:PokerGame;
 const engine:any={geo:[geoApply,geoBotAction],rummy:[rummyApply,rummyBotAction],poker:[pokerApply,pokerBotAction]};
 const canStep=games[route]?.turn===1&&['play','draw'].includes(games[route]?.phase);
 const stepBot=()=>run(()=>trackMove(games[route],engine[route][1](games[route]),engine[route][0]));
 return <BackContext.Provider value={backSettings}>
 <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();}}>Przejdź do treści</a>
 <header className="site-header"><a href="#" className="brand" aria-label="Przy stole - wybór gry"><span className="brand-mark"><Icon name="cards" size={25}/></span><span>Przy stole<span className="brand-sub">Dobra partia. W dobrym miejscu.</span></span></a><div className="header-actions"><button onClick={()=>setShowBacks(true)}><Icon name="cards"/><span>Rewersy</span></button>{route!=='home'&&<button onClick={()=>setRules(route)}><Icon name="help"/><span>Zasady</span></button>}<button className="theme-switch" onClick={cycleTheme} aria-label={`Motyw: ${({auto:'Auto',light:'Jasny',dark:'Ciemny'} as any)[theme]}. Zmień motyw.`}><Icon name={theme==='light'?'sun':theme==='dark'?'moon':'auto'}/><span>{({auto:'Auto',light:'Jasny',dark:'Ciemny'} as any)[theme]}</span></button></div></header>
 <main id="main-content" tabIndex={-1}>
 {storageWarning&&<div role="status" className="notice">{storageWarning}</div>}
 {route==='home'?<>
 <section className="lobby-intro"><div><h1>Znajdź swoją<br/><em>następną partię.</em></h1><p>Wielka strategia czy klasyczna talia?<br/>Wybierz swój stół. Komputer już czeka.</p></div><div className="lobby-note"><span className="online-dot"/>Graj we własnym tempie<span>Postęp zapisuje się na tym urządzeniu.</span></div></section>
 <div className="game-library"><article className="featured-game"><div className="cover-wrap"><img src="./geopolitix-cover.webp" alt="Geopolitix: światowi przywódcy nad mapą świata" width="768" height="1152" fetchPriority="high"/></div><div className="featured-copy"><div className="genre"><Icon name="globe"/>Strategia geopolityczna</div><h2>Geopolitix</h2><p>Sojusze mają swoją cenę.<br/>Każda karta zmienia układ sił.</p><ul className="game-facts"><li>Europe kontra North America</li><li>50 kart we frakcji</li><li>Do dwóch wygranych rund</li></ul><div className="featured-bottom"><button className="primary" onClick={()=>enter('geo')}>{launchLabel('geo')} <Icon name="arrow"/></button><button className="text-button" onClick={()=>setRules('geo')}>Poznaj zasady</button></div>{hasSave('geo')&&<small className="save-label">Zapisana partia · runda {games.geo.round}</small>}</div></article>
 <div className="classic-games"><article className="classic-game rummy-tile"><div className="classic-top"><span>Klasyka układania</span><div className="mini-deck" aria-hidden="true">{[7,8,9].map(rank=><PlayingCard key={rank} card={{rank,suit:'H'}} small/>)}</div></div><h2>Remik</h2><p>Znajdź sekwencję. Ułóż plan.<br/>Wyłóż ostatnią kartę.</p><div className="tile-meta">2 talie · próg 51 punktów</div><div className="tile-actions"><button className="primary" onClick={()=>enter('rummy')}>{launchLabel('rummy')} <Icon name="arrow"/></button><button className="text-button" onClick={()=>setRules('rummy')}>Zasady</button></div></article>
 <article className="classic-game poker-tile"><div className="classic-top"><span>Texas Hold’em</span><div className="mini-deck" aria-hidden="true"><PlayingCard card={{rank:1,suit:'S'}} small/><PlayingCard card={{rank:1,suit:'D'}} small/></div></div><h2>Poker</h2><p>Nie każda dobra decyzja<br/>zaczyna się od dobrej ręki.</p><div className="tile-meta">1 000 żetonów · blindy 10 / 20</div><div className="tile-actions"><button className="primary" onClick={()=>enter('poker')}>{launchLabel('poker')} <Icon name="arrow"/></button><button className="text-button" onClick={()=>setRules('poker')}>Zasady</button></div></article></div>
 </div><section className="lobby-footer"><span><Icon name="shield"/>Bez konta. Bez prawdziwych pieniędzy.</span><span>Trzy gry. Jeden stół.</span></section>
 </>:<><div className="game-heading"><div><a href="#" className="back-link"><Icon name="back"/>Wszystkie gry</a><h1>{gameInfo[route].name}</h1></div><button onClick={()=>setReset(true)} disabled={!games[route]}>Nowa gra</button></div>{error&&<div className="notice error" role="alert">{error}<button onClick={()=>setError('')}>Zamknij komunikat</button></div>}
 <section className="test-controls" aria-label="Sterowanie testowe"><div><strong>Tryb testowy</strong><span>{botPaused?'Komputer czeka na pojedynczy ruch.':'Komputer wykonuje ruchy automatycznie.'}</span></div><button aria-pressed={botPaused} onClick={()=>setBotPaused(p=>!p)}>{botPaused?'Wznów komputer':'Pauza komputera'}</button><button disabled={!botPaused||!canStep||!!rules||showBacks} onClick={stepBot}>Wykonaj jeden ruch komputera</button></section>
 <ErrorBoundary key={route} reset={()=>setGame(null)}><Current key={`${route}-${games[route]?'playing':'setup'}`} state={games[route]} setState={setGame} run={run} paused={!!rules||reset||showBacks||botPaused}/></ErrorBoundary>
 <div className="game-footer"><button className="text-button" onClick={()=>setRules(route)}>Zasady tej wersji</button><span>Gra lokalna przeciw komputerowi · automatyczny zapis</span></div></>}
 </main>
 {showBacks&&<Dialog title="Rewersy kart" onClose={()=>setShowBacks(false)}><CardBackSettings value={backSettings} onSave={saveBacks}/>{backError&&<p role="alert">{backError}</p>}</Dialog>}
 {rules&&<Dialog title={`Jak grać: ${gameInfo[rules].name}`} onClose={()=>setRules(null)}><Rules game={rules}/></Dialog>}
 {reset&&<Dialog title="Rozpocząć nową grę?" onClose={()=>setReset(false)}><p>Bieżący zapis gry {gameInfo[route].name} zostanie zastąpiony. Zapisy pozostałych gier zostaną zachowane.</p><div className="action-row"><button onClick={()=>setReset(false)}>Wróć do partii</button><button className="primary" onClick={()=>{setGame(null);setReset(false);setError('');}}>Rozpocznij nową grę</button></div></Dialog>}
 </BackContext.Provider>;
}
createRoot(document.getElementById('root')!).render(<App/>);

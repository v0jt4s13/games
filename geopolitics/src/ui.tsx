import {tr, systemText} from "./i18n";
import React from 'react';
// Online tables: names of the other player and a plain game log (the detailed test log is local-only).
export const OnlineContext=React.createContext<any>({online:false,opponent:tr("Komputer"),names:null});
export const useOnline=()=>React.useContext(OnlineContext);
// Name of the player at seat `i` (0 = me; the others follow in table order). Local games: Ty, Komputer, Komputer 2...
export function useSeatName(){const {names}=useOnline();return (i:number,lower=false)=>names?names[i]:i===0?tr("Ty"):lower?(i===1?tr("komputer"):tr("komputer {0}", [i])):(i===1?tr("Komputer"):tr("Komputer {0}", [i]));}
export function PlayerCount({value,onChange,max=4}:any) {
 return <fieldset className="player-count"><legend>{tr("Liczba graczy")}</legend>{Array.from({length:max-1},(_,k)=>k+2).map(n=><label className="faction-choice" key={n}><input type="radio" name="player-count" checked={value===n} onChange={()=>onChange(n)}/><span><strong>{n===2?tr("2 graczy"):tr("{0} graczy", [n])}</strong><small>{n===2?tr("Ty i komputer"):tr("Ty i {0} {1}", [n-1, n===2?tr("komputer"):tr("komputery")])}</small></span></label>)}</fieldset>;
}
import {CardBackImage} from './CardBackSettings';
import TraceLog from './TraceLog';
import {cardLabel,rankLabel,suitSymbol} from './engines/common.mjs';
export function Icon({name,size=20}:{name:string,size?:number}) {
 const paths:any={arrow:<><path d="m9 5 7 7-7 7M4 12h12"/></>,back:<path d="m14 6-6 6 6 6M8 12h12"/>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,moon:<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>,auto:<><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></>,cards:<><rect x="4" y="5" width="11" height="16" rx="2"/><path d="m9 4 9-2 3 16-4 1M8 10h3m-3 4h3"/></>,close:<path d="m6 6 12 12M6 18 18 6"/>,help:<><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1"/></>,shield:<><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/></>,globe:<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></>};
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.cards}</svg>;
}
export function PlayingCard({card,hidden=false,selected=false,onClick,small=false,disabled=false,backGame='poker'}:any) {
 const cls=`playing-card ${small?'small':''} ${hidden?'card-back':''} ${selected?'selected':''} ${card&&['H','D'].includes(card.suit)?'red':''}`;
 const content=hidden?<CardBackImage game={backGame}/>:<><span className="card-corner">{rankLabel(card.rank)}<small>{suitSymbol[card.suit]}</small></span><span className="card-suit" aria-hidden="true">{suitSymbol[card.suit]}</span><span className="card-bottom" aria-hidden="true">{rankLabel(card.rank)}</span></>;
 return onClick?<button className={cls} aria-label={cardLabel(card)} aria-pressed={selected} onClick={onClick} disabled={disabled}>{content}</button>:<div className={cls} aria-label={hidden?tr("Zakryta karta"):cardLabel(card)} role="img">{content}</div>;
}
export function CardBacks({count,game='rummy'}:any) {return <div className="opponent-hand" aria-label={`${count} kart przeciwnika`}>{Array.from({length:Math.min(count,7)},(_,i)=><PlayingCard key={i} hidden small backGame={game}/>)}<span className="hand-count">{count}{tr(" kart")}</span></div>;}
export function GameLog({state}:any) {
 const {online,names}=useOnline();
 if(online)return <details className="game-log" open><summary>{tr("Przebieg gry ")}<span>{state.log.length}{tr(" ostatnich komunikatów")}</span></summary><ol className="online-log">{[...state.log].reverse().map((line:string,i:number)=><li key={i}>{systemText(line,names||[])}</li>)}</ol></details>;
 return <TraceLog state={state}/>;
}
export function Outcome({winner,children,players=2}:any) {const {online}=useOnline(),name=useSeatName();return <section className="outcome" aria-live="polite"><Icon name="shield" size={28}/><div><h2>{winner===0?tr("Wygrywasz!"):winner>0?(online||players>2?tr("Wygrywa {0}.", [name(winner)]):tr("Tym razem komputer.")):tr("Remis.")}</h2>{children}</div></section>;}
export function TurnBadge({bot,text,who}:any) {const {online,opponent}=useOnline();return <span className={`turn-badge ${bot?'bot':''}`} role="status"><i/>{text||(bot?tr("{0} myśli…", [who||(online?opponent:tr("Komputer"))]):tr("Twój ruch"))}</span>;}

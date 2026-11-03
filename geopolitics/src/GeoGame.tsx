import {tr, localizedLabels, cardDescription} from "./i18n";
import {trackMove} from './trace.mjs';
import {cardArtUrl} from './cardArt.mjs';
import React,{useState,useEffect,useRef} from 'react';
import {newGeo,geoApply,geoBotAction,geoActions,geoTotals,geoScores,geoPower} from './engines/geopolitix.mjs';
import {rows,rowLabels as rawRows,factionLabels as rawFactions,factions} from './data/geopolitix.mjs';
const rowLabels=localizedLabels(rawRows),factionLabels=localizedLabels(rawFactions);
import {Icon,GameLog,Outcome,TurnBadge,useOnline} from './ui';
import {usePhone,useFillHeight,Layer,GeoTile} from './phone';
function GeoArtPreview({card}:any) {
 const url=cardArtUrl(card),[failed,setFailed]=useState<string|null>(null);
 return url&&failed!==url?<img className="geo-art-preview" src={url} alt={tr("Ilustracja: {0}", [tr(card.name)])} onError={()=>setFailed(url)}/>:null;
}
export function GeoCard({card,onClick,selected,power,compact}:any) {
 const url=cardArtUrl(card),[failed,setFailed]=useState<string|null>(null),hasArt=!!url&&failed!==url;
 const category=card.hero?tr("Lider"):card.type==='unit'?(card.muster?tr("Seria"):tr("Postać")):card.type==='event'?tr("Wydarzenie"):tr("Specjalna");
 const row=typeof card.row==='string'?rowLabels[card.row]:card.type==='event'?tr("Cel: rząd rywala"):tr(tr("Taktyka"));
 const strength=card.power?power??card.power:<Icon name="globe" size={18}/>;
 return <button className={`geo-card ${card.faction} ${selected?'selected':''} ${compact?'compact':''} ${card.hero?'hero-card':''} ${hasArt?'has-art':''}`} onClick={onClick} aria-pressed={selected} title={`${tr(card.name)} · ${category} · ${row}`} aria-label={tr("{0}, siła {1}. {2}. {3}. {4}", [tr(card.name), power??card.power, category, row, cardDescription(card.desc)])}>
 {hasArt?<>
 <span className="geo-art"><img src={url} alt="" loading="lazy" decoding="async" onError={()=>setFailed(url)}/></span>
 <span className="geo-card-caption"><b className="geo-power">{strength}</b><strong>{tr(card.name)}</strong></span>
 </>:<>
 <span className="geo-card-top"><b>{strength}</b><span>{category.toUpperCase()}</span></span>
 {!compact&&<div className="geo-emblem"><Icon name={card.type==='event'?'globe':card.hero?'shield':'cards'} size={34}/></div>}
 <strong>{tr(card.name)}</strong>{!compact&&<small>{row}</small>}
 </>}
 </button>;
}
export default function GeoGame({state,setState,run,paused}:any) {
 const {online,opponent}=useOnline();
 const [faction,setFaction]=useState('europe'),[oppFaction,setOppFaction]=useState('random'),[selected,setSelected]=useState<string|null>(null),[exchange,setExchange]=useState<string[]>([]),[inspect,setInspect]=useState<any>(null),phone=usePhone(),fillRef=useFillHeight(phone),[handOpen,setHandOpen]=useState(false),[seenOver,setSeenOver]=useState(false);
 useEffect(()=>{if(state?.phase==='mulligan'&&!state.mulliganDone?.[0])setHandOpen(true);},[state?.phase]);
 // Rows touched by the last tactic card (state.lastPlay from the engine) glow for a few seconds. A game restored from a save does not.
 const playKey=state?.lastPlay?`${state.lastPlay.id}@${state.lastPlay.at}`:'',seenPlay=useRef<string|null>(null),[marks,setMarks]=useState<any>(null);
 useEffect(()=>{if(seenPlay.current===null){seenPlay.current=playKey;return;}if(!playKey){setMarks(null);return;}if(playKey===seenPlay.current)return;seenPlay.current=playKey;setMarks({rows:state.lastPlay.rows.map(([p,r]:any)=>`${p}:${r}`)});const id=setTimeout(()=>setMarks(null),4500);return()=>clearTimeout(id);},[playKey]);
 useEffect(()=>{if(state?.phase==='play'&&state.turn===1&&!paused&&!online){const id=setTimeout(()=>run(()=>{setSelected(null);return trackMove(state,geoBotAction(state),geoApply);}),650);return()=>clearTimeout(id);}},[state,paused]);
 if(!state)return <div className="setup geo-setup"><img src="./geopolitix-cover.webp" alt={tr("Ilustracja Geopolitix: światowi przywódcy i mapa świata")}/><div><h2>{tr("Świat jest Twoim stołem.")}</h2><p>{tr("Wybierz frakcję. Zachowaj karty na kolejne rundy, wykorzystaj serie i uderz w słabości rywala.")}</p><fieldset><legend>{tr("Twoja frakcja")}</legend>{factions.map(f=><label className="faction-choice" key={f}><input type="radio" name="faction" checked={faction===f} onChange={()=>setFaction(f)}/><span><strong>{factionLabels[f]}</strong><small>{tr("50 kart · ")}{({europe:tr("Koalicje, dyplomacja, Blackout"),america:tr("Serie, technologia, Tornado"),asia:tr("Technologia, serie, Blackout"),africa:tr("Technologia, serie, Powódź"),south_america:tr("Technologia, serie, Trzęsienie ziemi")} as any)[f]}</small></span></label>)}</fieldset><fieldset><legend>{tr("Przeciwnik komputerowy")}</legend>{['random',...factions.filter(f=>f!==faction)].map(f=><label className="faction-choice" key={f}><input type="radio" name="opponent" checked={oppFaction===f||(f==='random'&&(!factions.includes(oppFaction)||oppFaction===faction))} onChange={()=>setOppFaction(f)}/><span><strong>{f==='random'?tr("Losowy"):factionLabels[f]}</strong></span></label>)}</fieldset><p className="muted">{tr("2 graczy · do dwóch wygranych rund · przeciwnik komputerowy")}</p><button className="primary" onClick={()=>{const others=factions.filter(f=>f!==faction),opp=others.includes(oppFaction)?oppFaction:others[Math.floor(Math.random()*others.length)];setState(newGeo(faction,undefined,opp));}}>{tr("Rozdaj 21 kart ")}<Icon name="arrow"/></button></div></div>;
 const totals=geoTotals(state),scores=geoScores(state),hand=state.players[0].hand;
 const current=hand.find(c=>c.id===selected),actions=current?geoActions(state,0).filter(a=>a.id===selected):[];
 const viewed=current||inspect;
 function act(a:any){run(()=>trackMove(state,a,geoApply));setSelected(null);setInspect(null);setHandOpen(false);}
 const choose=(c:any)=>{if(state.phase==='mulligan'){setExchange(old=>old.includes(c.id)?old.filter(id=>id!==c.id):old.length<3?[...old,c.id]:old);}else{setSelected(c.id===selected?null:c.id);setInspect(null);}};
 const actionLabel=(a:any)=>{const target=rows.flatMap(r=>state.players[0].board[r]).find(c=>c.id===a.target);return target?`${tr(target.name)}${a.row?' → '+rowLabels[a.row]:''}`:a.row?tr('{0} rywala', [rowLabels[a.row]]):tr("Zagraj kartę");};

 if(phone) {
  const order=(p:number)=>p===1?[...rows].reverse():rows,name=(p:number)=>p===0?tr("Ty"):(online?opponent:tr("Komputer"));
  const where=(card:any)=>{for(const p of [0,1])for(const r of rows)if(state.players[p].board[r].some((x:any)=>x.id===card.id))return {p,r};return null;};
  const mulligan=state.phase==='mulligan',playable=state.phase==='play',myTurn=playable&&state.turn===0;
  const details=(card:any)=>{const at=where(card);return <><div className="geo-detail"><GeoArtPreview key={card.id} card={card}/><div className="geo-detail-info"><div className="selected-name"><strong>{tr(card.name)}</strong><span>{card.power?tr("{0} siły bazowej", [card.power]):tr("Karta taktyczna")} · {Array.isArray(card.row)?card.row.map((r:string)=>rowLabels[r]).join(' / '):rowLabels[card.row]||tr("Taktyka")}{card.hero?tr(" · Lider"):card.muster?tr(" · Seria"):''}</span></div>{at&&<p className="geo-detail-power"><b>{tr("Siła teraz: ")}{geoPower(state,at.p,at.r,card)}</b> · {at.p===0?tr("Twoja plansza"):tr("Plansza rywala")}, {rowLabels[at.r]}{card.protected?tr(" · ochrona"):''}{card.sanction?tr(" · sankcje"):''}</p>}</div></div><p className="geo-detail-desc">{cardDescription(card.desc)}</p></>;};
  const board=(p:number)=><section className={`geo-side felt side-${p}`} aria-label={p===0?tr("Twoja plansza"):(online?tr("Plansza: {0}", [opponent]):tr("Plansza komputera"))}>{order(p).map(row=>{const cards=state.players[p].board[row];return <div className={`geo-row ${marks?.rows.includes(`${p}:${row}`)?'marked':''}`} key={row} aria-label={`${rowLabels[row]}: ${scores[p][row]}`}>{cards.map((c:any)=><GeoTile key={c.id} card={c} power={geoPower(state,p,row,c)} onClick={()=>{setInspect(c);setSelected(null);}}/>)}<span className="geo-row-name" aria-hidden="true" style={{'--n':String(rowLabels[row]).length} as React.CSSProperties}>{rowLabels[row]}</span></div>;})}</section>;
  const side=(p:number)=>{const pl=state.players[p];return <div className={`stat-side stat-${p}`}><div className="stat-head"><div className="stat-who"><strong>{name(p)}</strong><span>{factionLabels[pl.faction]}{pl.passed?tr(" · PAS"):''}</span></div><b className="stat-total">{totals[p]}</b></div><small className="stat-counts">{tr("Ręka ")}{pl.hand.length}{tr(" · Talia ")}{pl.deck.length}{tr(" · Cm. ")}{pl.grave.length}</small></div>;};
  return <div className="geo-phone-root" ref={fillRef}>
   <div className="geo-boards">
    {board(1)}
    <section className="geo-stats felt" aria-label={tr("Statystyki gry")}>{side(0)}<div className="stat-mid"><strong>{tr("Runda ")}{state.round}</strong><b className="stat-wins" aria-label={tr("Wygrane rundy: Ty {0}, {1} {2}", [state.wins[0], online?opponent:tr("komputer"), state.wins[1]])}>{state.wins[0]} : {state.wins[1]}</b><TurnBadge bot={state.turn===1} text={mulligan?tr("Wymień do 3 kart"):playable?undefined:state.phase==='over'?tr("Koniec meczu"):tr("Koniec rundy")}/></div>{side(1)}</section>
    {board(0)}
   </div>
   <div className="geo-actionbar"><button className="primary" onClick={()=>setHandOpen(true)}>{mulligan?tr("Wymiana kart"):tr("Ręka")} <b>{hand.length}</b></button>{!mulligan&&<button className="pass-button" disabled={!myTurn} onClick={()=>act({type:'pass'})}>{tr("Pasuję do końca rundy")}</button>}</div>
   {handOpen&&<Layer title={tr("Twoja ręka")} onClose={()=>setHandOpen(false)}>
    <div className="section-line"><h2>{tr("Twoja ręka ")}<span>{hand.length}</span></h2><span>{mulligan?tr("Zaznacz do 3 kart do wymiany"):tr("Dotknij karty, aby wykonać ruch")}</span></div>
    <div className="geo-hand-grid">{hand.map((c:any)=><GeoCard key={c.id} card={c} selected={mulligan?exchange.includes(c.id):selected===c.id} onClick={()=>choose(c)}/>)}</div>
    {!hand.length&&<p>{tr("Brak kart na ręce. Spasuj, aby zakończyć rundę.")}</p>}
    {mulligan&&<div className="geo-layer-actions"><b>{tr("Do wymiany: ")}{exchange.length} / 3</b><button className="primary" disabled={online&&!!state.mulliganDone?.[0]} onClick={()=>{act({type:'mulligan',ids:exchange});setExchange([]);}}>{exchange.length?tr("Wymień {0} i rozpocznij", [exchange.length]):tr("Zachowaj rękę i rozpocznij")}</button></div>}
   </Layer>}
   {current&&!mulligan&&<Layer title={tr(current.name)} level={2} onClose={()=>setSelected(null)}>{details(current)}{myTurn&&(actions.length?<div className="target-list">{actions.map((a:any,i:number)=>{const {trace,...previewState}=state;const after=geoTotals(geoApply(previewState,a));return <button className="primary" key={i} onClick={()=>act(a)}><span>{actionLabel(a)}<small>{tr("Po ruchu: Ty ")}{after[0]}{tr(" · rywal ")}{after[1]}</small></span><Icon name="arrow"/></button>;})}</div>:<p className="muted">{tr("Teraz brak legalnego celu dla tej karty. Wybierz inną lub spasuj.")}</p>)}</Layer>}
   {inspect&&!current&&<Layer title={tr(inspect.name)} level={2} onClose={()=>setInspect(null)}>{details(inspect)}</Layer>}
   {state.phase==='roundEnd'&&<Layer title={tr("Koniec rundy")} center level={3}><div className="round-result"><strong>{tr("Runda zakończona: ")}{totals[0]} : {totals[1]}</strong><span>{tr("Zachowujesz karty na ręce. Plansza zostanie wyczyszczona.")}</span><button className="primary" onClick={()=>act({type:'nextRound'})}>{tr("Następna runda ")}<Icon name="arrow"/></button></div></Layer>}
   {state.phase==='over'&&!seenOver&&<Layer title={tr("Koniec meczu")} center level={3} onClose={()=>setSeenOver(true)}><Outcome winner={state.winner}><p>{tr("Rundy: ")}{state.wins[0]} : {state.wins[1]}{tr(". Nowy mecz rozpoczniesz przyciskiem „Nowa gra”.")}</p></Outcome></Layer>}
  </div>;
 }
 return <>
 <div className="match-strip"><div><strong>{tr("Runda ")}{state.round}</strong><span>{factionLabels[state.players[0].faction]} vs {factionLabels[state.players[1].faction]}</span></div><div className="round-score" aria-label={tr("Wygrane rundy: Ty {0}, {1} {2}", [state.wins[0], online?opponent:tr("komputer"), state.wins[1]])}>{state.wins[0]} <span>{tr("rundy")}</span> {state.wins[1]}</div><TurnBadge bot={state.turn===1} text={state.phase==='mulligan'?tr("Wymień do 3 kart"):state.phase==='play'?undefined:state.phase==='over'?tr("Koniec meczu"):tr("Koniec rundy")}/></div>
 {state.phase==='over'&&<Outcome winner={state.winner}><p>{tr("Rundy: ")}{state.wins[0]} : {state.wins[1]}{tr(". Nowy mecz rozpoczniesz przyciskiem „Nowa gra”.")}</p></Outcome>}
 {state.phase==='roundEnd'&&<div className="round-result"><strong>{tr("Runda zakończona: ")}{totals[0]} : {totals[1]}</strong><span>{tr("Zachowujesz karty na ręce. Plansza zostanie wyczyszczona.")}</span><button className="primary" onClick={()=>act({type:'nextRound'})}>{tr("Następna runda ")}<Icon name="arrow"/></button></div>}
 <div className="geo-layout"><div className="geo-table felt">
 {[1,0].map(p=><section className={`side side-${p}`} key={p} aria-label={p===0?tr("Twoja plansza"):(online?tr("Plansza: {0}", [opponent]):tr("Plansza komputera"))}><header className="player-line"><div><strong>{p===0?tr("Ty"):(online?opponent:tr("Komputer"))}</strong><span>{factionLabels[state.players[p].faction]}{state.players[p].passed?tr(" · PAS"):''}</span></div><div className="pile-counts"><span>{tr("Ręka ")}{state.players[p].hand.length}</span><span>{tr("Talia ")}{state.players[p].deck.length}</span><span>{tr("Cmentarz ")}{state.players[p].grave.length}</span></div><b className="total-score">{totals[p]}</b></header>
 {(p===1?[...rows].reverse():rows).map(row=><div className="battle-row" key={row}><div className="row-title"><span>{rowLabels[row]}</span><b>{scores[p][row]}</b>{state.players[p].events[row].map(e=><small className="event-chip" key={e.type}>{({blackout:'Blackout',half:tr("½ siły"),silence:tr("Bez premii"),strike:tr("Strajk")} as any)[e.type]}</small>)}</div><div className="row-cards">{state.players[p].board[row].length?state.players[p].board[row].map(c=><GeoCard key={c.id} card={c} compact power={geoPower(state,p,row,c)} onClick={()=>{setInspect(c);setSelected(null);}}/>):<span className="empty-row">{p===0?tr("Miejsce na Twoje karty"):tr("Rywal nie zagrał tu kart")}</span>}</div></div>)}
 </section>)}
 </div><aside className="tactics"><h2>{state.phase==='mulligan'?tr("Przygotuj rękę"):tr("Twój ruch, Twój plan.")}</h2>
 {state.phase==='mulligan'?<><p>{tr("Wybierz do 3 kart na dole, aby wymienić je na inne z talii. Możesz też zachować całą rękę.")}</p><b>{tr("Do wymiany: ")}{exchange.length} / 3</b><button className="primary" disabled={online&&!!state.mulliganDone?.[0]} onClick={()=>{act({type:'mulligan',ids:exchange});setExchange([]);}}> {exchange.length?tr("Wymień {0} i rozpocznij", [exchange.length]):tr("Zachowaj rękę i rozpocznij")}</button></>:<>
 {viewed?<><GeoArtPreview key={viewed.id} card={viewed}/><div className="selected-name"><strong>{tr(viewed.name)}</strong><span>{viewed.power?tr("{0} siły bazowej", [viewed.power]):tr("Karta taktyczna")} · {Array.isArray(viewed.row)?viewed.row.map(r=>rowLabels[r]).join(' / '):rowLabels[viewed.row]||tr("Taktyka")}{viewed.hero?tr(" · Lider"):viewed.muster?tr(" · Seria"):''}</span></div><p>{cardDescription(viewed.desc)}</p>{current&&state.phase==='play'&&state.turn===0&&(actions.length?<div className="target-list">{actions.map((a,i)=>{const {trace,...previewState}=state;const after=geoTotals(geoApply(previewState,a));return <button className="primary" key={i} onClick={()=>act(a)}><span>{actionLabel(a)}<small>{tr("Po ruchu: Ty ")}{after[0]}{tr(" · rywal ")}{after[1]}</small></span><Icon name="arrow"/></button>;})}</div>:<p className="muted">{tr("Teraz brak legalnego celu dla tej karty. Wybierz inną lub spasuj.")}</p>)}</>:<p>{tr("Wybierz kartę z ręki. Zobaczysz jej działanie, dostępne cele i wynik po zagraniu.")}</p>}
 {state.phase==='play'&&<button className="pass-button" disabled={state.turn!==0} onClick={()=>act({type:'pass'})}>{tr("Pasuję do końca rundy")}</button>}<p className="hint">{tr("Po pasie rywal może grać dalej. Nie dobierasz kart między rundami.")}</p></>}
 </aside></div>
 <section className="hand-section"><div className="section-line"><h2>{tr("Twoja ręka ")}<span>{hand.length}</span></h2><span>{state.phase==='mulligan'?tr("Zaznacz karty do wymiany"):tr("Dotknij karty, aby zobaczyć akcje")}</span></div><div className="hand geo-hand">{hand.map(c=><GeoCard key={c.id} card={c} selected={state.phase==='mulligan'?exchange.includes(c.id):selected===c.id} onClick={()=>choose(c)}/>)}</div>{!hand.length&&<p>{tr("Brak kart na ręce. Spasuj, aby zakończyć rundę.")}</p>}</section>
 <GameLog state={state}/></>;
}

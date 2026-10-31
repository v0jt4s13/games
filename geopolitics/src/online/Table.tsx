import React, {useEffect, useRef, useState} from 'react';
import {api, inviteLink, gameNames} from './api';
import {OnlineContext, Icon} from '../ui';
import {setMoveSink} from '../trace.mjs';
import {factionLabels} from '../data/geopolitix.mjs';
import GeoGame from '../GeoGame';
import RummyGame from '../RummyGame';
import PokerGame from '../PokerGame';
import Chat from './Chat';

const GAMES: any = {geo: GeoGame, rummy: RummyGame, poker: PokerGame};
const until = (at: number) => new Date(at * 1000).toLocaleString('pl-PL', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
const mergeMessages = (old: any[], fresh: any[]) => {
  if (!fresh.length) return old;
  const known = new Set(old.map(m => m.id));
  return [...old, ...fresh.filter(m => !known.has(m.id))];
};

function Dot({on}: {on: boolean}) { return <i className={`presence-dot ${on ? 'on' : ''}`} title={on ? 'Połączony' : 'Brak połączenia'}/>; }

function ConfirmButton({label, confirm, onConfirm}: any) {
  const [asked, setAsked] = useState(false);
  return asked
    ? <><button className="primary" onClick={() => { setAsked(false); onConfirm(); }}>{confirm}</button><button onClick={() => setAsked(false)}>Anuluj</button></>
    : <button onClick={() => setAsked(true)}>{label}</button>;
}

/** Invitations of one seat (host only): create a one-time link, show it once, revoke pending ones. */
function SeatInvite({t, index, fresh, onInvite, onRevoke}: any) {
  const [copied, setCopied] = useState(false), field = useRef<HTMLInputElement>(null);
  const pending = (t.invites || []).filter((i: any) => i.seat === index);
  const link = fresh && fresh.seat === index ? inviteLink(fresh.code) : '';
  const copy = async () => {
    field.current?.select();
    try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setCopied(false); }   // http on a LAN: copy by hand
  };
  return <div className="seat-invite">
    <button onClick={() => { setCopied(false); onInvite(index); }}>{pending.length ? 'Nowy link zaproszenia' : 'Zaproś gracza'}</button>
    {link && <div className="invite-link"><label>Link zaproszenia (jednorazowy, ważny 24 godziny)
      <input ref={field} readOnly value={link} onFocus={e => e.target.select()}/></label>
      <button onClick={copy}>{copied ? 'Skopiowano' : 'Kopiuj'}</button></div>}
    {pending.map((i: any) => <p className="muted invite-pending" key={i.id}>Aktywne zaproszenie do {until(i.expires)}
      <button className="text-button" onClick={() => onRevoke(i.id)}>Odwołaj</button></p>)}
  </div>;
}

function SeatCard({t, index, fresh, cmd, invite, revoke}: any) {
  const seat = t.seats[index], lobby = t.phase === 'lobby';
  const faction = t.game === 'geo' ? (index === 0 ? t.opts.faction : t.opts.faction === 'america' ? 'europe' : 'america') : null;
  return <article className={`seat-card ${seat.you ? 'you' : ''}`}>
    <header><h3>Miejsce {index + 1}</h3>{faction && <span className="seat-faction">{factionLabels[faction]}</span>}</header>
    {seat.kind === 'human' && <p className="seat-name"><Dot on={seat.online}/><strong>{seat.name}</strong>
      {seat.you && <span className="tag">Ty</span>}{seat.host && <span className="tag">gospodarz</span>}{seat.muted && <span className="tag">wyciszony</span>}</p>}
    {seat.kind === 'ai' && <p className="seat-name"><Icon name="cards"/><strong>{seat.name}</strong><span className="tag">komputer</span></p>}
    {seat.kind === 'empty' && <p className="seat-name muted">Wolne miejsce</p>}
    {t.host && !seat.host && <div className="seat-actions">
      {lobby && seat.kind === 'human' && <button onClick={() => cmd('seat', {seat: index, kind: 'empty'})}>Usuń gracza</button>}
      {lobby && seat.kind === 'ai' && <button onClick={() => cmd('seat', {seat: index, kind: 'empty'})}>Usuń SI</button>}
      {lobby && seat.kind === 'empty' && <button onClick={() => cmd('seat', {seat: index, kind: 'ai'})}>Dodaj SI</button>}
      {seat.kind !== 'ai' && <SeatInvite t={t} index={index} fresh={fresh} onInvite={invite} onRevoke={revoke}/>}
    </div>}
  </article>;
}

export default function OnlineTable({id, onRules}: {id: string; onRules: (game: string) => void}) {
  const [t, setT] = useState<any>(null), [msgs, setMsgs] = useState<any[]>([]), [error, setError] = useState(''), [fatal, setFatal] = useState('');
  const [fresh, setFresh] = useState<any>(null);
  const ver = useRef(0), last = useRef(0), epoch = useRef(-1), busy = useRef(false), alive = useRef(true), timer = useRef<any>(null);
  const current = useRef<any>(null), loop = useRef<() => void>(() => {});

  async function poll() {
    if (busy.current || !alive.current) return;
    busy.current = true;
    try {
      const d = await api(`tables/${id}?v=${ver.current}&c=${last.current}&ce=${epoch.current}`);
      if (!alive.current) return;
      setError(old => (old.startsWith('Brak połączenia') ? '' : old));
      const ids = (d.changed ? d.chat.messages : d.messages).map((m: any) => m.id);
      if (d.changed) {
        ver.current = d.version;
        const reset = d.chat.epoch !== epoch.current;
        epoch.current = d.chat.epoch;
        if (reset) last.current = 0;
        setMsgs(old => (reset ? d.chat.messages : mergeMessages(old, d.chat.messages)));
        current.current = d; setT(d);
      } else {
        setMsgs(old => mergeMessages(old, d.messages));
        setT((prev: any) => (prev && JSON.stringify(prev.seats.map((s: any) => s.online)) !== JSON.stringify(d.presence)
          ? {...prev, seats: prev.seats.map((s: any, i: number) => ({...s, online: d.presence[i]}))} : prev));
      }
      if (ids.length) last.current = Math.max(last.current, ...ids);
    } catch (e: any) {
      if ([401, 403, 404].includes(e.status)) { setFatal(e.status === 404 ? 'Ten stół nie istnieje albo został zamknięty.' : 'Nie masz dostępu do tego stołu. Poproś gospodarza o nowe zaproszenie.'); alive.current = false; }
      else setError(e.message);
    } finally { busy.current = false; }
  }
  const delay = () => (document.hidden ? 5000 : current.current?.waiting ? 600 : current.current?.phase === 'playing' ? 1000 : 1500);
  loop.current = async () => { await poll(); if (alive.current) { clearTimeout(timer.current); timer.current = setTimeout(() => loop.current(), delay()); } };
  const pollNow = () => { clearTimeout(timer.current); loop.current(); };

  useEffect(() => {
    alive.current = true; loop.current();
    const visible = () => { if (!document.hidden) pollNow(); };
    document.addEventListener('visibilitychange', visible);
    return () => { alive.current = false; clearTimeout(timer.current); document.removeEventListener('visibilitychange', visible); };
  }, [id]);

  async function cmd(path: string, body: any = {}) {
    try { const d = await api(`tables/${id}/${path}`, 'POST', body); setError(''); pollNow(); return d; }
    catch (e: any) { setError(e.message); pollNow(); return null; }
  }
  // Moves made in the game components (via trackMove) go to the server instead of a local engine.
  useEffect(() => { setMoveSink((action: any) => { cmd('action', {action}); }); return () => setMoveSink(null); }, [id]);
  const invite = async (seat: number) => { const d = await cmd('invite', {seat}); if (d) setFresh(d); };
  const revoke = (inviteId: string) => cmd('invite/revoke', {id: inviteId});
  const leave = async () => { if (await cmd('leave')) location.hash = 'online'; };
  const close = async () => { if (await cmd('close')) location.hash = 'online'; };

  if (fatal) return <section className="online-hub"><div className="notice error" role="alert">{fatal}</div><a className="back-link" href="#online"><Icon name="back"/>Moje stoły</a></section>;
  if (!t) return <section className="online-hub"><p className="muted" role="status">Łączenie ze stołem…</p>{error && <div className="notice error" role="alert">{error}</div>}</section>;

  const lobby = t.phase === 'lobby', full = t.seats.every((s: any) => s.kind !== 'empty'), name = gameNames[t.game];
  // names in the order the game view uses: me first, then the others in table order
  const names = t.seats.map((_: any, i: number) => t.seats[(t.seat + i) % t.seats.length].name || 'Wolne miejsce');
  const opponent = names[1] || 'Przeciwnik';
  const Game = GAMES[t.game];
  const seatGrid = <div className="seat-grid" aria-label="Miejsca przy stole">
    {t.seats.map((_: any, i: number) => <SeatCard key={i} t={t} index={i} fresh={fresh} cmd={cmd} invite={invite} revoke={revoke}/>)}
  </div>;
  return <section className="online-table">
    <div className="game-heading"><div><a href="#online" className="back-link"><Icon name="back"/>Moje stoły</a><h1>{name} · stół online</h1></div>
      <button onClick={() => onRules(t.game)}><Icon name="help"/><span>Zasady</span></button></div>
    {error && <div className="notice error" role="alert">{error}<button onClick={() => setError('')}>Zamknij komunikat</button></div>}

    {lobby ? seatGrid : <details className="seat-details" open={!full}><summary>Miejsca i zaproszenia</summary>{seatGrid}</details>}

    {lobby && <div className="table-controls">
      {t.host ? <>
        <p className="muted">Ustaw miejsca: zaproś człowieka albo dodaj SI. Zaproszenie to jednorazowy link - wyślij go wybranej osobie.</p>
        <div className="action-row">
          {t.seats.length === 2 && <button onClick={() => cmd('seat', {op: 'swap'})}>Zamień miejsca</button>}
          <button className="primary" disabled={!full} onClick={() => cmd('start')}>Rozpocznij grę <Icon name="arrow"/></button>
          <ConfirmButton label="Zamknij stół" confirm="Na pewno zamknąć" onConfirm={close}/>
        </div>
        {!full && <small className="muted">Obydwa miejsca muszą być zajęte (gracz albo SI).</small>}
      </> : <>
        <p className="muted" role="status">Czekamy, aż gospodarz rozpocznie grę.</p>
        <div className="action-row"><ConfirmButton label="Opuść stół" confirm="Na pewno opuścić" onConfirm={leave}/></div>
      </>}
    </div>}

    {!lobby && <OnlineContext.Provider value={{online: true, opponent, names}}>
      {!full && <div className="notice" role="status">Czekamy na gracza - miejsce jest wolne.{t.host ? ' Utwórz zaproszenie powyżej.' : ''}</div>}
      <div className="online-strip">{t.seats.map((_: any, i: number) => { const s = t.seats[(t.seat + i) % t.seats.length]; return <span key={i}><Dot on={s.online}/>{i === 0 ? `Ty (${s.name})` : s.name || 'wolne miejsce'}</span>; })}
        {t.waiting && t.view?.phase !== 'over' && <span className="muted" role="status">SI myśli…</span>}</div>
      <Game key={`${t.game}-${t.id}`} state={t.view} setState={() => {}} run={(fn: any) => { try { fn(); return true; } catch (e: any) { setError(e.message); return false; } }} paused={false}/>
      <div className="table-controls"><div className="action-row">
        {t.host && <ConfirmButton label="Nowa gra przy tym stole" confirm="Na pewno zacząć od nowa" onConfirm={() => cmd('start')}/>}
        {t.host ? <ConfirmButton label="Zamknij stół" confirm="Na pewno zamknąć" onConfirm={close}/> : <ConfirmButton label="Opuść stół" confirm="Na pewno opuścić" onConfirm={leave}/>}
      </div></div>
    </OnlineContext.Provider>}

    <Chat tableId={t.id} messages={msgs} meta={t.chat} seats={t.seats} isHost={t.host} onChanged={pollNow}/>
  </section>;
}

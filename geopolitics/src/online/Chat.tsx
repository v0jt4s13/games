import {tr, getRegion, systemText} from "../i18n";
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {api} from './api';
import {Icon} from '../ui';

const LIMIT = 2000;
const clock = (at: number) => new Date(at * 1000).toLocaleTimeString(getRegion(), {hour: '2-digit', minute: '2-digit'});

type Pending = {key: number; text: string; status: 'sending' | 'failed' | 'sent'; id?: number; error?: string};

/** Text conversation of a table: history (paged), Enter sends, failed messages can be retried, host controls. */
export default function Chat({tableId, messages, meta, seats, isHost, onChanged}: any) {
  const [expanded, setExpanded] = useState(true), [text, setText] = useState(''), [pending, setPending] = useState<Pending[]>([]);
  const [older, setOlder] = useState<any[]>([]), [more, setMore] = useState(true), [error, setError] = useState(''), [confirmClear, setConfirmClear] = useState(false);
  const counter = useRef(0), seen = useRef(0), list = useRef<HTMLOListElement>(null), stick = useRef(true);

  useEffect(() => { setOlder([]); setMore(true); }, [meta.epoch]);               // history cleared by the host
  const all = useMemo(() => {
    const byId = new Map<number, any>();
    [...older, ...messages].forEach(m => byId.set(m.id, m));
    return [...byId.values()].sort((a, b) => a.id - b.id);
  }, [older, messages]);
  const lastId = all.length ? all[all.length - 1].id : 0;
  if (expanded) seen.current = lastId;
  const unread = expanded ? 0 : all.filter(m => !m.mine && m.id > seen.current).length;
  const visible = pending.filter(p => !(p.status === 'sent' && p.id !== undefined && p.id <= lastId));

  useEffect(() => { const el = list.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [all.length, visible.length, expanded]);
  const onScroll = () => { const el = list.current; if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; };

  const upsert = (item: Pending) => setPending(old => old.some(p => p.key === item.key) ? old.map(p => p.key === item.key ? item : p) : [...old, item]);
  async function submit(value: string, key = ++counter.current) {
    upsert({key, text: value, status: 'sending'});
    try {
      const d = await api(`tables/${tableId}/chat`, 'POST', {text: value});
      upsert({key, text: value, status: 'sent', id: d.id});
      stick.current = true; onChanged();
    } catch (e: any) { upsert({key, text: value, status: 'failed', error: e.message}); }
  }
  const send = () => { const value = text.trim(); if (!value || !canWrite) return; setText(''); submit(value); };
  async function loadOlder() {
    try {
      const d = await api(`tables/${tableId}/chat?before=${all[0]?.id ?? 0}`);
      setOlder(old => [...d.messages, ...old]); setMore(d.messages.length >= 50); setError('');
    } catch (e: any) { setError(e.message); }
  }
  async function admin(op: string, seat?: number) {
    try { await api(`tables/${tableId}/chat/admin`, 'POST', {op, seat}); setError(''); setConfirmClear(false); onChanged(); }
    catch (e: any) { setError(e.message); }
  }
  const canWrite = meta.open && !meta.muted;
  const others = seats.map((s: any, i: number) => ({s, i})).filter(({s}: any) => s.kind === 'human' && !s.host);

  return <aside className="chat-panel" aria-label={tr("Komunikacja")}>
    <button className="chat-toggle" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
      <Icon name="cards"/><span>{tr("Komunikacja")}</span>{unread > 0 && <b className="chat-badge" aria-label={tr("{0} nowych wiadomości", [unread])}>{unread}</b>}
      {!meta.open && <small>{tr("zamknięta")}</small>}</button>
    {expanded && <div className="chat-body">
      {all.length >= 50 && more && <button className="text-button" onClick={loadOlder}>{tr("Starsze wiadomości")}</button>}
      <ol className="chat-list" ref={list} onScroll={onScroll} aria-live="polite">
        {!all.length && !visible.length && <li className="chat-empty">{tr("Brak wiadomości. Napisz pierwszą.")}</li>}
        {all.map((m: any) => <li key={m.id} className={m.mine ? 'mine' : ''}><span className="chat-meta"><strong>{m.name}</strong><time>{clock(m.at)}</time></span><p>{m.text}</p></li>)}
        {visible.map(p => <li key={`p${p.key}`} className={`mine pending ${p.status}`}><p>{p.text}</p>
          <span className="chat-meta">{p.status === 'failed' ? <>{systemText(p.error || 'Nie wysłano.')} <button className="text-button" onClick={() => submit(p.text, p.key)}>{tr("Ponów")}</button></> : tr("wysyłanie…")}</span></li>)}
      </ol>
      {error && <p className="chat-error" role="alert">{systemText(error)}</p>}
      {!meta.open && <p className="chat-note">{tr("Gospodarz zamknął rozmowę.")}</p>}
      {meta.open && meta.muted && <p className="chat-note">{tr("Gospodarz odebrał Ci możliwość pisania.")}</p>}
      <div className="chat-compose">
        <textarea value={text} maxLength={LIMIT} rows={2} disabled={!canWrite} placeholder={tr("Wiadomość (Enter wysyła, Shift+Enter - nowy wiersz)")}
          aria-label={tr("Treść wiadomości")} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}/>
        <button className="primary" disabled={!canWrite || !text.trim()} onClick={send}>{tr("Wyślij")}</button>
        {text.length > LIMIT - 200 && <small>{text.length} / {LIMIT}</small>}
      </div>
      {isHost && <details className="chat-admin"><summary>{tr("Moderacja rozmowy")}</summary><div className="action-row">
        <button onClick={() => admin(meta.open ? 'close' : 'open')}>{meta.open ? tr("Zamknij rozmowę") : tr("Otwórz rozmowę")}</button>
        {others.map(({s, i}: any) => <button key={i} onClick={() => admin(s.muted ? 'unmute' : 'mute', i)}>{s.muted ? tr("Przywróć: {0}", [s.name]) : tr("Wycisz: {0}", [s.name])}</button>)}
        {confirmClear ? <><button className="primary" onClick={() => admin('clear')}>{tr("Na pewno wyczyścić")}</button><button onClick={() => setConfirmClear(false)}>{tr("Anuluj")}</button></>
          : <button onClick={() => setConfirmClear(true)}>{tr("Wyczyść historię")}</button>}
      </div></details>}
    </div>}
  </aside>;
}

import {tr, systemText} from "../i18n";
import React, {useEffect, useState} from 'react';
import {api, parseInvite, gameNames, ApiError} from './api';
import {Icon} from '../ui';

/** Identity: an anonymous name kept on the server (cookie). Loaded once per page. */
function useIdentity() {
  const [name, setName] = useState<string | null>(null), [error, setError] = useState('');
  useEffect(() => { api('me').then(d => setName(d.name)).catch(e => setError(e.message)); }, []);
  const save = async (value: string) => {
    try { const d = await api('me', 'POST', {name: value}); setName(d.name); setError(''); return d.name as string; }
    catch (e: any) { setError(e.message); return null; }
  };
  return {name, setName, save, error};
}

function NameField({identity}: any) {
  const {name, setName, save} = identity;
  if (name === null) return null;
  return <label className="online-name">{tr("Twoje imię przy stole ")}<input value={name} maxLength={24} onChange={e => setName(e.target.value)} onBlur={e => save(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}/></label>;
}

export function OnlineHub() {
  const identity = useIdentity(), [game, setGame] = useState('poker'), [faction, setFaction] = useState('europe'), [players, setPlayers] = useState(2);
  const [tables, setTables] = useState<any[]>([]), [code, setCode] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { if (identity.name !== null) api('tables').then(d => setTables(d.tables)).catch(() => {}); }, [identity.name]);
  const create = async () => {
    setBusy(true);
    try {
      await identity.save(identity.name || '');
      const d = await api('tables', 'POST', {game, faction, players: game === 'geo' ? 2 : players});
      location.hash = `stol/${d.id}`;
    } catch (e: any) { setError(e.message); setBusy(false); }
  };
  const join = () => { const c = parseInvite(code); if (c) location.hash = `dolacz/${encodeURIComponent(c)}`; else setError(tr("Wklej link albo kod zaproszenia.")); };
  const phase: any = {lobby: tr("poczekalnia"), playing: tr("w grze"), over: tr("zakończona")};
  return <section className="online-hub">
    <div className="game-heading"><div><a href="#" className="back-link"><Icon name="back"/>{tr("Wszystkie gry")}</a><h1>{tr("Stół online")}</h1></div></div>
    {(error || identity.error) && <div className="notice error" role="alert">{systemText(error || identity.error)}<button onClick={() => setError('')}>{tr("Zamknij komunikat")}</button></div>}
    <p className="muted">{tr("Zagraj z innym człowiekiem albo z SI. Bez konta - wystarczy imię. Gospodarz ustawia miejsca i zaprasza osoby jednorazowym linkiem.")}</p>
    <NameField identity={identity}/>
    <div className="online-grid">
      <article className="online-card">
        <h2>{tr("Nowy stół")}</h2>
        <fieldset><legend>{tr("Gra")}</legend>
          {Object.entries(gameNames).map(([key, label]) => <label className="faction-choice" key={key}>
            <input type="radio" name="game" checked={game === key} onChange={() => setGame(key)}/><span><strong>{label}</strong></span></label>)}
        </fieldset>
        {game !== 'geo' && <fieldset><legend>{tr("Liczba graczy przy stole")}</legend>
          {[2, 3, 4].map(n => <label className="faction-choice" key={n}>
            <input type="radio" name="players" checked={players === n} onChange={() => setPlayers(n)}/><span><strong>{n}{tr(" graczy")}</strong>
              <small>{n === 2 ? tr("Ty i jedna osoba albo SI") : tr("Miejsca zajmują ludzie albo SI")}</small></span></label>)}
        </fieldset>}
        {game === 'geo' && <fieldset><legend>{tr("Twoja frakcja")}</legend>
          {[['europe', tr("Europe")], ['america', tr("North America")]].map(([key, label]) => <label className="faction-choice" key={key}>
            <input type="radio" name="faction" checked={faction === key} onChange={() => setFaction(key)}/><span><strong>{label}</strong></span></label>)}
        </fieldset>}
        <button className="primary" disabled={busy || identity.name === null} onClick={create}>{tr("Utwórz stół ")}<Icon name="arrow"/></button>
      </article>
      <article className="online-card">
        <h2>{tr("Dołącz do stołu")}</h2>
        <p className="muted">{tr("Wklej link albo kod zaproszenia od gospodarza.")}</p>
        <label>{tr("Link lub kod")}<input value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') join(); }} placeholder="…#dolacz/…"/></label>
        <button className="primary" onClick={join}>{tr("Dołącz ")}<Icon name="arrow"/></button>
      </article>
    </div>
    {tables.length > 0 && <article className="online-card"><h2>{tr("Twoje stoły")}</h2>
      <ul className="table-list">{tables.map(t => <li key={t.id}>
        <a href={`#stol/${t.id}`}><strong>{gameNames[t.game]}</strong><span>{t.players.join(' · ')}</span>
          <small>{phase[t.phase]}{t.host ? tr(" · gospodarz") : ''}</small></a></li>)}</ul></article>}
  </section>;
}

/** Landing page of an invitation link: joining is an explicit click (the code is single-use). */
export function JoinPage({code}: {code: string}) {
  const identity = useIdentity(), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const join = async () => {
    setBusy(true);
    try {
      await identity.save(identity.name || '');
      const d = await api('join', 'POST', {code});
      location.replace(`#stol/${d.id}`);
    } catch (e: any) { setError(e instanceof ApiError ? e.message : tr("Nie udało się dołączyć.")); setBusy(false); }
  };
  return <section className="online-hub">
    <div className="game-heading"><div><a href="#" className="back-link"><Icon name="back"/>{tr("Wszystkie gry")}</a><h1>{tr("Zaproszenie do stołu")}</h1></div></div>
    {(error || identity.error) && <div className="notice error" role="alert">{systemText(error || identity.error)}</div>}
    <p className="muted">{tr("Ktoś zaprosił Cię do gry. Podaj imię, pod którym zobaczą Cię pozostali.")}</p>
    <NameField identity={identity}/>
    <button className="primary" disabled={busy || identity.name === null} onClick={join}>{tr("Dołącz do stołu ")}<Icon name="arrow"/></button>
  </section>;
}

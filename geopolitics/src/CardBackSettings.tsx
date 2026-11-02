import {tr, systemText} from "./i18n";
import React,{createContext,useState,useContext,useEffect} from 'react';
import {defaultBacks,validateBack,DEFAULT_BACK_URL} from './cardBacks.mjs';
export const BackContext=createContext<any>(defaultBacks());
export function CardBackImage({game='poker',config:override}:any){const settings=useContext(BackContext),config=override||settings[game];const [failed,setFailed]=useState('');const url=config?.url;
 useEffect(()=>setFailed(''),[config]);
 return <span className={`back-pattern ${url&&failed!==url?'custom-back':''}`}>
 {url&&failed!==url?<img src={url} alt="" referrerPolicy="no-referrer" style={{objectFit:config.fit}} onError={()=>setFailed(url)}/>:<span className="back-fallback" aria-hidden="true">L</span>}
 </span>;
}
export default function CardBackSettings({value,onSave}:any){const [draft,setDraft]=useState(()=>structuredClone(value)),[preview,setPreview]=useState(()=>structuredClone(value)),[error,setError]=useState(''),[saved,setSaved]=useState(false),[previewVersion,setPreviewVersion]=useState(0);
 function validate(){try{const result={rummy:validateBack(draft.rummy),poker:validateBack(draft.poker)};setError('');setPreview(result);setPreviewVersion(n=>n+1);return result;}catch(e:any){setError(e.message);return null;}}
 return <form className="back-settings" onSubmit={e=>{e.preventDefault();const result=validate();if(result)setSaved(onSave(result));}}><p>{tr("Ustaw osobny rewers każdej gry. Logo dopasuj w całości, a fotografią możesz wypełnić kartę. Zmiana nie restartuje partii.")}</p>
 {['rummy','poker'].map(game=><fieldset key={game}><legend>{game==='rummy'?tr("Remik"):'Poker'}</legend><div className="back-form-row"><div className="playing-card card-back back-preview"><CardBackImage key={preview[game].url+preview[game].fit+previewVersion} config={preview[game]}/></div><div><label htmlFor={`back-${game}`}>{tr("Adres obrazka")}</label><input id={`back-${game}`} type="url" value={draft[game].url} placeholder="https://…" onChange={e=>{setDraft({...draft,[game]:{...draft[game],url:e.target.value}});setSaved(false);}}/><label htmlFor={`fit-${game}`}>{tr("Dopasowanie")}</label><select id={`fit-${game}`} value={draft[game].fit} onChange={e=>{setDraft({...draft,[game]:{...draft[game],fit:e.target.value}});setSaved(false);}}><option value="contain">{tr("Cały obrazek / logo")}</option><option value="cover">{tr("Wypełnij kartę (przytnij)")}</option></select><button type="button" className="text-button" onClick={()=>{const config={url:DEFAULT_BACK_URL,fit:'contain'};setDraft({...draft,[game]:config});setPreview({...preview,[game]:config});setSaved(false);}}>{tr("Przywróć logo Londynek")}</button></div></div></fieldset>)}
 <p className="hint">{tr("Puste pole przywraca prosty rewers. Niedostępny obrazek zastępuje wzór „L”. Obrazek jest pobierany z podanego adresu, więc musi być publicznie dostępny.")}</p><div className="action-row"><button type="button" onClick={validate}>{tr("Odśwież podgląd")}</button><button type="submit" className="primary">{tr("Zapisz rewersy")}</button></div>{error&&<p role="alert">{systemText(error)}</p>}{saved&&<p role="status">{tr("Zapisano rewersy obu gier.")}</p>}</form>;
}

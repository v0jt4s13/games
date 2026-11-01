import React,{useEffect,useRef,useState} from 'react';
import {Icon} from './ui';
import {cardArtUrl} from './cardArt.mjs';

// Phone layout of Geopolitix (one screen: boards + stats in the middle, everything else in layers).
export const PHONE_QUERY='(max-width: 600px)';
export function usePhone() {
 const [phone,setPhone]=useState(()=>typeof window!=='undefined'&&!!window.matchMedia&&window.matchMedia(PHONE_QUERY).matches);
 useEffect(()=>{const mq=window.matchMedia(PHONE_QUERY),on=()=>setPhone(mq.matches);on();mq.addEventListener('change',on);return()=>mq.removeEventListener('change',on);},[]);
 return phone;
}
/** Gives the element the rest of the viewport height, so the whole game fits one screen without scrolling. */
export function useFillHeight(active:boolean) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!active)return;
  const fit=()=>{const el=ref.current;if(!el)return;const top=el.getBoundingClientRect().top+window.scrollY;el.style.height=`${Math.max(460,window.innerHeight-top-8)}px`;};
  fit();const id=setTimeout(fit,50);
  window.addEventListener('resize',fit);window.addEventListener('orientationchange',fit);window.visualViewport?.addEventListener('resize',fit);
  return()=>{clearTimeout(id);window.removeEventListener('resize',fit);window.removeEventListener('orientationchange',fit);window.visualViewport?.removeEventListener('resize',fit);};
 },[active]);
 return ref;
}
/** A layer over the game: bottom sheet by default, centred window with `center`. Escape or a tap outside closes it. */
export function Layer({title,onClose,center=false,level=1,children}:any) {
 useEffect(()=>{if(!onClose)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[onClose]);
 return <div className={`geo-layer ${center?'center':''}`} style={{zIndex:30+level}} role="dialog" aria-modal="true" aria-label={title} onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose();}}>
  <div className="geo-layer-body">{onClose&&<button className="icon-button geo-layer-close" aria-label="Zamknij" onClick={onClose}><Icon name="close"/></button>}{children}</div></div>;
}
/** A card on the board: only its picture; details come in a layer after a tap. */
export function GeoTile({card,power,onClick}:any) {
 const url=cardArtUrl(card),[failed,setFailed]=useState<string|null>(null),hasArt=!!url&&failed!==url;
 return <button className={`geo-tile ${card.faction} ${card.hero?'hero-card':''}`} onClick={onClick} aria-label={`${card.name}, siła ${power}`}>
  {hasArt?<img src={url} alt="" loading="lazy" decoding="async" onError={()=>setFailed(url)}/>:<b className="geo-tile-fallback">{power}</b>}</button>;
}

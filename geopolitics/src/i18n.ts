import {useSyncExternalStore} from 'react';
import {chooseLocale, isLocale, LANGUAGE_STORAGE_KEY, locales, translate, translateSystemText} from './i18n-core.mjs';
export {locales};
export type Locale = 'pl' | 'en' | 'cs';
function savedLanguage() { try { return localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { return null; } }
function preferredLanguage(): Locale {
  return chooseLocale(savedLanguage(), typeof navigator === 'undefined' ? [] : [...navigator.languages]) as Locale;
}
let locale: Locale = typeof window === 'undefined' ? 'pl' : preferredLanguage();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getLocale = () => locale;
export const getRegion = () => locales[locale].region;
export const tr = (key: string, args: unknown[] = []) => translate(locale, key, args);
// Only use for application-owned text, never for names or chat messages.
export function systemText(text: string, protectedNames: string[] = []) {
  return translateSystemText(locale, text, protectedNames);
}
export const localizedLabels = (labels: Record<string, string>) => new Proxy(labels, {
  get: (target, key) => typeof key === 'string' && key in target ? tr(target[key]) : Reflect.get(target, key),
});
export function cardDescription(text: string = '') {
  const suffix = ' Odporność na Blackout.';
  return text.endsWith(suffix) ? tr(text.slice(0, -suffix.length)) + tr(suffix) : tr(text);
}
export const pokerHandName = (name: string) => tr(name === 'Poker' ? 'Poker (układ)' : name);
function updateDocument() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.title = tr('Przy stole') + ' | Geopolitix · ' + tr('Remik') + ' · Poker';
}
function apply(next: Locale) {
  if (next === locale) return;
  locale = next; updateDocument(); listeners.forEach(listener => listener());
}
export function setLocale(next: string) {
  if (!isLocale(next)) return;
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* The choice still works for this session. */ }
  apply(next as Locale);
}
export const useLocale = () => useSyncExternalStore(subscribe, getLocale, getLocale);
if (typeof window !== 'undefined') window.addEventListener?.('storage', event => {
  if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) apply(preferredLanguage());
});
updateDocument();

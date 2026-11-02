import pl from './locales/pl.json' with {type: 'json'};
import en from './locales/en.json' with {type: 'json'};
import cs from './locales/cs.json' with {type: 'json'};

export const catalogs = {pl, en, cs};
export const locales = {pl: {name: 'Polski', region: 'pl-PL'}, en: {name: 'English', region: 'en-GB'}, cs: {name: 'Čeština', region: 'cs-CZ'}};
export const LANGUAGE_STORAGE_KEY = 'games:language';
export const isLocale = value => typeof value === 'string' && Object.hasOwn(locales, value);
export function chooseLocale(saved, languages = []) {
  if (isLocale(saved)) return saved;
  for (const language of languages) {
    const candidate = String(language).toLowerCase().split(/[-_]/)[0];
    if (isLocale(candidate)) return candidate;
  }
  return 'pl';
}
// Polish source text is the stable key. Arguments are opaque values: never translate
// player names, chat content, URLs or user input, even if they match a dictionary key.
export function translate(locale, key, args = []) {
  const catalog = catalogs[isLocale(locale) ? locale : 'pl'];
  const template = Object.hasOwn(catalog, key) ? catalog[key] : Object.hasOwn(pl, key) ? pl[key] : key;
  return String(template).replace(/\{(\d+)\}/g, (match, index) => Number(index) < args.length ? String(args[Number(index)] ?? '') : match);
}

const exactSystemKeys = new Map();
const systemPatterns = [];
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const catalog of Object.values(catalogs)) for (const [key, text] of Object.entries(catalog)) {
  if (!/\{\d+\}/.test(text)) { exactSystemKeys.set(text, key); continue; }
  const indices = [];
  const parts = text.split(/(\{\d+\})/g);
  const pattern = parts.map(part => {
    const match = /^\{(\d+)\}$/.exec(part);
    if (!match) return escapeRegex(part);
    indices.push(Number(match[1])); return '(.*?)';
  }).join('');
  systemPatterns.push({key, indices, regex: new RegExp('^' + pattern + '$', 's'), specificity: text.replace(/\{\d+\}/g, '').length});
}
systemPatterns.sort((a, b) => b.specificity - a.specificity);
// Compatibility with existing saves and the server's Polish string protocol.
// This function is ONLY for known application-generated messages. Captured values
// are opaque and are not recursively translated (a player can have any name).
export function translateSystemText(locale, text, protectedNames = []) {
  if (!text) return text;
  const names = [...new Set(protectedNames.filter(name => typeof name === 'string' && name.length))].sort((a, b) => b.length - a.length);
  if (names.length) {
    let marker = '\uE000';
    while (text.includes(marker) || names.some(name => name.includes(marker))) marker += '\uE000';
    const slots = [];
    const masked = text.replace(new RegExp(names.map(escapeRegex).join('|'), 'g'), name => {
      const slot = `${marker}${slots.length}\uE001`; slots.push([slot, name]); return slot;
    });
    let translated = translateSystemText(locale, masked);
    for (const [slot, name] of slots) translated = translated.split(slot).join(name);
    return translated;
  }
  const exact = Object.hasOwn(catalogs.pl, text) ? text : exactSystemKeys.get(text);
  if (exact) return translate(locale, exact);
  for (const {key, indices, regex} of systemPatterns) {
    const match = regex.exec(text);
    if (!match) continue;
    const args = [];
    indices.forEach((index, i) => { args[index] = match[i + 1]; });
    // Only this slot is another system message, not a player-supplied value.
    if (key === 'Runda {0}: {1} : {2}. {3}') args[3] = translateSystemText(locale, args[3]);
    if (key === '{0}: dobór {1}.' && args[1] === 'ze stosu zakrytego') args[1] = translate(locale, args[1]);
    return translate(locale, key, args);
  }
  return text;
}

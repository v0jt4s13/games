import React from 'react';
import {locales, setLocale, tr, useLocale} from './i18n';

export default function LanguageSwitch() {
  const locale = useLocale();
  return <label className="language-switch"><span>{tr('Język')}</span>
    <select value={locale} aria-label={tr('Język')} onChange={event => setLocale(event.target.value)}>
      {Object.entries(locales).map(([code, language]) => <option key={code} value={code} lang={code}>{language.name}</option>)}
    </select>
  </label>;
}

import {tr} from '../i18n';
// HTTP client for the online tables (server/ in app_games). Paths are relative to the page, so the app
// works under a prefix (/games/) and in dev (Vite proxies /api).
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function api(path: string, method = 'GET', body?: any): Promise<any> {
  const url = new URL('api/' + path.replace(/^\//, ''), document.baseURI);
  let res: Response;
  try {
    res = await fetch(url, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: method === 'GET' ? {} : {'Content-Type': 'application/json', 'X-Requested-With': 'games'},
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Brak połączenia z serwerem.', 0);
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* not JSON (e.g. the page is opened from a file) */ }
  if (!res.ok) throw new ApiError(data?.error || `Błąd serwera (${res.status}).`, res.status);
  if (data === null) throw new ApiError('Tryb online wymaga serwera gier (strona otwarta z pliku?).', 0);
  return data;
}

export const inviteLink = (code: string) => `${location.origin}${location.pathname}#dolacz/${code}`;

/** Accepts a full link or a bare code. */
export function parseInvite(text: string): string {
  const raw = text.trim();
  const at = raw.indexOf('#dolacz/');
  return decodeURIComponent(at >= 0 ? raw.slice(at + 8) : raw).trim();
}

export const gameNames: Record<string, string> = {geo: 'Geopolitix', get rummy() { return tr('Remik'); }, poker: 'Poker'};

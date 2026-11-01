# AGENTS.md - app_games

**Wersja: 1.6.1** (2026-11-01) - łagodniejszy kontrast sukna w jasnym motywie (tokeny `--felt-*`). 1.6.0 (2026-11-01) - układ telefoniczny Geopolitix (`src/phone.tsx`). 1.5.1 (2026-10-31) - komplet grafik kart Ameryki, uwaga o nazwach plików. 1.5.0 (2026-10-30) - Remik i Poker dla 2-4 graczy (silniki, widoki, stoły, interfejs). 1.4.0 - stoły online (człowiek/SI, zaproszenia, czat): `server/`, `geopolitics/server/`, `docs/ONLINE.md`, `TODO.md`. 1.3.0 - zależności npm tylko z rejestru; `TASK_STATUS.md`. 1.2.0 - konwencja grafik kart (WebP 512x768, paczki poza drzewem). 1.1.0 - `deploy.sh` i `.env.deploy`. 1.0.0 - pierwsza wersja: zakres, pułapki (build, manifest grafik, prefix),
uruchomienie lokalne przez `appctl` i wdrożenie przez `projects_manager`.

## Czym jest ten plik

**Obowiązuje każdego asystenta AI pracującego w `ops02/app_games/`. Przeczytaj go na starcie
sesji, przed pierwszą akcją.**

- Zakres: tylko ta aplikacja. Reguły wspólne (sposób pracy z Właścicielem, git, sekrety,
  dyscyplina zmian, zwykły `-` zamiast pauzy) są w `/home/vs/repo/AGENTS.md` - tu ich nie
  powtarzamy.
- Instrukcja JAK pracować, nie zapis CO zrobiono. Komendy i procedury są w
  `geopolitics/README.md`, plan w `geopolitics/PLAN.md`.

## Co to jest

Gry karciane przy stole: Geopolitix, Remik i Poker. Front w `geopolitics/` (Vite 7, React 19,
TypeScript; Node 22.12+). Dwa tryby:

- **gra lokalna z komputerem** - w całości w przeglądarce, zapis w `localStorage`, bez serwera;
- **stół online** (człowiek / SI, zaproszenia linkiem, czat tekstowy) - serwer w `server/` (Python,
  stdlib + SQLite), wołany przez `wsgi.py`; zasady gier wykonuje **ten sam kod silników** w Node
  (`geopolitics/server/runner.mjs`). Opis i protokół: **`docs/ONLINE.md`**, braki: **`TODO.md`**.

Bez zewnętrznych API i bez kont (tożsamość to ciasteczko). Poza `geopolitics/` leżą `wsgi.py`,
`server/`, `tests/`, `docs/`, `deploy.sh`.

- Katalog `app_games/` jest kluczem aplikacji w `appctl`/`projects_manager`, a projekt Vite
  siedzi poziom niżej. Komendy `npm` uruchamiaj w `geopolitics/`.
- Testy: `npm test` w `geopolitics/` (build, silniki, renderowanie, kompletność kart, widoki, pełne gry
  AI-vs-AI online i mecze 3-4 graczy) oraz `python3 -m unittest discover -s tests` w `app_games/` (API end-to-end i limity, wymaga `node`).
  Zmiana silnika albo `views.mjs` = oba zestawy.

## Pułapki

- **Manifest grafik kart liczy się z `public/cards` względem roota Vite** (`vite.config.ts`,
  `configResolved`). Wcześniej liczył się względem cwd, więc start z innego katalogu dawał
  pusty manifest i karty bez obrazków, bez żadnego błędu. Obie talie (`europe`, `america`) mają
  komplet grafik (po 44). **Nazwa pliku musi równać się kluczowi karty** (np. `orban.webp`, bez akcentu):
  plik o innej nazwie jest po cichu pomijany, więc po dodaniu grafik sprawdź pokrycie (`collectCardArt` vs `deckFor`).
- **Geopolitix na telefonie (<= 600 px) ma osobny układ** (`GeoGame.tsx`, gałąź `if(phone)`, elementy w `src/phone.tsx`,
  style na końcu `style.css`): jeden ekran bez przewijania (`useFillHeight`), plansza z samych grafik (`GeoTile`),
  statystyki między planszami, ręka i ruch w warstwach (`Layer`), koniec rundy jako okno na środku. Na tej trasie
  (`main.geo-route`) schowane są tryb testowy i stopka; dziennik gry nie jest renderowany. Widok komputerowy jest
  nietknięty (`tests/phone.test.mjs` sprawdza oba). Układ dotyczy tylko Geopolitix; Remik i Poker bez zmian.
- **Kolory „sukna” (plansze i stoły: `.felt`) tylko przez tokeny `--felt*`** (`--felt-text`, `--felt-muted`, `--felt-gold`,
  `--felt-rule`, `--felt-edge`...). W jasnym motywie sukno jest jasną szałwią z ciemnym tekstem (tekst 9,7:1, drugorzędny 5,0:1,
  złoty 5,1:1), w ciemnym - dawną ciemną zielenią; wartości ciemne są w obu blokach nadpisań (`prefers-color-scheme` i
  `[data-theme="dark"]`). Nie wpisuj jasnych kolorów tekstu na sztywno - zniknęłyby w jasnym motywie.
- **Build używa ścieżek względnych** (`base: './'`), więc pod prefiksem adres musi kończyć
  się `/` (`/games/`). `wsgi.py` przekierowuje `/games` na `/games/`; nie zmieniaj tego na
  ścieżki bezwzględne bez sprawdzenia `standalone.html`.
- **Zależności npm tylko z rejestru, jako numer wersji (`"19.2.14"`), nigdy jako URL, git ani `file:`.**
  npm na serwerze blokuje zależności remote (`EALLOWREMOTE`), więc `npm ci` w `BUILD_CMD` przerywa
  `setup`/`update` całego wdrożenia. Po zmianie `package.json` sprawdź, że lockfile nie ma takich wpisów.
- **Grafiki kart: tylko `.webp` 512x768 (jakość ok. 80, ok. 40-140 KB), nazwa = klucz karty,
  w `public/cards/<frakcja>/`.** Wszystko z `public/` trafia do `dist/` i na produkcję bez kompresji,
  więc paczki `.zip`, PNG i oryginały 1024x1536 zostają poza drzewem (`ops02/dev-files/app_games/`;
  `.gitignore` odrzuca `.zip` i `.png` w `public/cards`). Manifest i tak woli `.webp` przed `.png`.
  Konwersja: Pillow, `resize((512, 768), LANCZOS)`, `save(..., 'WEBP', quality=80, method=6)`.
- **Silniki są wspólne dla trybu lokalnego i serwera.** Zmiana w `geopolitics/src/engines/` zmienia też grę
  online; zachowuj zgodność wsteczną (np. `action.seat` w wymianie kart Geopolitix jest opcjonalne, a
  `setActorNames` domyślnie wyłączone, więc lokalnie nadal "Ty"/"Komputer").
- **Ukryta informacja online tylko przez `geopolitics/server/views.mjs`.** Nowe pole stanu z tajnymi
  kartami albo stanem losowania musi tam trafić (ukrycie i obrót miejsc), inaczej wycieknie do
  przeciwników. Nowe pole z indeksem miejsca (`turn`, `winner`...) trzeba tam obrócić. `tests/online.test.mjs`
  sprawdza szczelność i obrót na pełnych grach (2-4 miejsca) - dopisz przypadek.
- **Remik i Poker mają 2-4 graczy** (`newRummy(rng, n)`, `newPoker(rng, n)`), Geopolitix zawsze 2. Silniki nie
  zakładają `1 - p`: kolejność liczą z `players.length`. Dwóch graczy zachowuje dotychczasowe reguły (heads-up).
  Zmieniając poker sprawdź `tests/multiplayer.test.mjs` (zachowanie żetonów i kart w pełnych meczach 3-4 graczy).
- **Serwer pod gunicornem ma 3 workery** (`production_manager.sh`), więc stan jest w SQLite, nie w pamięci;
  zapisy idą przez `store.tx()` (`BEGIN IMMEDIATE`). Nie dodawaj globalnego stanu w procesie.
- **Node w runtime usługi**: systemd ma tylko PATH systemowy. `BUILD_CMD` zapisuje ścieżkę `node` do
  `${APP_DIR}/node-path` (`NODE_PATH_FILE`). Brak Node'a widać w `GET /api/health` (`node: null`).
- `dist/`, `node_modules/` i `data/` nie są w gicie. Produkcja buduje front sama (`BUILD_CMD`).

## Uruchomienie lokalne

- Przez `tools/appctl.py` (wiersz `ops02/app_games`): `python3 wsgi.py --port 5007` (zbudowany front + API;
  najpierw `cd geopolitics && npm ci && npm run build`), log w `tools/logs/`. Zaproszenia działają z innych
  urządzeń w LAN pod adresem komputera.
- Dev z HMR: `python3 wsgi.py --port 8012` i `cd geopolitics && npm run dev -- --port 5173 --strictPort`
  (Vite przekazuje `/api` na 8012).

## Wdrożenie

- Produkcja: `https://ops02.jdblayer.com/games/`, gunicorn `127.0.0.1:8012`, `/opt/apps/app_games`,
  wspólny vhost z moderacją (`NGINX_STRATEGY="prefix"`), konfiguracja
  `projects_manager/production_projects/games.env`.
- Wdrożenie wykonuje Właściciel: `./deploy.sh` (domyślnie `update`; też `setup|status|restart|logs`)
  z maszyny dev albo bezpośrednio `sudo production_manager.sh update games` na serwerze. `update` buduje
  front (`npm ci && npm run build` w `geopolitics/`) i restartuje usługę. Hosty bastionu i serwera
  w niewersjonowanym `.env.deploy` (wzór: `.env.deploy.example`); po wdrożeniu skrypt sprawdza
  `/games/` = 200, `/` = 302 (wspólny vhost z moderacją) i `/games/api/health` z wersją Node. Dane online
  w `/opt/apps/app_games/data` (poza katalogiem kodu; kopie: `docs/ONLINE.md`).
- Pierwsze `setup` wymaga rzeczy, których manager nie robi: repozytorium na GitHubie
  (`v0jt4s13/games`, jeszcze nie założone) z kluczem deploy, Node.js 22.12+ i npm na serwerze.
- `.env` na serwerze ma pierwszeństwo przed repo: po `git pull` sprawdź, że `games.env` ma aktualne
  `BUILD_CMD` i `EXTRA_SYSTEMD_ENV` (`NODE_PATH_FILE`, `GAMES_DATA_DIR`); `update` przepisuje unit systemd.
- Zmiana układu `dist/` albo prefiksu wymaga zmian w `wsgi.py`.

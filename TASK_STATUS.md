# TASK_STATUS - app_games

Stan na 2026-11-02. Plik nadpisywany przy kolejnym przekazaniu (nie jest historią).

## Frakcje Asia, Africa, South America w Geopolitix (2026-11-03)

- Talie `asia`, `africa`, `south_america` (po 50 kart, 44 klucze, z `GEOPOLITIX-NEW-FACTIONS-PROPOSAL.md`) w `src/data/geopolitix.mjs`; lista `factions` i `defaultOpponent` stamtąd czytają silnik,
  `runner.mjs`, `scripts/card-art.mjs`, UI i testy. Serwer ma lustro w `server/config.py` (`GEO_FACTIONS`) - przy nowej frakcji zmień oba.
- `newGeo(faction, rng, opponent)`: brak `opponent` = dotychczasowe europe<->america (asia -> europe). Stoły online mają `opts.faction` i
  `opts.opponent`; stare stoły bez `opponent` działają po staremu. Lokalnie przeciwnik: losowy albo wybrany.
- Nie oglądane w przeglądarce ani na telefonie. Balans: symulacja bot-vs-bot, wynik w rozmowie, nie w repo.

## Cel

Gry karciane (`geopolitics/`: Geopolitix, Remik, Poker) pod `https://ops02.jdblayer.com/games/`
(`projects_manager`, gunicorn `127.0.0.1:8012`). Dodane **stoły online**: gra z człowiekiem i z SI,
wybór graczy na miejscach, zaproszenia linkiem, czat tekstowy (wzorowane na kronikach Aetherii).
Architektura i protokół: `docs/ONLINE.md`. Braki i rzeczy do zrobienia: `TODO.md`.

## Geopolitix na telefonie: nazwy wierszy i znacznik karty taktycznej (2026-11-01)

- Nazwa wiersza (Dyplomacja / Gospodarka / Bezpieczeństwo) po prawej stronie każdego wiersza, litery od góry do dołu; rozmiar
  liczony z wysokości wiersza (`cqh`). Z `.stat-side` usunięte wyniki rzędów i linia efektów.
- Karta taktyczna (wydarzenie, wymiana, ochrona, przesunięcie, oczyszczenie, łapówka) zapisuje w silniku `state.lastPlay`;
  telefon podświetla te wiersze ok. 4,5 s (nie po wczytaniu zapisu). Test: `tests/tactic-marks.test.mjs` (5), widok drugiego
  gracza obraca miejsca. Nie oglądane na telefonie.

## Geopolitix na telefonie (2026-11-01)

- Układ jednoekranowy (<= 600 px): plansza z samych grafik kart (szczegóły po dotknięciu, w tym "Siła teraz"), statystyki
  (suma, ręka/talia/cmentarz, wyniki rzędów, efekty, pas, runda, wygrane rundy, tura) w pasie między planszami, ręka jako
  warstwa z listą grafik, dotknięcie karty otwiera kolejną warstwę z ruchami, koniec rundy jako okno na środku.
  Przy wymianie kart warstwa ręki otwiera się sama. Test: `tests/phone.test.mjs` (render z wymuszonym telefonem); `npm test` 54.
  **Nie oglądany na telefonie.** Propozycje do akceptacji: `TODO.md`.

## Grafiki kart Ameryki (2026-10-31)

- `public/cards/america`: 44 karty, WebP 512x768 (82,8 MB -> 4,1 MB); obie talie mają komplet grafik (44/44).
  Naprawiona nazwa `europe/orbán.webp` -> `orban.webp` (klucz karty bez akcentu; wcześniej Orbán nie miał grafiki).
- Poza drzewem, w `ops02/dev-files/app_games/cards-zrodla/` (poza gitem, bez kopii): 44 PNG źródeł Ameryki,
  archiwum `geopolitix-north-america-44.zip` i `america-webp-1024x1536.tar` (oryginały WebP przed konwersją).

## Remik i Poker dla 2-4 graczy

- Silniki (`poker.mjs`, `rummy.mjs`): n graczy zamiast `1 - p`; poker z blindami i kolejnością dla 3-4 graczy,
  odpadaniem, pulami bocznymi i wygraną przez spasowanie reszty; dwóch graczy bez zmian (29 istniejących testów OK).
  `tests/multiplayer.test.mjs`: pozycje, spasowanie do jednego, odpadanie, 3 all-iny, pełne mecze 3-4 graczy z kontrolą
  żetonów i kart, Remik 3-4 graczy, limit tur.
- Widoki (`views.mjs`): obrót miejsc o k zamiast odbicia, ukrycie kart wszystkich pozostałych; testy 2-4 miejsca.
- Serwer: stół ma 2-4 miejsc (`players`), widoki w kolumnie `views` z migracją starych baz; testy API 26.
- Interfejs: wybór liczby graczy (gra lokalna i hub online), przeciwnicy w pętli, nazwy w kolejności widoku, wyniki
  dla wielu graczy; `tests/multiplayer-ui.test.mjs` (SSR). **Układ stołu 3-4 graczy nie był oglądany w przeglądarce.**

## Zrobione i zweryfikowane

- **Wdrożenie podstawowe** (poprzednie tury): front działa na serwerze (potwierdził Właściciel),
  `deploy.sh`, `games.env`, grafiki WebP, poprawka `npm ci`.
- **Silniki** (`geopolitics/src/engines/`): nazwy graczy w dzienniku (`setActorNames`), wymiana kart
  Geopolitix dla dwóch miejsc (`action.seat`, zgodnie wstecznie). Test: `npm test` 41/41.
- **Runner i widoki** (`geopolitics/server/`): serwer autorytatywny, widoki bez stanu losowania, niedobranych
  kart i kart przeciwnika, odbicie miejsc. Test: `tests/online.test.mjs` - pełne gry AI-vs-AI we wszystkich
  trzech grach (obie frakcje Geopolitix), szczelność widoków w każdym kroku, odrzucanie ruchów poza turą.
- **Serwer** (`server/`, `wsgi.py`): tożsamość (ciasteczko), stoły, miejsca (człowiek/SI/puste), zaproszenia
  jednorazowe 24 h, ruchy z SI, odzyskiwanie miejsca, czat (limit, wyciszanie, zamknięcie, czyszczenie).
  Test: `python3 -m unittest discover -s tests` - 19 testów end-to-end przez WSGI (z prawdziwym Node i SQLite).
  Po HTTP (wsgiref): health, ciasteczko pod prefiksem `/games/`, ochrona CSRF, tworzenie stołu, statyki.
- **Interfejs** (`geopolitics/src/online/`, `main.tsx`): hub, dołączanie, poczekalnia z wyborem miejsc,
  rozgrywka na istniejących komponentach gier, czat. Test: `tsc` i build przechodzą.
- **`tools/appctl.py`**: `ops02/app_games` startuje `python3 wsgi.py --port 5007` (front + API); 45 testów OK.
- **Konfiguracja**: `games.env` (`BUILD_CMD` zapisuje ścieżkę node, `NODE_PATH_FILE`, `GAMES_DATA_DIR`),
  `deploy.sh` kontroluje `/api/health`.

## Zrobione, niesprawdzone

- **Interfejs online nie był oglądany w przeglądarce** (tylko typy, build, API). To pierwszy punkt `TODO.md`.
- Całość na serwerze po tej zmianie: `update`, Node w runtime usługi, nginx, ciasteczko, `/api/health`.
- Gunicorn z 3 workerami (lokalnie `wsgiref` i testy przez WSGI).

## Kolejne kroki

1. Kod jest wypchnięty (`origin/main` = `cf3839a`, repo `v0jt4s13/games`). Na serwerze: `git pull` w `projects_manager`
   (zmieniony `games.env`), sprawdzić `.env` serwera (ma pierwszeństwo), potem `./deploy.sh update` (kontrola `/api/health`).
   Czy stoły online i układ telefoniczny są już wdrożone na ops02, nie ustalono.
2. Przetestować na telefonie i w dwóch przeglądarkach (P1 w `TODO.md`): układ telefoniczny Geopolitix, nazwy wierszy,
   podświetlenie wiersza po karcie taktycznej, stoły 3-4 graczy. Serwer LAN: `http://192.168.0.151:5007/` (`appctl`).
3. Reszta `TODO.md` (kopie bazy, głos, konta, SSE, limity).

## Otwarte decyzje Właściciela

- Historia gita ma 146 MB (zipy i PNG w pierwszym commicie): przepisanie tylko za zgodą.
- Czy dodawać głos (TURN, HTTPS) i konta (Google) - odrębne etapy.

## Dla współpracujących agentów (nie wynika z samego kodu)

- Silniki są wspólne dla gry lokalnej i serwera; ukryta informacja online przechodzi wyłącznie przez
  `geopolitics/server/views.mjs`. Szczegóły i pułapki: `AGENTS.md`.
- `tools/`: commit `94b1c35` (start/restart zestawów Compose budują obraz) jest niewypchnięty; cudze nieśledzone
  `disk-audit.sh` i `depricated/reelgen-zlecenia.tar.gz` zostają.
- **Niezacommitowana praca Właściciela w `app_games`:** `geopolitics/src/main.tsx` i `style.css` (kafelek „Kroniki Aetherii” w lobby,
  stopka „Cztery gry”). Nie commituj tego przy okazji innych zmian.
- Zmiany wizualne: Właściciel testuje na telefonie przez LAN (`appctl`, port 5007) i oczekuje dokładnie tego, o co prosi;
  propozycje dodatków zgłaszaj do akceptacji (`TODO.md`), nie wdrażaj ich. Układ telefoniczny dotyczy tylko Geopolitix.
- Kroniki Aetherii (`ops02/app_kroniki-aetherii-part-1`) to osobne repo Właściciela. Lokalny obraz Dockera jest wersją z drzewa
  roboczego (zbudowany 2026-11-02 02:31, przed `Release 0.1.3`); aktualizuje go `appctl --restart ops02/app_kroniki-aetherii-part-1`.
- Główny `/home/vs/repo/AGENTS.md` nie jest pod gitem (wiersz `app_games` w tabeli rozdziału 1 wskazuje ten projekt).
- Kopie `ops02/dev-files/app_games/cards-zrodla/` (paczki grafik) są poza gitem.

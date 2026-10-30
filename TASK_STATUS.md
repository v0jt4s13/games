# TASK_STATUS - app_games

Stan na 2026-10-30. Plik nadpisywany przy kolejnym przekazaniu (nie jest historią).

## Cel

Gry karciane (`geopolitics/`: Geopolitix, Remik, Poker) pod `https://ops02.jdblayer.com/games/`
(`projects_manager`, gunicorn `127.0.0.1:8012`). Dodane **stoły online**: gra z człowiekiem i z SI,
wybór graczy na miejscach, zaproszenia linkiem, czat tekstowy (wzorowane na kronikach Aetherii).
Architektura i protokół: `docs/ONLINE.md`. Braki i rzeczy do zrobienia: `TODO.md`.

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

1. Wypchnąć kod (repo `v0jt4s13/games`) i na serwerze `git pull` w `projects_manager` (zmieniony `games.env`),
   sprawdzić `.env` serwera (ma pierwszeństwo), potem `./deploy.sh update` (kontrola `/api/health`).
2. Przetestować w dwóch przeglądarkach (P1 w `TODO.md`), poprawić znalezione błędy interfejsu.
3. Reszta `TODO.md` (kopie bazy, głos, konta, SSE, limity).

## Otwarte decyzje Właściciela

- Historia gita ma 146 MB (zipy i PNG w pierwszym commicie): przepisanie tylko za zgodą.
- Czy dodawać głos (TURN, HTTPS) i konta (Google) - odrębne etapy.

## Dla współpracujących agentów (nie wynika z samego kodu)

- Silniki są wspólne dla gry lokalnej i serwera; ukryta informacja online przechodzi wyłącznie przez
  `geopolitics/server/views.mjs`. Szczegóły i pułapki: `AGENTS.md`.
- `tools/` ma niezacommitowane zmiany `appctl.py`, `appctl_tests.py`, `README.md` (wpis `app_games`);
  cudze nieśledzone `disk-audit.sh`, `depricated/reelgen-zlecenia.tar.gz` zostają.
- Główny `/home/vs/repo/AGENTS.md` nie jest pod gitem (sekcja 1.14 opisuje `app_games`).
- Kopie `ops02/dev-files/app_games/cards-zrodla/` (paczki grafik) są poza gitem.

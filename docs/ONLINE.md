# Stoły online - architektura i obsługa

Gra z człowiekiem i z SI przy wspólnym stole (Geopolitix: 2 graczy, **Remik i Poker: 2-4 graczy**): wybór graczy na miejscach (jak w kronikach
Aetherii), zaproszenia jednorazowym linkiem i rozmowa tekstowa. Gra lokalna z komputerem
(`#geopolitix`, `#remik`, `#poker`) działa jak wcześniej, w przeglądarce, bez serwera.

## Jak to działa

```
przegladarka  --HTTP, polling 1 s-->  nginx (/games/)  -->  gunicorn: wsgi.py
                                                              |-- /api/*  server/api.py, logic.py (SQLite)
                                                              |            |-- engine.py --> node runner.mjs (zasady gier)
                                                              `-- reszta  geopolitics/dist (statyki)
```

- **Serwer jest autorytatywny.** Pełny stan gry leży w SQLite (`tables.state`). Ruch gracza trafia
  do `POST /api/tables/<id>/action`, serwer wywołuje **te same silniki** co lokalna gra
  (`geopolitics/src/engines/*.mjs`) przez `geopolitics/server/runner.mjs` i zapisuje wynik.
- **Ukryta informacja** (`geopolitics/server/views.mjs`): każdy gracz dostaje własny *widok* -
  bez stanu generatora losowania, bez niedobranych kart i bez kart przeciwnika (zamiast nich
  znaczniki `hidden`, żeby liczby kart się wyświetlały). Widoki liczy runner przy każdej zmianie
  stanu i serwer zapisuje je w bazie (`view0`, `view1`), więc odpytywanie nie uruchamia Node'a.
- **Obrót miejsc.** Interfejs zakłada "ja = miejsce 0, pozostali w kolejności przy stole". Widok miejsca k
  ma więc obrócone miejsca: nowy indeks i to stary `(k + i) % n` (`players`, `turn`, `dealer`, `winner`,
  `pending`, wyniki, właściciele układów...; dla dwóch graczy to dawne "odbicie"). Dzięki temu komponenty
  gier działają bez zmian logiki; tryb online tylko wyłącza lokalnego bota (`useOnline()` w `ui.tsx`)
  i podmienia nazwy graczy (`names` w kolejności widoku, `useSeatName()`).
- **Ruchy z interfejsu** idą na serwer przez `setMoveSink` (`trace.mjs`): `trackMove` zamiast liczyć
  lokalnie wysyła akcję HTTP, a nowy stan przychodzi z kolejnym odpytaniem (po ruchu klient odpytuje
  od razu).
- **SI** gra na serwerze. Ruch SI wykonuje pierwsze odpytanie po upływie `GAMES_AI_DELAY` (0,9 s),
  więc nie ma procesu w tle; gdy nikt nie odpytuje, gra czeka. Silnik SI to `*BotAction` z lokalnej gry.
- **Nazwy graczy** są wpisywane do dziennika gry w chwili startu (`setActorNames`), dlatego miejsce
  opuszczone w trakcie gry zachowuje nazwę (`keep`) i wraca z nią po zaproszeniu.

## Miejsca i zaproszenia

- Gospodarz zajmuje miejsce 1 (przy stole dwuosobowym można zamienić). Każde pozostałe miejsce: **człowiek**
  (zaproszenie), **SI** albo puste. Liczbę miejsc wybiera gospodarz przy tworzeniu stołu (`players`, 2-4 dla
  Remika i Pokera). W Geopolitix miejsce 1 gra `opts.faction`, drugie `opts.opponent` (europe, america, asia; brak przeciwnika = europe<->america; zamiana miejsc zamienia frakcje).
- Zaproszenie: link `…/#dolacz/<stol>.<sekret>`; sekret jest w fragmencie adresu (nie trafia do logów nginx),
  w bazie tylko jego skrót SHA-256. **Jednorazowe, ważne 24 godziny**, do 6 aktywnych na stół, gospodarz
  może je odwołać. Dołączenie wymaga kliknięcia na stronie zaproszenia (nie dzieje się przy samym otwarciu linku).
- Odzyskanie miejsca (utrata ciasteczka, inne urządzenie): gospodarz tworzy nowe zaproszenie na miejsce
  zajęte przez człowieka; po użyciu zastępuje ono poprzedniego gracza (także w trakcie gry).
- Bez konta: tożsamość to losowy token w ciasteczku `games_pid` (HttpOnly, SameSite=Lax, ścieżka
  `/games/`), w bazie tylko skrót. Imię (do 24 znaków) zapisane po stronie serwera.

## Rozmowa

Do 2000 znaków, Enter wysyła, Shift+Enter dodaje wiersz, nieudane wiadomości mają przycisk ponowienia,
historia stronicowana (50), retencja 30 dni. Widzą ją i piszą tylko osoby siedzące przy stole. Gospodarz
może zamknąć rozmowę, wyczyścić historię i wyciszyć drugiego gracza. Limit 20 wiadomości na minutę na
gracza. Treści nie są nigdzie wysyłane poza serwer. **Brak głosu** (patrz `TODO.md`).

## API (`/api/*`, JSON)

Zapisy wymagają nagłówka `X-Requested-With: games` (ochrona przed CSRF) i ciasteczka tożsamości.

| Metoda i ścieżka | Kto | Działanie |
|---|---|---|
| `GET /health` | każdy | `{ok, node, games}`; `node: null` = brak Node.js w runtime |
| `GET /me`, `POST /me` | każdy | tworzy tożsamość (ciasteczko) / zmienia imię |
| `GET /tables`, `POST /tables` | gracz | moje stoły / nowy stół `{game, faction?, opponent?, players?}` (`players` 2-4 dla remika i pokera) |
| `POST /join` | gracz | `{code}` - zajęcie zaproszonego miejsca |
| `GET /tables/<id>?v=&c=&ce=` | siedzący | odpytywanie: pełny stan, gdy zmieniła się wersja; inaczej tylko obecność i nowe wiadomości |
| `POST /tables/<id>/seat` | gospodarz | `{seat, kind: ai\|empty}` albo `{op: swap}` (tylko przed startem) |
| `POST /tables/<id>/invite`, `/invite/revoke` | gospodarz | utworzenie / odwołanie zaproszenia |
| `POST /tables/<id>/start` | gospodarz | start albo nowa gra przy tym samym stole |
| `POST /tables/<id>/action` | siedzący | `{action}` - ruch (serwer sprawdza turę, miejsce i legalność) |
| `POST /tables/<id>/leave`, `/close` | siedzący / gospodarz | opuszczenie / zamknięcie stołu |
| `GET/POST /tables/<id>/chat`, `POST …/chat/admin` | siedzący / gospodarz | historia, wysłanie, moderacja |

## Konfiguracja i dane

| Zmienna | Znaczenie |
|---|---|
| `GAMES_DATA_DIR` | katalog SQLite (`games.sqlite`); produkcja `/opt/apps/app_games/data`, lokalnie `app_games/data/` |
| `NODE_BIN` | bezwzględna ścieżka `node` (nadpisuje resztę) |
| `NODE_PATH_FILE` | plik z ścieżką `node`, zapisywany przez `BUILD_CMD`; usługa systemd ma tylko PATH systemowy |
| `GAMES_AI_DELAY` | opóźnienie ruchu SI w sekundach (domyślnie 0,9) |
| `SCRIPT_NAME` | prefiks (`/games`), ustawia go `production_manager.sh` |

Widoki graczy są w kolumnie `tables.views` (JSON, jeden na miejsce). Bazy sprzed stołów 3-4-osobowych (kolumny
`view0`/`view1`) są migrowane przy pierwszym połączeniu (`store._migrate`).

Baza działa w trybie WAL; nie kopiuj pliku `games.sqlite` w trakcie pracy bez `-wal` i `-shm` (użyj
`sqlite3 games.sqlite ".backup kopia.sqlite"`). Stoły bez aktywności przez 30 dni są sprzątane
przy tworzeniu nowych.

## Ochrona maszyny przed nadużyciem

Aplikacja stoi na maszynie z innymi usługami, a każdy start gry i ruch uruchamia krótki proces Node.
Dlatego: limity na adres klienta (nagłówek `X-Real-IP` ustawia nginx i nadpisuje wartość od klienta) -
30 nowych tożsamości na godzinę i 240 zapisów na minutę (`THROTTLE`), globalne limity graczy (50 000)
i stołów (2 000), limit wiadomości czatu, 10 stołów na gospodarza. Przekroczenie daje HTTP 429/503.
Gunicorn ma 3 workery, więc przeciążenie dotyka tylko tej usługi. Dodatkowo (decyzja Właściciela) można
ograniczyć zasoby usługi w systemd: `sudo systemctl set-property games MemoryMax=512M CPUQuota=100%`.

## Uruchomienie i testy

- Lokalnie (LAN): `cd geopolitics && npm ci && npm run build`, potem `python3 wsgi.py --port 5007`
  (tak startuje je `tools/appctl.py`). Zaproszenia działają z innych urządzeń pod adresem komputera.
- Dev z HMR: `python3 wsgi.py --port 8012` oraz `npm run dev` w `geopolitics/` (Vite przekazuje `/api`
  na 8012, zmienna `GAMES_API`).
- Testy: `npm test` w `geopolitics/` (silniki, widoki, pełne gry AI-vs-AI) i
  `python3 -m unittest discover -s tests` w `app_games/` (API end-to-end, wymaga `node`).

## Czego nie ma

Patrz `TODO.md` (głos, konta, otwarte stoły, widzowie, SSE, test w przeglądarce...).

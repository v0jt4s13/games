# TASK_STATUS - app_games

Stan na 2026-10-30. Plik nadpisywany przy kolejnym przekazaniu (nie jest historią).

## Cel

Gry karciane (`geopolitics/`: Geopolitix, Remik, Poker, Vite + React) uruchamiane lokalnie
przez `tools/appctl.py` i wdrożone na ops02 jako `https://ops02.jdblayer.com/games/`
(`projects_manager`, gunicorn `127.0.0.1:8012`, wspólny vhost z moderacją).

## Zrobione i zweryfikowane

- `tools/appctl.py`: wiersz `ops02/app_games`, start Vite na `0.0.0.0:5007`, wpis `games` w
  `MAPA_KATALOGOW`. Test: `python3 -m unittest appctl_tests` (45 OK), komenda startu rozwiązuje
  się, Vite na 5007 odpowiada 200 po IP z LAN. Commit `tools`: `b238660`.
- Brak obrazów na kartach: manifest grafik liczył się względem cwd (start z `app_games/`
  dawał `__GEOPOLITIX_ART__={}`). Poprawione w `geopolitics/vite.config.ts` (root z
  `configResolved`). Test: manifest po restarcie ma 43 klucze, pliki 200.
- Grafiki kart: 46 plików WebP 512x768 (81,3 MB -> 4,0 MB), PNG-duplikaty usunięte, trzy `.zip`
  (61 MB) przeniesione do `ops02/dev-files/app_games/cards-zrodla/` (sumy SHA-256 zgodne).
  Test: `npm test` 35/35, klucze manifestu przed i po identyczne. Oryginały w tarze w scratchpadzie
  sesji (87 MB, tymczasowy, może zniknąć).
- `wsgi.py` (serwuje tylko `geopolitics/dist`, przekierowanie `/games` -> `/games/`, blokada
  wyjścia poza `dist/`): testowany przez `wsgiref`, nie przez gunicorna.
- `projects_manager/production_projects/games.env` (commit `12101fb`): wczytuje się w bashu,
  port 8012 i nazwa `games` bez kolizji z innymi `.env`.
- `deploy.sh` (bastion + `ssh -t ... sudo production_manager.sh`, kontrola `/games/`=200 i
  `/`=302): `bash -n` oraz atrapa `ssh`/`curl`. Na prawdziwym serwerze nieuruchamiany.
- `package.json`/lockfile: `@types/react` i `@types/react-dom` z rejestru zamiast URL-i
  (commit `8c35234`), bo npm na serwerze odrzucił zależności remote (`EALLOWREMOTE`).
  Test: `npm ci` w czystym katalogu OK, brak specyfikacji URL/git/file w lockfile.
- Repo `v0jt4s13/games` założone, `main` zgodny z `origin/main` (commity `d6db764`, `8c35234`, `fca5aa9`).

## Zrobione, niesprawdzone

- Poprawka `EALLOWREMOTE` na serwerze: nie udało się odtworzyć ograniczenia lokalnie
  (lokalny npm 11.8.0, flaga `--allow-remote=none` nie wywołała błędu na starej wersji).
- Cały `production_manager.sh setup games` po poprawce, gunicorn z `wsgi.py`, vhost `prefix`
  w `moderacja.conf` i kontrola `/games/` + `/`: nie wykonane (po błędzie `npm ci` venv i
  gunicorn były już zainstalowane).

## Do zrobienia

1. Na serwerze po `git pull`/nowym checkoucie: `sudo ./production_manager.sh setup games`
   (lub `./deploy.sh setup` po założeniu `.env.deploy` z `.env.deploy.example`), potem
   `curl -sI https://ops02.jdblayer.com/games/` (200) i `.../` (302).
2. Jeśli `npm ci` znowu padnie: log z serwera; sprawdzić wersję Node (wymagane 22.12+) i npm.
3. Grafiki dla `america`: `geopolitics/public/cards/america/`, WebP 512x768, nazwy = klucze kart
   (konwencja w `AGENTS.md`).

## Otwarte decyzje Właściciela

- Historia gita ma 146 MB (zipy i PNG w pierwszym commicie, już wypchniętym). Zmniejszenie
  wymaga `git filter-repo` i `push --force` - nie wykonywane bez zgody; aktualnie `git clone`
  (także na serwerze przy `setup`) ściąga całość raz.
- `npm audit`: 8 podatności (5 wysokich) wyłącznie w narzędziach deweloperskich
  (nanoid, picomatch i inne, `overrides`); `--omit=dev` daje 0. Nie aktualizowane.
- `.env.deploy`: hosty bastionu i serwera nie są w repo; w `~/.ssh/config` nie ma aliasu ops02
  (nie czytałem `app_mediagenerator/.env.deploy`).

## Dla współpracujących agentów (nie wynika z samego kodu)

- Klucz aplikacji w `appctl`/`projects_manager` to `ops02/app_games`, ale projekt jest w
  `geopolitics/`; `appctl` startuje z `app_games/`, więc komendy używają ścieżek względnych
  i nie wolno zakładać cwd w `geopolitics/`.
- `tools/` ma commit `b238660`, który obejmuje też wpisy `reelgen`, `testy-na-prawko` i
  `kroniki-aetherii` (były niezacommitowane razem z moimi). W `tools` zostają cudze, nieśledzone:
  `disk-audit.sh`, `depricated/reelgen-zlecenia.tar.gz`.
- Główny `/home/vs/repo/AGENTS.md` (v1.23.0, sekcja 1.14 dla `app_games`) nie jest pod gitem,
  więc ta zmiana nie ma commita.
- `ops02/dev-files/` jest poza gitem: paczki grafik tam nie mają historii ani kopii.

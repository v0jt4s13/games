# AGENTS.md - app_games

**Wersja: 1.2.0** (2026-10-30) - konwencja grafik kart (WebP 512x768, paczki poza drzewem). 1.1.0 - `deploy.sh` i `.env.deploy`. 1.0.0 - pierwsza wersja: zakres, pułapki (build, manifest grafik, prefix),
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

Gry karciane przy stole: Geopolitix, Remik i Poker przeciw komputerowi. Cały kod jest w
`geopolitics/` (Vite 7, React 19, TypeScript; Node 22.12+). **Bez backendu**, bez kont i bez
zewnętrznych API; zapis partii w `localStorage` przeglądarki. Poza `geopolitics/` leżą tylko
`wsgi.py` (serwer produkcyjny), `.gitignore` i ten plik.

- Katalog `app_games/` jest kluczem aplikacji w `appctl`/`projects_manager`, a projekt Vite
  siedzi poziom niżej. Komendy `npm` uruchamiaj w `geopolitics/`.
- Testy: `npm test` w `geopolitics/` (robi build, potem silniki, renderowanie, kompletność kart).

## Pułapki

- **Manifest grafik kart liczy się z `public/cards` względem roota Vite** (`vite.config.ts`,
  `configResolved`). Wcześniej liczył się względem cwd, więc start z innego katalogu dawał
  pusty manifest i karty bez obrazków, bez żadnego błędu. Grafiki ma na razie tylko `europe`
  (brak `public/cards/america`).
- **Build używa ścieżek względnych** (`base: './'`), więc pod prefiksem adres musi kończyć
  się `/` (`/games/`). `wsgi.py` przekierowuje `/games` na `/games/`; nie zmieniaj tego na
  ścieżki bezwzględne bez sprawdzenia `standalone.html`.
- **Grafiki kart: tylko `.webp` 512x768 (jakość ok. 80, ok. 40-140 KB), nazwa = klucz karty,
  w `public/cards/<frakcja>/`.** Wszystko z `public/` trafia do `dist/` i na produkcję bez kompresji,
  więc paczki `.zip`, PNG i oryginały 1024x1536 zostają poza drzewem (`ops02/dev-files/app_games/`;
  `.gitignore` odrzuca `.zip` i `.png` w `public/cards`). Manifest i tak woli `.webp` przed `.png`.
  Konwersja: Pillow, `resize((512, 768), LANCZOS)`, `save(..., 'WEBP', quality=80, method=6)`.
- `dist/` i `node_modules/` nie są w gicie. Produkcja buduje front sama (`BUILD_CMD`).

## Uruchomienie lokalne

- Przez `tools/appctl.py` (wiersz `ops02/app_games`): Vite na `0.0.0.0:5007`, log w `tools/logs/`.
- Ręcznie: `cd geopolitics && npm ci && npm run dev -- --port 5173 --strictPort`.

## Wdrożenie

- Produkcja: `https://ops02.jdblayer.com/games/`, gunicorn `127.0.0.1:8012`, `/opt/apps/app_games`,
  wspólny vhost z moderacją (`NGINX_STRATEGY="prefix"`), konfiguracja
  `projects_manager/production_projects/games.env`.
- Wdrożenie wykonuje Właściciel: `./deploy.sh` (domyślnie `update`; też `setup|status|restart|logs`)
  z maszyny dev albo bezpośrednio `sudo production_manager.sh update games` na serwerze. `update` buduje
  front (`npm ci && npm run build` w `geopolitics/`) i restartuje usługę. Hosty bastionu i serwera
  w niewersjonowanym `.env.deploy` (wzór: `.env.deploy.example`); po wdrożeniu skrypt sprawdza
  `/games/` = 200 i `/` = 302 (wspólny vhost z moderacją).
- Pierwsze `setup` wymaga rzeczy, których manager nie robi: repozytorium na GitHubie
  (`v0jt4s13/games`, jeszcze nie założone) z kluczem deploy, Node.js 22.12+ i npm na serwerze.
- Zmiana kodu gry nie wymaga zmian w `wsgi.py`; zmiana układu `dist/` albo prefiksu - tak.

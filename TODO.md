# TODO - app_games

Stan na 2026-10-30. Priorytet: **P1** blokuje albo grozi wdrożeniu, **P2** ważne, **P3** pomysły.
Opis działania: `docs/ONLINE.md`, przekazanie: `TASK_STATUS.md`.

## P1 - przed uznaniem wdrożenia za gotowe

- [ ] **Test interfejsu online w przeglądarce.** Nowy interfejs (hub, poczekalnia, miejsca, zaproszenia,
  rozgrywka, czat) przeszedł tylko `tsc`, build i testy API; nie był oglądany w przeglądarce.
  Sprawdzić dwiema przeglądarkami (albo normalna + prywatne okno): utworzenie stołu, zaproszenie linkiem,
  start, ruchy w trzech grach, SI, czat, odświeżenie strony w trakcie gry, telefon.
- [ ] **Weryfikacja na serwerze.** `curl https://ops02.jdblayer.com/games/api/health` musi dać
  `"node":"v22..."`. Jeśli `null`: Node nie jest w login PATH użytkownika `games` albo `BUILD_CMD` nie zapisał
  `/opt/apps/app_games/node-path`. Sprawdzić też, że `.env` na serwerze (`games.env`) ma nowe `BUILD_CMD` i
  `EXTRA_SYSTEMD_ENV` (serwerowe `.env` ma pierwszeństwo przed repo), a `systemctl cat games` zawiera
  `NODE_PATH_FILE` i `GAMES_DATA_DIR`.
- [ ] **Katalog danych i uprawnienia.** `/opt/apps/app_games/data` tworzy aplikacja przy pierwszym żądaniu;
  potwierdzić, że właścicielem jest `games` (nie root) i że `ProtectSystem=full` nie przeszkadza.
- [ ] **Nginx i ciasteczko.** Potwierdzić, że ciasteczko `games_pid` ma ścieżkę `/games/` i że po
  `https` dostaje `Secure` (wymaga `X-Forwarded-Proto` od nginx); polling co 1 s nie jest ucinany limitami.
- [ ] **Kopie zapasowe** `/opt/apps/app_games/data/games.sqlite` (patrz `docs/ONLINE.md`, `sqlite3 .backup`).
  Dane to stoły i czat, nie konta, ale utrata przerywa trwające gry.

## P2 - niedokończone fragmenty i luki

- [ ] **Geopolitix na telefonie: układ jednoekranowy nie był oglądany na urządzeniu.** Test renderowania sprawdza strukturę,
  ale nie wysokości, zawijanie ani dotyk. Sprawdzić na telefonie: wysokość planszy, czytelność przy wielu kartach w rzędzie
  (karty zwężają się i są przycinane), warstwy, przy okazji też tryb online (plansza liczy wysokość od swojej pozycji).
- [ ] **Do akceptacji (propozycje, nie wdrożone):** (1) małe etykiety rzędów na planszy, bo bez nich rzędy rozpoznaje się
  tylko po układzie; (2) menu z dziennikiem gry, trybem testowym i zasadami (na telefonie w Geopolitix są dziś niedostępne
  tryb testowy, stopka i dziennik); (3) przycisk „Zobacz planszę” w oknie końca rundy; (4) ten sam układ dla Remika i Pokera.

- [ ] **Poker i Remik dla 3-4 graczy: układ w przeglądarce.** Silniki i widoki są przetestowane (pełne mecze
  3-4 graczy, szczelność widoków, renderowanie), ale układ stołu na wąskich ekranach (4 miejsca, 6 zakrytych kart
  przeciwników) nie był oglądany. Do sprawdzenia razem z testem online (P1).
- [ ] **Bot pokera/remika** gra tak samo przy 2 i 4 graczach (prosta heurystyka, bez oceny liczby przeciwników,
  bez blefu). Przy 4 graczach jest słabszy/bardziej przewidywalny; osobne zadanie.
- [ ] **Poker: pule boczne w interfejsie** - wypłaty są pokazane w sumie na gracza, bez rozbicia na pule.
- [ ] **Gra lokalna 3-4 graczy**: komputery grają po kolei co ok. 0,6-0,85 s; przy czterech graczach rozdanie
  trwa dłużej. Pauza i "jeden ruch komputera" w trybie testowym działają dla dowolnego komputera.

- [ ] **Głos** (jest w kronikach: WebRTC + TURN, "Mic", wyciszanie). Tu tylko tekst. Wymaga TURN
  (`compose.turn.yaml` z kronik) i HTTPS; osobny etap.
- [ ] **Konta i zaproszenia przypisane do konta** (w kronikach: logowanie Google). Teraz tożsamość to ciasteczko;
  utrata ciasteczka = nowe zaproszenie od gospodarza.
- [ ] **Polling zamiast WebSocket/SSE.** Opóźnienie ruchu przeciwnika do ok. 1 s, a gunicorn ma 3 workery
  sync; przy większym ruchu przejść na SSE/long-poll (wymaga `proxy_buffering off` w nginx) albo na wątki.
- [ ] **Brak optymistycznego UI**: po ruchu widok odświeża się dopiero po odpowiedzi serwera (ok. 0,2-1 s).
- [ ] **Bezczynność i porzucone gry**: brak limitu czasu tury, "AFK", przejęcia tury przez SI, powiadomienia
  (dźwięk, tytuł karty) o ruchu przeciwnika.
- [ ] **Limity nadużyć** (aplikacja dzieli maszynę z innymi usługami). Są: czat 20/min, 10 stołów na gospodarza,
  6 zaproszeń, **na adres IP** 30 nowych tożsamości/godz. i 240 zapisów/min (`THROTTLE` w `server/config.py`),
  globalnie 50 000 graczy i 2 000 stołów. Brak: limitu odpytywania (GET), limitów na nginx (`limit_req`)
  i limitów zasobów usługi w systemd (`MemoryMax`, `CPUQuota` - patrz `docs/ONLINE.md`).
- [ ] **Moderacja czatu**: tylko zamknięcie, wyczyszczenie, wyciszenie. Brak zgłaszania, edycji i usuwania
  pojedynczych wiadomości oraz filtra treści. Regulamin i polityka prywatności (imię, treść czatu 30 dni) - do uzupełnienia.
- [ ] **Geopolitix: wymiana kart.** Po zatwierdzeniu własnej wymiany przycisk jest zablokowany, ale brak
  komunikatu "czekasz na przeciwnika". SI nie wymienia kart (`ids: []`).
- [ ] **Dziennik testowy** (`TraceLog`) działa tylko lokalnie; online jest prosty przebieg gry. Eksport śladu online - brak.
- [ ] **Sprzątanie** starych stołów jest oportunistyczne (przy tworzeniu stołu), nie z crona.
- [ ] **Testy UI w przeglądarce** (Playwright) i test dwóch klientów przeciw prawdziwemu serwerowi: brak.
  Testy API (`tests/test_server.py`) i silników (`tests/online.test.mjs`) są.
- [ ] **Dostępność panelu czatu** (aria-live, fokus po wysłaniu, czytnik ekranu): nie sprawdzano.
- [ ] **Lokalny `wsgi.py --port`** nie przekierowuje `/games` na `/games/` (brak `RAW_URI` we `wsgiref`);
  pod gunicornem działa. Dotyczy tylko prób z `SCRIPT_NAME` lokalnie.

## P3 - pomysły

- [ ] Otwarte stoły (lista publiczna, dobieranie), widzowie, powtórki partii.
- [ ] Więcej niż dwóch graczy (silniki są dwuosobowe: poker wieloosobowy, remik 2-4).
- [ ] Rankingi i statystyki.
- [ ] Zaproszenia e-mailem (w kronikach też poza MVP).
- [ ] Historia gita ma 146 MB (zipy i PNG z pierwszego commita) - przepisanie historii tylko za zgodą Właściciela.
- [ ] `npm audit`: 8 podatności w narzędziach deweloperskich (`--omit=dev`: 0), do osobnej aktualizacji.

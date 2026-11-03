# TODO - app_games

Stan na 2026-11-02. Priorytet: **P1** blokuje albo grozi wdrożeniu, **P2** ważne, **P3** pomysły.
Opis działania: `docs/ONLINE.md`, przekazanie: `TASK_STATUS.md`.

## Wspólny standard aplikacji gier - kolejność realizacji

Decyzja Właściciela: zaczynamy od **4. PL/EN/CS**. Numeracja poniżej odpowiada liście
wymagań, nie kolejności wykonania. Standard obowiązuje obecne i nowe aplikacje gier;
reguła trwała: `AGENTS.md`, sekcja „Wspólne funkcje aplikacji gier”.

1. [ ] **Konta i odzyskiwanie rozgrywek na innym urządzeniu.** Przypisanie miejsca i zapisów
   do konta; migracja obecnej tożsamości opartej na ciasteczku bez utraty gry.
2. [ ] **Logowanie Google.** Powiązanie z kontem aplikacji; konfiguracja OAuth na docelowych domenach.
3. [ ] **Rozmowa głosowa.** WebRTC + własny TURN, wybór mikrofonu, lokalne wyciszanie
   rozmówców; odbiór na dwóch urządzeniach. Punktem odniesienia są Kroniki Aetherii.
4. [x] **Wybór języka PL/EN/CS - wdrożony w kodzie jako pierwszy.** Zapamiętany wybór, zmiana
   bez utraty rozgrywki, tłumaczenia interfejsu, zasad, opisów kart i komunikatów systemowych;
   imiona i wiadomości graczy pozostają bez zmian. Kroniki już mają PL/EN/CS.
   Zakres zgodności starszych komunikatów i diagnostyki: `docs/LANGUAGES.md`.
5. [ ] **Ukryte statystyki odwiedzin na osobnej nowej stronie.** Bez publicznego licznika
   na stronie głównej; dostęp do raportu po autoryzacji (sam niepodlinkowany URL nie wystarcza).
   Ujednolicić również Kroniki, które obecnie pokazują licznik publicznie.
6. [ ] **Geopolitix dla 2-4 osób / SI.** Frakcje Asia, Africa i South America są w grze od 2026-11-03 (5 frakcji;
   balans do sprawdzenia na grach ludzi). Dokończyć:
   rozszerzyć silnik, boty, lokalny i online interfejs oraz ukrywanie informacji na 3-4 miejsca.
   Zweryfikować pełne partie i zgodność zapisów dwuosobowych. Remik, Poker i Kroniki mają już 2-4 graczy.

## P1 - przed uznaniem wdrożenia za gotowe

- [ ] **Odbiór PL/EN/CS w przeglądarce i wdrożenie.** Sprawdzić telefon/desktop w obu motywach,
  zmianę języka w trakcie partii, zachowanie zaznaczonych kart i niewysłanej wiadomości,
  odświeżenie i synchronizację między kartami. Automatyczne testy renderowania nie zastępują odbioru wizualnego.

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
- [ ] **Do akceptacji (propozycje, nie wdrożone):** (1) menu z dziennikiem gry, trybem testowym i zasadami (na telefonie w Geopolitix są dziś niedostępne
  tryb testowy, stopka i dziennik); (2) przycisk „Zobacz planszę” w oknie końca rundy; (3) ten sam układ dla Remika i Pokera; (4) oznaczanie wiersza po karcie taktycznej także w widoku komputerowym (dziś tylko telefon).

- [ ] **Poker i Remik dla 3-4 graczy: układ w przeglądarce.** Silniki i widoki są przetestowane (pełne mecze
  3-4 graczy, szczelność widoków, renderowanie), ale układ stołu na wąskich ekranach (4 miejsca, 6 zakrytych kart
  przeciwników) nie był oglądany. Do sprawdzenia razem z testem online (P1).
- [ ] **Bot pokera/remika** gra tak samo przy 2 i 4 graczach (prosta heurystyka, bez oceny liczby przeciwników,
  bez blefu). Przy 4 graczach jest słabszy/bardziej przewidywalny; osobne zadanie.
- [ ] **Poker: pule boczne w interfejsie** - wypłaty są pokazane w sumie na gracza, bez rozbicia na pule.
- [ ] **Gra lokalna 3-4 graczy**: komputery grają po kolei co ok. 0,6-0,85 s; przy czterech graczach rozdanie
  trwa dłużej. Pauza i "jeden ruch komputera" w trybie testowym działają dla dowolnego komputera.

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
- [ ] Rankingi i statystyki.
- [ ] Zaproszenia e-mailem (w kronikach też poza MVP).
- [ ] Historia gita ma 146 MB (zipy i PNG z pierwszego commita) - przepisanie historii tylko za zgodą Właściciela.
- [ ] `npm audit`: 8 podatności w narzędziach deweloperskich (`--omit=dev`: 0), do osobnej aktualizacji.

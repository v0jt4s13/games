# Przy stole - Geopolitix, Remik, Poker

Działający panel i trzy lokalne gry przeciw komputerowi. Frontend React + TypeScript + Vite. Gry działają bez backendu i zewnętrznych API. Interfejs po polsku, frakcje i identyfikatory kart zachowują angielską bazę.

## Otwórz i graj

Po zbudowaniu otwórz **dist/standalone.html** w aktualnym Chrome, Firefox, Edge lub Safari. Ten plik ma wbudowany JavaScript i CSS i nie wymaga serwera. Obok muszą pozostać geopolitix-cover.webp i rules-geopolitix.pdf. Można przenieść cały katalog dist.

Standardowy dist/index.html wymaga serwera HTTP. Nie otwieraj go przez file://; do tego służy standalone.html.

## Uruchomienie developerskie

Wymagany Node.js 22.12+ (sprawdzono 22.20) i npm. W katalogu projektu:

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

Adres: http://127.0.0.1:5173/ . Serwer nie jest uruchomiony przez asystenta: środowisko wykonawcze blokuje bind portu błędem EPERM.

Na telefonie w tej samej sieci lokalnej uruchom zamiast tego:

```sh
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Wejdź na http://ADRES_LAN_KOMPUTERA:5173/ . Adres uzyskasz np. przez hostname -I. To serwer developerski do lokalnego testowania, nie sposób wdrożenia publicznego.

## Build i testy

```sh
npm run build
npm test
```

Build tworzy standardową witrynę statyczną dist/index.html i dist/standalone.html. npm test uruchamia build przez pretest, następnie testy silników, renderowania komponentów w Node i kompletności wariantu offline. Zależności są przypięte przez package-lock.json; nie wymagają globalnych pakietów.

Weryfikacja: 35 testów, w tym 30 symulowanych meczów Geopolitix, 10 partii Remika, zestaw do 200 rozdań pokera (pętla kończy się wcześniej przy bankructwie), karty i żetony bez duplikacji/utraty, błędne akcje, zapis/odczyt, brak korzystania z zakrytych kart rywala w decyzjach botów i renderowanie wszystkich stołów. Testy przeglądarkowe i wizualne nie zostały wykonane bez zgody właściciela. Układ CSS ma warianty desktop/mobile; potrzebna weryfikacja na rzeczywistych urządzeniach.

## Co działa

- Panel: trzy gry, zasady, wznowienie oddzielnych zapisów, potwierdzenie restartu tylko wybranej gry.
- Geopolitix: Europe i North America po 50 kart, 21 na ręce, mulligan do 3, trzy rzędy, serie, premie, katastrofy, specjalne karty, pas, rundy i wynik meczu. Wybór karty pokazuje cele i punkty po ruchu. Asia, Africa i South America pozostają poza MVP.
- Remik: dwie talie bez jokerów, 13 kart, dobór/odrzucanie, grupy i sekwensy, przygotowanie kilku układów do otwarcia 51, dokładanie, podpowiedzi, tasowanie stosu, wynik. Limit 200 tur zapobiega nieskończonej partii.
- Poker: heads-up Texas Hold’em, 1000 żetonów, blindy 10/20, rotacja dealera, check/call/fold/raise, all-in, automatyczne odkrycie stołu, ranking 5 z 7, remisy, zwrot nadpłat i wynik meczu. Uniwersalne rozliczenie pul jest testowane również dla więcej niż dwóch kontrybutorów, ale UI oferuje tylko dwóch graczy.
- Motywy Auto / Jasny / Ciemny: localStorage i skrypt przed pierwszym malowaniem. Obsługa klawiatury i dotyku; bez obowiązkowego przeciągania. Modal zasad zatrzymuje ruchy bota.

## Zapis i ograniczenia

localStorage: przy-stole-v1 (partie) i cards-theme (motyw). Zamknięcie strony lub przejście do innej gry zachowuje stan; powrót wznawia także oczekujący ruch komputera. Usunięcie danych witryny kasuje zapis. Przy braku dostępu do localStorage można grać, ale UI informuje o braku trwałego zapisu. Plik file:// i adres HTTP mogą mieć osobne magazyny danych.

To rekreacyjna wersja single-player: nie ma kont, multiplayer ani pieniędzy. Silniki działają lokalnie; obrazki rewersów są pobierane z ustawionych URL-i (domyślnie logo Londynek). Bez sieci pozostaje zastępczy rewers. Źródłowe odnośniki w zasadach otwierają strony zewnętrzne wyłącznie po kliknięciu. Cały stan gry jest w przeglądarce, więc ukrycie ręki nie chroni przed podglądem w narzędziach developerskich. Online wymaga oddzielnego autorytatywnego serwera i ograniczonych widoków graczy.

## Dziennik testowy i rewersy

Nad planszą dostępna jest pauza komputera i wykonanie dokładnie jednej jego akcji (w Remiku dobór, wyłożenie i odrzucenie to osobne akcje). Pauza nie blokuje ruchów człowieka. Otwieranie zasad i ustawień rewersów również wstrzymuje bota.

Dziennik pod stołem zapisuje wszystkie zatwierdzone akcje od rozpoczęcia szczegółowego zapisu: kolejny numer, gracza, rundę/turę/rozdanie, kartę i cel, komunikaty efektów, różnice stanu oraz pełne migawki jawne przed i po. Obejmuje m.in. siłę kart i rzędów, aktywne katastrofy, układy remika, stosy, żetony, zakłady, karty wspólne i wypłaty. Można filtrować gracza, zmienić kolejność, rozwijać kolejne pozycje i eksportować JSON. Nie usuwa starszych szczegółowych wpisów; ostatnie 60 komunikatów silnika stanowi tylko dodatkowy skrót. Podglądy efektów i symulacje bota nie tworzą wpisów. Odrzucona przez silnik akcja wyświetla błąd, bez zapisania ruchu.

Zakryte karty oraz stan generatora są w sekcji diagnostycznej, domyślnie wyłączonej w widoku i eksporcie. Checkbox jawnie włącza je również do eksportu. Stan jest lokalny, więc nie jest to zabezpieczenie multiplayer. Stare partie bez trace dostają migawkę początkową przy pierwszym nowym ruchu; dawnych szczegółów nie da się odtworzyć. Nowa gra kasuje historię poprzedniej partii tej gry. Ślad jest zapisywany razem z partią; limit localStorage jest obsługiwany komunikatem o braku zapisu, bez cichego ucinania historii.

Przycisk **Rewersy** w nagłówku otwiera osobne ustawienia Remika i Pokera: publiczny URL HTTP/HTTPS, cały obrazek (contain) lub wypełnienie z przycięciem (cover), podgląd i powrót do logo Londynek. Pole puste lub niedostępny obrazek daje rewers zastępczy. Ustawienia przechowywane są oddzielnie od partii w localStorage pod przy-stole-card-backs-v1; zmiana nie restartuje gry. Logo jest na wszystkich zakrytych kartach obu gier, w tym stosie dobierania Remika.

Lista nazw do przygotowania ilustracji Geopolitix: [GEOPOLITIX-CARDS.md](docs/GEOPOLITIX-CARDS.md) i [CSV](docs/geopolitix-cards.csv). 88 pozycji ilustracji, 100 fizycznych kart. Pliki zawierają nazwy dokładnie z aktualnego katalogu i proponowane nazwy plików.

## Ilustracje kart Geopolitix

Dodawaj pliki do public/cards/europe/ lub public/cards/america/, używając kluczy z CSV. Przykłady: europe/tusk.png, europe/blackout.png, europe/mermaid.png. Obsługiwane rozszerzenia: .webp, .avif, .png, .jpg, .jpeg (w tej kolejności pierwszeństwa, jeśli istnieje kilka formatów). Nazwy bazowe i foldery są małymi literami. Wszystkie kopie jednej serii używają tego samego obrazka.

W działającym npm run dev wystarczy odświeżyć stronę: lista plików skanowana jest przy żądaniu HTML. Nie trzeba zmieniać katalogu kart ani zaczynać nowej partii. Wersja produkcyjna oraz dist/standalone.html wymagają npm run build po dodaniu lub usunięciu plików; przenoś cały katalog dist, razem z cards/. Ilustracje są widoczne w ręce, na planszy i w większym podglądzie wybranej karty. Brakujące obrazy nie powodują żądań 404; błąd wczytania istniejącej grafiki przywraca dotychczasowy wygląd. Źródłowe pliki użytkownika nie są modyfikowane.

## Mapa kodu

- src/main.tsx: panel, nawigacja hash, zapis, motyw, dialogi.
- src/GeoGame.tsx, src/RummyGame.tsx, src/PokerGame.tsx: stoły i interakcje.
- src/engines/: niezależne silniki, walidacja, deterministyczne losowanie i boty.
- src/data/geopolitix.mjs: 100 fizycznych kart z ID, siłą, efektem i tagami.
- src/rules.tsx: reguły widoczne w grze; docs/RULES-MVP.md: kontrakt uzupełniający projekt PDF.
- src/style.css: motywy i układy responsive; scripts/standalone.mjs: eksport bez serwera.
- tests/: testy silników, brzegów i renderowania bez przeglądarki.

## Ręczna weryfikacja przed publikacją

1. Otwórz panel w szerokościach 360 px i desktopowej; sprawdź trzy motywy oraz ich zachowanie po odświeżeniu.
2. W Geopolitix wybierz frakcję, wymień 3 karty, zagraj kartę i spasuj; przejdź do kolejnej rundy.
3. W Remiku dobierz, zaznacz układ, użyj przygotowania i podpowiedzi, odrzuć jedną kartę; sprawdź próg 51 i dokładanie.
4. W Pokerze sprawdź zakład, podbij, zagraj all-in i następne rozdanie. Weryfikuj zakrycie kart do showdown.
5. Przełącz gry, odśwież stronę, otwórz i zamknij zasady klawiszem Escape, sprawdź restart z anulowaniem i klawiaturę.

Wdrożenie pozostaje decyzją właściciela. Gotowy katalog dist można serwować statycznie pod dowolnym prefiksem, bo base w Vite jest względne.

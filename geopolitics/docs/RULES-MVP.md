# Kontrakt zasad MVP 1.0

Źródło: Projekt geopolitycznej gry karcianej.pdf w tym katalogu oraz odnośniki do pokera i remika z PLAN.md. PDF jest rozmową projektową, nie kompletną specyfikacją. Poniższe decyzje wykonawcze uzupełniają luki na potrzeby działającej gry. Nie są cytatami ani deklaracją akceptacji szczegółów przez właściciela. Zasady są dostępne także w src/rules.tsx i w panelu.

## Geopolitix

Dwie frakcje po 50 kart. Losowe 21 kart startowych, do 3 wymian bez możliwości ponownego dobrania wymienianych kart. Bot nie wymienia kart. Pierwszy ruch losowany, runda 2 od bota, runda 3 od człowieka. Angielskie klucze kart z osobnymi ID każdej kopii; siła i podatność są parametrami gry, nie oceną realnych osób.

Jedna karta na turę lub trwały pas w rundzie. Po pasie przeciwnika można grać bez przerwy. Oba pasy rozliczają sumę rzędów; remis daje obojgu punkt. Mecz do dwóch punktów, jednoczesne osiągnięcie dwóch oznacza remis. Po rundzie plansza zostaje wyczyszczona, efekty znikają, karty trafiają do cmentarzy pierwotnych właścicieli (także szpieg i karta z Łapówki). Ręka pozostaje, nie ma doboru. Brak karty z aktywną zdolnością dowódcy.

### Parametry i efekty

| Mechanika | Dokładne działanie |
|---|---|
| Lider | Odporny na negatywne efekty, nie może być celem Krasnala, Paktu ani Łapówki. Dostaje dodatnie premie. |
| Bigfoot / Ochroniarz | Odporność na negatywne efekty; ochrona kończy się wraz z rundą lub powrotem do ręki. |
| Muster | Przywołanie wszystkich pozostałych kart serii z talii, bez ręki i cmentarza. |
| Koalicja / Tech | Minimum 3 na własnej planszy daje +2 każdej karcie tej grupy. |
| RCMP | Muster i dodatkowo +1 za każdą sojuszniczą kartę z horse, w tym siebie. |
| Syrenka | +2 dwóm bezpośrednim sąsiadom w rzędzie. Kolejność to kolejność wyłożenia. |
| Blackout / Cyberatak | Ustawia na 1 siłę podatnych kart z electric w wybranym rzędzie wroga. |
| Kryzys energetyczny, Afera, Powódź, Market Crash, Katrina, Susza, Szturm | Połowa siły podatnych kart w wskazanym rzędzie, w dół. |
| Cenzura / Wyciek danych | Wyłączenie premii podatnych kart w rzędzie. |
| Sankcje / Embargo | Najsilniejsza podatna karta traci połowę siły, w dół; remis rozstrzyga pozycja od lewej. |
| Strajk / Protesty | Siła podatnych kart rzędu wynosi 0 do końca następnej akcji ich kontrolera. Przy zakończeniu rundy punkty liczone przed zdjęciem efektu. |
| Tornado | Niszczy wszystkie najsłabsze podatne karty wybranego rzędu według aktualnej siły. |
| Krasnal | Własna nieliderska jednostka wraca do ręki, tracąc ochronę i Sankcje; sam Krasnal trafia na cmentarz. |
| Szpieg | Jednostka na stronę rywala, daje mu punkty; dobiera do 2 kart. |
| Zielony Elf | Usuwa wszystkie katastrofy i Sankcje z własnej planszy. |
| Pakt | Przenosi własną nieliderską kartę do dowolnego innego rzędu. |
| Łapówka | Losowa nieliderska jednostka z cmentarza przeciwnika na własny stół. Nie uruchamia efektów wejścia, np. Muster lub Szpiega. |
| QE | Dobór jednej karty. Pusta talia: bez efektu. |

Katastrofa dotyczy jednego wskazanego rzędu i trwa do końca rundy poza Strajkiem. Identyczne efekty w jednym rzędzie nie kumulują się. Wzmocnienia i zmiany liczone od stanu, a nie trwale dopisywane do siły: baza -> premie (o ile nie wyłączone) -> Sankcje -> połowa rzędu -> Blackout -> Strajk. Odporność pomija negatywne kroki. Kata­strofa bez jakiejkolwiek podatnej jednostki jest niedostępna. Elf bez efektów do zdjęcia i Łapówka bez jednostek na cmentarzu również wymagają innej akcji. To zapobiega niezamierzonym pustym zagraniom.

### Balans

Nie deklarujemy równej siły frakcji tylko dlatego, że mają po 50 kart. Obecne listy pochodzą z propozycji PDF. Dalszy etap: większa próba meczów i balans premii RCMP, doboru, odporności oraz kosztów katastrof. Bot jest heurystyczny i deterministyczny przy zadanym ziarnie, nie jest modelem AI ani graczem optymalnym.

## Remik

Dwie talie po 52 karty, brak jokerów. Po 13 kart; jedna odkryta na stosie, człowiek zaczyna od dobrania. Każda tura: dokładnie jeden dobór, dowolna liczba legalnych wyłożeń/dołożeń, odrzucenie jednej karty. Sekwens minimum 3 jednego koloru bez powtórzeń; grupa 3-4 jednego nominału i różnych kolorów. As tylko niski i wart 1; figury warte 10.

Otwarcie wymaga minimum 51 punktów w jednej zatwierdzonej akcji, która może zawierać wiele rozłącznych układów. Przygotowanie w UI nie usuwa kart z ręki. Po otwarciu można dokładać pojedyncze karty do wszystkich układów i wykładać własne bez progu. Zostawić jedną kartę na końcowy odrzut. Nie przebudowujemy układów stołu.

Brak stosu: przetasowanie odrzuconych poza górną kartą. Brak materiału do przetasowania: remis. Po 200 zakończonych turach wygrywa mniejsza suma kart na ręce, równa daje remis. Punkty końcowe są informacją; nie ma meczu z kumulowanym rankingiem.

## Poker

Heads-up no-limit Texas Hold’em, 1000 żetonów na gracza, stałe blindy 10/20. Dealer jest small blindem i zaczyna preflop; BB zaczyna pozostałe ulice. Dealer rotuje. Nie ma ante ani rake. Pięć kart wspólnych z paleniem jednej przed flopem, turnem i riverem.

Zakład to suma wpłat w bieżącej ulicy. Minimalne pełne podbicie równe poprzedniemu pełnemu podbiciu, początkowo 20. Maksimum ograniczone efektywnym stosem obu graczy. Krótszy all-in dozwolony tylko przy tym limicie. Po sprawdzeniu all-in automatyczny runout. Pas oddaje pulę bez odkrycia. Best-five z siedmiu; as w niskim stricie. Remisy dzielą pule, nieparzysty żeton dla pierwszego uprawnionego gracza za dealerem. Niesprawdzona nadpłata wraca; algorytm warstw pul obsługuje różne wpłaty.

Stan showdown zapisuje wypłatę brutto z puli, a nie zysk netto. Mecz kończy się po podsumowaniu rozdania, w którym ktoś ma zero żetonów. Brak pieniędzy, multiplayer i turniejów.

# Plan platformy gier karcianych

## Stan
Zrealizowano lokalne MVP: panel wyboru oraz gry Geopolitix, Remik i Poker przeciw komputerowi, w kolejności 1-5 planu. Dostępny automatyczny zapis osobnych partii i motywy Auto/Jasny/Ciemny. Uruchomienie: README.md. Zbudowany wariant dist/standalone.html działa bez serwera. Multiplayer i wdrożenie pozostają dalszymi etapami.

Ilustracja geopolitix-cover.png (1024 × 1536, 2:3) pochodzi z image_gen. Frontend używa zoptymalizowanego WebP 768 × 1152. 8k z briefu jest określeniem jakości, nie rzeczywistą rozdzielczością.

## Panel wyboru
Trzy pozycje: Poker, Remik, Geopolitix (geopolityczny wariant inspirowany gwintem). Każda zawiera ilustrację, krótki opis, odnośnik do zasad i rzeczywisty status dostępności. Wybór otwiera szczegóły gry; rozpoczęcie rozgrywki dostępne dopiero po implementacji silnika. Desktop: trzy kolumny; mobile: pojedyncza kolumna. Motyw Auto / Jasny / Ciemny zapisany w localStorage i zastosowany przed pierwszym malowaniem. Klawiatura, widoczny fokus, dotykowe przyciski minimum 44 px. Interakcja z kartami przez dotknięcie i wybór celu, bez konieczności przeciągania.

## Kolejność realizacji
1. Grafika i panel wyboru: okładka Geopolitix, klasyczne symbole pokera i remika, szczegóły gry i źródła zasad. Kryterium: obsługa 360 px i desktopu, obu motywów, klawiatury i dotyku.
2. Specyfikacja zasad: wersjonowany dokument dla każdej gry, katalog kart oraz przykładowe tury. Dokument Geopolitix odczytany z lokalnego PDF; luki rozstrzygnięte jawnie w regułach MVP w src/rules.tsx i docs/RULES-MVP.md.
3. Geopolitix MVP: czysty silnik stanu i legalnych ruchów, talie i efekty zapisane w danych, plansza, wybór kart, koniec tury i wynik zgodne z zatwierdzonymi zasadami. Najpierw deterministyczny przeciwnik treningowy; jego strategia zależy od reguł.
4. Remik: rozdawanie, dobieranie, odrzucanie, walidacja sekwensów i grup, próg wyłożenia, koniec partii. Ustalić wariant jokerów, asów i punktowania przed kodowaniem.
5. Poker: proponowany Texas Hold’em na wirtualne żetony; blinds, rundy licytacji, ranking układów, all-in, pule boczne, podział puli i eliminacja.
6. Multiplayer: prywatne pokoje, autorytatywny serwer, WebSocket, wznowienie po utracie połączenia, limity czasu i filtrowane widoki stanu. Serwer nie wysyła cudzych zakrytych kart. Losowanie talii po stronie serwera.
7. Wydanie: testy reguł, testy pełnych partii, urządzenia mobilne i desktop, dostępność, kompresja ilustracji, monitoring błędów, wdrożenie po decyzji właściciela.

## Architektura MVP i dalsze etapy
Zaimplementowano React + TypeScript + Vite dla panelu i plansz oraz niezależne silniki src/engines/*.mjs (JavaScript ESM, testowane w Node). Każdy moduł ma konstruktor stanu, walidowany reducer akcji i strategię bota. Widok ukrywa rękę przeciwnika; stan w localStorage pozostaje lokalny i nie jest granicą bezpieczeństwa multiplayer. Backend z autorytatywnym stanem, WebSocket, playerView i PostgreSQL jest propozycją etapu online, nie częścią obecnej wersji.

Testy: legalne i nielegalne ruchy, niezmienniki liczby kart, remisy, kolejność efektów, powtórzenie partii z logu akcji, ukrywanie ręki przeciwnika, ponowne połączenie i odrzucanie powtórzonych akcji. Nie zakładać identycznych reguł tur we wszystkich grach.

## Źródła i otwarte ustalenia
- Poker: https://igamingpolska.pl/poker-zasady-gry/ - odczytany; podstawą proponowanego wariantu jest Texas Hold’em.
- Remik: https://dziendobry.tvn.pl/newsy/jak-grac-w-remika-jakie-sa-zasady-gry-da304805-ls5341760 - odczytany; 13 kart, grupy/sekwensy i próg 51 punktów. Warianty wymagają jednoznacznego kontraktu.
- Geopolitix: [lokalny dokument](docs/Projekt%20geopolitycznej%20gry%20karcianej.pdf), odczytany 2026-10-30. Jest zapisem rozmowy projektowej, zawiera zarówno decyzje właściciela, jak i propozycje modelu. Zastępuje niedostępny odczyt Google Docs; nie utożsamiać zasad automatycznie z komercyjnym Gwintem.
- Do ustalenia: priorytet bot/online, docelowy hosting, zatwierdzenie szczegółowych efektów i proponowanych reguł meczu. Dokument opisuje rozgrywkę dwóch graczy.

## Geopolitix: ustalenia z PDF
- Nazwa: Geopolitix. Angielskie identyfikatory i nazwy bazowe; przygotowanie lokalizacji PL i CZ.
- Pięć frakcji: North America, South America, Europe, Africa, Asia. Pierwszy grywalny zakres: Europe kontra North America; pozostałe mają tylko szkice.
- Po 50 kart na frakcję, początkowa ręka 21 kart, wymiana do 3 kart. Docelowo porównywalna siła frakcji, wymagająca testów balansu.
- Trzy rzędy: Diplomacy & Soft Power, Economy & Finance, Defense & Security.
- Katastrofy celowane w przeciwnika. Blackout obniża podatne jednostki do 1, z wyjątkami dla tradycyjnych/historycznych kart. Podatność powinna być jawnym atrybutem karty, nie wyliczeniem z dat życia postaci.
- Zaakceptowany kierunek kart specjalnych: powrót karty do ręki, szpieg dający dobór, anulowanie katastrof.

### Propozycje modelu zawarte w PDF, wymagające domknięcia
- Mecz do dwóch wygranych rund; wynik rundy to suma trzech rzędów po spasowaniu obu graczy. Losowanie rozpoczynającego pierwszą rundę.
- Jedna akcja na turę: zagranie karty, zdolność dowódcy albo pas. Pas trwa do końca rundy.
- Dwie rozpisane talie: każda 4 liderów + 6 polityków + 14 kart serii/zespołów + 12 zwykłych + 8 wydarzeń + 6 specjalnych = 50 fizycznych kart. Numeracja do 36 nie oznacza 36 kart: serie zawierają kopie.
- Muster pobiera serię z talii; szpieg oddaje przeciwnikowi punkty i dobiera 2 karty; combo europejskie daje +2 każdej karcie grupy przy minimum 3 na planszy.

### Luki i sprzeczności źródła (rozstrzygnięcia MVP w docs/RULES-MVP.md)
1. Remis rundy/meczu, rozpoczynający kolejne rundy, czyszczenie planszy, zachowanie ręki i ewentualne dobieranie między rundami.
2. Mulligan: czy odrzucone karty wracają przed losowaniem; co przy pustej talii lub ręce.
3. Muster: wyłącznie talia czy również ręka. Symulacja ma całą serię na ręce, a potem pobiera ją z talii - nie może być testem referencyjnym bez poprawki.
4. Niezniszczalność liderów: czy chroni też przed osłabieniem, podniesieniem do ręki i przenoszeniem. Zdolności aktywnego dowódcy nie są zdefiniowane; nie włączać tej akcji do MVP bez specyfikacji.
5. Katastrofy: czas działania, cele, kumulacja, pierwszeństwo wobec premii i ochrony. Część wydarzeń ma wyłącznie nazwę. Tornado wymaga rozstrzygnięcia liczby usuwanych kart i remisów siły; sankcje - zaokrąglania.
6. Combo technologiczne, premie za konie, sąsiedztwo Syrenki, cele Paktu i Łapówki oraz zasięg Zielonego Elfa wymagają precyzji. Europe przypisuje części grupy dwa rzędy bez podziału per karta.
7. Symulacja sugeruje odporność kowbojów na Blackout, ale stoją oni w innym rzędzie niż cel ataku - przykład nie testuje faktycznej odporności.

### Artefakty i kryteria wdrożonego MVP
- Katalog kart z osobnymi ID definicji i fizycznych kopii, frakcją, rzędem, siłą, tagami podatności, efektem i kluczami tłumaczeń.
- Jawna tabela efektów i kolejności ich rozliczania w docs/RULES-MVP.md. Uzupełnienia przyjęte na potrzeby działającego MVP po poleceniu realizacji są oznaczone; nie są przedstawiane jako cytat z PDF.
- Scenariusze testowe: 50 kart na frakcję, 21 na ręce, wymiana do 3, Muster bez duplikacji, Blackout na podatną i odporną kartę w tym samym rzędzie, szpieg przy małej talii, pas i rozliczenie rundy.
- UI planszy: sześć rzędów, punkty rund i rzędów, licznik talii/cmentarza, ręka 21 kart z przewijaniem i powiększeniem wybranej karty na mobile. Podgląd celu i skutków przed zatwierdzeniem ruchu.

## Dokładny prompt ilustracji
Use case: stylized-concept. Asset: cover artwork for geopolitical strategy card game Geopolitix. Portrait aspect ratio 2:3. World leaders and political figures in stylized semi-caricature modern graphic novel art style. Dynamic composition, dramatic cinematic lighting, rich colors, detailed background mixing modern skyscrapers and historical architecture. High quality digital painting, premium board game art, extremely detailed 8k aesthetic. Title text exactly 'GEOPOLITIX'. No game statistics or invented card rules.

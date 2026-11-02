# Języki PL/EN/CS

Wybór języka jest w nagłówku `/games/`, także podczas gry lokalnej i online.
Zmiana nie przeładowuje strony, nie zmienia trasy ani kluczy komponentów gry.
Nie resetuje partii, zaznaczonych kart, formularza czatu ani połączenia ze stołem.

Kolejność wyboru: zapisane `games:language` w `localStorage`, pierwszy obsługiwany
język przeglądarki, polski. Wybór synchronizuje się między kartami tego samego originu.
Jeśli przeglądarka blokuje zapis, ustawienie działa do zamknięcia strony.
`html.lang`, tytuł dokumentu oraz formatowanie liczb i dat odpowiadają językowi.
Kroniki mają własny selektor i klucz `aetherii:language`; przejście do osobnej aplikacji
nie nadpisuje jej preferencji.

## Utrzymanie

- `geopolitics/src/locales/{pl,en,cs}.json`: lokalne słowniki, bez usług tłumaczeniowych.
  Kluczem jest polski tekst źródłowy; wszystkie słowniki muszą mieć te same klucze
  i parametry `{0}`, `{1}` itd. Klucz pozostaje stabilny również przy korekcie wyświetlanego tekstu.
- `src/i18n-core.mjs`: wybór języka, formatowanie parametrów i zgodność ze starymi
  komunikatami systemowymi. Nie wymaga DOM i jest testowany w Node.
- `src/i18n.ts`: stan języka, subskrypcje React, zapis, synchronizacja kart i metadane dokumentu.
- `src/LanguageSwitch.tsx`: selektor. `App` subskrybuje język, ale nie używa go jako `key`.

Nowy tekst interfejsu dodaj do trzech słowników i renderuj przez `tr(tekst, parametry)`.
Parametry pozostają wartościami, nie HTML-em. Nigdy nie przepuszczaj czatu ani imion przez
translator. `systemText` służy tylko do komunikatów aplikacji; dziennik online przekazuje
listę imion do ochrony przed tłumaczeniem, również gdy imię wygląda jak komunikat systemowy.

Silniki, ID kart, hashe tras, dane zapisów i protokół API pozostają niezależne od języka.
Opisy i nazwy kart są tłumaczone przy renderowaniu, bez modyfikowania kart w silniku.
Nazwiska postaci, symbole kart i oryginalne grafiki pozostają wspólne.

## Zgodność i zakres

Tłumaczenia obejmują lobby, zasady, ekrany trzech gier (także telefoniczny Geopolitix),
rewersy, stoły, zaproszenia, czat, znane błędy i szablony dziennika.
Stary protokół zwraca polskie teksty: rozpoznawane szablony są tłumaczone przy wyświetlaniu,
a nieznane komunikaty pozostają w oryginale. Wartości wewnątrz złożonych zapisów diagnostycznych
mogą pozostać źródłowe; pełne migawki oraz eksport JSON celowo zachowują dane bez tłumaczenia.
Przy dodaniu komunikatu silnika lub API dodaj jego szablon do słowników.

## Weryfikacja

`npm test` obejmuje kompletność słowników i parametrów, opisy wszystkich kart, wybór języka,
blokadę `localStorage`, synchronizację, renderowanie trzech gier i zasad w PL/EN/CS,
niezmienność danych gry oraz ochronę imion i czatu. To testy bez przeglądarki.

Odbiór ręczny: przełącz PL/EN/CS podczas rozgrywki i pisania wiadomości, odśwież stronę,
otwórz drugą kartę, sprawdź telefon i komputer w jasnym oraz ciemnym motywie.
Nie wykonano jeszcze wizualnego odbioru w przeglądarce.

# Handoff: grafiki kart Geopolitix

## Stan Azji

- Propozycja kart została zaakceptowana. Talia ma 50 kart fizycznych i wymaga 44 różnych ilustracji.
- W `public/cards/asia/` jest komplet 44/44 wymaganych plików WebP. Po ponownym wygenerowaniu 12 portretów Właściciel zastąpił brakujące karty Netanjahu i Gandhiego kartami `shogun` i `bruce_lee`; oba nowe portrety zostały wygenerowane i zapisane.
- `xi.webp` i `yeti.webp` zostały przerobione, by pasowały stylistycznie do talii Europy. `modi.webp` pozostaje w pierwotnym stylu.

## Stan pozostałych frakcji

- `public/cards/africa/` zawiera komplet 44/44 ilustracji Afryki.
- `public/cards/south_america/` zawiera komplet 44/44 ilustracji Ameryki Południowej i Środkowej.
- Wszystkie trzy nowe zestawy sprawdzono: po 44 pliki WebP 512x768 px na frakcję.

## Wzorzec i format

- Porównane przykłady z `public/cards/europe/`: `orban.webp` i `blackout.webp`.
- Styl: ilustracja komiksowa 2D, mocny ciemny kontur, uproszczone sylwetki, nasycone kolory, cel-shading i lekko karykaturalne proporcje. Unikaj fotorealizmu i malarskich, rozmytych przejść.
- Zachowuj temat i główną kompozycję istniejącej grafiki podczas korekty stylu. Nie kopiuj tej samej sceny do wielu kluczy (wcześniej `yeti.webp` i `yeti_decoy.webp` były omyłkowo duplikatami; obecnie to różne ilustracje).
- Każdy plik: `public/cards/<frakcja>/<klucz>.webp`, 512x768 px; nazwa musi dokładnie odpowiadać kluczowi karty. Szczegóły konwersji są w `AGENTS.md`.
- Ilustracje pozostałych frakcji przygotować dopiero po zatwierdzeniu postaci i zgodnie z tym samym wzorcem stylu.

## Następny krok

Wszystkie trzy talie (Asia, Africa, South America) są w danych gry, tłumaczeniach i manifeście grafik (2026-11-03). Kolejne frakcje wymagają nowej propozycji i grafik.

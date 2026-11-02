# Handoff: grafiki kart Geopolitix

## Stan Azji

- Propozycja kart została zaakceptowana. Talia ma 50 kart fizycznych i wymaga 44 różnych ilustracji.
- W `public/cards/asia/` jest 30 plików WebP. Pozostałe 14 to portrety nazwanych postaci: `putin`, `erdogan`, `takaichi`, `lee_jae_myung`, `pezeshkian`, `mb_saud`, `netanyahu`, `prabowo`, `genghis_khan`, `gandhi`, `ataturk`, `mao`, `golda_meir`, `akbar`.
- Generowanie portretów tych osób zostało wcześniej odrzucone przez generator (kategoria `public-figure`). Nie twórz zamienników bez decyzji Właściciela. Zapytanie o wariant symboliczny pozostało bez odpowiedzi.
- `xi.webp` i `yeti.webp` zostały przerobione, by pasowały stylistycznie do talii Europy. `modi.webp` jest wśród istniejących 30 grafik, ale pozostaje w pierwotnym stylu.

## Wzorzec i format

- Porównane przykłady z `public/cards/europe/`: `orban.webp` i `blackout.webp`.
- Styl: ilustracja komiksowa 2D, mocny ciemny kontur, uproszczone sylwetki, nasycone kolory, cel-shading i lekko karykaturalne proporcje. Unikaj fotorealizmu i malarskich, rozmytych przejść.
- Zachowuj temat i główną kompozycję istniejącej grafiki podczas korekty stylu. Nie kopiuj tej samej sceny do wielu kluczy (wcześniej `yeti.webp` i `yeti_decoy.webp` były omyłkowo duplikatami; obecnie to różne ilustracje).
- Każdy plik: `public/cards/<frakcja>/<klucz>.webp`, 512x768 px; nazwa musi dokładnie odpowiadać kluczowi karty. Szczegóły konwersji są w `AGENTS.md`.
- Ilustracje pozostałych frakcji przygotować dopiero po zatwierdzeniu postaci i zgodnie z tym samym wzorcem stylu.

## Następny krok

Poprosić Właściciela o decyzję dotyczącą 14 brakujących portretów Azji. Po decyzji uzupełnić dokumentację i sprawdzić pokrycie kluczy kart przez pliki w folderze frakcji.

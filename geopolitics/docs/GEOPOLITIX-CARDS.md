# Geopolitix - lista kart do przygotowania ilustracji

Lista odczytana z src/data/geopolitix.mjs. Dwie dostępne frakcje: 100 fizycznych kart, 88 odrębnych pozycji do ilustracji (44 na frakcję). Serie ×4 mogą korzystać z jednej ilustracji. Pozostałe frakcje nie mają jeszcze katalogu kart.

Proponowane pliki: WebP, pion 2:3, np. 1024 × 1536 px. Sama ilustracja, bez nazwy, siły i opisu - tekst dodaje interfejs. Ilustracje są automatycznie wczytywane z public/cards/<frakcja>/<klucz>.<rozszerzenie>. Oprócz WebP z tabeli obsługiwane są AVIF, PNG, JPG i JPEG. Wystarczy zachować nazwę bazową (np. europe/tusk.png). Przy kilku formatach pierwszeństwo: WebP, AVIF, PNG, JPG, JPEG. Brak lub błąd obrazka zachowuje dotychczasowy wygląd karty. Na serwerze developerskim po dodaniu plików odśwież stronę; wersje dist i standalone wymagają ponownego npm run build.

## Europe

| Nazwa | Kopie | Proponowany plik |
|---|---:|---|
| Viktor Orbán | 1 | europe/orban.webp |
| Ursula von der Leyen | 1 | europe/ursula.webp |
| Margaret Thatcher | 1 | europe/thatcher.webp |
| Winston Churchill | 1 | europe/churchill.webp |
| Giorgia Meloni | 1 | europe/meloni.webp |
| Donald Tusk | 1 | europe/tusk.webp |
| Emmanuel Macron | 1 | europe/macron.webp |
| Olaf Scholz | 1 | europe/scholz.webp |
| Pedro Sánchez | 1 | europe/sanchez.webp |
| Mark Rutte | 1 | europe/rutte.webp |
| John Blake | 4 | europe/blake.webp |
| Jarosław Kaczyński | 1 | europe/jaroslaw.webp |
| Lech Kaczyński | 1 | europe/lech.webp |
| Mateusz Morawiecki | 1 | europe/morawiecki.webp |
| Andrzej Duda | 1 | europe/duda.webp |
| Beata Szydło | 1 | europe/szydlo.webp |
| Przemysław Czarnek | 1 | europe/czarnek.webp |
| Gwardia Szwajcarska | 4 | europe/swiss.webp |
| Gwardia Królewska | 1 | europe/royal.webp |
| Agent Interpolu | 1 | europe/interpol.webp |
| Dyplomata z Brukseli | 1 | europe/diplomat.webp |
| Koncern samochodowy | 1 | europe/cars.webp |
| Francuski lekkoatleta | 1 | europe/athlete.webp |
| Włoski szef kuchni | 1 | europe/chef.webp |
| Instalator baterii | 1 | europe/battery.webp |
| Górnik ze Śląska | 1 | europe/miner.webp |
| Hiszpański nawigator | 1 | europe/navigator.webp |
| Szwajcarski bankier | 1 | europe/banker.webp |
| Ogród filozoficzny | 1 | europe/garden.webp |
| Brytyjski analityk | 1 | europe/analyst.webp |
| Awaria elektrowni | 1 | europe/blackout.webp |
| Strajk generalny | 1 | europe/strike.webp |
| Sankcje gospodarcze | 1 | europe/sanctions.webp |
| Kryzys energetyczny | 1 | europe/energy.webp |
| Afera medialna | 1 | europe/scandal.webp |
| Cyberatak na sieć | 1 | europe/cyber.webp |
| Powódź stulecia | 1 | europe/flood.webp |
| Cenzura prasy | 1 | europe/press.webp |
| Krasnal | 1 | europe/gnome.webp |
| Czarny Diabeł | 1 | europe/devil.webp |
| Zielony Elf | 1 | europe/elf.webp |
| Syrenka Warszawska | 1 | europe/mermaid.webp |
| Pakt dyplomatyczny | 1 | europe/pact.webp |
| Łapówka | 1 | europe/bribe.webp |

## North America

| Nazwa | Kopie | Proponowany plik |
|---|---:|---|
| George Washington | 1 | america/washington.webp |
| Barack Obama | 1 | america/obama.webp |
| Donald Trump | 1 | america/trump.webp |
| Abraham Lincoln | 1 | america/lincoln.webp |
| Joe Biden | 1 | america/biden.webp |
| Bill Clinton | 1 | america/clinton.webp |
| Gerald Ford | 1 | america/ford.webp |
| Justin Trudeau | 1 | america/trudeau.webp |
| Ronald Reagan | 1 | america/reagan.webp |
| George W. Bush | 1 | america/bush.webp |
| Teksaski kowboj | 4 | america/cowboy.webp |
| Gwardia Kanadyjska | 4 | america/rcmp.webp |
| Tech CEO | 1 | america/ceo.webp |
| Inżynier AI | 1 | america/ai.webp |
| Inwestor Venture | 1 | america/venture.webp |
| Kryptowalutowy magnat | 1 | america/crypto.webp |
| Data Scientist | 1 | america/scientist.webp |
| Startupek | 1 | america/startup.webp |
| Agent Secret Service | 1 | america/secret.webp |
| Pilot F-35 | 1 | america/pilot.webp |
| Farmer z Midwestu | 1 | america/farmer.webp |
| Lobbing z Wall Street | 1 | america/wallstreet.webp |
| Hollywoodzki gwiazdor | 1 | america/hollywood.webp |
| Gracz NFL | 1 | america/nfl.webp |
| Szeryf z Arizony | 1 | america/sheriff.webp |
| Drwal z Kanady | 1 | america/lumberjack.webp |
| Meksykański przedsiębiorca | 1 | america/business.webp |
| Inżynier NASA | 1 | america/nasa.webp |
| Dziennikarz | 1 | america/journalist.webp |
| Przewodnik Yellowstone | 1 | america/guide.webp |
| Trąba powietrzna | 1 | america/tornado.webp |
| Kryzys na Wall Street | 1 | america/crash.webp |
| Huragan Katrina | 1 | america/katrina.webp |
| Protesty i strajki | 1 | america/protest.webp |
| Susza w Kalifornii | 1 | america/drought.webp |
| Wyciek danych | 1 | america/leak.webp |
| Embargo handlowe | 1 | america/embargo.webp |
| Szturm na Kapitol | 1 | america/capitol.webp |
| Leprechaun | 1 | america/leprechaun.webp |
| Shadow Broker | 1 | america/broker.webp |
| Whistleblower | 1 | america/whistleblower.webp |
| Bigfoot | 1 | america/bigfoot.webp |
| Wydruk dolarów | 1 | america/qe.webp |
| Prywatny ochroniarz | 1 | america/bodyguard.webp |


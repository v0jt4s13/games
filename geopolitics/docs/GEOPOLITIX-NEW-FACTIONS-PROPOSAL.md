# Geopolitix - propozycje nowych frakcji

Status: **lista zaakceptowana przez Właściciela. Grafiki Azji, Afryki i Ameryki Południowej i Środkowej: po 44/44 gotowe. Na polecenie Właściciela karty Netanjahu i Gandhiego zastąpiono kartami Shōguna i Bruce'a Lee. Azja jest w grze (2026-11-03: dane, silnik, serwer, interfejs, testy); Afryka i Ameryka Południowa i Środkowa czekają na wdrożenie.**

## Założenia

- Każda talia ma 50 kart fizycznych i 44 różne ilustracje. Wiersz `kopie=4` oznacza cztery egzemplarze tej samej karty/ilustracji.
- Azja obejmuje Bliski Wschód, Turcję i Rosję. Afryka obejmuje Afrykę Północną. Ameryka Południowa obejmuje Amerykę Środkową; Meksyk i Karaiby są poza zakresem tej propozycji.
- Każda talia ma 16 postaci politycznych/historycznych oraz maksymalnie 2 postacie fikcyjne. Talia Azji zawiera zatwierdzony archetyp Shōguna. Statystyki są parametrami rozgrywki, nie oceną osób ani państw.
- Używam istniejących efektów i tagów. Nie proponuję na tym etapie zmian silnika. `elektryczna` oznacza podatność na Blackout; `lider` oznacza odporność lidera opisaną w obecnych zasadach; `muster:<klucz>` przywołuje pozostałe kopie serii z talii; `combo:tech` / `combo:coalition` daje +2 każdej karcie tej grupy, gdy na planszy są co najmniej 3; `horse` / `horseBonus` używa istniejącego bonusu końskiego; `aura` daje +2 sąsiadom. Pozostałe nazwy efektów odpowiadają `src/data/geopolitix.mjs`.
- Stały profil każdej talii: 16 postaci, 6 jednostek technologicznych/koalicyjnych, 6 jednostek wsparcia, 2 serie po 4 kopie, 8 wydarzeń i 6 kart taktycznych. To 50 egzemplarzy / 44 projekty graficzne.
- Rzędy: dyplomacja, gospodarka, bezpieczeństwo. Karty wydarzeń można zagrać wyłącznie do wymienionych rzędów. Wszystkie wartości, nazwy i efekty niżej są propozycją.

## Postacie do zatwierdzenia

Współczesne stanowiska sprawdzono na 2 listopada 2026. W talii mogą pozostać także osoby, które później przestaną pełnić urząd. Wartości i efekty nie są przypisane do poglądów ani oceny historycznej.

### Azja (obejmuje Bliski Wschód, Turcję i Rosję)

**Współcześni:** Xi Jinping, Narendra Modi, Władimir Putin, Recep Tayyip Erdoğan, Sanae Takaichi, Lee Jae-myung, Masoud Pezeshkian, Mohammed bin Salman, Prabowo Subianto.

**Historyczni:** Czyngis-chan, Bruce Lee, Mustafa Kemal Atatürk, Mao Zedong, Golda Meir, Akbar Wielki, Shōgun (archetyp feudalnego władcy Japonii).

### Afryka (w tym Północna)

**Współcześni:** Cyril Ramaphosa, William Ruto, Bola Tinubu, Duma Boko, Netumbo Nandi-Ndaitwah, Abdel Fattah el-Sisi, John Mahama, Abdelmadjid Tebboune, Paul Kagame, Samia Suluhu Hassan.

**Historyczni:** Nelson Mandela, Kwame Nkrumah, Thomas Sankara, Hajle Syllasje, Gamal Abdel Naser, Mansa Musa.

### Ameryka Południowa i Środkowa

**Współcześni:** Luiz Inácio Lula da Silva, Javier Milei, Nayib Bukele, Laura Fernández Delgado, Daniel Noboa, Abelardo de la Espriella, José Raúl Mulino, Bernardo Arévalo, Nasry Asfura, Rodrigo Paz.

**Historyczni:** Simón Bolívar, José de San Martín, Eva Perón, Salvador Allende, Augusto César Sandino, Omar Torrijos.

### Postacie fikcyjne (limit: 3 na talię)

- Azja: Yeti, Jadeitowy Smok.
- Afryka: Anansi, Mami Wata.
- Ameryka Południowa i Środkowa: El Dorado, Chupacabra.

## Talia Azji

| Nazwa | Klucz | Kopie | Siła | Tagi | Efekt | Uzasadnienie |
|---|---|---:|---:|---|---|---|
| Xi Jinping | xi | 1 | 20 | lider, elektryczna, dyplomacja | Lider | Silna karta dyplomatyczna; bazowa odporność lidera. |
| Narendra Modi | modi | 1 | 18 | lider, elektryczna, gospodarka | Lider | Wysoka siła w gospodarce. |
| Władimir Putin | putin | 1 | 16 | lider, bez elektryczności, bezpieczeństwo | Lider | Mocna, lecz nie najwyższa karta bezpieczeństwa. |
| Recep Tayyip Erdoğan | erdogan | 1 | 14 | lider, bez elektryczności, dyplomacja | Lider | Uzupełnia pulę liderów dyplomatycznych. |
| Sanae Takaichi | takaichi | 1 | 15 | elektryczna, dyplomacja | Brak | Współczesna polityczka; średnio-wysoka siła. |
| Lee Jae-myung | lee_jae_myung | 1 | 14 | elektryczna, gospodarka | Brak | Współczesny polityk i karta gospodarcza. |
| Masoud Pezeshkian | pezeshkian | 1 | 13 | elektryczna, dyplomacja | Brak | Reprezentuje Bliski Wschód. |
| Mohammed bin Salman | mb_saud | 1 | 12 | elektryczna, gospodarka | Brak | Reprezentuje Zatokę Perską i gospodarkę. |
| Shōgun | shogun | 1 | 11 | elektryczna, bezpieczeństwo | Brak | Archetyp feudalnego władcy Japonii; umiarkowana siła karty bezpieczeństwa. |
| Prabowo Subianto | prabowo | 1 | 10 | elektryczna, bezpieczeństwo | Brak | Reprezentuje Azję Południowo-Wschodnią. |
| Czyngis-chan | genghis_khan | 1 | 9 | elektryczna, bezpieczeństwo | Brak | Postać historyczna osadzona w rzędzie bezpieczeństwa. |
| Bruce Lee | bruce_lee | 1 | 8 | bez elektryczności, bezpieczeństwo | Brak | Historyczny mistrz sztuk walki i aktor; odporność na Blackout. |
| Mustafa Kemal Atatürk | ataturk | 1 | 7 | elektryczna, dyplomacja | Brak | Historyczny polityk Turcji. |
| Mao Zedong | mao | 1 | 6 | elektryczna, bezpieczeństwo | Brak | Historyczny przywódca Chin. |
| Golda Meir | golda_meir | 1 | 5 | elektryczna, dyplomacja | Brak | Historyczna przywódczyni Izraela. |
| Akbar Wielki | akbar | 1 | 4 | bez elektryczności, gospodarka | Brak | Historyczny władca; niska siła równoważy pulę postaci. |
| Konsorcjum półprzewodników | chipmakers | 1 | 8 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Motyw technologiczny o wspólnej synergii. |
| Laboratorium robotyki | robotics_lab | 1 | 7 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Wzmacnia strategię technologiczną. |
| Sieć satelitarna | satellite_network | 1 | 6 | elektryczna, combo:tech, bezpieczeństwo | +2 dla grupy przy min. 3 | Łączy technologię z bezpieczeństwem. |
| Fabryka baterii | battery_plant | 1 | 5 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Niska siła bazowa, ale synergia. |
| Giełda cyfrowa | digital_exchange | 1 | 5 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Daje elastyczność układowi gospodarki. |
| Terminal danych | data_terminal | 1 | 4 | elektryczna, combo:tech, dyplomacja | +2 dla grupy przy min. 3 | Słaba samodzielnie, użyteczna w grupie. |
| Konwój na Jedwabnym Szlaku | silk_convoy | 1 | 9 | bez elektryczności, gospodarka | Brak | Jednostka handlowa odporna na Blackout. |
| Dyplomata ASEAN | asean_diplomat | 1 | 7 | elektryczna, dyplomacja | Brak | Obejmuje południowo-wschodnią część regionu. |
| Analityk rynku ropy | oil_analyst | 1 | 8 | elektryczna, gospodarka | Brak | Karta gospodarcza bez dodatkowej synergii. |
| Górski przewodnik | mountain_guide | 1 | 5 | bez elektryczności, bezpieczeństwo | Brak | Niska siła i odporność na Blackout. |
| Yeti | yeti | 1 | 6 | bez elektryczności, bezpieczeństwo, immune | Odporność na negatywne efekty | Jedna z dwóch fikcyjnych postaci; defensywna karta. |
| Jadeitowy Smok | jade_dragon | 1 | 7 | bez elektryczności, dyplomacja, aura | +2 dla sąsiadów | Druga fikcyjna postać; nagradza planowanie kolejności. |
| Patrol graniczny | border_patrol | 4 | 4 | bez elektryczności, muster:border_patrol, bezpieczeństwo | Muster | Seria do zbiorczego zagrania, jak obecne serie ×4. |
| Flota handlowa | trade_fleet | 4 | 5 | bez elektryczności, muster:trade_fleet, bezpieczeństwo | Muster | Druga seria; mobilność z niską bazową siłą. |
| Blackout sieci energetycznej | grid_blackout | 1 | 0 | wydarzenie, gospodarka/bezpieczeństwo | blackout | Kontruje wybrany rząd zależny od elektryczności. |
| Awaria sieci satelitarnej | satellite_failure | 1 | 0 | wydarzenie, bezpieczeństwo | blackout | Drugi Blackout; tematycznie inny, te same reguły. |
| Kryzys naftowy | oil_crisis | 1 | 0 | wydarzenie, gospodarka | half | Osłabia wybrany rząd rywala o połowę. |
| Kryzys łańcucha dostaw | supply_crisis | 1 | 0 | wydarzenie, gospodarka | half | Drugi efekt połowienia, wspiera kontrolę gospodarki. |
| Cenzura cyfrowa | digital_censorship | 1 | 0 | wydarzenie, dyplomacja | silence | Wyłącza premie w wybranym rzędzie. |
| Strajk portowy | port_strike | 1 | 0 | wydarzenie, gospodarka | strike | Czasowe wyzerowanie punktów rzędu. |
| Sankcje handlowe | trade_sanctions | 1 | 0 | wydarzenie, gospodarka | sanction | Osłabia najsilniejszą podatną kartę rzędu. |
| Trzęsienie ziemi | earthquake | 1 | 0 | wydarzenie, bezpieczeństwo | tornado | Niszczy najsłabsze podatne karty w rzędzie. |
| Yeti - zmyłka | yeti_decoy | 1 | 0 | taktyczna | decoy | Powrót własnej jednostki do ręki; karta taktyczna. |
| Kurier wywiadu | intel_courier | 1 | 8 | elektryczna, bezpieczeństwo | spy | Jednostka po stronie rywala, dobiera do 2 kart. |
| Pomoc po monsunie | monsoon_relief | 1 | 0 | taktyczna | clear | Usuwa własne osłabienia. |
| Porozumienie korytarzowe | corridor_accord | 1 | 0 | taktyczna | move | Przenosi własną jednostkę między rzędami. |
| Fundusz rezerwowy | reserve_fund | 1 | 0 | taktyczna | draw | Dobiera kartę, gdy talia ma zapas. |
| Ochrona konwoju | convoy_guard | 1 | 0 | taktyczna | protect | Chroni jedną własną kartę do końca rundy. |

## Talia Afryki

| Nazwa | Klucz | Kopie | Siła | Tagi | Efekt | Uzasadnienie |
|---|---|---:|---:|---|---|---|
| Cyril Ramaphosa | ramaphosa | 1 | 20 | lider, elektryczna, dyplomacja | Lider | Bazowa karta lidera o największej sile. |
| William Ruto | ruto | 1 | 18 | lider, elektryczna, gospodarka | Lider | Lider gospodarczy, ta sama skala siły. |
| Bola Tinubu | tinubu | 1 | 16 | lider, bez elektryczności, bezpieczeństwo | Lider | Lider bezpieczeństwa odporny na Blackout. |
| Duma Boko | boko | 1 | 14 | lider, bez elektryczności, dyplomacja | Lider | Uzupełnia pulę liderów dyplomatycznych. |
| Netumbo Nandi-Ndaitwah | netumbo | 1 | 15 | elektryczna, dyplomacja | Brak | Współczesna przywódczyni Namibii. |
| Abdel Fattah el-Sisi | elsisi | 1 | 14 | elektryczna, bezpieczeństwo | Brak | Reprezentuje Afrykę Północną. |
| John Mahama | mahama | 1 | 13 | elektryczna, dyplomacja | Brak | Współczesny polityk Afryki Zachodniej. |
| Abdelmadjid Tebboune | tebboune | 1 | 12 | elektryczna, gospodarka | Brak | Reprezentuje Afrykę Północną. |
| Paul Kagame | kagame | 1 | 11 | elektryczna, bezpieczeństwo | Brak | Karta bezpieczeństwa o średniej sile. |
| Samia Suluhu Hassan | samia | 1 | 10 | elektryczna, gospodarka | Brak | Współczesna przywódczyni Afryki Wschodniej. |
| Nelson Mandela | mandela | 1 | 9 | bez elektryczności, dyplomacja | Brak | Historyczna postać dyplomacji, odporna na Blackout. |
| Kwame Nkrumah | nkrumah | 1 | 8 | elektryczna, dyplomacja | Brak | Historyczny polityk i działacz panafrykański. |
| Thomas Sankara | sankara | 1 | 7 | elektryczna, gospodarka | Brak | Historyczna postać Afryki Zachodniej. |
| Hajle Syllasje | haile_selassie | 1 | 6 | elektryczna, dyplomacja | Brak | Historyczny władca i dyplomata. |
| Gamal Abdel Naser | nasser | 1 | 5 | elektryczna, bezpieczeństwo | Brak | Historyczny przywódca Afryki Północnej. |
| Mansa Musa | mansa_musa | 1 | 4 | bez elektryczności, gospodarka | Brak | Historyczny władca i karta gospodarcza. |
| Sieć płatności mobilnych | mobile_payments | 1 | 8 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Synergia cyfrowej gospodarki. |
| Konsorcjum energii słonecznej | solar_consor | 1 | 7 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Wspólny pakiet technologiczny. |
| Hub telekomunikacyjny | telecom_hub | 1 | 6 | elektryczna, combo:tech, dyplomacja | +2 dla grupy przy min. 3 | Łączność wzmacnia układ grupowy. |
| Centrum przetwarzania | data_center | 1 | 5 | elektryczna, combo:tech, bezpieczeństwo | +2 dla grupy przy min. 3 | Technologia w rzędzie bezpieczeństwa. |
| Laboratorium szczepionek | vaccine_lab | 1 | 5 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Niewielka siła pojedyncza, premia grupowa. |
| AfCFTA - system celny | afcfta_system | 1 | 4 | elektryczna, combo:tech, dyplomacja | +2 dla grupy przy min. 3 | Synergia handlu kontynentalnego. |
| Kolejarz transkontynentalny | rail_engineer | 1 | 9 | bez elektryczności, gospodarka | Brak | Jednostka infrastruktury odporna na Blackout. |
| Mediator Unii Afrykańskiej | au_mediator | 1 | 7 | elektryczna, dyplomacja | Brak | Karta dyplomatyczna bez specjalnego efektu. |
| Ratownik medyczny | medic | 1 | 8 | elektryczna, bezpieczeństwo | Brak | Wspiera rząd bezpieczeństwa. |
| Strażnik rezerwatu | ranger | 1 | 5 | bez elektryczności, bezpieczeństwo | Brak | Niska siła, odporność na Blackout. |
| Anansi | anansi | 1 | 6 | bez elektryczności, dyplomacja | Brak | Pierwsza z dwóch postaci fikcyjnych. |
| Mami Wata | mami_wata | 1 | 7 | bez elektryczności, dyplomacja, aura | +2 dla sąsiadów | Druga fikcyjna postać; premia zależy od kolejności. |
| Straż graniczna AfCFTA | afcfta_guards | 4 | 4 | bez elektryczności, muster:afcfta_guards, bezpieczeństwo | Muster | Seria ×4 o niskiej sile pojedynczej. |
| Konwój solarny | solar_convoy | 4 | 5 | bez elektryczności, muster:solar_convoy, bezpieczeństwo | Muster | Seria mobilna, dopasowana skalą do Azji. |
| Awaria sieci energetycznej | power_outage | 1 | 0 | wydarzenie, gospodarka/bezpieczeństwo | blackout | Atakuje podatny rząd rywala. |
| Sabotaż łączy telekomunikacyjnych | telecom_sabotage | 1 | 0 | wydarzenie, bezpieczeństwo | blackout | Drugi Blackout o innym temacie. |
| Skok cen żywności | food_price_shock | 1 | 0 | wydarzenie, gospodarka | half | Obniża siłę rzędu o połowę. |
| Susza w Sahelu | sahel_drought | 1 | 0 | wydarzenie, gospodarka | half | Drugi efekt połowienia, regionowość bez nowej reguły. |
| Zablokowane media | media_blackout | 1 | 0 | wydarzenie, dyplomacja | silence | Wyłącza premie w rzędzie. |
| Strajk transportowy | transport_strike | 1 | 0 | wydarzenie, gospodarka | strike | Czasowo zeruje punkty wybranego rzędu. |
| Sankcje surowcowe | resource_sanctions | 1 | 0 | wydarzenie, gospodarka | sanction | Osłabia najsilniejszą podatną kartę. |
| Powódź w delcie | delta_flood | 1 | 0 | wydarzenie, bezpieczeństwo | tornado | Niszczy najsłabsze podatne karty rzędu. |
| Anansi - zmyłka | anansi_decoy | 1 | 0 | taktyczna | decoy | Zwraca własną nie-liderską jednostkę do ręki. |
| Kurier kontynentalny | continental_courier | 1 | 8 | elektryczna, bezpieczeństwo | spy | Karta po stronie rywala, dobiera do 2 kart. |
| Zielony Pas | green_belt | 1 | 0 | taktyczna | clear | Usuwa osłabienia z własnej planszy. |
| Porozumienie kontynentalne | continental_accord | 1 | 0 | taktyczna | move | Przenosi własną jednostkę między rzędami. |
| Sieć diaspory | diaspora_network | 1 | 0 | taktyczna | draw | Dobiera jedną kartę z talii. |
| Eskorta konwoju | convoy_escort | 1 | 0 | taktyczna | protect | Ochrona własnej karty do końca rundy. |

## Talia Ameryki Południowej i Środkowej

| Nazwa | Klucz | Kopie | Siła | Tagi | Efekt | Uzasadnienie |
|---|---|---:|---:|---|---|---|
| Luiz Inácio Lula da Silva | lula | 1 | 20 | lider, elektryczna, dyplomacja | Lider | Bazowa siła lidera, bez oceny politycznej. |
| Javier Milei | milei | 1 | 18 | lider, elektryczna, gospodarka | Lider | Lider gospodarczy o tej samej skali. |
| Nayib Bukele | bukele | 1 | 16 | lider, bez elektryczności, bezpieczeństwo | Lider | Lider bezpieczeństwa odporny na Blackout. |
| Laura Fernández Delgado | laura_fernandez | 1 | 14 | lider, bez elektryczności, dyplomacja | Lider | Lider dyplomacji, równoważna siła bazowa. |
| Daniel Noboa | noboa | 1 | 15 | elektryczna, gospodarka | Brak | Współczesny polityk Ameryki Południowej. |
| Abelardo de la Espriella | de_la_espriella | 1 | 14 | elektryczna, bezpieczeństwo | Brak | Współczesna postać polityczna Kolumbii. |
| José Raúl Mulino | mulino | 1 | 13 | elektryczna, gospodarka | Brak | Reprezentuje Panamę i handel. |
| Bernardo Arévalo | arevalo | 1 | 12 | elektryczna, dyplomacja | Brak | Współczesny polityk Ameryki Środkowej. |
| Nasry Asfura | asfura | 1 | 11 | elektryczna, gospodarka | Brak | Reprezentuje Honduras. |
| Rodrigo Paz | rodrigo_paz | 1 | 10 | elektryczna, dyplomacja | Brak | Reprezentuje Boliwię. |
| Simón Bolívar | bolivar | 1 | 9 | bez elektryczności, bezpieczeństwo | Brak | Historyczna postać wojen niepodległościowych. |
| José de San Martín | san_martin | 1 | 8 | elektryczna, bezpieczeństwo | Brak | Historyczny dowódca i polityk. |
| Eva Perón | eva_peron | 1 | 7 | elektryczna, dyplomacja | Brak | Historyczna postać polityki społecznej. |
| Salvador Allende | allende | 1 | 6 | elektryczna, dyplomacja | Brak | Historyczny prezydent Chile. |
| Augusto César Sandino | sandino | 1 | 5 | elektryczna, bezpieczeństwo | Brak | Historyczna postać Ameryki Środkowej. |
| Omar Torrijos | torrijos | 1 | 4 | bez elektryczności, gospodarka | Brak | Historyczna postać Panamy, mieszcząca się w zakresie geograficznym. |
| Sieć natychmiastowych płatności | pix_network | 1 | 8 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Cyfrowa gospodarka, wspólna synergia. |
| Centrum litowe | lithium_center | 1 | 7 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Surowce i technologia w jednej grupie. |
| Konsorcjum hydroenergii | hydro_consor | 1 | 6 | elektryczna, combo:tech, gospodarka | +2 dla grupy przy min. 3 | Wspiera gospodarczy układ grupowy. |
| Sieć obserwacji Amazonii | amazon_monitor | 1 | 5 | elektryczna, combo:tech, bezpieczeństwo | +2 dla grupy przy min. 3 | Łączy technologię i ochronę regionu. |
| Centrum satelitarne | satellite_center | 1 | 5 | elektryczna, combo:tech, bezpieczeństwo | +2 dla grupy przy min. 3 | Niska siła bazowa, premia zespołowa. |
| Portowy system celny | port_customs | 1 | 4 | elektryczna, combo:tech, dyplomacja | +2 dla grupy przy min. 3 | Daje grupie kartę dyplomatyczną. |
| Operator kanału | canal_operator | 1 | 9 | bez elektryczności, gospodarka | Brak | Jednostka infrastruktury handlowej. |
| Obserwator wyborczy | election_observer | 1 | 7 | elektryczna, dyplomacja | Brak | Jednostka dyplomacji bez nowej mechaniki. |
| Pilot ratunkowy | rescue_pilot | 1 | 8 | elektryczna, bezpieczeństwo | Brak | Wspiera rząd bezpieczeństwa. |
| Strażnik Andów | andes_guard | 1 | 5 | bez elektryczności, bezpieczeństwo | Brak | Niska siła i odporność na Blackout. |
| El Dorado | el_dorado | 1 | 6 | bez elektryczności, gospodarka | Brak | Pierwsza z dwóch postaci fikcyjnych. |
| Chupacabra | chupacabra | 1 | 7 | bez elektryczności, bezpieczeństwo, immune | Odporność na negatywne efekty | Druga fikcyjna postać; defensywna karta. |
| Brygada ochrony Amazonii | amazon_guards | 4 | 4 | bez elektryczności, muster:amazon_guards, bezpieczeństwo | Muster | Seria ×4 o niskiej sile indywidualnej. |
| Konwój andyjski | andes_convoy | 4 | 5 | bez elektryczności, muster:andes_convoy, bezpieczeństwo | Muster | Druga seria; skala jak w pozostałych frakcjach. |
| Awaria sieci energetycznej | grid_failure | 1 | 0 | wydarzenie, gospodarka/bezpieczeństwo | blackout | Blackout wybranego rzędu rywala. |
| Awaria infrastruktury kanału | canal_outage | 1 | 0 | wydarzenie, gospodarka | blackout | Drugi Blackout o innym kontekście. |
| Kryzys walutowy | currency_crisis | 1 | 0 | wydarzenie, gospodarka | half | Obniża siłę wybranego rzędu o połowę. |
| Pożary Amazonii | amazon_fires | 1 | 0 | wydarzenie, bezpieczeństwo | half | Drugi efekt połowienia, bez nowej reguły. |
| Cenzura kampanii | campaign_censorship | 1 | 0 | wydarzenie, dyplomacja | silence | Wyłącza premie w wybranym rzędzie. |
| Strajk portowy | port_strike | 1 | 0 | wydarzenie, gospodarka | strike | Czasowe zerowanie punktów rzędu. |
| Sankcje handlowe | trade_sanctions | 1 | 0 | wydarzenie, gospodarka | sanction | Osłabia najsilniejszą podatną kartę rzędu. |
| Trzęsienie ziemi | earthquake | 1 | 0 | wydarzenie, bezpieczeństwo | tornado | Niszczy najsłabsze podatne karty w rzędzie. |
| Zaginione miasto - zmyłka | lost_city_decoy | 1 | 0 | taktyczna | decoy | Powrót własnej jednostki; nazwa w klimacie mitu El Dorado. |
| Broker kanałowy | canal_broker | 1 | 8 | elektryczna, bezpieczeństwo | spy | Jednostka po stronie rywala, dobiera do 2 kart. |
| Odbudowa Amazonii | amazon_recovery | 1 | 0 | taktyczna | clear | Usuwa osłabienia z własnej planszy. |
| Korytarz kontynentalny | continental_corridor | 1 | 0 | taktyczna | move | Przenosi własną jednostkę między rzędami. |
| Rezerwa banku centralnego | central_reserve | 1 | 0 | taktyczna | draw | Dobiera jedną kartę z talii. |
| Ochrona szlaku | route_guard | 1 | 0 | taktyczna | protect | Chroni własną kartę do końca rundy. |

## Kontrola sum i kwestie do akceptacji

- Każda propozycja sumuje się do 50 egzemplarzy: 16 postaci + 6 kart combo + 6 jednostek wsparcia + 8 kart w dwóch seriach ×4 + 8 wydarzeń + 6 kart taktycznych.
- Każda propozycja ma 44 różne klucze/ilustracje: seria ×4 zajmuje po jednym kluczu na serię.
- Zestawy efektów są identyczne między frakcjami; bazowe siły liderów, postaci, serii i grup combo również mają tę samą krzywą. To wyrównuje narzędzia, choć faktyczny balans trzeba później potwierdzić symulacjami pełnych meczów.
- Brak nowych efektów. Jeżeli lista zostanie zaakceptowana, trzeba będzie dodać frakcje i teksty kart do danych gry, UI i testów przed użyciem w rozgrywce.
- Obecne pliki `src/data/geopolitix.mjs`, tłumaczenia i manifest grafik nie zawierają nowych frakcji. Ten dokument nie wprowadza kart do gry.

## Źródła sprawdzenia współczesnych postaci

- Azja: AP o spotkaniu przywódców Chin, Rosji i Indii (31.08.2026): https://apnews.com/article/cf543dfad0a20097ed4c2b415a26e8b4 ; AP o współpracy premier Japonii Sanae Takaichi i prezydenta Korei Lee Jae-myunga (13.01.2026): https://apnews.com/article/8523995d0a2bad880c62b3dbfe0b9035 ; AP o prezydencie Iranu Masoudzie Pezeshkianie (23.09.2026): https://apnews.com/article/210d432587bb8dc2d7303ca4c8ea67b6 ; AP o prezydencie Indonezji Prabowo Subianto (22.10.2026): https://apnews.com/article/b8b593b960cde0ed6db837144ca68798 ; AP o Mohammedzie bin Salmanie i el-Sisim (15.09.2026): https://apnews.com/article/bfee618a925924b8562f9fb0a58538b7 ; AP o Benjaminie Netanyahym (08.09.2026): https://apnews.com/article/935c2cd82d3204d6dc859d296fc866e3 .
- Afryka: Unia Afrykańska - wykaz prezydentów (Cyril Ramaphosa, William Ruto, Bola Tinubu, Duma Boko, Abdelmadjid Tebboune, Paul Kagame, John Mahama, Samia Suluhu Hassan): https://au.int/fr/presidents-champions ; komunikat AU z listą urzędujących liderów (w tym Netumbo Nandi-Ndaitwah): https://aprm.au.int/sites/default/files/files/2026-02/enfinal-communique-35th-apr-summit-14-2-2026-002.pdf ; profil AU Egiptu (Abdel Fattah el-Sisi): https://au.int/en/cities/cairo .
- Ameryka Środkowa i Południowa: Congressional Research Service, liderzy i harmonogramy wyborów w Ameryce Łacińskiej: https://www.congress.gov/crs_external_products/RS/PDF/98-684/98-684.218.pdf ; AP o reelekcji Luiza Inácio Luli da Silvy (26.10.2026): https://apnews.com/article/b68d2e2e315644e62de8f6839e8ddcff ; wynik wyborów w Kostaryce - Tribunal Supremo de Elecciones: https://www.tse.go.cr/comunicado1168.html ; urząd prezydenta Hondurasu - Secretaría de Defensa Nacional: https://sedena.gob.hn/noticias/toma-de-posesion-presidencial-2026 ; prezydent Boliwii - oficjalna strona rządu: https://presidencia.gob.bo/index.php/presidente-de-bolivia/ ; wybory i inauguracja prezydenta Kolumbii - CRS: https://www.everycrsreport.com/files/2026-09-24_IN12689_81ffbe7576f18488bfc6e82c2b13faccad8694d9.html .

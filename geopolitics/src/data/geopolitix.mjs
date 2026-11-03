export const rows = ['diplomacy', 'economy', 'defense'];
export const rowLabels = {diplomacy:'Dyplomacja', economy:'Gospodarka', defense:'Bezpieczeństwo'};
export const factions = ['europe', 'america', 'asia', 'africa', 'south_america'];
export const factionLabels = {europe:'Europe', america:'North America', asia:'Asia', africa:'Africa', south_america:'South America'};
// Przeciwnik, gdy nie wybrano go jawnie (zgodność wsteczna: europe <-> america).
export const defaultOpponent = f => f==='europe'?'america':'europe';
const unit = (key, name, power, row, more={}) => ({key,name,power,row,type:'unit',electric:true,...more});
const hero = (key,name,power,row,electric=true) => unit(key,name,power,row,{hero:true,electric});
const event = (key,name,effect,row,desc) => ({key,name,effect,row,type:'event',power:0,desc});
const special = (key,name,effect,desc) => ({key,name,effect,type:'special',power:0,desc});
const series = (key,name,power,more={}) => Array.from({length:4},()=>unit(key,name,power,'defense',{muster:key,electric:false,...more}));
export const descriptions = {
 blackout:'Do końca rundy: podatne karty w wybranym rzędzie rywala mają siłę 1. Liderzy i chronione karty są odporne.',
 half:'Do końca rundy: siła podatnych kart w wybranym rzędzie rywala spada o połowę, w dół.',
 silence:'Do końca rundy: wyłącza premie podatnych kart w wybranym rzędzie rywala.',
 strike:'Wyłącza punkty podatnych kart rzędu do końca następnej akcji rywala. Przy końcu rundy efekt jeszcze się liczy.',
 sanction:'Najsilniejsza podatna karta wybranego rzędu traci połowę siły do końca rundy. Remis: pierwsza od lewej.',
 tornado:'Niszczy wszystkie najsłabsze podatne karty wybranego rzędu, według aktualnej siły.',
 decoy:'Wybierz własną kartę na planszy (oprócz lidera), aby wróciła do ręki. Krasnal trafia na cmentarz.',
 spy:'Zagraj na stronę rywala; jego punkty rosną. Dobierz do 2 kart z talii.',
 clear:'Usuwa wszystkie katastrofy i osłabienia z Twojej planszy.',
 move:'Przenieś własną kartę (oprócz lidera) do innego rzędu.',
 bribe:'Losowa nieliderska jednostka z cmentarza rywala trafia na Twój stół. Bez ponownego wywołania zdolności.',
 draw:'Dobierz jedną kartę z talii. Pusta talia nie daje karty.',
 protect:'Wybrana własna karta jest odporna na osłabienie i zniszczenie do końca rundy.'
};
const eu = [
 hero('orban','Viktor Orbán',20,'diplomacy'),hero('ursula','Ursula von der Leyen',18,'diplomacy'),hero('thatcher','Margaret Thatcher',17,'economy'),hero('churchill','Winston Churchill',15,'defense',false),
 unit('meloni','Giorgia Meloni',15,'diplomacy'),unit('tusk','Donald Tusk',14,'economy'),unit('macron','Emmanuel Macron',13,'diplomacy'),unit('scholz','Olaf Scholz',12,'economy'),unit('sanchez','Pedro Sánchez',11,'diplomacy'),unit('rutte','Mark Rutte',10,'economy'),
 ...series('blake','John Blake',4),
 ...[['jaroslaw','Jarosław Kaczyński',8,'diplomacy'],['lech','Lech Kaczyński',8,'diplomacy'],['morawiecki','Mateusz Morawiecki',6,'economy'],['duda','Andrzej Duda',6,'diplomacy'],['szydlo','Beata Szydło',5,'economy'],['czarnek','Przemysław Czarnek',5,'diplomacy']].map(a=>unit(...a,{combo:'coalition'})),
 ...series('swiss','Gwardia Szwajcarska',5),
 ...[['royal','Gwardia Królewska',8,'defense',false],['interpol','Agent Interpolu',7,'defense',true],['diplomat','Dyplomata z Brukseli',6,'diplomacy',true],['cars','Koncern samochodowy',9,'economy',true],['athlete','Francuski lekkoatleta',5,'diplomacy',false],['chef','Włoski szef kuchni',4,'diplomacy',false],['battery','Instalator baterii',6,'economy',true],['miner','Górnik ze Śląska',7,'economy',false],['navigator','Hiszpański nawigator',5,'economy',false],['banker','Szwajcarski bankier',9,'economy',true],['garden','Ogród filozoficzny',3,'diplomacy',false],['analyst','Brytyjski analityk',6,'diplomacy',true]].map(([k,n,p,r,e])=>unit(k,n,p,r,{electric:e})),
 event('blackout','Awaria elektrowni','blackout',['economy','defense']),event('strike','Strajk generalny','strike',['economy']),event('sanctions','Sankcje gospodarcze','sanction',['economy']),event('energy','Kryzys energetyczny','half',['economy']),event('scandal','Afera medialna','half',['diplomacy']),event('cyber','Cyberatak na sieć','blackout',['defense']),event('flood','Powódź stulecia','half',['economy']),event('press','Cenzura prasy','silence',['diplomacy']),
 special('gnome','Krasnal','decoy'),unit('devil','Czarny Diabeł',7,'defense',{effect:'spy'}),special('elf','Zielony Elf','clear'),unit('mermaid','Syrenka Warszawska',8,'diplomacy',{aura:true,electric:false}),special('pact','Pakt dyplomatyczny','move'),special('bribe','Łapówka','bribe')
];
const na = [
 hero('washington','George Washington',20,'defense',false),hero('obama','Barack Obama',18,'diplomacy'),hero('trump','Donald Trump',17,'economy'),hero('lincoln','Abraham Lincoln',16,'diplomacy',false),
 ...[['biden','Joe Biden',15,'diplomacy'],['clinton','Bill Clinton',14,'diplomacy'],['ford','Gerald Ford',13,'economy'],['trudeau','Justin Trudeau',12,'diplomacy'],['reagan','Ronald Reagan',11,'defense'],['bush','George W. Bush',10,'defense']].map(a=>unit(...a)),
 ...series('cowboy','Teksaski kowboj',5,{horse:true}),...series('rcmp','Gwardia Kanadyjska',4,{horse:true,horseBonus:true}),
 ...[['ceo','Tech CEO',8],['ai','Inżynier AI',7],['venture','Inwestor Venture',6],['crypto','Kryptowalutowy magnat',5],['scientist','Data Scientist',5],['startup','Startupek',4]].map(a=>unit(...a,'economy',{combo:'tech'})),
 ...[['secret','Agent Secret Service',8,'defense',true],['pilot','Pilot F-35',9,'defense',true],['farmer','Farmer z Midwestu',6,'economy',false],['wallstreet','Lobbing z Wall Street',9,'economy',true],['hollywood','Hollywoodzki gwiazdor',7,'diplomacy',true],['nfl','Gracz NFL',6,'defense',false],['sheriff','Szeryf z Arizony',5,'defense',false],['lumberjack','Drwal z Kanady',7,'economy',false],['business','Meksykański przedsiębiorca',6,'economy',true],['nasa','Inżynier NASA',8,'defense',true],['journalist','Dziennikarz',5,'diplomacy',true],['guide','Przewodnik Yellowstone',4,'diplomacy',false]].map(([k,n,p,r,e])=>unit(k,n,p,r,{electric:e})),
 event('tornado','Trąba powietrzna','tornado',['economy','defense']),event('crash','Kryzys na Wall Street','half',['economy']),event('katrina','Huragan Katrina','half',['economy']),event('protest','Protesty i strajki','strike',['diplomacy']),event('drought','Susza w Kalifornii','half',['economy']),event('leak','Wyciek danych','silence',['diplomacy']),event('embargo','Embargo handlowe','sanction',['economy']),event('capitol','Szturm na Kapitol','half',['diplomacy']),
 special('leprechaun','Leprechaun','decoy'),unit('broker','Shadow Broker',8,'defense',{effect:'spy'}),special('whistleblower','Whistleblower','clear'),unit('bigfoot','Bigfoot',10,'defense',{immune:true,electric:false}),special('qe','Wydruk dolarów','draw'),special('bodyguard','Prywatny ochroniarz','protect')
];
const asia = [
 hero('xi','Xi Jinping',20,'diplomacy'),hero('modi','Narendra Modi',18,'economy'),hero('putin','Władimir Putin',16,'defense',false),hero('erdogan','Recep Tayyip Erdoğan',14,'diplomacy',false),
 ...[['takaichi','Sanae Takaichi',15,'diplomacy'],['lee_jae_myung','Lee Jae-myung',14,'economy'],['pezeshkian','Masoud Pezeshkian',13,'diplomacy'],['mb_saud','Mohammed bin Salman',12,'economy'],['shogun','Shōgun',11,'defense'],['prabowo','Prabowo Subianto',10,'defense'],['genghis_khan','Czyngis-chan',9,'defense'],['bruce_lee','Bruce Lee',8,'defense',false],['ataturk','Mustafa Kemal Atatürk',7,'diplomacy'],['mao','Mao Zedong',6,'defense'],['golda_meir','Golda Meir',5,'diplomacy'],['akbar','Akbar Wielki',4,'economy',false]].map(([k,n,p,r,e=true])=>unit(k,n,p,r,{electric:e})),
 ...[['chipmakers','Konsorcjum półprzewodników',8,'economy'],['robotics_lab','Laboratorium robotyki',7,'economy'],['satellite_network','Sieć satelitarna',6,'defense'],['battery_plant','Fabryka baterii',5,'economy'],['digital_exchange','Giełda cyfrowa',5,'economy'],['data_terminal','Terminal danych',4,'diplomacy']].map(a=>unit(...a,{combo:'tech'})),
 ...[['silk_convoy','Konwój na Jedwabnym Szlaku',9,'economy',false],['asean_diplomat','Dyplomata ASEAN',7,'diplomacy',true],['oil_analyst','Analityk rynku ropy',8,'economy',true],['mountain_guide','Górski przewodnik',5,'defense',false]].map(([k,n,p,r,e])=>unit(k,n,p,r,{electric:e})),
 unit('yeti','Yeti',6,'defense',{immune:true,electric:false}),unit('jade_dragon','Jadeitowy Smok',7,'diplomacy',{aura:true,electric:false}),
 ...series('border_patrol','Patrol graniczny',4),...series('trade_fleet','Flota handlowa',5),
 event('grid_blackout','Blackout sieci energetycznej','blackout',['economy','defense']),event('satellite_failure','Awaria sieci satelitarnej','blackout',['defense']),event('oil_crisis','Kryzys naftowy','half',['economy']),event('supply_crisis','Kryzys łańcucha dostaw','half',['economy']),event('digital_censorship','Cenzura cyfrowa','silence',['diplomacy']),event('port_strike','Strajk portowy','strike',['economy']),event('trade_sanctions','Sankcje handlowe','sanction',['economy']),event('earthquake','Trzęsienie ziemi','tornado',['defense']),
 special('yeti_decoy','Yeti - zmyłka','decoy','Wybierz własną kartę na planszy (oprócz lidera), aby wróciła do ręki. Yeti trafia na cmentarz.'),unit('intel_courier','Kurier wywiadu',8,'defense',{effect:'spy'}),special('monsoon_relief','Pomoc po monsunie','clear'),special('corridor_accord','Porozumienie korytarzowe','move'),special('reserve_fund','Fundusz rezerwowy','draw'),special('convoy_guard','Ochrona konwoju','protect')
];
const africa = [
 hero('ramaphosa','Cyril Ramaphosa',20,'diplomacy',true),
 hero('ruto','William Ruto',18,'economy',true),
 hero('tinubu','Bola Tinubu',16,'defense',false),
 hero('boko','Duma Boko',14,'diplomacy',false),
 unit('netumbo','Netumbo Nandi-Ndaitwah',15,'diplomacy',{electric:true}),
 unit('elsisi','Abdel Fattah el-Sisi',14,'defense',{electric:true}),
 unit('mahama','John Mahama',13,'diplomacy',{electric:true}),
 unit('tebboune','Abdelmadjid Tebboune',12,'economy',{electric:true}),
 unit('kagame','Paul Kagame',11,'defense',{electric:true}),
 unit('samia','Samia Suluhu Hassan',10,'economy',{electric:true}),
 unit('mandela','Nelson Mandela',9,'diplomacy',{electric:false}),
 unit('nkrumah','Kwame Nkrumah',8,'diplomacy',{electric:true}),
 unit('sankara','Thomas Sankara',7,'economy',{electric:true}),
 unit('haile_selassie','Hajle Syllasje',6,'diplomacy',{electric:true}),
 unit('nasser','Gamal Abdel Naser',5,'defense',{electric:true}),
 unit('mansa_musa','Mansa Musa',4,'economy',{electric:false}),
 unit('mobile_payments','Sieć płatności mobilnych',8,'economy',{electric:true,combo:'tech'}),
 unit('solar_consor','Konsorcjum energii słonecznej',7,'economy',{electric:true,combo:'tech'}),
 unit('telecom_hub','Hub telekomunikacyjny',6,'diplomacy',{electric:true,combo:'tech'}),
 unit('data_center','Centrum przetwarzania',5,'defense',{electric:true,combo:'tech'}),
 unit('vaccine_lab','Laboratorium szczepionek',5,'economy',{electric:true,combo:'tech'}),
 unit('afcfta_system','AfCFTA - system celny',4,'diplomacy',{electric:true,combo:'tech'}),
 unit('rail_engineer','Kolejarz transkontynentalny',9,'economy',{electric:false}),
 unit('au_mediator','Mediator Unii Afrykańskiej',7,'diplomacy',{electric:true}),
 unit('medic','Ratownik medyczny',8,'defense',{electric:true}),
 unit('ranger','Strażnik rezerwatu',5,'defense',{electric:false}),
 unit('anansi','Anansi',6,'diplomacy',{electric:false}),
 unit('mami_wata','Mami Wata',7,'diplomacy',{electric:false,aura:true}),
 ...series('afcfta_guards','Straż graniczna AfCFTA',4),
 ...series('solar_convoy','Konwój solarny',5),
 event('power_outage','Awaria sieci energetycznej','blackout',['economy', 'defense']),
 event('telecom_sabotage','Sabotaż łączy telekomunikacyjnych','blackout',['defense']),
 event('food_price_shock','Skok cen żywności','half',['economy']),
 event('sahel_drought','Susza w Sahelu','half',['economy']),
 event('media_blackout','Zablokowane media','silence',['diplomacy']),
 event('transport_strike','Strajk transportowy','strike',['economy']),
 event('resource_sanctions','Sankcje surowcowe','sanction',['economy']),
 event('delta_flood','Powódź w delcie','tornado',['defense']),
 special('anansi_decoy','Anansi - zmyłka','decoy','Anansi trafia na cmentarz.'),
 unit('continental_courier','Kurier kontynentalny',8,'defense',{electric:true,effect:'spy'}),
 special('green_belt','Zielony Pas','clear'),
 special('continental_accord','Porozumienie kontynentalne','move'),
 special('diaspora_network','Sieć diaspory','draw'),
 special('convoy_escort','Eskorta konwoju','protect')
];
const south_america = [
 hero('lula','Luiz Inácio Lula da Silva',20,'diplomacy',true),
 hero('milei','Javier Milei',18,'economy',true),
 hero('bukele','Nayib Bukele',16,'defense',false),
 hero('laura_fernandez','Laura Fernández Delgado',14,'diplomacy',false),
 unit('noboa','Daniel Noboa',15,'economy',{electric:true}),
 unit('de_la_espriella','Abelardo de la Espriella',14,'defense',{electric:true}),
 unit('mulino','José Raúl Mulino',13,'economy',{electric:true}),
 unit('arevalo','Bernardo Arévalo',12,'diplomacy',{electric:true}),
 unit('asfura','Nasry Asfura',11,'economy',{electric:true}),
 unit('rodrigo_paz','Rodrigo Paz',10,'diplomacy',{electric:true}),
 unit('bolivar','Simón Bolívar',9,'defense',{electric:false}),
 unit('san_martin','José de San Martín',8,'defense',{electric:true}),
 unit('eva_peron','Eva Perón',7,'diplomacy',{electric:true}),
 unit('allende','Salvador Allende',6,'diplomacy',{electric:true}),
 unit('sandino','Augusto César Sandino',5,'defense',{electric:true}),
 unit('torrijos','Omar Torrijos',4,'economy',{electric:false}),
 unit('pix_network','Sieć natychmiastowych płatności',8,'economy',{electric:true,combo:'tech'}),
 unit('lithium_center','Centrum litowe',7,'economy',{electric:true,combo:'tech'}),
 unit('hydro_consor','Konsorcjum hydroenergii',6,'economy',{electric:true,combo:'tech'}),
 unit('amazon_monitor','Sieć obserwacji Amazonii',5,'defense',{electric:true,combo:'tech'}),
 unit('satellite_center','Centrum satelitarne',5,'defense',{electric:true,combo:'tech'}),
 unit('port_customs','Portowy system celny',4,'diplomacy',{electric:true,combo:'tech'}),
 unit('canal_operator','Operator kanału',9,'economy',{electric:false}),
 unit('election_observer','Obserwator wyborczy',7,'diplomacy',{electric:true}),
 unit('rescue_pilot','Pilot ratunkowy',8,'defense',{electric:true}),
 unit('andes_guard','Strażnik Andów',5,'defense',{electric:false}),
 unit('el_dorado','El Dorado',6,'economy',{electric:false}),
 unit('chupacabra','Chupacabra',7,'defense',{electric:false,immune:true}),
 ...series('amazon_guards','Brygada ochrony Amazonii',4),
 ...series('andes_convoy','Konwój andyjski',5),
 event('grid_failure','Awaria sieci energetycznej','blackout',['economy', 'defense']),
 event('canal_outage','Awaria infrastruktury kanału','blackout',['economy']),
 event('currency_crisis','Kryzys walutowy','half',['economy']),
 event('amazon_fires','Pożary Amazonii','half',['defense']),
 event('campaign_censorship','Cenzura kampanii','silence',['diplomacy']),
 event('port_strike','Strajk portowy','strike',['economy']),
 event('trade_sanctions','Sankcje handlowe','sanction',['economy']),
 event('earthquake','Trzęsienie ziemi','tornado',['defense']),
 special('lost_city_decoy','Zaginione miasto - zmyłka','decoy','Zaginione miasto trafia na cmentarz.'),
 unit('canal_broker','Broker kanałowy',8,'defense',{electric:true,effect:'spy'}),
 special('amazon_recovery','Odbudowa Amazonii','clear'),
 special('continental_corridor','Korytarz kontynentalny','move'),
 special('central_reserve','Rezerwa banku centralnego','draw'),
 special('route_guard','Ochrona szlaku','protect')
];
const decks = {europe:eu, america:na, asia, africa, south_america};
export function deckFor(faction, owner) {
 return (decks[faction]||eu).map((c,i)=>({...c,id:`${owner}-${faction}-${i}`,owner,faction,nameKey:`cards.${c.key}.name`,desc:c.desc || descriptions[c.effect] || (c.hero?'Lider: odporny na osłabienie, zniszczenie i przenoszenie.':c.muster?'Muster: przywołuje pozostałe karty tej serii z talii, nie z ręki.':c.combo?'Przy co najmniej 3 kartach tej grupy: każda otrzymuje +2 siły.':c.aura?'Sąsiednie karty w tym rzędzie otrzymują +2 siły.':'Zagraj do przypisanego rzędu.')+(c.electric===false?' Odporność na Blackout.':'')}));
}

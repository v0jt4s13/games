export const rows = ['diplomacy', 'economy', 'defense'];
export const rowLabels = {diplomacy:'Dyplomacja', economy:'Gospodarka', defense:'Bezpieczeństwo'};
export const factionLabels = {europe:'Europe', america:'North America'};
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
export function deckFor(faction, owner) {
 return (faction==='europe'?eu:na).map((c,i)=>({...c,id:`${owner}-${faction}-${i}`,owner,faction,nameKey:`cards.${c.key}.name`,desc:c.desc || descriptions[c.effect] || (c.hero?'Lider: odporny na osłabienie, zniszczenie i przenoszenie.':c.muster?'Muster: przywołuje pozostałe karty tej serii z talii, nie z ręki.':c.combo?'Przy co najmniej 3 kartach tej grupy: każda otrzymuje +2 siły.':c.aura?'Sąsiednie karty w tym rzędzie otrzymują +2 siły.':'Zagraj do przypisanego rzędu.')+(c.electric===false?' Odporność na Blackout.':'')}));
}

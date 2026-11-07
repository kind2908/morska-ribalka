// Страны, города (районы) с точками, часовой пояс, правила рыбалки.
// Названия мест: ru, en (латиница), loc (на языке страны).

const ME_REGIONS = [
  { key: 'Херцег-Нови', ru: 'Херцег-Нови', en: 'Herceg Novi', loc: 'Herceg Novi', pts: [[42.4490, 18.5685], [42.4300, 18.5550], [42.2785, 18.4673]] },
  { key: 'Тиват', ru: 'Тиват', en: 'Tivat / Boka', loc: 'Tivat / Boka', pts: [[42.4350, 18.6950], [42.4400, 18.7100], [42.2785, 18.4673]] },
  { key: 'Будва', ru: 'Будва', en: 'Budva', loc: 'Budva', pts: [[42.2790, 18.8400], [42.2600, 18.8143], [42.1840, 18.7120]] },
  { key: 'Петровац', ru: 'Петровац', en: 'Petrovac', loc: 'Petrovac', pts: [[42.2060, 18.9460], [42.1870, 18.9203], [42.1110, 18.8180]] },
  { key: 'Бар', ru: 'Бар', en: 'Bar', loc: 'Bar', pts: [[42.0930, 19.0870], [42.0740, 19.0613], [41.9980, 18.9590]] },
  { key: 'Ульцинь', ru: 'Ульцинь', en: 'Ulcinj', loc: 'Ulcinj', pts: [[41.9200, 19.2040], [41.9010, 19.1783], [41.8250, 19.0760]] }
];

const DISCLAIMER = [
  'Сведения собраны из открытых публикаций и могут устареть. Это не юридическая консультация. Перед рыбалкой уточните правила в местном ведомстве или рыболовном клубе.',
  'The information is collected from public sources and may be out of date. It is not legal advice. Check the rules with the local authority or a fishing club before fishing.',
  'Podaci su prikupljeni iz javnih izvora i mogu biti zastarjeli. To nije pravni savjet. Prije ribolova provjerite pravila kod lokalne službe ili ribolovnog kluba.'
];

const COUNTRIES = [
  {
    code: 'ME', name: ['Черногория', 'Montenegro', 'Crna Gora'], native: 'Crna Gora', lang: 'sr', tz: 'Europe/Belgrade',
    sea: ['Адриатика', 'Adriatic', 'Jadran'], regions: ME_REGIONS,
    authority: ['Министерство сельского хозяйства Черногории', 'the Ministry of Agriculture of Montenegro', 'Ministarstvo poljoprivrede Crne Gore'],
    rules: null // берётся из DATA.rules
  },
  {
    code: 'HR', name: ['Хорватия', 'Croatia', 'Hrvatska'], native: 'Hrvatska', lang: 'hr', tz: 'Europe/Belgrade',
    sea: ['Адриатика', 'Adriatic', 'Jadran'],
    authority: ['Министерство сельского хозяйства Хорватии (Управление рыболовства)', 'the Croatian Ministry of Agriculture (Directorate of Fisheries)', 'Ministarstvo poljoprivrede Hrvatske (Uprava ribarstva)'],
    regions: [
      { key: 'Пула', ru: 'Пула', en: 'Pula', loc: 'Pula', pts: [[44.8690, 13.8425], [44.8250, 13.8000], [44.7200, 13.6200]] },
      { key: 'Ровинь', ru: 'Ровинь', en: 'Rovinj', loc: 'Rovinj', pts: [[45.0790, 13.6340], [45.0600, 13.5700], [44.9900, 13.4300]] },
      { key: 'Пореч', ru: 'Пореч', en: 'Poreč', loc: 'Poreč', pts: [[45.2265, 13.5890], [45.2250, 13.5550], [45.2000, 13.4000]] },
      { key: 'Умаг', ru: 'Умаг', en: 'Umag', loc: 'Umag', pts: [[45.4320, 13.5170], [45.4300, 13.4800], [45.4200, 13.3300]] },
      { key: 'Опатия', ru: 'Опатия', en: 'Opatija', loc: 'Opatija', pts: [[45.3368, 14.3108], [45.3250, 14.3450], [45.1900, 14.2800]] },
      { key: 'Мали-Лошинь', ru: 'Мали-Лошинь', en: 'Mali Lošinj', loc: 'Mali Lošinj', pts: [[44.5300, 14.4400], [44.5200, 14.4100], [44.5000, 14.2500]] },
      { key: 'Задар', ru: 'Задар', en: 'Zadar', loc: 'Zadar', pts: [[44.1190, 15.2240], [44.1400, 15.1900], [44.1800, 15.0500]] },
      { key: 'Шибеник', ru: 'Шибеник', en: 'Šibenik', loc: 'Šibenik', pts: [[43.7000, 15.8850], [43.6900, 15.8700], [43.6000, 15.7200]] },
      { key: 'Сплит', ru: 'Сплит', en: 'Split', loc: 'Split', pts: [[43.5000, 16.4400], [43.4650, 16.4300], [43.2500, 16.5000]] },
      { key: 'Макарска', ru: 'Макарска', en: 'Makarska', loc: 'Makarska', pts: [[43.2900, 17.0120], [43.2700, 17.0000], [43.2200, 16.9500]] },
      { key: 'Корчула', ru: 'Корчула', en: 'Korčula', loc: 'Korčula', pts: [[42.9630, 17.1400], [42.9500, 17.1700], [42.8300, 17.1300]] },
      { key: 'Дубровник', ru: 'Дубровник', en: 'Dubrovnik', loc: 'Dubrovnik', pts: [[42.6382, 18.1100], [42.6000, 18.0800], [42.5000, 17.9500]] }
    ],
    rules: [
      ['Нужна лицензия на любую морскую рыбалку, с берега и с лодки (с 14 лет). Бывает суточная, на несколько дней и годовая. Годовую продают с 1 декабря по 1 марта, обычно резидентам. Суточные и многодневные можно купить онлайн на сайте Минсельхоза.',
       'A licence is needed for any sea fishing, from shore or from a boat (age 14 and over). Daily, multi-day and annual types exist. Annual licences are sold from 1 December to 1 March, generally to residents. Daily and multi-day ones can be bought online from the Ministry of Agriculture.',
       'Za svaki morski ribolov, s obale i s broda, potrebna je dozvola (od 14 godina). Postoji dnevna, višednevna i godišnja. Godišnja se prodaje od 1. prosinca do 1. ožujka, najčešće rezidentima. Dnevne i višednevne mogu se kupiti online na stranici Ministarstva poljoprivrede.'],
      ['Улов для рекреационной лицензии: до 5 кг в сутки. Для крупной рыбы (синий тунец, рыба-меч, парусник) нужна отдельная лицензия: один экземпляр в сутки, обязателен отчёт.',
       'Recreational licence catch: up to 5 kg per day. Big-game fish (bluefin tuna, swordfish, sailfish) need a separate licence: one fish per day, with a report.',
       'Ulov za rekreacijsku dozvolu: do 5 kg dnevno. Za krupnu ribu (plavoperajna tuna, sabljarka, jedrenjak) potrebna je posebna dozvola: jedan primjerak dnevno, uz obvezno izvješće.'],
      ['Снасти: до 2 ручных лесок («odmet»), до 2 «kančenica», до 2 троллинговых, до 2 приманок для головоногих. Донный ярус, ловушки (до 3) и подводные ружья (до 2) только по специальным лицензиям.',
       'Gear: up to 2 handlines (“odmet”), up to 2 “kančenica”, up to 2 trolling lines, up to 2 cephalopod jigs. Bottom longlines, pots (up to 3) and spear guns (up to 2) need special licences.',
       'Alat: do 2 ručne panule („odmet“), do 2 „kančenice“, do 2 trolling panule, do 2 varalice za glavonošce. Dugi parangal, vrše (do 3) i podvodne puške (do 2) samo uz posebne dozvole.'],
      ['Подводная охота: по спортивной лицензии (через хорватский союз морского спортивного рыболовства). Только на задержке дыхания, без акваланга, днём, с буем, силой своего тела.',
       'Spearfishing: with a sport licence (through the Croatian sport sea fishing association). Breath-hold only, no scuba, daylight only, with a buoy, under your own power.',
       'Podvodni ribolov: uz sportsku dozvolu (preko hrvatskog saveza za sportski ribolov na moru). Samo na dah, bez autonomnog aparata, danju, s plovkom, vlastitom snagom.'],
      ['Нельзя ловить в портах, на пляжах и местах купания с 1 мая по 1 октября, в особых заповедниках, в устьях ряда рек (Драгоня, Мирна, Неретва, Цетина). В национальных парках (Бриони, Корнаты, Mljet) и природных парках действуют отдельные правила и разрешения.',
       'Do not fish in ports, on beaches and bathing areas from 1 May to 1 October, in special reserves or in several river mouths (Dragonja, Mirna, Neretva, Cetina). National parks (Brijuni, Kornati, Mljet) and nature parks have separate rules and permits.',
       'Zabranjen je ribolov u lukama, na plažama i kupalištima od 1. svibnja do 1. listopada, u posebnim rezervatima i ušćima nekoliko rijeka (Dragonja, Mirna, Neretva, Cetina). U nacionalnim parkovima (Brijuni, Kornati, Mljet) i parkovima prirode vrijede posebna pravila i dozvole.'],
      ['Продавать улов нельзя. Действуют минимальные размеры по правилам ЕС (регламент 2019/1241). Охраняемых животных (морские коньки, черепахи, дельфины, красный коралл, благородная пинна) нельзя трогать.',
       'Selling the catch is forbidden. EU minimum sizes apply (Regulation 2019/1241). Protected animals (seahorses, turtles, dolphins, red coral, noble pen shell) must not be touched.',
       'Prodaja ulova je zabranjena. Vrijede minimalne veličine prema pravilima EU (uredba 2019/1241). Zaštićene životinje (morski konjici, kornjače, dupini, crveni koralj, plemenita periska) ne smiju se dirati.'],
      ['Безопасность: экстренный номер 112, морская спасательная служба 195. Берите спасательный жилет, телефон и сообщайте близким, куда идёте.',
       'Safety: emergency number 112, maritime rescue 195. Take a life jacket and a phone and tell someone where you are going.',
       'Sigurnost: broj hitnih službi 112, pomorsko spašavanje 195. Ponesite prsluk za spašavanje i telefon i javite bliskima kamo idete.'],
      DISCLAIMER,
      ['Источники: gov.hr (Marine recreational and sport fisheries), croatiatraveller.com, Eurofish. Размеры лицензий и лимиты менялись, проверяйте на сайте Минсельхоза.',
       'Sources: gov.hr (Marine recreational and sport fisheries), croatiatraveller.com, Eurofish. Licence fees and limits have changed, so check the Ministry website.',
       'Izvori: gov.hr (Marine recreational and sport fisheries), croatiatraveller.com, Eurofish. Cijene i ograničenja su se mijenjali, provjerite na stranici Ministarstva.']
    ]
  },
  {
    code: 'IT', name: ['Италия', 'Italy', 'Italija'], native: 'Italia', lang: 'it', tz: 'Europe/Belgrade',
    sea: ['Средиземное море', 'Mediterranean', 'Sredozemno more'],
    authority: ['Министерство сельского хозяйства Италии (MASAF) и местная Капитанерия порта', 'the Italian Ministry of Agriculture (MASAF) and the local Harbour Master (Capitaneria di Porto)', 'Ministarstvo poljoprivrede Italije (MASAF) i lokalna lučka kapetanija'],
    regions: [
      { key: 'Триест', ru: 'Триест', en: 'Trieste', loc: 'Trieste', pts: [[45.6480, 13.7600], [45.6200, 13.7300], [45.6200, 13.6000]] },
      { key: 'Венеция (Лидо)', ru: 'Венеция (Лидо)', en: 'Venice (Lido)', loc: 'Venezia (Lido)', pts: [[45.3890, 12.3730], [45.3800, 12.4200], [45.3000, 12.5500]] },
      { key: 'Римини', ru: 'Римини', en: 'Rimini', loc: 'Rimini', pts: [[44.0625, 12.5885], [44.0700, 12.6200], [44.1000, 12.7600]] },
      { key: 'Анкона', ru: 'Анкона', en: 'Ancona', loc: 'Ancona', pts: [[43.6208, 13.5085], [43.6400, 13.5400], [43.7200, 13.6500]] },
      { key: 'Пескара', ru: 'Пескара', en: 'Pescara', loc: 'Pescara', pts: [[42.4720, 14.2250], [42.4800, 14.2500], [42.5500, 14.3500]] },
      { key: 'Бари', ru: 'Бари', en: 'Bari', loc: 'Bari', pts: [[41.1260, 16.8750], [41.1500, 16.9000], [41.2500, 17.0000]] },
      { key: 'Отранто', ru: 'Отранто', en: 'Otranto', loc: 'Otranto', pts: [[40.1486, 18.4918], [40.1500, 18.5300], [40.1700, 18.6500]] },
      { key: 'Таранто', ru: 'Таранто', en: 'Taranto', loc: 'Taranto', pts: [[40.4500, 17.2000], [40.4300, 17.1700], [40.3500, 17.0800]] },
      { key: 'Реджо-Калабрия', ru: 'Реджо-Калабрия', en: 'Reggio Calabria', loc: 'Reggio Calabria', pts: [[38.1100, 15.6400], [38.1100, 15.6100], [38.0000, 15.5500]] },
      { key: 'Катания', ru: 'Катания', en: 'Catania', loc: 'Catania', pts: [[37.4950, 15.1050], [37.4800, 15.1300], [37.4700, 15.2700]] },
      { key: 'Палермо', ru: 'Палермо', en: 'Palermo', loc: 'Palermo', pts: [[38.1250, 13.3700], [38.1500, 13.3800], [38.2500, 13.4000]] },
      { key: 'Кальяри', ru: 'Кальяри', en: 'Cagliari', loc: 'Cagliari', pts: [[39.2050, 9.1600], [39.1700, 9.1700], [39.0800, 9.1600]] },
      { key: 'Салерно', ru: 'Салерно', en: 'Salerno', loc: 'Salerno', pts: [[40.6720, 14.7600], [40.6500, 14.7600], [40.5500, 14.7600]] },
      { key: 'Неаполь', ru: 'Неаполь', en: 'Naples', loc: 'Napoli', pts: [[40.8268, 14.2490], [40.8100, 14.2700], [40.7200, 14.2800]] },
      { key: 'Остия (Рим)', ru: 'Остия (Рим)', en: 'Rome (Ostia)', loc: 'Roma (Ostia)', pts: [[41.7280, 12.2650], [41.7200, 12.2550], [41.6500, 12.1500]] },
      { key: 'Ливорно', ru: 'Ливорно', en: 'Livorno', loc: 'Livorno', pts: [[43.5300, 10.3000], [43.5300, 10.2600], [43.5300, 10.1200]] },
      { key: 'Генуя', ru: 'Генуя', en: 'Genoa', loc: 'Genova', pts: [[44.4000, 8.9300], [44.3750, 8.9300], [44.2700, 8.9300]] }
    ],
    rules: [
      ['Для любительской ловли в море отдельная лицензия не нужна, но Минсельхоз просит бесплатную регистрацию онлайн (уведомление для рекреационного рыболова). Продажа улова запрещена.',
       'No licence is required for recreational sea fishing, but the Ministry asks for a free online registration (notification for recreational fishers). Selling the catch is forbidden.',
       'Za rekreacijski morski ribolov nije potrebna dozvola, ali Ministarstvo traži besplatnu online prijavu. Prodaja ulova je zabranjena.'],
      ['Улов до 5 кг в сутки на человека. Исключение: одна рыба тяжелее 5 кг. Подводный охотник может взять только одного групера (cernia) в сутки.',
       'Catch up to 5 kg per person per day. Exception: a single fish heavier than 5 kg. A spearfisher may take only one grouper (cernia) per day.',
       'Ulov do 5 kg dnevno po osobi. Izuzetak: jedna riba teža od 5 kg. Podvodni ribolovac smije uzeti samo jednu kirnju (cernia) dnevno.'],
      ['Подводная охота: только на задержке дыхания. Акваланг и ружьё вместе нельзя. С 16 лет. Запрещена от заката до восхода.',
       'Spearfishing: breath-hold only. Scuba and a speargun cannot be combined. From age 16. Banned from sunset to sunrise.',
       'Podvodni ribolov: samo na dah. Autonomni aparat i puška ne smiju se kombinirati. Od 16 godina. Zabranjen od zalaska do izlaska sunca.'],
      ['Подводному охотнику нужен буй или флаг (красный с белой диагональю), видимый с 300 м. С лодкой-сопровождением флаг на лодке, плыть не дальше 50 м от неё. Лодки обязаны держаться на 100 м.',
       'A spearfisher needs a buoy or flag (red with a white diagonal) visible from 300 m. With a support boat the flag is on the boat and you stay within 50 m of it. Boats must keep 100 m away.',
       'Podvodni ribolovac treba plovak ili zastavicu (crvenu s bijelom dijagonalom) vidljivu s 300 m. Uz pratnju čamca zastava je na čamcu i ne smije se udaljiti više od 50 m. Plovila moraju držati 100 m razmaka.'],
      ['Дистанции: от пляжей, где купаются, 500 м; от стационарных снастей и жаберных сетей 100 м; от судов на якоре вне порта 100 м. Нельзя ловить в портовых проходах и на якорных стоянках.',
       'Distances: 500 m from beaches used by bathers; 100 m from fixed fishing gear and gill nets; 100 m from ships anchored outside ports. No fishing in port channels and anchorages.',
       'Udaljenosti: 500 m od plaža na kojima se kupaju; 100 m od stalnih ribolovnih naprava i mreža stajaćica; 100 m od brodova na sidru izvan luke. Zabranjen je ribolov u lučkim prolazima i sidrištima.'],
      ['Нельзя собирать красный коралл, моллюсков и ракообразных (есть исключения), морских ежей. Действуют минимальные размеры ЕС (регламент 2019/1241). Синий тунец: случайный улов нельзя оставлять без разрешения.',
       'Do not collect red coral, molluscs and crustaceans (with some exceptions) or sea urchins. EU minimum sizes apply (Regulation 2019/1241). Bluefin tuna: an accidental catch may not be kept without authorisation.',
       'Ne skupljajte crveni koralj, mekušce i rakove (uz iznimke) ni ježince. Vrijede minimalne veličine EU (uredba 2019/1241). Plavoperajna tuna: slučajni ulov ne smije se zadržati bez dozvole.'],
      ['Безопасность: экстренный номер 112, береговая охрана 1530. Берите жилет, телефон и сообщайте близким, куда идёте.',
       'Safety: emergency number 112, Coast Guard 1530. Take a life jacket and a phone and tell someone where you are going.',
       'Sigurnost: broj hitnih službi 112, obalna straža 1530. Ponesite prsluk i telefon i javite bliskima kamo idete.'],
      DISCLAIMER,
      ['Источники: studiocataldi.it (обзор правил), areasosta.com, форумы по подводной охоте. Правила отличаются по регионам и охраняемым зонам; проверяйте у Капитанерии порта.',
       'Sources: studiocataldi.it (rules overview), areasosta.com, spearfishing forums. Rules differ by region and protected areas; check with the Harbour Master.',
       'Izvori: studiocataldi.it (pregled pravila), areasosta.com, forumi o podvodnom ribolovu. Pravila se razlikuju po regijama i zaštićenim područjima; provjerite kod lučke kapetanije.']
    ]
  },
  {
    code: 'GR', name: ['Греция', 'Greece', 'Grčka'], native: 'Ελλάδα', lang: 'el', tz: 'Europe/Athens',
    sea: ['Ионическое и Эгейское моря', 'Ionian and Aegean', 'Jonsko i Egejsko more'],
    authority: ['Береговая охрана Греции (Hellenic Coast Guard)', 'the Hellenic Coast Guard', 'Grčka obalna straža (Hellenic Coast Guard)'],
    regions: [
      { key: 'Корфу', ru: 'Корфу', en: 'Corfu', loc: 'Κέρκυρα', pts: [[39.6262, 19.9262], [39.6200, 19.9700], [39.5000, 20.0500]] },
      { key: 'Патры', ru: 'Патры', en: 'Patras', loc: 'Πάτρα', pts: [[38.2395, 21.7258], [38.2600, 21.7000], [38.3000, 21.5500]] },
      { key: 'Афины (Пирей)', ru: 'Афины (Пирей)', en: 'Athens (Piraeus)', loc: 'Αθήνα (Πειραιάς)', pts: [[37.9318, 23.6430], [37.9100, 23.6200], [37.8000, 23.5500]] },
      { key: 'Салоники', ru: 'Салоники', en: 'Thessaloniki', loc: 'Θεσσαλονίκη', pts: [[40.6300, 22.9400], [40.5800, 22.9200], [40.4500, 22.8500]] },
      { key: 'Ираклион', ru: 'Ираклион', en: 'Heraklion', loc: 'Ηράκλειο', pts: [[35.3430, 25.1450], [35.3750, 25.1500], [35.5000, 25.1500]] },
      { key: 'Родос', ru: 'Родос', en: 'Rhodes', loc: 'Ρόδος', pts: [[36.4500, 28.2290], [36.4700, 28.2500], [36.5500, 28.3000]] }
    ],
    rules: [
      ['Индивидуальные лицензии на любительскую рыбалку отменены, но ограничения действуют. Рыбачить любительски в греческих водах можно только с судов под греческим флагом.',
       'Individual recreational fishing licences have been abolished, but the restrictions remain. Recreational fishing in Greek waters is allowed only from Greek-flagged vessels.',
       'Pojedinačne dozvole za rekreacijski ribolov ukinute su, ali ograničenja vrijede. Rekreacijski ribolov u grčkim vodama dopušten je samo s plovila pod grčkom zastavom.'],
      ['Улов до 5 кг рыбы и головоногих за 24 часа. Ярус: до 10 кг. Одна рыба тяжелее лимита допускается. Групер (Epinephelus): один экземпляр. Осьминог: действует ограничение по весу (500 г), уточните.',
       'Catch up to 5 kg of fish and cephalopods per 24 hours. Longline: up to 10 kg. A single fish heavier than the limit is allowed. Grouper (Epinephelus): one per day. Octopus: a weight restriction (500 g) applies, check it.',
       'Ulov do 5 kg ribe i glavonožaca u 24 sata. Parangal: do 10 kg. Jedna riba teža od ograničenja je dopuštena. Kirnja (Epinephelus): jedan primjerak. Hobotnica: vrijedi ograničenje težine (500 g), provjerite.'],
      ['Морские ежи: 20 в сутки на всех, кто на борту (30 с рыболовным судном). Живая наживка (черви, береговые улитки): до 30 штук каждого вида в сутки.',
       'Sea urchins: 20 per day for everyone on board (30 with a fishing vessel). Live bait (worms, limpets): up to 30 of each species per day.',
       'Morski ježevi: 20 dnevno za sve na brodu (30 uz ribarsko plovilo). Živi mamac (crvi, priljepci): do 30 komada svake vrste dnevno.'],
      ['Запрещено любителям: тралы, кошельковые и закидные сети, лодочные драги, ярусы с берега, ярусы на проходных рыб. Крупных пелагических (синий тунец, меч-рыба) с прогулочных лодок ловить нельзя.',
       'Banned for amateurs: trawls, purse seines and seine nets, boat dredges, longlines from shore, longlines for migratory species. Large pelagics (bluefin tuna, swordfish) may not be fished from recreational boats.',
       'Zabranjeno amaterima: koće, plivarice i potegače, brodske dredže, parangali s obale i za migratorne vrste. Velike pelagične ribe (plavoperajna tuna, sabljarka) ne smiju se loviti s rekreacijskih brodova.'],
      ['Подводная охота: с 16 лет, только на задержке дыхания (акваланг и дыхательные аппараты на борту запрещены), только днём, с жёлтым буем с красным диагональным флагом «Y», видимым с 300 м, держаться в 50 м от буя или лодки. Не ближе 200 м к купающимся, портам, лодкам и сетям. Данные из старых источников, подтвердите их в портовой службе.',
       'Spearfishing: from age 16, breath-hold only (scuba and breathing apparatus on board are banned), daylight only, with a yellow buoy with a red diagonal “Y” flag visible from 300 m, stay within 50 m of the buoy or boat. Keep at least 200 m from swimmers, ports, boats and nets. These details come from older sources, so confirm them at the port authority.',
       'Podvodni ribolov: od 16 godina, samo na dah (autonomni aparat i uređaji za disanje na plovilu zabranjeni), samo danju, sa žutim plovkom s crvenom dijagonalnom zastavom „Y“ vidljivim s 300 m, ostanite u krugu 50 m od plovka ili čamca. Najmanje 200 m od kupača, luka, plovila i mreža. Podaci su iz starijih izvora, pa ih provjerite u lučkoj kapetaniji.'],
      ['Безопасность: экстренный номер 112, береговая охрана 108. Берите жилет, телефон и сообщайте близким, куда идёте.',
       'Safety: emergency number 112, Coast Guard 108. Take a life jacket and a phone and tell someone where you are going.',
       'Sigurnost: broj hitnih službi 112, obalna straža 108. Ponesite prsluk i telefon i javite bliskima kamo idete.'],
      DISCLAIMER,
      ['Источники: alieia.hcg.gr (FAQ Береговой охраны Греции), Presidential Decree 373/85, форум DeeperBlue. Для морских парков и заповедников действуют отдельные запреты.',
       'Sources: alieia.hcg.gr (Hellenic Coast Guard FAQ), Presidential Decree 373/85, DeeperBlue forum. Marine parks and reserves have separate bans.',
       'Izvori: alieia.hcg.gr (FAQ grčke obalne straže), Presidential Decree 373/85, forum DeeperBlue. U morskim parkovima i rezervatima vrijede posebne zabrane.']
    ]
  },
  {
    code: 'AL', name: ['Албания', 'Albania', 'Albanija'], native: 'Shqipëria', lang: 'sq', tz: 'Europe/Belgrade',
    sea: ['Адриатика и Ионическое море', 'Adriatic and Ionian', 'Jadran i Jonsko more'],
    authority: ['Министерство сельского хозяйства Албании (e-Albania)', 'the Albanian Ministry of Agriculture (e-Albania)', 'Ministarstvo poljoprivrede Albanije (e-Albania)'],
    regions: [
      { key: 'Шенгин', ru: 'Шенгин', en: 'Shëngjin', loc: 'Shëngjin', pts: [[41.8170, 19.5900], [41.8300, 19.5600], [41.8800, 19.4500]] },
      { key: 'Дуррес', ru: 'Дуррес', en: 'Durrës', loc: 'Durrës', pts: [[41.3100, 19.4500], [41.3200, 19.4300], [41.3800, 19.3000]] },
      { key: 'Влёра', ru: 'Влёра', en: 'Vlorë', loc: 'Vlorë', pts: [[40.4400, 19.4800], [40.4600, 19.4600], [40.5500, 19.3800]] },
      { key: 'Химара', ru: 'Химара', en: 'Himarë', loc: 'Himarë', pts: [[40.1000, 19.7500], [40.1000, 19.7200], [40.1000, 19.6000]] },
      { key: 'Саранда', ru: 'Саранда', en: 'Sarandë', loc: 'Sarandë', pts: [[39.8700, 20.0050], [39.8600, 19.9900], [39.9000, 19.8500]] }
    ],
    rules: [
      ['Нужно разрешение на любительскую рыбалку. С берега: разрешение у муниципалитета (онлайн через e-Albania, для иностранцев краткосрочное до 30 дней). С лодки или каяка: туристическое разрешение Минсельхоза через e-Albania (около 1000 лек в день), нужны документы на лодку и права.',
       'A recreational fishing authorisation is required. From shore: from the municipality (online via e-Albania; short-term, up to 30 days, for foreigners). From a boat or kayak: a tourist fishing authorisation from the Ministry of Agriculture via e-Albania (about 1,000 ALL per day), with boat and skipper documents.',
       'Potrebna je dozvola za rekreacijski ribolov. S obale: dozvola općine (online preko e-Albania, za strance kratkotrajna do 30 dana). S čamca ili kajaka: turistička dozvola Ministarstva poljoprivrede preko e-Albania (oko 1.000 leka dnevno), uz dokumente čamca i skipera.'],
      ['Снасти: до 2 удочек (до 3 крючков на каждой), до 10 ручных лесок с крючками, небольшой подсак. Улов до 5 кг в сутки (больше только если одна рыба тяжелее 5 кг). Продавать улов нельзя.',
       'Gear: up to 2 rods (up to 3 hooks each), up to 10 handlines with hooks, a small hand net. Catch up to 5 kg per day (more only if a single fish is heavier than 5 kg). Selling the catch is forbidden.',
       'Alat: do 2 štapa (do 3 udice na svakom), do 10 ručnih panula s udicama, mala mrežica. Ulov do 5 kg dnevno (više samo ako je jedna riba teža od 5 kg). Prodaja ulova je zabranjena.'],
      ['Нельзя убивать маточную рыбу и нерестующих самок. Для видов с особым режимом (угорь, синий тунец, рыба-меч) действуют отдельные меры; ловля тунца сезонная и строго регулируется.',
       'Breeding fish and spawning females must not be killed. Species under special regimes (eel, bluefin tuna, swordfish) follow separate measures; tuna fishing is seasonal and strictly regulated.',
       'Ne smiju se ubijati matice i mrijesteće ženke. Za vrste s posebnim režimom (jegulja, plavoperajna tuna, sabljarka) vrijede posebne mjere; lov tune je sezonski i strogo reguliran.'],
      ['Подводная охота разрешена с ограничениями: не ночью, не младше 16 лет, не в охраняемых зонах. Остальные правила и лимиты действуют так же.',
       'Spearfishing is allowed with restrictions: not at night, not under 16, not in protected areas. All other rules and limits still apply.',
       'Podvodni ribolov je dopušten uz ograničenja: ne noću, ne mlađima od 16 godina, ne u zaštićenim područjima. Sva ostala pravila i ograničenja i dalje vrijede.'],
      ['Ловля запрещена в национальном парке Карабурун-Сазан и других охраняемых зонах. Отпускайте акул и скатов.',
       'Fishing is banned in the Karaburun-Sazan Marine National Park and other protected zones. Release sharks and rays.',
       'Ribolov je zabranjen u nacionalnom parku Karaburun-Sazan i drugim zaštićenim zonama. Pustite morske pse i raže.'],
      ['Безопасность: экстренный номер 112. Берите жилет, телефон и сообщайте близким, куда идёте.',
       'Safety: emergency number 112. Take a life jacket and a phone and tell someone where you are going.',
       'Sigurnost: broj hitnih službi 112. Ponesite prsluk i telefon i javite bliskima kamo idete.'],
      DISCLAIMER,
      ['Источники: решение № 6 от 11.04.2022 (FAOLEX), fishingworldguide.com. Порядок оформления на e-Albania менялся, проверяйте на сайте.',
       'Sources: Decision No. 6 of 11 April 2022 (FAOLEX), fishingworldguide.com. The e-Albania procedure has changed over time, so check the site.',
       'Izvori: Odluka br. 6 od 11. travnja 2022. (FAOLEX), fishingworldguide.com. Postupak na e-Albania se mijenjao, provjerite na stranici.']
    ]
  },
  {
    code: 'SI', name: ['Словения', 'Slovenia', 'Slovenija'], native: 'Slovenija', lang: 'sl', tz: 'Europe/Belgrade',
    sea: ['Адриатика', 'Adriatic', 'Jadran'],
    authority: ['Министерство сельского хозяйства Словении (портал SPOT)', 'the Slovenian Ministry of Agriculture (SPOT portal)', 'Ministarstvo poljoprivrede Slovenije (portal SPOT)'],
    regions: [
      { key: 'Копер', ru: 'Копер', en: 'Koper', loc: 'Koper', pts: [[45.5500, 13.7300], [45.5700, 13.7100], [45.6000, 13.6200]] },
      { key: 'Изола', ru: 'Изола', en: 'Izola', loc: 'Izola', pts: [[45.5370, 13.6590], [45.5500, 13.6300], [45.6000, 13.5500]] },
      { key: 'Пиран', ru: 'Пиран', en: 'Piran', loc: 'Piran', pts: [[45.5280, 13.5680], [45.5400, 13.5300], [45.5800, 13.4000]] }
    ],
    rules: [
      ['Рыбалка с берега: разрешение не нужно. С лодки (с якоря или на буксире): суточное или недельное разрешение (онлайн, не позднее чем за час до начала). Членство в клубе не нужно. Разрешение личное.',
       'Fishing from the coast: no permit needed. From a boat (anchored or drifting): a daily or weekly permit (online, at least one hour before you start). No club membership needed. The permit is personal.',
       'Ribolov s obale: dozvola nije potrebna. S plovila (na sidru ili u plutanju): dnevna ili tjedna dozvola (online, najmanje sat prije početka). Članstvo u klubu nije potrebno. Dozvola je osobna.'],
      ['Снасти: не более 2 удочек или лесок, на них не более 3 крючков. Допускаются искусственные и натуральные приманки, нельзя использовать живых позвоночных. Тройник на подёргивающейся приманке нельзя.',
       'Gear: no more than 2 rods or lines, with no more than 3 hooks. Artificial and natural bait are allowed; live vertebrates may not be used. No treble hook on a pulled lure.',
       'Alat: najviše 2 štapa ili panule, s najviše 3 udice. Dopuštene su umjetne i prirodne varalice, ali ne i živi kralježnjaci. Ne smije se koristiti trokraka udica na povlačenje.'],
      ['Улов до 5 кг в сутки (или одна рыба тяжелее 5 кг). Нельзя ловить молодь, собирать моллюсков, продавать улов, использовать дыхательные аппараты.',
       'Catch up to 5 kg per day (or one fish heavier than 5 kg). Do not catch immature fish, harvest molluscs, sell the catch or use underwater breathing devices.',
       'Ulov do 5 kg dnevno (ili jedna riba teža od 5 kg). Zabranjeno je loviti nedorasle ribe, skupljati školjke, prodavati ulov i koristiti uređaje za disanje pod vodom.'],
      ['Нельзя ловить: ближе 200 м от маркированных ферм, 50 м от донных сетей и от другого рыбака с лодки, 300 м от судна со светом или кошельковым неводом, в портах и на пляжах с 1 мая по 30 октября.',
       'Do not fish: within 200 m of marked farms, 50 m of bottom nets and of another boat angler, 300 m of a vessel showing a light or using an encircling net, in ports and at bathing sites from 1 May to 30 October.',
       'Ne smije se loviti: bliže od 200 m od označenih uzgajališta, 50 m od pridnenih mreža i drugog ribolovca s plovila, 300 m od plovila sa svjetlom ili plivaricom, u lukama i na kupalištima od 1. svibnja do 30. listopada.'],
      ['Подводная охота: годовое разрешение, выдаётся только членам морского спортивного клуба; нужен журнал уловов. Только днём, на задержке дыхания, нельзя с судна, где есть акваланг, нельзя в охраняемых зонах. Обязателен буй не менее 10 л на верёвке.',
       'Spearfishing: an annual permit, issued only to members of a sea sport fishing society; a catch log is required. Daylight only, breath-hold only, not from a vessel carrying scuba gear, not in protected areas. A signal buoy of at least 10 litres on a rope is mandatory.',
       'Podvodni ribolov: godišnja dozvola, izdaje se samo članovima društva za morski športski ribolov; obvezan je dnevnik ulova. Samo danju, samo na dah, ne s plovila na kojem je ronilačka oprema, ne u zaštićenim područjima. Obvezan je signalni plovak od najmanje 10 litara na užetu.'],
      ['Безопасность: экстренный номер 112. Берите жилет, телефон и сообщайте близким, куда идёте.',
       'Safety: emergency number 112. Take a life jacket and a phone and tell someone where you are going.',
       'Sigurnost: broj hitnih službi 112. Ponesite prsluk i telefon i javite bliskima kamo idete.'],
      DISCLAIMER,
      ['Источники: spot.gov.si (Recreational marine fishing; Sea sport fishing with a spear gun). Размеры и тарифы смотрите на портале SPOT.',
       'Sources: spot.gov.si (Recreational marine fishing; Sea sport fishing with a spear gun). See the SPOT portal for sizes and fees.',
       'Izvori: spot.gov.si (Recreational marine fishing; Sea sport fishing with a spear gun). Veličine i cijene potražite na portalu SPOT.']
    ]
  },
  {
    code: 'TR', name: ['Турция', 'Turkey', 'Turska'], native: 'Türkiye', lang: 'tr', tz: 'Europe/Istanbul',
    sea: ['Чёрное, Мраморное, Эгейское и Средиземное моря', 'Black, Marmara, Aegean and Mediterranean seas', 'Crno, Mramorno, Egejsko i Sredozemno more'],
    authority: ['Министерство сельского и лесного хозяйства Турции', 'the Turkish Ministry of Agriculture and Forestry', 'Ministarstvo poljoprivrede i šumarstva Turske'],
    regions: [
      { key: 'Трабзон', ru: 'Трабзон', en: 'Trabzon', loc: 'Trabzon', pts: [[41.0150, 39.7300], [41.0320, 39.7300], [41.1400, 39.7300]] },
      { key: 'Самсун', ru: 'Самсун', en: 'Samsun', loc: 'Samsun', pts: [[41.3000, 36.3450], [41.3250, 36.3650], [41.4300, 36.4000]] },
      { key: 'Синоп', ru: 'Синоп', en: 'Sinop', loc: 'Sinop', pts: [[42.0320, 35.1500], [42.0600, 35.1500], [42.1650, 35.1500]] },
      { key: 'Шиле', ru: 'Шиле', en: 'Şile', loc: 'Şile', pts: [[41.1840, 29.6100], [41.2050, 29.6200], [41.3100, 29.6500]] },
      { key: 'Стамбул', ru: 'Стамбул', en: 'Istanbul', loc: 'İstanbul', pts: [[40.9750, 29.0300], [40.9500, 29.0200], [40.8500, 28.9800]] },
      { key: 'Чешме', ru: 'Чешме', en: 'Çeşme', loc: 'Çeşme', pts: [[38.2150, 26.4000], [38.1800, 26.3700], [38.0800, 26.3700]] },
      { key: 'Кушадасы', ru: 'Кушадасы', en: 'Kuşadası', loc: 'Kuşadası', pts: [[37.8680, 27.2400], [37.8650, 27.2150], [37.8600, 27.1000]] },
      { key: 'Бодрум', ru: 'Бодрум', en: 'Bodrum', loc: 'Bodrum', pts: [[37.0260, 27.4300], [37.0080, 27.4300], [36.9000, 27.4300]] },
      { key: 'Мармарис', ru: 'Мармарис', en: 'Marmaris', loc: 'Marmaris', pts: [[36.8450, 28.2700], [36.8200, 28.2700], [36.7400, 28.3300]] },
      { key: 'Фетхие', ru: 'Фетхие', en: 'Fethiye', loc: 'Fethiye', pts: [[36.6260, 29.0950], [36.6400, 29.0700], [36.6800, 28.9500]] },
      { key: 'Анталья', ru: 'Анталья', en: 'Antalya', loc: 'Antalya', pts: [[36.8550, 30.6500], [36.8300, 30.6600], [36.7200, 30.7000]] },
      { key: 'Аланья', ru: 'Аланья', en: 'Alanya', loc: 'Alanya', pts: [[36.5400, 31.9850], [36.5100, 32.0000], [36.4000, 32.0000]] },
      { key: 'Мерсин', ru: 'Мерсин', en: 'Mersin', loc: 'Mersin', pts: [[36.7800, 34.6200], [36.7600, 34.6300], [36.6700, 34.7000]] }
    ],
    rules: null // правила и районы приходят из данных приложения (rules-data.js, site_regions)
  },
  {
    code: 'ES', name: ['Испания', 'Spain', 'Španija'], native: 'España', lang: 'es', tz: 'Europe/Madrid',
    sea: ['Средиземное море и Атлантический океан', 'Mediterranean Sea and Atlantic Ocean', 'Sredozemno more i Atlantski okean'],
    authority: ['Министерство сельского хозяйства, рыболовства и продовольствия Испании (MAPA) и правительства автономных областей', 'the Spanish Ministry of Agriculture, Fisheries and Food (MAPA) and the regional governments', 'Ministarstvo poljoprivrede, ribarstva i hrane Španije (MAPA) i vlade autonomnih oblasti'],
    noLionfish: true,
    fishExclude: new Set(['Иглобрюх серебристый', 'Сиган полосатый']),
    regions: [
      { key: 'Росас', ru: 'Росас', en: 'Roses', loc: 'Roses', area: 'CT', pts: [[42.2480, 3.1700], [42.2350, 3.1900], [42.1300, 3.2500]] },
      { key: 'Барселона', ru: 'Барселона', en: 'Barcelona', loc: 'Barcelona', area: 'CT', pts: [[41.3700, 2.2000], [41.3500, 2.2200], [41.2800, 2.3300]] },
      { key: 'Таррагона', ru: 'Таррагона', en: 'Tarragona', loc: 'Tarragona', area: 'CT', pts: [[41.1050, 1.2500], [41.0850, 1.2500], [40.9800, 1.2700]] },
      { key: 'Пеньискола', ru: 'Пеньискола', en: 'Peñíscola', loc: 'Peníscola', area: 'VC', pts: [[40.3550, 0.4100], [40.3500, 0.4400], [40.3200, 0.5700]] },
      { key: 'Валенсия', ru: 'Валенсия', en: 'Valencia', loc: 'València', area: 'VC', pts: [[39.4600, -0.3100], [39.4600, -0.2800], [39.4500, -0.1500]] },
      { key: 'Дения', ru: 'Дения', en: 'Dénia', loc: 'Dénia', area: 'VC', pts: [[38.8450, 0.1250], [38.8500, 0.1500], [38.8500, 0.2900]] },
      { key: 'Аликанте', ru: 'Аликанте', en: 'Alicante', loc: 'Alacant', area: 'VC', pts: [[38.3350, -0.4750], [38.3200, -0.4500], [38.2500, -0.3500]] },
      { key: 'Торревьеха', ru: 'Торревьеха', en: 'Torrevieja', loc: 'Torrevieja', area: 'VC', pts: [[37.9650, -0.6700], [37.9550, -0.6500], [37.9200, -0.5300]] },
      { key: 'Картахена', ru: 'Картахена', en: 'Cartagena', loc: 'Cartagena', area: 'MU', pts: [[37.5700, -0.9800], [37.5500, -0.9800], [37.4500, -0.9800]] },
      { key: 'Альмерия', ru: 'Альмерия', en: 'Almería', loc: 'Almería', area: 'ANM', pts: [[36.8250, -2.4600], [36.8000, -2.4600], [36.7000, -2.4500]] },
      { key: 'Малага', ru: 'Малага', en: 'Málaga', loc: 'Málaga', area: 'ANM', pts: [[36.7100, -4.4000], [36.6900, -4.4000], [36.6000, -4.3500]] },
      { key: 'Марбелья', ru: 'Марбелья', en: 'Marbella', loc: 'Marbella', area: 'ANM', pts: [[36.5050, -4.8800], [36.4800, -4.8800], [36.3900, -4.8500]] },
      { key: 'Кадис', ru: 'Кадис', en: 'Cádiz', loc: 'Cádiz', area: 'ANA', pts: [[36.5350, -6.3150], [36.5300, -6.3500], [36.5000, -6.4700]] },
      { key: 'Уэльва', ru: 'Уэльва (Пунта-Умбрия)', en: 'Huelva (Punta Umbría)', loc: 'Punta Umbría', area: 'ANA', pts: [[37.1500, -6.9600], [37.1400, -6.9500], [37.0500, -6.9500]] },
      { key: 'Пальма', ru: 'Пальма (Мальорка)', en: 'Palma (Mallorca)', loc: 'Palma', area: 'IB', pts: [[39.5500, 2.6300], [39.5300, 2.6300], [39.4300, 2.6500]] },
      { key: 'Маон', ru: 'Маон (Менорка)', en: 'Mahón (Menorca)', loc: 'Maó', area: 'IB', pts: [[39.8650, 4.3100], [39.8600, 4.3400], [39.8300, 4.4800]] },
      { key: 'Ибица', ru: 'Ибица', en: 'Ibiza', loc: 'Eivissa', area: 'IB', pts: [[38.9000, 1.4400], [38.8800, 1.4600], [38.8200, 1.5800]] },
      { key: 'Виго', ru: 'Виго', en: 'Vigo', loc: 'Vigo', area: 'GA', pts: [[42.2450, -8.7300], [42.2200, -8.7800], [42.2000, -8.9500]] },
      { key: 'Ла-Корунья', ru: 'Ла-Корунья', en: 'A Coruña', loc: 'A Coruña', area: 'GA', pts: [[43.3900, -8.4000], [43.4100, -8.4200], [43.4800, -8.4500]] },
      { key: 'Хихон', ru: 'Хихон', en: 'Gijón', loc: 'Xixón', area: 'AS', pts: [[43.5500, -5.6600], [43.5700, -5.6600], [43.6800, -5.6600]] },
      { key: 'Сантандер', ru: 'Сантандер', en: 'Santander', loc: 'Santander', area: 'CB', pts: [[43.4800, -3.7700], [43.5000, -3.7800], [43.6000, -3.7800]] },
      { key: 'Бильбао', ru: 'Бильбао (Гечо)', en: 'Bilbao (Getxo)', loc: 'Getxo', area: 'PV', pts: [[43.3500, -3.0300], [43.3800, -3.0300], [43.4800, -3.0300]] },
      { key: 'Сан-Себастьян', ru: 'Сан-Себастьян', en: 'San Sebastián', loc: 'Donostia', area: 'PV', pts: [[43.3160, -1.9930], [43.3350, -1.9900], [43.4500, -2.0000]] }
    ],
    rules: null // правила, области и районы приходят из данных приложения (rules-data.js, site_regions)
  }
];

// ---------- Метеостанции (аэропорты, данные METAR) ----------
const STATIONS = [
  ['LIBN', 'Lecce', 40.238, 18.138], ['LGEL', 'Elefsina', 38.064, 23.556], ['LGHI', 'Chios', 38.343, 26.141], ['LGSM', 'Samos', 37.69, 26.912], ['LGKO', 'Kos', 36.801, 27.091], ['LYTV', 'Tivat', 42.4047, 18.7233], ['LYPG', 'Podgorica', 42.3594, 19.2519], ['LDDU', 'Dubrovnik', 42.5614, 18.2682],
  ['LDSP', 'Split', 43.5389, 16.2980], ['LDZD', 'Zadar', 44.1083, 15.3467], ['LDPL', 'Pula', 44.8935, 13.9222],
  ['LDRI', 'Rijeka', 45.2169, 14.5703], ['LDLO', 'Lošinj', 44.5658, 14.3931], ['LIPQ', 'Trieste', 45.8275, 13.4722],
  ['LIPZ', 'Venezia', 45.5053, 12.3519], ['LIPR', 'Rimini', 44.0203, 12.6117], ['LIPY', 'Ancona', 43.6163, 13.3612],
  ['LIBD', 'Bari', 41.1389, 16.7606], ['LIBR', 'Brindisi', 40.6576, 17.9470], ['LIRN', 'Napoli', 40.8860, 14.2908],
  ['LICJ', 'Palermo', 38.1760, 13.0910], ['LGKR', 'Corfu', 39.6019, 19.9117], ['LGRX', 'Araxos', 38.1511, 21.4256],
  ['LGAV', 'Athens', 37.9364, 23.9445], ['LGTS', 'Thessaloniki', 40.5197, 22.9709], ['LGIR', 'Heraklion', 35.3397, 25.1803],
  ['LGRP', 'Rhodes', 36.4054, 28.0862], ['LATI', 'Tirana', 41.4147, 19.7206], ['LJPZ', 'Portorož', 45.4753, 13.6153],
  ['LJLJ', 'Ljubljana', 46.2237, 14.4576], ['LTCG', 'Trabzon', 40.9950, 39.7820], ['LTFH', 'Samsun', 41.2550, 36.5670],
  ['LTCM', 'Sinop', 42.0190, 35.0720], ['LTFM', 'Istanbul', 41.2620, 28.7400], ['LTBA', 'Istanbul Atatürk', 40.9820, 28.8210],
  ['LTBH', 'Çanakkale', 40.1400, 26.4250], ['LTFD', 'Edremit', 39.5590, 27.0250], ['LTBJ', 'Izmir', 38.2850, 27.1550],
  ['LTFE', 'Bodrum', 37.2450, 27.6730], ['LTBS', 'Dalaman', 36.7130, 28.7930], ['LTAI', 'Antalya', 36.9000, 30.7980],
  ['LTFG', 'Gazipaşa', 36.2990, 32.3000], ['LTAF', 'Adana', 36.9890, 35.2930], ['LTDA', 'Hatay', 36.3610, 36.2830],
  ['LIBP', 'Pescara', 42.4320, 14.1810], ['LIBG', 'Taranto', 40.5170, 17.4030], ['LICR', 'Reggio Calabria', 38.0720, 15.6540],
  ['LICC', 'Catania', 37.4670, 15.0640], ['LIEE', 'Cagliari', 39.2430, 9.0600], ['LIRI', 'Salerno', 40.6200, 14.9110],
  ['LIRF', 'Roma Fiumicino', 41.8000, 12.2390], ['LIRP', 'Pisa', 43.6840, 10.3930], ['LIMJ', 'Genova', 44.4130, 8.8380],
  ['LEGE', 'Girona', 41.9110, 2.7630], ['LEBL', 'Barcelona', 41.2930, 2.0700], ['LERS', 'Reus', 41.1500, 1.1790],
  ['LECH', 'Castellón', 40.2110, 0.0670], ['LEVC', 'Valencia', 39.4890, -0.4820], ['LEAL', 'Alicante', 38.2820, -0.5580],
  ['LELC', 'San Javier', 37.7750, -0.8120], ['LEMI', 'Murcia', 37.8030, -1.1250], ['LEAM', 'Almería', 36.8460, -2.3570],
  ['LEMG', 'Málaga', 36.6660, -4.4820], ['LXGB', 'Gibraltar', 36.1510, -5.3500], ['LEJR', 'Jerez', 36.7510, -6.0560],
  ['LERT', 'Rota', 36.6450, -6.3490], ['LEZL', 'Sevilla', 37.4180, -5.8930], ['LPFR', 'Faro', 37.0140, -7.9660],
  ['LEPA', 'Palma de Mallorca', 39.5610, 2.7370], ['LEMH', 'Menorca', 39.8550, 4.2160], ['LEIB', 'Ibiza', 38.8760, 1.3840],
  ['LEVX', 'Vigo', 42.2390, -8.6240], ['LECO', 'A Coruña', 43.3070, -8.3720], ['LEST', 'Santiago', 42.8880, -8.4110],
  ['LEAS', 'Asturias', 43.5670, -6.0440], ['LEXJ', 'Santander', 43.4290, -3.8310], ['LEBB', 'Bilbao', 43.2980, -2.9060],
  ['LESO', 'San Sebastián', 43.3610, -1.7870],
  ['LBWN', 'Varna', 43.2321, 27.8251], ['LBBG', 'Burgas', 42.5696, 27.5152]
];
// Станции не дальше 110 км, от ближайшей к дальней (до трёх)
function nearestStations(lat, lon) {
  const rad = x => x * Math.PI / 180;
  return STATIONS.map(s => {
    const dLat = rad(s[2] - lat), dLon = rad(s[3] - lon);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(s[2])) * Math.sin(dLon / 2) ** 2;
    return { icao: s[0], name: s[1], lat: s[2], lon: s[3], km: 6371 * 2 * Math.asin(Math.sqrt(a)) };
  }).filter(s => s.km <= 110).sort((a, b) => a.km - b.km).slice(0, 3);
}

// ---------- Текущая страна ----------
let TZ = 'Europe%2FBelgrade';
let TZ_NAME = 'Europe/Belgrade';

const Country = {
  code: 'ME',
  get data() { return COUNTRIES.find(c => c.code === this.code) || COUNTRIES[0]; },
  all: COUNTRIES,
  saved() {
    const c = Store.get('country', null);
    return COUNTRIES.some(x => x.code === c) ? c : null;
  },
  apply(code) {
    this.code = COUNTRIES.some(c => c.code === code) ? code : 'ME';
    TZ_NAME = this.data.tz;
    TZ = encodeURIComponent(TZ_NAME);
  },
  set(code) { Store.set('country', code); this.apply(code); },
  name() { return t3(this.data.name); },
  sea() { return t3(this.data.sea); },
  authority() { return t3(this.data.authority); },
  rules() { return this.data.rules || DATA.rules; },
  regions() { return this.data.regions; },
  // Область района со своими законами (Испания: CT, IB...), иначе null
  area(regionKey) {
    const r = this.data.regions.find(x => x.key === regionKey);
    return (r && r.area && this.data.areas || []).find(a => a.code === r.area) || null;
  },
  visible(f) {
    const d = this.data;
    if (d.noLionfish && f.key === 'Рыба-лев (крылатка)') return false;
    if (d.fishExclude && d.fishExclude.has(f.key)) return false;
    if (f.only && !f.only.includes(this.code)) return false;
    return !d.fishFilter || d.fishFilter.has(f.key);
  }
};

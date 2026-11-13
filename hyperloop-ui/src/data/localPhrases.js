// A farewell and a greeting in the language of a destination, shown on the farewell/greeting popup. Keyed by the
// country names in countryFlags.js; a country with no entry just shows no phrase. [language, farewell, greeting]
const ES = ['Spanish', '¡Buen viaje!', '¡Bienvenidos!']
const AR = ['Arabic', 'رحلة سعيدة', 'أهلاً وسهلاً']
const DE = ['German', 'Gute Reise!', 'Willkommen!']
const FR = ['French', 'Bon voyage !', 'Bienvenue !']
const NL = ['Dutch', 'Goede reis!', 'Welkom!']
const PT = ['Portuguese', 'Boa viagem!', 'Bem-vindos!']
const EL = ['Greek', 'Καλό ταξίδι!', 'Καλώς ήρθατε!']
const ZH = ['Chinese', '一路平安！', '欢迎！']
const MS = ['Malay', 'Selamat jalan!', 'Selamat datang!']
const SW = ['Swahili', 'Safari njema!', 'Karibu!']
const EN = ['English', 'Goodbye!', 'Welcome!']

const localPhrases = {
    France: FR, Monaco: FR,
    Belgium: NL, 'The Netherlands': NL,
    Ireland: ['Irish', 'Slán!', 'Fáilte!'],
    Scotland: ['Scottish Gaelic', 'Slàn leibh!', 'Fàilte!'],
    Wales: ['Welsh', 'Taith dda!', 'Croeso!'],
    'United States of America': EN, Australia: EN, 'New Zealand': EN, Canada: EN, England: EN, Singapore: EN,
    Nigeria: EN, Uganda: EN, Zimbabwe: EN, Namibia: EN, Liberia: EN, 'Sierra Leone': EN, Botswana: EN, Zambia: EN,
    'Papua New Guinea': EN, 'Federated States of Micronesia': EN, 'The Bahamas': EN, Barbados: EN, Guyana: EN,
    'Trinidad and Tobago': EN,
    Jamaica: ['Jamaican Patois', 'Walk good!', 'Welcome!'],
    Ghana: ['Twi', 'Nante yiye!', 'Akwaaba!'],
    'South Africa': ['Zulu', 'Hamba kahle!', 'Siyakwemukela!'],
    Rwanda: ['Kinyarwanda', 'Urugendo rwiza!', 'Murakaza neza!'],
    Italy: ['Italian', 'Buon viaggio!', 'Benvenuti!'],
    Japan: ['Japanese', 'いってらっしゃい！', 'ようこそ！'],
    'South Korea': ['Korean', '안녕히 가세요!', '환영합니다!'],
    Germany: DE, Austria: DE, Switzerland: DE,
    Luxembourg: ['Luxembourgish', 'Gutt Rees!', 'Wëllkomm!'],
    Thailand: ['Thai', 'เดินทางโดยสวัสดิภาพ', 'ยินดีต้อนรับ'],
    China: ZH, Taiwan: ['Chinese', '一路平安！', '歡迎光臨！'], 'Hong Kong': ['Chinese', '一路順風！', '歡迎！'],
    Macau: ['Chinese', '一路順風！', '歡迎！'],
    India: ['Hindi', 'शुभ यात्रा!', 'स्वागत है!'], Nepal: ['Nepali', 'शुभ यात्रा!', 'स्वागत छ!'],
    Bangladesh: ['Bengali', 'শুভ যাত্রা!', 'স্বাগতম!'],
    Pakistan: ['Urdu', 'خدا حافظ', 'خوش آمدید'],
    Iran: ['Persian', 'سفر بخیر', 'خوش آمدید'],
    'Saudi Arabia': AR, Egypt: AR, 'United Arab Emirates': AR, Morocco: AR, Tunisia: AR, Algeria: AR, Jordan: AR,
    Lebanon: AR, Iraq: AR, Oman: AR, Qatar: AR, Kuwait: AR, Libya: AR, Yemen: AR, Sudan: AR,
    Cuba: ES, Mexico: ES, Spain: ES, Argentina: ES, Colombia: ES, Chile: ES, Peru: ES, Venezuela: ES, Uruguay: ES,
    Paraguay: ES, Bolivia: ES, Ecuador: ES, Guatemala: ES, 'Costa Rica': ES, Panama: ES, Nicaragua: ES,
    'Dominican Republic': ES, 'Puerto Rico': ES,
    Senegal: FR, Mali: FR, 'Ivory Coast': FR, Cameroon: FR, Chad: FR, Niger: FR, Guinea: FR, Haiti: FR, Madagascar: FR,
    Mauritius: FR, Vanuatu: FR, 'Democratic Republic of the Congo': FR, 'Republic of the Congo': FR,
    Brazil: PT, Portugal: PT, Angola: PT, Mozambique: PT,
    Greece: EL, Cyprus: EL,
    Malaysia: MS, Indonesia: ['Indonesian', 'Selamat jalan!', 'Selamat datang!'],
    Kenya: SW, Tanzania: SW,
    Sweden: ['Swedish', 'Trevlig resa!', 'Välkommen!'],
    Norway: ['Norwegian', 'God tur!', 'Velkommen!'],
    Denmark: ['Danish', 'God rejse!', 'Velkommen!'],
    Finland: ['Finnish', 'Hyvää matkaa!', 'Tervetuloa!'],
    Iceland: ['Icelandic', 'Góða ferð!', 'Velkomin!'],
    Turkey: ['Turkish', 'İyi yolculuklar!', 'Hoş geldiniz!'],
    Russia: ['Russian', 'Счастливого пути!', 'Добро пожаловать!'],
    Ukraine: ['Ukrainian', 'Щасливої дороги!', 'Ласкаво просимо!'],
    Poland: ['Polish', 'Szerokiej drogi!', 'Witamy!'],
    Hungary: ['Hungarian', 'Jó utat!', 'Üdvözöljük!'],
    Czechia: ['Czech', 'Šťastnou cestu!', 'Vítejte!'],
    Slovakia: ['Slovak', 'Šťastnú cestu!', 'Vitajte!'],
    Slovenia: ['Slovenian', 'Srečno pot!', 'Dobrodošli!'],
    Croatia: ['Croatian', 'Sretan put!', 'Dobrodošli!'],
    'Bosnia and Herzegovina': ['Bosnian', 'Sretan put!', 'Dobrodošli!'],
    'North Macedonia': ['Macedonian', 'Среќен пат!', 'Добредојдовте!'],
    Moldova: ['Romanian', 'Drum bun!', 'Bine ați venit!'],
    Belarus: ['Russian', 'Счастливого пути!', 'Добро пожаловать!'],
    Kyrgyzstan: ['Russian', 'Счастливого пути!', 'Добро пожаловать!'],
    Serbia: ['Serbian', 'Srećan put!', 'Dobrodošli!'],
    Romania: ['Romanian', 'Drum bun!', 'Bine ați venit!'],
    Bulgaria: ['Bulgarian', 'Лек път!', 'Добре дошли!'],
    Lithuania: ['Lithuanian', 'Gero kelio!', 'Sveiki atvykę!'],
    Latvia: ['Latvian', 'Laimīgu ceļu!', 'Laipni lūdzam!'],
    Estonia: ['Estonian', 'Head reisi!', 'Tere tulemast!'],
    Albania: ['Albanian', 'Udhë të mbarë!', 'Mirë se vini!'],
    Malta: ['Maltese', 'Safar tajjeb!', 'Merħba!'],
    Philippines: ['Filipino', 'Ingat sa biyahe!', 'Maligayang pagdating!'],
    Vietnam: ['Vietnamese', 'Thượng lộ bình an!', 'Chào mừng!'],
    Fiji: ['Fijian', 'Moce!', 'Bula!'],
    Samoa: ['Samoan', 'Tofa!', 'Afio mai!'],
}

// { language, text } for a departing loop's country, or an arriving loop's greeting; null when there isn't one
export function localPhrase(country, kind) {
    const entry = localPhrases[country]
    if (!entry) return null
    return { language: entry[0], text: kind === 'arrival' ? entry[2] : entry[1] }
}

export default localPhrases

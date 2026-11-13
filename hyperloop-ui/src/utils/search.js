// Shared search matching for the Cities and Development pages (bug #109). Ignores case, accents
// and spacing/punctuation, and maps letters that don't split into letter + accent (ł, ø, ß…) to
// their plain forms, so "Wroclaw", "Lodz", "Washington DC", "St Louis" and "cafe" all match.
const PLAIN_LETTERS = { 'ł': 'l', 'ŀ': 'l', 'ø': 'o', 'đ': 'd', 'ð': 'd', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ı': 'i', 'þ': 'th', 'ħ': 'h' }
 
export function normaliseForSearch(text) {
    return String(text ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[łŀøđðßæœıþħ]/g, ch => PLAIN_LETTERS[ch])
        .replace(/[^\p{L}\p{N}]/gu, '')
}
 
export function matchesSearch(text, query) {
    return normaliseForSearch(text).includes(normaliseForSearch(query))
}
 
// Shorthand and alternative names for the city/country search boxes. Each key is a nickname; each
// value is the country (or countries) the game stores it under. The UK is England + Scotland +
// Wales: the Northern Irish cities (Belfast, Derry) are stored under "Ireland", so they are left out.
const UK = ['England', 'Scotland', 'Wales']
const PLACE_ALIASES = {
    // United Kingdom
    uk: UK, gb: UK, gbr: UK, greatbritain: UK, britain: UK, unitedkingdom: UK, ukofgreatbritain: UK,
    // United States
    usa: ['United States of America'], us: ['United States of America'], unitedstates: ['United States of America'],
    america: ['United States of America'], usofa: ['United States of America'], theus: ['United States of America'],
    theusa: ['United States of America'], states: ['United States of America'], murica: ['United States of America'],
    // Gulf
    uae: ['United Arab Emirates'], emirates: ['United Arab Emirates'], ksa: ['Saudi Arabia'],
    // Asia / Pacific
    prc: ['China'], peoplesrepublicofchina: ['China'], roc: ['Taiwan'], republicofchina: ['Taiwan'],
    rok: ['South Korea'], republicofkorea: ['South Korea'], hk: ['Hong Kong'], png: ['Papua New Guinea'],
    nz: ['New Zealand'], aotearoa: ['New Zealand'], oz: ['Australia'], aus: ['Australia'],
    fsm: ['Federated States of Micronesia'], burma: ['Myanmar'], turkiye: ['Turkey'],
    // Europe
    holland: ['The Netherlands'], nl: ['The Netherlands'], netherlands: ['The Netherlands'],
    czechrepublic: ['Czechia'], macedonia: ['North Macedonia'], bosnia: ['Bosnia and Herzegovina'],
    bih: ['Bosnia and Herzegovina'], swiss: ['Switzerland'], eire: ['Ireland'], roi: ['Ireland'],
    deutschland: ['Germany'], espana: ['Spain'], italia: ['Italy'], hellas: ['Greece'],
    // Africa / Americas / other
    drc: ['Democratic Republic of the Congo'], drcongo: ['Democratic Republic of the Congo'],
    congokinshasa: ['Democratic Republic of the Congo'], zaire: ['Democratic Republic of the Congo'],
    congobrazzaville: ['Republic of the Congo'],
    rsa: ['South Africa'], za: ['South Africa'], cotedivoire: ['Ivory Coast'], caboverde: ['Cape Verde'],
    bahamas: ['The Bahamas'], tt: ['Trinidad and Tobago'], trinidad: ['Trinidad and Tobago'],
    domrep: ['Dominican Republic'], pr: ['Puerto Rico'],
}
const ALIAS_KEYS = Object.keys(PLACE_ALIASES)

// The countries a query stands for, as normalised names ('' if the query isn't a shorthand).
// A whole-word shorthand (UK, USA, UAE...) stands for only those countries, so "UK" gives
// England/Scotland/Wales and not Ukraine. A long alias typed part-way ("unitedk", "greatb") also adds
// its countries on top of the normal matches.
function aliasCountries(query) {
    const q = normaliseForSearch(query)
    if (!q) return { exact: null, partial: [] }
    if (PLACE_ALIASES[q]) return { exact: PLACE_ALIASES[q].map(normaliseForSearch), partial: [] }
    const partial = q.length >= 5
        ? ALIAS_KEYS.filter(k => k.length > q.length && k.startsWith(q)).flatMap(k => PLACE_ALIASES[k].map(normaliseForSearch))
        : []
    return { exact: null, partial }
}

// Nicknames for single cities. Each key is the nickname (as normaliseForSearch makes it); each value is the city names the
// game stores it under. A nickname adds its cities on top of the normal name matches, so "ny" still finds Sydney and the
// rest, and "la" still finds every city with "la" in it - it just also brings up New York / Los Angeles.
const CITY_ALIASES = {
    nyc: ['New York'], ny: ['New York'], bigapple: ['New York'], newyorkcity: ['New York'],
    la: ['Los Angeles'], sf: ['San Francisco'], frisco: ['San Francisco'], nola: ['New Orleans'],
    kl: ['Kuala Lumpur'], hcmc: ['Ho Chi Minh City'], saigon: ['Ho Chi Minh City'], cdmx: ['Mexico City'],
    stpetersburg: ['Saint Petersburg'], stpete: ['Saint Petersburg'],
}
const cityAliasMatches = (cityName, query) =>
    (CITY_ALIASES[normaliseForSearch(query)] || []).some(n => normaliseForSearch(n) === normaliseForSearch(cityName))

// True when a city (its name + country) matches what was typed in a city/country search box,
// including shorthands like UK, USA, UAE. A shorthand still finds cities whose own name contains it ("uk" finds Nuuk,
// "pr" finds Prague), it just doesn't match other countries' names by it, so "UK" doesn't bring up Ukraine.
export function matchesPlace(cityName, country, query) {
    const { exact, partial } = aliasCountries(query)
    const c = normaliseForSearch(country)
    if (cityAliasMatches(cityName, query)) return true
    if (exact) return exact.includes(c) || matchesSearch(cityName, query)
    return matchesSearch(cityName, query) || matchesSearch(country, query) || partial.includes(c)
}

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
 
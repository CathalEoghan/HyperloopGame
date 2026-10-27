// What the player owns and has equipped from the Shop. Kept in localStorage under one key, which is part of the
// save file (SaveManager's AUX_KEYS) and survives a prestige. Shape: { owned: ['workSound:soft', ...], equipped: { workSound: 'soft' } }
// The free 'default' item of each category is always owned, so it is never listed.
import { SHOP_CATEGORIES, SHOP_ITEMS, THEME_PICS_BOARD } from '../data/shopCatalog.js'

export const COSMETICS_KEY = 'hyperloop_cosmetics'
export const COSMETICS_EVENT = 'hyperloop-cosmetics-changed'

const emptyState = () => ({ owned: [], equipped: {} })
const ownedKey = (category, id) => `${category}:${id}`

export function getItem(category, id) {
    return (SHOP_ITEMS[category] || []).find(item => item.id === id) || null
}

export function readCosmetics() {
    try {
        const raw = JSON.parse(localStorage.getItem(COSMETICS_KEY))
        if (!raw || typeof raw !== 'object') return emptyState()
        const owned = Array.isArray(raw.owned) ? raw.owned.filter(v => typeof v === 'string') : []
        const equipped = raw.equipped && typeof raw.equipped === 'object' && !Array.isArray(raw.equipped) ? raw.equipped : {}
        return { owned, equipped }
    } catch { return emptyState() }
}

export function writeCosmetics(state) {
    try { localStorage.setItem(COSMETICS_KEY, JSON.stringify(state)) } catch { /* storage full */ }
    window.dispatchEvent(new Event(COSMETICS_EVENT))
}

// A tier:'supporter' item is never free-owned even though its cost is 0 - it's locked until the Supporter's Set
// DLC exists and grants it some other way (see the TIERS note at the top of shopCatalog.js).
export function isOwned(state, category, id) {
    const item = getItem(category, id)
    if (!item) return false
    if (item.tier === 'supporter') return state.owned.includes(ownedKey(category, id))
    return item.cost === 0 || state.owned.includes(ownedKey(category, id))
}

export function withPurchase(state, category, id) {
    const key = ownedKey(category, id)
    return state.owned.includes(key) ? state : { ...state, owned: [...state.owned, key] }
}

export function withEquipped(state, category, id) {
    return { ...state, equipped: { ...state.equipped, [category]: id } }
}

// ── Bundles ──────────────────────────────────────────────────────────────────────────────────────────────────
// A bundle (SHOP_BUNDLES in shopCatalog.js) just references one item id per category - these three helpers are
// the only bundle-specific logic: which pieces it actually has, whether all of them are owned, and what's left
// to pay for the ones that aren't (20% off the sum of their normal costs). Buying/equipping a whole bundle is
// just calling withPurchase/withEquipped once per not-yet-owned piece - see handleBundleBuy in App.jsx.
export function bundlePieces(bundle) {
    return Object.entries(bundle.items)
        .map(([category, id]) => ({ category, id, item: getItem(category, id) }))
        .filter(p => p.item)
}

export function isBundleOwned(state, bundle) {
    return bundlePieces(bundle).every(p => isOwned(state, p.category, p.id))
}

export function bundlePrice(state, bundle) {
    const total = bundlePieces(bundle)
        .filter(p => !isOwned(state, p.category, p.id))
        .reduce((sum, p) => sum + (p.item.cost || 0), 0)
    return Math.round(total * 0.8)
}

// The item currently equipped in a category: the saved choice if it still exists and is owned, otherwise the default
export function getEquippedItem(category, state = readCosmetics()) {
    const id = state.equipped[category]
    if (id && isOwned(state, category, id)) return getItem(category, id)
    return getItem(category, 'default')
}

// Every CSS variable any theme can set, so equipping a theme can clear the ones the previous theme set
const THEME_CATEGORIES = SHOP_CATEGORIES.map(c => c.id).filter(id => (SHOP_ITEMS[id] || []).some(item => item.vars))
const ALL_THEME_VARS = [...new Set(THEME_CATEGORIES.flatMap(id => SHOP_ITEMS[id].flatMap(item => Object.keys(item.vars || {}))))]

// Puts the equipped themes onto the page as CSS variables. Safe to call any time; call it on start-up and after any change.
export function applyCosmetics(state = readCosmetics()) {
    const root = document.documentElement
    ALL_THEME_VARS.forEach(name => root.style.removeProperty(name))
    THEME_CATEGORIES.forEach(category => {
        const item = getEquippedItem(category, state)
        Object.entries(item?.vars || {}).forEach(([name, value]) => root.style.setProperty(name, value))
    })
    // A themed General theme's own photo takes the "TERMINAL BOARD" banner button's background over whatever
    // Board theme is equipped (equipped in practice, since only one photo can show at a time). The Departure
    // Board page itself stays plain black regardless - see DepartureBoard.css.
    const generalPic = THEME_PICS_BOARD[getEquippedItem('generalTheme', state)?.id]
    if (generalPic) root.style.setProperty('--board-bg-image', `url(${generalPic})`)
}

// The globe's route colours as numbers for three.js, from the equipped general theme (gold departures, blue arrivals by default)
const DEFAULT_ARC_COLORS = { departure: 0xf5a623, arrival: 0x4fc3f7 }
const toHex = (value, fallback) => {
    const n = typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? parseInt(value.slice(1), 16) : NaN
    return Number.isFinite(n) ? n : fallback
}
export function getArcColors(state = readCosmetics()) {
    const vars = getEquippedItem('generalTheme', state)?.vars || {}
    return {
        departure: toHex(vars['--arc-departure'], DEFAULT_ARC_COLORS.departure),
        arrival: toHex(vars['--arc-arrival'], DEFAULT_ARC_COLORS.arrival),
    }
}

// Shape check used when a save is imported: a wrong type here must never reach the game
export function cosmeticsShapeOk(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v)
        && Array.isArray(v.owned) && v.owned.every(x => typeof x === 'string')
        && v.equipped !== null && typeof v.equipped === 'object' && !Array.isArray(v.equipped)
        && Object.values(v.equipped).every(x => typeof x === 'string')
}

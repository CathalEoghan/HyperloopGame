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

// True when every piece of the bundle is the one equipped in its category right now (a new game has the Classic
// bundle equipped, since every category starts on its default piece).
export function isBundleEquipped(state, bundle) {
    return bundlePieces(bundle).every(p => getEquippedItem(p.category, state)?.id === p.id)
}

function bundleUnownedTotal(state, bundle) {
    return bundlePieces(bundle)
        .filter(p => !isOwned(state, p.category, p.id))
        .reduce((sum, p) => sum + (p.item.cost || 0), 0)
}

export function bundlePrice(state, bundle) {
    return Math.round(bundleUnownedTotal(state, bundle) * 0.8)
}

// The same unowned-pieces total bundlePrice discounts, before that 20% comes off - so the Shop can show players
// what they're actually saving (the crossed-out price next to the real one) instead of just a price that's
// quietly lower than adding up the pieces would suggest.
export function bundleOriginalPrice(state, bundle) {
    return Math.round(bundleUnownedTotal(state, bundle))
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

// Relative luminance (WCAG definition) of a "#rrggbb" colour, used below to pick readable text for whatever
// an equipped theme's accent happens to be.
function relativeLuminance(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(hex)
    if (!match) return null
    const [r, g, b] = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255)
    const chan = c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}
const contrastRatio = (l1, l2) => { const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05) }
// Nudges a "#rrggbb" colour toward white by the given fraction (0-1), keeping its hue - used below to lighten
// an accent that's too dark to read as text on a dark card, without changing its colour family.
function blendTowardWhite(hex, pct) {
    const match = /^#([0-9a-f]{6})$/i.exec(hex)
    if (!match) return hex
    const [r, g, b] = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16))
    const mix = c => Math.round(c + (255 - c) * pct)
    return '#' + [mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')
}

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
    // Whichever of a near-black or near-white reads better on top of the equipped accent - most themes' accent
    // is light/mid-tone and want the dark one, but a few (Gingerbread's dark brown among them) are themselves
    // dark, and hardcoding dark text on those made buttons that fill with the accent (e.g. the City "Connect"
    // button's hover state) nearly unreadable. Falls back to the dark text the accent's own default would want.
    const accent = getEquippedItem('generalTheme', state)?.vars?.['--ui-accent'] || '#f5a623'
    const accentLum = relativeLuminance(accent)
    const DARK_TEXT = '#222222', LIGHT_TEXT = '#fff'
    const contrastText = accentLum === null ? DARK_TEXT
        : contrastRatio(1, accentLum) > contrastRatio(relativeLuminance(DARK_TEXT), accentLum) ? LIGHT_TEXT : DARK_TEXT
    root.style.setProperty('--ui-accent-contrast', contrastText)
    // A second case: several dark cards (the Progress page's stat cards and section headers among them) use the
    // accent as the TEXT colour on a fixed dark background, not as a background of its own - that reads fine for
    // most themes but a genuinely dark accent (Gingerbread, Western, Rockstar) is then dark text on a dark card.
    // Nudge just those toward white, in the accent's own hue, until it clears a readable contrast; everything
    // else keeps its accent exactly as the theme set it.
    const DARK_CARD_TEXT = relativeLuminance('#222222')
    let onDark = accent
    if (accentLum !== null) {
        let lum = accentLum
        for (let pct = 0; pct <= 0.8 && contrastRatio(lum, DARK_CARD_TEXT) < 4.5; pct += 0.05) {
            onDark = blendTowardWhite(accent, pct)
            lum = relativeLuminance(onDark)
        }
    }
    root.style.setProperty('--ui-accent-on-dark', onDark)
    // Accent-coloured TEXT and outlines on a near-black surface - the globe page's controls (Owned only,
    // Connections / Active Loops, the "N cities connected" line, the loops panel) and the dark stat boxes on the
    // Cities and Development pages (Population served, City income, Total development income). A genuinely dark
    // accent (Gingerbread's brown) is nearly invisible there, so for those themes - and only those - they switch
    // to plain white; every other theme keeps its accent exactly as set. --globe-active-text is the text on the
    // globe's selected tab, which is filled with the accent itself: white on a dark accent, the usual near-black
    // otherwise.
    const DARK_SURFACE = relativeLuminance('#0a0a1a')
    const accentTooDarkForSurface = accentLum !== null && contrastRatio(accentLum, DARK_SURFACE) < 4.5
    root.style.setProperty('--ui-accent-readable', accentTooDarkForSurface ? '#ffffff' : accent)
    root.style.setProperty('--globe-active-text', contrastText === LIGHT_TEXT ? '#ffffff' : '#0a0a1a')
    // The same two ideas for the BOARD accent, which a Board theme sets separately from the general accent. The
    // arrival/departure popups (greeting, farewell, VIP, delay) draw their text and button outlines in it on a
    // near-black card, so a dark one (Gingerbread's brown) goes white there, and --board-accent-contrast is the
    // text for a surface filled with the board accent (the buttons' hover). Any other board accent is left as is.
    const boardAccent = root.style.getPropertyValue('--board-accent').trim() || '#f5a623'
    const boardLum = relativeLuminance(boardAccent)
    const BOARD_CARD = relativeLuminance('#0a0a0a'), BOARD_DARK_TEXT = '#0a0a1a'
    const boardTooDark = boardLum !== null && contrastRatio(boardLum, BOARD_CARD) < 4.5
    root.style.setProperty('--board-accent-readable', boardTooDark ? '#ffffff' : boardAccent)
    const boardWantsLightText = boardLum !== null && contrastRatio(1, boardLum) > contrastRatio(relativeLuminance(BOARD_DARK_TEXT), boardLum)
    root.style.setProperty('--board-accent-contrast', boardWantsLightText ? '#ffffff' : BOARD_DARK_TEXT)
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

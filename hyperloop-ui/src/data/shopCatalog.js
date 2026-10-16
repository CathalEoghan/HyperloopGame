// The Shop's catalogue. Everything for sale lives in this file.
//
// ─── ADDING A THEME ───────────────────────────────────────────────────────────────────────────────────────────
// Copy a line in the right list below and change it. A theme is: id, name, cost (Reputation), a few colours, and
// an optional one-line description. Only list the colours you want to change: anything left out keeps the default.
//
//     boardTheme('sunset', 'Sunset', 40, { accent: '#ff7a59' }, 'Warm orange-red lettering.'),
//     hyperLinkTheme('mint', 'Mint', 40, { accent: '#3ec9a7', accentDark: '#2aa588' }),
//     generalTheme('dusk', 'Dusk', 75, { barBg: 'rgb(235, 228, 245)', accent: '#8b5cf6', tickerText: '#c4b5fd' }),
//     workSound('chime', 'Chime', 25, chimeSound, 'A little bell.'),
//
// The colours each kind of theme can set are listed in THEME_PROPS just below. A misspelled property name is
// reported in the browser console while developing (so 'acent' can't silently do nothing).
//
//   - id:   short and unique within its list. It is saved in players' saves, so never rename one that has shipped.
//   - cost: Reputation. 0 means free and owned from the start. Each list needs one 'default' at cost 0.
//   - The Shop draws a live preview of each theme from its colours, so there is nothing else to make.
//
// Everything marked PLACEHOLDER is just there so the Shop has something to show: edit, replace or delete it.
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
import workClickSound from '../assets/sounds/workClickSound.mp3'
import clickSound2 from '../assets/sounds/click_sound_2.mp3'
import clickSound3 from '../assets/sounds/click_sound_3.mp3'

export const SHOP_CATEGORIES = [
    { id: 'workSound', name: 'Work sounds', blurb: 'The sound the Work button makes.' },
    { id: 'boardTheme', name: 'Board themes', blurb: 'The look of the Terminal Board.' },
    { id: 'hyperLinkTheme', name: 'Hyper-Link themes', blurb: 'The look of the Hyper-Link phone.' },
    { id: 'generalTheme', name: 'General themes', blurb: 'The top and bottom bars, ticker, Work button and route colours.' },
]

// What each theme property changes. For each kind of theme: property name → the CSS variable the game's stylesheets
// read, and the colour it has when no theme changes it (the same as the fallback written in the CSS).
export const THEME_PROPS = {
    generalTheme: {
        barBg:        { cssVar: '--ui-bar-bg',    default: 'rgb(255, 240, 224)', note: 'top bar and bottom tabs' },
        accent:       { cssVar: '--ui-accent',    default: '#f5a623',            note: 'Work button, tab hover, board button, Shop buttons' },
        tickerBg:     { cssVar: '--ticker-bg',    default: '#0a0a0a',            note: 'ticker bar background' },
        tickerText:   { cssVar: '--ticker-text',  default: '#f5a623',            note: 'ticker bar text and top line' },
        departureArc: { cssVar: '--arc-departure', default: '#f5a623',           note: 'globe routes for departures (#rrggbb)' },
        arrivalArc:   { cssVar: '--arc-arrival',   default: '#4fc3f7',           note: 'globe routes for arrivals (#rrggbb)' },
    },
    boardTheme: {
        accent:       { cssVar: '--board-accent', default: '#f5a623',            note: 'Terminal Board lettering, borders and highlights' },
    },
    hyperLinkTheme: {
        accent:       { cssVar: '--hl-accent',      default: '#f5a623',          note: 'Hyper-Link header, buttons and highlights' },
        accentDark:   { cssVar: '--hl-accent-dark', default: '#e8941a',          note: 'the darker end of the Hyper-Link header gradient' },
    },
}

// The colours a theme sets, as CSS variables ({ '--board-accent': '#4fc3f7' }). Unknown property names are reported.
export function varsFor(kind, props) {
    const known = THEME_PROPS[kind]
    const vars = {}
    Object.entries(props || {}).forEach(([name, value]) => {
        if (!known[name]) {
            if (import.meta.env?.DEV) console.warn(`[shopCatalog] ${kind}: unknown property "${name}". Use one of: ${Object.keys(known).join(', ')}`)
            return
        }
        vars[known[name].cssVar] = value
    })
    return vars
}

// A theme's CSS variables with every property filled in (what it sets, else the default). The Shop's previews use
// this so a preview never picks up colours from whatever theme is currently equipped.
export function fullVarsFor(kind, item) {
    const vars = {}
    Object.values(THEME_PROPS[kind] || {}).forEach(p => { vars[p.cssVar] = p.default })
    return { ...vars, ...(item.vars || {}) }
}

const makeTheme = kind => (id, name, cost, props = {}, description = '') => ({ id, name, description, cost, vars: varsFor(kind, props) })
const boardTheme = makeTheme('boardTheme')
const hyperLinkTheme = makeTheme('hyperLinkTheme')
const generalTheme = makeTheme('generalTheme')
const workSound = (id, name, cost, src, description = '') => ({ id, name, description, cost, src })

export const SHOP_ITEMS = {
    workSound: [
        workSound('default', 'Classic click', 0, workClickSound, 'The original.'),
        // PLACEHOLDER
        workSound('soft', 'Soft click', 25, clickSound2, 'A gentler tap.'),
        // PLACEHOLDER
        workSound('crisp', 'Crisp click', 25, clickSound3, 'Short and sharp.'),
    ],

    boardTheme: [
        boardTheme('default', 'Amber', 0, {}, 'The classic amber-on-black board.'),
        // PLACEHOLDER
        boardTheme('ocean', 'Ocean', 40, { accent: '#4fc3f7' }, 'Cool blue lettering.'),
        // PLACEHOLDER
        boardTheme('terminal', 'Terminal green', 40, { accent: '#39ff14' }, 'Old-school green phosphor.'),
    ],

    hyperLinkTheme: [
        hyperLinkTheme('default', 'Sunrise', 0, {}, 'The classic amber Hyper-Link.'),
        // PLACEHOLDER
        hyperLinkTheme('ocean', 'Ocean', 40, { accent: '#3b82f6', accentDark: '#2563eb' }, 'A blue Hyper-Link.'),
        // PLACEHOLDER
        hyperLinkTheme('rose', 'Rose', 40, { accent: '#ec6a9c', accentDark: '#d94c82' }, 'A pink Hyper-Link.'),
    ],

    generalTheme: [
        generalTheme('default', 'Golden hour', 0, {}, 'The classic look.'),
        // PLACEHOLDER
        generalTheme('ocean', 'Ocean', 75, {
            barBg: 'rgb(228, 240, 255)', accent: '#3b82f6',
            tickerBg: '#06101c', tickerText: '#4fc3f7',
            departureArc: '#3b82f6', arrivalArc: '#f5a623',
        }, 'Blue bars, ticker and Work button, with blue departure routes and gold arrival routes.'),
    ],
}

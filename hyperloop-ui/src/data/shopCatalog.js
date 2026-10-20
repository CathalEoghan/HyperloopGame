// The Shop's catalogue. Everything for sale lives in this file.
//
// ─── TIERS ────────────────────────────────────────────────────────────────────────────────────────────────────
// Every item has a `tier`, and the Shop groups each category's items under three headings in this order:
//
//   'standard'  - cheap, Reputation-only. Usually a recolour: new colours on the same shapes/sounds everything
//                 already has (a new accent colour, a single alternate click sample, a cursor recolour).
//   'special'   - pricier, still Reputation-only. The thing that makes it special should be a NEW asset, not
//                 just a different colour: a custom background image, a sound that cycles between several
//                 samples, a redrawn cursor shape, a 3-colour gradient instead of 2. This is what should make
//                 players feel it was worth saving up for.
//   'supporter' - real-money only, as part of a future Steam "Supporter's Set" DLC. These are NOT ownable or
//                 equippable yet (see isOwned() in utils/cosmetics.js, which refuses tier:'supporter' even
//                 though its cost is 0) - they exist here so the Shop can show them locked, with a "Part of the
//                 Supporter's Set" note, to build anticipation without being purchasable or Reputation-priced.
//                 When the DLC ships, ownership will be granted some other way (a Steam entitlement check) -
//                 nothing here needs to change for that except isOwned()'s rule.
//
// ─── ADDING A THEME ───────────────────────────────────────────────────────────────────────────────────────────
// Copy a line in the right list below and change it. A theme is: id, name, cost (Reputation), a few colours, an
// optional one-line description, and a tier. Only list the colours you want to change: anything left out keeps
// the default.
//
//     boardTheme('sunset', 'Sunset', 40, { accent: '#ff7a59' }, 'Warm orange-red lettering.'),
//     hyperLinkTheme('mint', 'Mint', 40, { accent: '#3ec9a7', accentDark: '#2aa588' }),
//     generalTheme('dusk', 'Dusk', 75, { barBg: 'rgb(235, 228, 245)', accent: '#8b5cf6', tickerText: '#c4b5fd' }),
//     cursorTheme('lime', 'Lime', 20, { cursorDefault: '...', cursorPointer: '...', cursorGrab: '...', cursorGrabbing: '...' }),
//     workSound('chime', 'Chime', 25, chimeSound, 'A little bell.'),
//
// A theme item defaults to tier: 'standard' - pass 'special' or 'supporter' as the last argument to change it
// (see the examples further down). A workSound can take an array of files instead of one, for a click that
// cycles between several samples each time (a 'special'-tier thing - see 'medley' below).
//
// A boardTheme can also set `bgImage` (a CSS background-image value, usually another data: URI SVG like the
// cursors below) and two sounds - `hoverSound` / `clickSource` - which only the Terminal Board's own buttons use
// (ScheduleModal, the board tabs, Automate, Farewell, Delay). Leave them out and the board uses the same sounds
// as everything else, same as today.
//
// The colours each kind of theme can set are listed in THEME_PROPS just below. A misspelled property name is
// reported in the browser console while developing (so 'acent' can't silently do nothing).
//
//   - id:   short and unique within its list. It is saved in players' saves, so never rename one that has shipped.
//   - cost: Reputation. 0 means free and owned from the start (true for every 'default' item - each list needs
//           exactly one, at tier 'standard'). A tier:'supporter' item's cost is ignored (see TIERS above).
//   - The Shop draws a live preview of each theme from its colours, so there is nothing else to make. Cursor
//     themes preview as a little "hover to try it" swatch instead, since there's no colour swatch that shows a
//     cursor shape.
//
// Everything marked PLACEHOLDER is just there so the Shop has something to show: edit, replace or delete it.
//
// ─── BUNDLES ──────────────────────────────────────────────────────────────────────────────────────────────────
// A bundle groups one item from each of the five categories under a single theme, in the Shop's own "Bundles"
// tab. Every bundle below is a TEMPLATE: real structure, but placeholder content (recolours and reused sound
// files instead of real art/audio), so you can come back later and swap in the real thing piece by piece
// without having to touch the bundle mechanism itself. To finish a bundle: replace its pieces' colours/sounds
// in the five lists below (search for the bundle's id, e.g. "kitty"), or give a boardTheme piece a real bgImage
// and its own sounds the same way 'starlight' does above.
//
// A bundle is: export const SHOP_BUNDLES = [ { id, name, tier, blurb, items: { <category>: '<item id>', ... } } ]
//   - items: one item id per category, pointing at a real entry in the lists below (or an existing one - the
//     'starlight' bundle below reuses the Board theme already built earlier in this file rather than making a
//     second item with the same name).
//   - tier: 'special' (Reputation, like everything else here) or 'premium' (locked until the Supporter's Set
//     DLC - its pieces should then be tier:'supporter' themselves, the same locking TIERS already does).
//   - Each piece keeps its own Standard/Special/Supporter tag in its home category's tab; the bundle's own
//     tier badge ("Special"/"Premium") is a separate, bundle-level label shown only in the Bundles tab.
//   - Price: the sum of whichever pieces the player doesn't already own, minus 20% - see bundlePrice() in
//     utils/cosmetics.js. A fully-owned bundle has nothing left to buy, so the Shop shows "Equip all" instead.
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
import workClickSound from '../assets/sounds/workClickSound.mp3'
import clickSound2 from '../assets/sounds/click_sound_2.mp3'
import clickSound3 from '../assets/sounds/click_sound_3.mp3'
import hoverSoundAsset from '../assets/sounds/hoverSound.mp3'
import poltergeist1 from '../assets/work-click-sounds/poltergeist1.mp3'
import poltergeist2 from '../assets/work-click-sounds/poltergeist2.mp3'
import poltergeist3 from '../assets/work-click-sounds/poltergeist3.mp3'
import poltergeist4 from '../assets/work-click-sounds/poltergeist4.mp3'
import poltergeist5 from '../assets/work-click-sounds/poltergeist5.mp3'

export const SHOP_CATEGORIES = [
    { id: 'workSound', name: 'Work sounds', blurb: 'The sound the Work button makes.' },
    { id: 'boardTheme', name: 'Board themes', blurb: 'The look (and, for some, the sound) of the Terminal Board.' },
    { id: 'hyperLinkTheme', name: 'Hyper-Link themes', blurb: 'The look of the Hyper-Link phone.' },
    { id: 'generalTheme', name: 'General themes', blurb: 'The top and bottom bars, ticker, Work button and route colours.' },
    { id: 'cursorTheme', name: 'Cursors', blurb: 'The pointer, arrow and drag cursors.' },
]

// The order tiers are grouped and labelled in the Shop.
export const TIERS = [
    { id: 'standard', name: 'Standard' },
    { id: 'special', name: 'Special' },
    { id: 'supporter', name: 'Supporter' },
]

// What each theme property changes. For each kind of theme: property name → the CSS variable the game's stylesheets
// read, and the colour (or, for cursors, the cursor image) it has when no theme changes it - the same as the
// fallback written in the CSS it belongs to, so a theme that doesn't set a property is pixel-identical to today.
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
        accent:       { cssVar: '--board-accent',    default: '#f5a623',  note: 'Terminal Board lettering, borders and highlights' },
        bgImage:      { cssVar: '--board-bg-image',  default: 'none',     note: 'background image behind the board (a data: URI, or none). Always shown under a dark scrim, so any image stays readable.' },
    },
    hyperLinkTheme: {
        accent:       { cssVar: '--hl-accent',      default: '#f5a623',          note: 'Hyper-Link header, buttons and highlights' },
        accentDark:   { cssVar: '--hl-accent-dark', default: '#e8941a',          note: 'the darker end of the Hyper-Link header gradient' },
    },
    cursorTheme: {
        cursorDefault:  { cssVar: '--cursor-default',  note: 'the ordinary arrow',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffd86b'/%3E%3Cstop offset='1' stop-color='%23f5a623'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='%232b1a00' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default" },
        cursorPointer:  { cssVar: '--cursor-pointer',  note: 'over anything clickable',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%232b1a00' stroke='%232b1a00' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cg fill='%23ffb81c'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cpath d='M12.6 5 L12.6 13' stroke='%23fff3c4' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 13 3, pointer" },
        cursorGrab:     { cssVar: '--cursor-grab',     note: 'hovering a draggable (the Home globe)',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%232b1a00' stroke='%232b1a00' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cg fill='%23ffb81c'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cpath d='M10.3 10 L10.3 15 M14.7 8 L14.7 14 M19.1 9 L19.1 14' stroke='%23fff3c4' stroke-width='1' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 16 16, grab" },
        cursorGrabbing: { cssVar: '--cursor-grabbing', note: 'dragging the Home globe',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%232b1a00' stroke='%232b1a00' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3Cg fill='%23ffb81c'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3C/svg%3E\") 16 16, grabbing" },
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

const makeTheme = kind => (id, name, cost, props = {}, description = '', tier = 'standard') =>
    ({ id, name, description, cost, tier, vars: varsFor(kind, props) })
const hyperLinkTheme = makeTheme('hyperLinkTheme')
const generalTheme = makeTheme('generalTheme')
const cursorTheme = makeTheme('cursorTheme')

// boardTheme takes two extra, optional sounds (hoverSound/clickSource) that only the Terminal Board's own
// buttons play - see playBoardHoverSound()/playBoardClickSound() in utils/sound.js. Leave them out and the
// board keeps using the game's usual click/hover sounds, exactly as it does today.
const boardTheme = (id, name, cost, props = {}, description = '', tier = 'standard', sounds = {}) =>
    ({ id, name, description, cost, tier, vars: varsFor('boardTheme', props), hoverSound: sounds.hoverSound, clickSource: sounds.clickSource })

// A workSound can take one file (src) or an array (srcs) for a click that picks a different sample each time.
const workSound = (id, name, cost, fileOrFiles, description = '', tier = 'standard') =>
    ({ id, name, description, cost, tier, ...(Array.isArray(fileOrFiles) ? { srcs: fileOrFiles } : { src: fileOrFiles }) })

// Builds a complete cursor set (default/pointer/grab/grabbing) by recolouring the same shapes the Ocean cursor
// above uses - give it five hex colours and get a full, working cursor theme with no SVG-writing. Every
// bundle's cursor piece below is built this way: a real recolour to start from, not a redrawn shape. Swap in a
// genuinely new shape instead (see 'pod' above) for something more special, or just tweak these five colours.
const CURSOR_TEMPLATE = {
    default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='{{A}}'/%3E%3Cstop offset='1' stop-color='{{B}}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='{{STROKE}}' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default",
    pointer: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='{{STROKE}}' stroke='{{STROKE}}' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cg fill='{{FILL}}'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cpath d='M12.6 5 L12.6 13' stroke='{{HILITE}}' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 13 3, pointer",
    grab: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='{{STROKE}}' stroke='{{STROKE}}' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cg fill='{{FILL}}'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cpath d='M10.3 10 L10.3 15 M14.7 8 L14.7 14 M19.1 9 L19.1 14' stroke='{{HILITE}}' stroke-width='1' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 16 16, grab",
    grabbing: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='{{STROKE}}' stroke='{{STROKE}}' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3Cg fill='{{FILL}}'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3C/svg%3E\") 16 16, grabbing",
}
const recolorCursor = ({ a, b, stroke, fill, hilite }) => {
    const hex = c => '%23' + c.replace('#', '')
    const sub = s => s.replaceAll('{{A}}', hex(a)).replaceAll('{{B}}', hex(b)).replaceAll('{{STROKE}}', hex(stroke)).replaceAll('{{FILL}}', hex(fill)).replaceAll('{{HILITE}}', hex(hilite))
    return { cursorDefault: sub(CURSOR_TEMPLATE.default), cursorPointer: sub(CURSOR_TEMPLATE.pointer), cursorGrab: sub(CURSOR_TEMPLATE.grab), cursorGrabbing: sub(CURSOR_TEMPLATE.grabbing) }
}

export const SHOP_ITEMS = {
    workSound: [
        workSound('default', 'Classic click', 0, workClickSound, 'The original.'),
        // PLACEHOLDER
        workSound('soft', 'Soft click', 25, clickSound2, 'A gentler tap.'),
        // PLACEHOLDER
        workSound('crisp', 'Crisp click', 25, clickSound3, 'Short and sharp.'),

        // PLACEHOLDER - 'special' tier: a new asset (here, cycling between existing samples), not just a recolour
        workSound('medley', 'Medley', 60, [workClickSound, clickSound2, clickSound3], 'Cycles between three different clicks, so Work never sounds quite the same twice.', 'special'),

        // PLACEHOLDER - 'supporter' tier: locked until the Supporter's Set DLC exists (see TIERS above)
        workSound('fanfare', 'Fanfare', 0, workClickSound, 'A little flourish on every click. Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above) - reused existing samples as stand-ins. Swap
        // each src for a real themed sample (a meow, a chime, a parrot squawk...) whenever you get to it.
        workSound('kitty', 'Kitty click', 25, clickSound2, 'TEMPLATE - swap for a real meow/purr sample. Part of the Kitty bundle.'),
        workSound('fairy', 'Fairy click', 25, clickSound3, 'TEMPLATE - swap for a real chime/sparkle sample. Part of the Fairy bundle.'),
        workSound('poltergeist', 'Poltergeist click', 25, [poltergeist1, poltergeist2, poltergeist3, poltergeist4, poltergeist5], 'A creak, a whisper, a rattling chain - a different ghostly sound every click. Part of the Poltergeist bundle.'),
        workSound('playroom', 'Playroom click', 25, clickSound2, 'TEMPLATE - swap for a real xylophone-note sample. Part of the Playroom bundle.'),
        workSound('starlight', 'Starlight click', 25, clickSound3, 'TEMPLATE - swap for a real sci-fi blip sample. Part of the Starlight bundle.'),
        workSound('buccaneer', 'Buccaneer click', 25, workClickSound, 'TEMPLATE - swap for a real "arr"/parrot sample. Part of the Buccaneer bundle.'),
        workSound('princess', 'Princess click', 25, clickSound2, 'TEMPLATE - swap for a real sparkle/harp sample. Part of the Princess bundle.'),
        workSound('jazz', 'Jazz click', 25, clickSound3, 'TEMPLATE - swap for a real saxophone-note sample. Part of the Jazz bundle.'),
    ],

    boardTheme: [
        boardTheme('default', 'Amber', 0, {}, 'The classic amber-on-black board.'),
        // PLACEHOLDER
        boardTheme('ocean', 'Ocean', 40, { accent: '#4fc3f7' }, 'Cool blue lettering.'),
        // PLACEHOLDER
        boardTheme('terminal', 'Terminal green', 40, { accent: '#39ff14' }, 'Old-school green phosphor.'),

        // PLACEHOLDER - 'special' tier: a custom background image (always under a dark scrim, so it stays
        // readable) plus its own hover/click sounds, not just a recoloured accent
        boardTheme('starlight', 'Starlight', 90, {
            accent: '#c4b5fd',
            bgImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23030712'/%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='14' cy='18' r='1.1' opacity='0.8'/%3E%3Ccircle cx='40' cy='8' r='0.8' opacity='0.5'/%3E%3Ccircle cx='66' cy='26' r='1.3' opacity='0.9'/%3E%3Ccircle cx='92' cy='14' r='0.9' opacity='0.6'/%3E%3Ccircle cx='110' cy='40' r='1.1' opacity='0.7'/%3E%3Ccircle cx='22' cy='52' r='0.9' opacity='0.5'/%3E%3Ccircle cx='54' cy='60' r='1.2' opacity='0.8'/%3E%3Ccircle cx='80' cy='70' r='0.8' opacity='0.5'/%3E%3Ccircle cx='104' cy='84' r='1.3' opacity='0.9'/%3E%3Ccircle cx='10' cy='92' r='1' opacity='0.6'/%3E%3Ccircle cx='36' cy='104' r='0.9' opacity='0.5'/%3E%3Ccircle cx='62' cy='96' r='1.2' opacity='0.8'/%3E%3Ccircle cx='90' cy='110' r='1' opacity='0.6'/%3E%3Ccircle cx='116' cy='100' r='0.9' opacity='0.5'/%3E%3C/g%3E%3C/svg%3E\")",
        }, 'A starfield behind the board, with its own hover and click sounds.', 'special', { hoverSound: hoverSoundAsset, clickSource: clickSound3 }),

        // PLACEHOLDER - 'supporter' tier
        boardTheme('aurora', 'Aurora', 0, { accent: '#39ffc9' }, 'Shifting aurora colours behind the board. Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above) - plain accent recolours for now. Give any of
        // these a real bgImage (and hoverSound/clickSource) the same way 'starlight' above does when you're
        // ready. The Starlight BUNDLE itself reuses the 'starlight' item above rather than duplicating it.
        boardTheme('kitty', 'Kitty board', 40, { accent: '#ff8fab' }, 'TEMPLATE - pink lettering. Part of the Kitty bundle.'),
        boardTheme('fairy', 'Fairy board', 40, { accent: '#b794f6' }, 'TEMPLATE - lavender lettering. Part of the Fairy bundle.'),
        boardTheme('poltergeist', 'Poltergeist board', 40, { accent: '#7cff6b' }, 'TEMPLATE - sickly green lettering. Part of the Poltergeist bundle.'),
        boardTheme('playroom', 'Playroom board', 40, { accent: '#ffd166' }, 'TEMPLATE - crayon-yellow lettering. Part of the Playroom bundle.'),
        boardTheme('buccaneer', 'Buccaneer board', 40, { accent: '#c9972a' }, 'TEMPLATE - old-gold lettering. Part of the Buccaneer bundle.'),
        boardTheme('princess', 'Princess board', 40, { accent: '#f0a8d0' }, 'TEMPLATE - rose-gold lettering. Part of the Princess bundle.'),
        boardTheme('jazz', 'Jazz board', 40, { accent: '#b8860b' }, 'TEMPLATE - smoky goldenrod lettering. Part of the Jazz bundle.'),
    ],

    hyperLinkTheme: [
        hyperLinkTheme('default', 'Sunrise', 0, {}, 'The classic amber Hyper-Link.'),
        // PLACEHOLDER
        hyperLinkTheme('ocean', 'Ocean', 40, { accent: '#3b82f6', accentDark: '#2563eb' }, 'A blue Hyper-Link.'),
        // PLACEHOLDER
        hyperLinkTheme('rose', 'Rose', 40, { accent: '#ec6a9c', accentDark: '#d94c82' }, 'A pink Hyper-Link.'),

        // PLACEHOLDER - 'special' tier
        hyperLinkTheme('prism', 'Prism', 65, { accent: '#a855f7', accentDark: '#ec4899' }, 'A bolder violet-to-pink gradient.', 'special'),

        // PLACEHOLDER - 'supporter' tier
        hyperLinkTheme('neon', 'Neon', 0, { accent: '#39ffc9', accentDark: '#00c2a8' }, 'Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above)
        hyperLinkTheme('kitty', 'Kitty Hyper-Link', 40, { accent: '#ff8fab', accentDark: '#e85d87' }, 'TEMPLATE - part of the Kitty bundle.'),
        hyperLinkTheme('fairy', 'Fairy Hyper-Link', 40, { accent: '#b794f6', accentDark: '#9061d9' }, 'TEMPLATE - part of the Fairy bundle.'),
        hyperLinkTheme('poltergeist', 'Poltergeist Hyper-Link', 40, { accent: '#7cff6b', accentDark: '#4fc43f' }, 'TEMPLATE - part of the Poltergeist bundle.'),
        hyperLinkTheme('playroom', 'Playroom Hyper-Link', 40, { accent: '#ff6b6b', accentDark: '#e85252' }, 'TEMPLATE - part of the Playroom bundle.'),
        hyperLinkTheme('starlight', 'Starlight Hyper-Link', 40, { accent: '#c4b5fd', accentDark: '#7c6fd1' }, 'TEMPLATE - part of the Starlight bundle.'),
        hyperLinkTheme('buccaneer', 'Buccaneer Hyper-Link', 40, { accent: '#c9972a', accentDark: '#a87a1c' }, 'TEMPLATE - part of the Buccaneer bundle.'),
        hyperLinkTheme('princess', 'Princess Hyper-Link', 40, { accent: '#f0a8d0', accentDark: '#d4af37' }, 'TEMPLATE - part of the Princess bundle.'),
        hyperLinkTheme('jazz', 'Jazz Hyper-Link', 40, { accent: '#b8860b', accentDark: '#8b0000' }, 'TEMPLATE - part of the Jazz bundle.'),
    ],

    generalTheme: [
        generalTheme('default', 'Golden hour', 0, {}, 'The classic look.'),
        // PLACEHOLDER
        generalTheme('ocean', 'Ocean', 75, {
            barBg: 'rgb(228, 240, 255)', accent: '#3b82f6',
            tickerBg: '#06101c', tickerText: '#4fc3f7',
            departureArc: '#3b82f6', arrivalArc: '#f5a623',
        }, 'Blue bars, ticker and Work button, with blue departure routes and gold arrival routes.'),

        // PLACEHOLDER - 'special' tier
        generalTheme('noir', 'Noir', 95, {
            barBg: 'rgb(24, 22, 28)', accent: '#c4b5fd',
            tickerBg: '#000000', tickerText: '#c4b5fd',
            departureArc: '#c4b5fd', arrivalArc: '#39ffc9',
        }, 'A dark top and bottom bar with violet accents, for a sleeker look than the cream default.', 'special'),

        // PLACEHOLDER - 'supporter' tier
        generalTheme('prestige', 'Prestige', 0, {
            barBg: 'rgb(20, 18, 14)', accent: '#ffd86b',
            tickerBg: '#000000', tickerText: '#ffd86b',
            departureArc: '#ffd86b', arrivalArc: '#c4b5fd',
        }, 'Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above)
        generalTheme('kitty', 'Kitty', 75, {
            barBg: 'rgb(255, 240, 246)', accent: '#ff8fab',
            tickerBg: '#2b0f1a', tickerText: '#ffb6c9',
            departureArc: '#ff8fab', arrivalArc: '#ffd86b',
        }, 'TEMPLATE - pink and cream. Part of the Kitty bundle.'),
        generalTheme('fairy', 'Fairy', 75, {
            barBg: 'rgb(243, 235, 255)', accent: '#b794f6',
            tickerBg: '#160f26', tickerText: '#d9c7ff',
            departureArc: '#b794f6', arrivalArc: '#6ee7b7',
        }, 'TEMPLATE - lavender and mint. Part of the Fairy bundle.'),
        generalTheme('poltergeist', 'Poltergeist', 75, {
            barBg: 'rgb(18, 20, 18)', accent: '#7cff6b',
            tickerBg: '#000000', tickerText: '#9fffb0',
            departureArc: '#7cff6b', arrivalArc: '#c4b5fd',
        }, 'TEMPLATE - sickly green on near-black. Part of the Poltergeist bundle.'),
        generalTheme('playroom', 'Playroom', 75, {
            barBg: 'rgb(255, 249, 224)', accent: '#ffd166',
            tickerBg: '#1a1406', tickerText: '#ffe08a',
            departureArc: '#ff6b6b', arrivalArc: '#4ecdc4',
        }, 'TEMPLATE - crayon-box colours. Part of the Playroom bundle.'),
        generalTheme('starlight', 'Starlight', 75, {
            barBg: 'rgb(10, 10, 20)', accent: '#c4b5fd',
            tickerBg: '#000000', tickerText: '#39ffc9',
            departureArc: '#c4b5fd', arrivalArc: '#39ffc9',
        }, 'TEMPLATE - indigo and cyan, to match the Starlight board. Part of the Starlight bundle.'),
        generalTheme('buccaneer', 'Buccaneer', 75, {
            barBg: 'rgb(245, 235, 210)', accent: '#c9972a',
            tickerBg: '#1a1206', tickerText: '#e8c468',
            departureArc: '#c9972a', arrivalArc: '#2e8b8b',
        }, 'TEMPLATE - old gold and sea teal. Part of the Buccaneer bundle.'),
        generalTheme('princess', 'Princess', 75, {
            barBg: 'rgb(255, 244, 250)', accent: '#f0a8d0',
            tickerBg: '#1a0514', tickerText: '#f6c7e4',
            departureArc: '#f0a8d0', arrivalArc: '#d4af37',
        }, 'TEMPLATE - rose and gold. Part of the Princess bundle.'),
        generalTheme('jazz', 'Jazz', 75, {
            barBg: 'rgb(30, 20, 22)', accent: '#b8860b',
            tickerBg: '#000000', tickerText: '#e0b25c',
            departureArc: '#b8860b', arrivalArc: '#8b0000',
        }, 'TEMPLATE - smoky goldenrod and burgundy. Part of the Jazz bundle.'),
    ],

    cursorTheme: [
        cursorTheme('default', 'Classic', 0, {}, 'The original gold hand and arrow.'),

        // PLACEHOLDER - 'standard' tier: a recolour of the same shapes
        cursorTheme('ocean', 'Ocean', 20, {
            cursorDefault: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2399d6ff'/%3E%3Cstop offset='1' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='%230d1b2e' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default",
            cursorPointer: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%230d1b2e' stroke='%230d1b2e' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cg fill='%234fc3f7'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cpath d='M12.6 5 L12.6 13' stroke='%23e0f4ff' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 13 3, pointer",
            cursorGrab: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%230d1b2e' stroke='%230d1b2e' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cg fill='%234fc3f7'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cpath d='M10.3 10 L10.3 15 M14.7 8 L14.7 14 M19.1 9 L19.1 14' stroke='%23e0f4ff' stroke-width='1' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 16 16, grab",
            cursorGrabbing: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%230d1b2e' stroke='%230d1b2e' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3Cg fill='%234fc3f7'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3C/svg%3E\") 16 16, grabbing",
        }, 'The same shapes, recoloured blue.'),

        // PLACEHOLDER - 'special' tier: a genuinely new shape (a little hyperloop pod), not just a recolour
        cursorTheme('pod', 'Hyperloop Pod', 65, {
            cursorDefault: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ede9fe'/%3E%3Cstop offset='1' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='%232a1033' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default",
            cursorPointer: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%232a1033' stroke='%232a1033' stroke-width='1.8' stroke-linejoin='round'%3E%3Crect x='3' y='10' width='21' height='12' rx='6'/%3E%3Cpath d='M24 12 L30 16 L24 20 Z'/%3E%3C/g%3E%3Cg fill='%238b5cf6'%3E%3Crect x='4.3' y='11.3' width='18.4' height='9.4' rx='4.7'/%3E%3Cpath d='M24.5 13 L28.5 16 L24.5 19 Z'/%3E%3C/g%3E%3Ccircle cx='9.5' cy='16' r='2' fill='%23f5f3ff'/%3E%3Ccircle cx='15.5' cy='16' r='2' fill='%23f5f3ff'/%3E%3C/svg%3E\") 4 16, pointer",
            cursorGrab: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%232a1033' stroke='%232a1033' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cg fill='%23c4b5fd'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cpath d='M10.3 10 L10.3 15 M14.7 8 L14.7 14 M19.1 9 L19.1 14' stroke='%23f5f3ff' stroke-width='1' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 16 16, grab",
            cursorGrabbing: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%232a1033' stroke='%232a1033' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3Cg fill='%23c4b5fd'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3C/svg%3E\") 16 16, grabbing",
        }, 'A little hyperloop pod instead of a hand, for the pointer cursor.', 'special'),

        // PLACEHOLDER - 'supporter' tier (reuses the Ocean shapes recoloured gold, as a stand-in until real art exists)
        cursorTheme('vip', 'VIP', 0, {
            cursorDefault: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23fff3c4'/%3E%3Cstop offset='1' stop-color='%23ffd86b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='%232b1a00' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default",
        }, 'Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above) - built with recolorCursor(), so each one is a
        // real working recolour already. Give any of them a genuinely new shape (like 'pod' above) later if
        // you want that bundle's cursor to feel more special.
        cursorTheme('kitty', 'Kitty cursor', 20, recolorCursor({ a: '#ffd6e8', b: '#ff8fab', stroke: '#5a1a2e', fill: '#ff8fab', hilite: '#fff0f5' }), 'TEMPLATE - part of the Kitty bundle.'),
        cursorTheme('fairy', 'Fairy cursor', 20, recolorCursor({ a: '#e9d8ff', b: '#b794f6', stroke: '#2e1a4d', fill: '#b794f6', hilite: '#f5f0ff' }), 'TEMPLATE - part of the Fairy bundle.'),
        cursorTheme('poltergeist', 'Poltergeist cursor', 20, recolorCursor({ a: '#d4ffd0', b: '#5fdb5a', stroke: '#0d140d', fill: '#5fdb5a', hilite: '#eafff0' }), 'TEMPLATE - part of the Poltergeist bundle.'),
        cursorTheme('playroom', 'Playroom cursor', 20, recolorCursor({ a: '#fff3b0', b: '#ffd166', stroke: '#3a2a05', fill: '#ffd166', hilite: '#fffdf0' }), 'TEMPLATE - part of the Playroom bundle.'),
        cursorTheme('starlight', 'Starlight cursor', 20, recolorCursor({ a: '#c4b5fd', b: '#39ffc9', stroke: '#05050f', fill: '#8b7cf6', hilite: '#eafff8' }), 'TEMPLATE - part of the Starlight bundle.'),
        cursorTheme('buccaneer', 'Buccaneer cursor', 20, recolorCursor({ a: '#ffe6a8', b: '#c9972a', stroke: '#2e1c05', fill: '#c9972a', hilite: '#fff6e0' }), 'TEMPLATE - part of the Buccaneer bundle.'),
        cursorTheme('princess', 'Princess cursor', 20, recolorCursor({ a: '#ffe3f0', b: '#f0a8d0', stroke: '#3a0d22', fill: '#f0a8d0', hilite: '#fff5fb' }), 'TEMPLATE - part of the Princess bundle.'),
        cursorTheme('jazz', 'Jazz cursor', 20, recolorCursor({ a: '#f0d890', b: '#b8860b', stroke: '#1a0c0c', fill: '#b8860b', hilite: '#fff6dc' }), 'TEMPLATE - part of the Jazz bundle.'),
    ],
}

// One bundle per themed set - see "ADDING A BUNDLE" near the top of this file. Prices are computed from these
// (sum of the not-yet-owned pieces, minus 20%) by bundlePrice() in utils/cosmetics.js, so nothing here sets a
// price directly.
export const SHOP_BUNDLES = [
    {
        id: 'kitty', name: 'Kitty', tier: 'special',
        blurb: 'Cat-themed: pink and cream everywhere, a meowing Work button, a paw-pink cursor.',
        items: { generalTheme: 'kitty', boardTheme: 'kitty', hyperLinkTheme: 'kitty', workSound: 'kitty', cursorTheme: 'kitty' },
    },
    {
        id: 'fairy', name: 'Fairy', tier: 'special',
        blurb: 'Fantasy-themed: lavender and mint, a chiming Work button, a sparkling cursor.',
        items: { generalTheme: 'fairy', boardTheme: 'fairy', hyperLinkTheme: 'fairy', workSound: 'fairy', cursorTheme: 'fairy' },
    },
    {
        id: 'poltergeist', name: 'Poltergeist', tier: 'special',
        blurb: 'Spooky-themed: sickly green on near-black, a creaking Work button.',
        items: { generalTheme: 'poltergeist', boardTheme: 'poltergeist', hyperLinkTheme: 'poltergeist', workSound: 'poltergeist', cursorTheme: 'poltergeist' },
    },
    {
        id: 'playroom', name: 'Playroom', tier: 'special',
        blurb: 'Nursery-themed: crayon-box colours, a xylophone Work button.',
        items: { generalTheme: 'playroom', boardTheme: 'playroom', hyperLinkTheme: 'playroom', workSound: 'playroom', cursorTheme: 'playroom' },
    },
    {
        // Reuses the Board theme already built above rather than duplicating it under a second id.
        id: 'starlight', name: 'Starlight', tier: 'special',
        blurb: 'Sci-fi-themed: a starfield board, indigo-and-cyan bars, a sci-fi blip Work button.',
        items: { generalTheme: 'starlight', boardTheme: 'starlight', hyperLinkTheme: 'starlight', workSound: 'starlight', cursorTheme: 'starlight' },
    },
    {
        id: 'buccaneer', name: 'Buccaneer', tier: 'special',
        blurb: 'Pirate-themed: old gold and sea teal, an "arr" on every click.',
        items: { generalTheme: 'buccaneer', boardTheme: 'buccaneer', hyperLinkTheme: 'buccaneer', workSound: 'buccaneer', cursorTheme: 'buccaneer' },
    },
    {
        id: 'princess', name: 'Princess', tier: 'special',
        blurb: 'Elegant and royal: rose and gold, a sparkling Work button.',
        items: { generalTheme: 'princess', boardTheme: 'princess', hyperLinkTheme: 'princess', workSound: 'princess', cursorTheme: 'princess' },
    },
    {
        id: 'jazz', name: 'Jazz', tier: 'special',
        blurb: 'Smoky and musical: goldenrod and burgundy, a saxophone note on every click.',
        items: { generalTheme: 'jazz', boardTheme: 'jazz', hyperLinkTheme: 'jazz', workSound: 'jazz', cursorTheme: 'jazz' },
    },
]

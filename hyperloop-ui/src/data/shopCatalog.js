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
//     A generalTheme with a dark barBg MUST also set barText (and usually barTextMuted) - the top bar/bottom tabs'
//     text otherwise stays the default dark colour and becomes unreadable on a dark bar (see prestige/
//     poltergeist/starlight/jazz below for examples):
//     generalTheme('midnight', 'Midnight', 75, { barBg: 'rgb(16, 16, 24)', barText: '#eee8ff', barTextMuted: '#a79fc0', accent: '#8b5cf6' }),
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
import clickSound3 from '../assets/sounds/click_sound_3.mp3'
import hoverSoundAsset from '../assets/sounds/hoverSound.mp3'
import poltergeist1 from '../assets/work-click-sounds/poltergeist1.mp3'
import poltergeist2 from '../assets/work-click-sounds/poltergeist2.mp3'
import poltergeist3 from '../assets/work-click-sounds/poltergeist3.mp3'
import poltergeist4 from '../assets/work-click-sounds/poltergeist4.mp3'
import poltergeist5 from '../assets/work-click-sounds/poltergeist5.mp3'
import kitty1 from '../assets/work-click-sounds/kitty1.mp3'
import kitty2 from '../assets/work-click-sounds/kitty2.mp3'
import kitty3 from '../assets/work-click-sounds/kitty3.mp3'
import kitty4 from '../assets/work-click-sounds/kitty4.mp3'
import kitty5 from '../assets/work-click-sounds/kitty5.mp3'
import fairy1 from '../assets/work-click-sounds/fairy1.mp3'
import fairy2 from '../assets/work-click-sounds/fairy2.mp3'
import fairy3 from '../assets/work-click-sounds/fairy3.mp3'
import fairy4 from '../assets/work-click-sounds/fairy4.mp3'
import pirate1 from '../assets/work-click-sounds/pirate1.mp3'
import pirate2 from '../assets/work-click-sounds/pirate2.mp3'
import pirate3 from '../assets/work-click-sounds/pirate3.mp3'
import pirate4 from '../assets/work-click-sounds/pirate4.mp3'
import classicOpeningAudio from '../assets/sounds/openingAudio.mp3'
import kittyOpening from '../assets/opening-intros/kitty.mp3'
import fairyOpening from '../assets/opening-intros/fairy.mp3'
import poltergeistOpening from '../assets/opening-intros/poltergeist.mp3'
import pirateOpening from '../assets/opening-intros/pirate.mp3'
import princessOpening from '../assets/opening-intros/princess.mp3'
import jazzOpening from '../assets/opening-intros/jazz.mp3'
import playroomOpening from '../assets/opening-intros/playtime.mp3'
import starlightOpening from '../assets/opening-intros/starlight.mp3'
import duckOpening from '../assets/opening-intros/duck.mp3'
import woofOpening from '../assets/opening-intros/woof.mp3'
import oceanOpening from '../assets/opening-intros/ocean.mp3'
import princess1 from '../assets/work-click-sounds/princess1.mp3'
import princess2 from '../assets/work-click-sounds/princess2.mp3'
import princess3 from '../assets/work-click-sounds/princess3.mp3'
import princess4 from '../assets/work-click-sounds/princess4.mp3'
import playroom1 from '../assets/work-click-sounds/playroom1.mp3'
import playroom2 from '../assets/work-click-sounds/playroom2.mp3'
import playroom3 from '../assets/work-click-sounds/playroom3.mp3'
import playroom4 from '../assets/work-click-sounds/playroom4.mp3'
import playroom5 from '../assets/work-click-sounds/playroom5.mp3'
import duck1 from '../assets/work-click-sounds/duck1.mp3'
import duck2 from '../assets/work-click-sounds/duck2.mp3'
import duck3 from '../assets/work-click-sounds/duck3.mp3'
import jazz1 from '../assets/work-click-sounds/jazz1.mp3'
import jazz2 from '../assets/work-click-sounds/jazz2.mp3'
import jazz3 from '../assets/work-click-sounds/jazz3.mp3'
import jazz4 from '../assets/work-click-sounds/jazz4.mp3'
import jazz5 from '../assets/work-click-sounds/jazz5.mp3'
import starlight1 from '../assets/work-click-sounds/starlight1.mp3'
import starlight2 from '../assets/work-click-sounds/starlight2.mp3'
import starlight3 from '../assets/work-click-sounds/starlight3.mp3'
import starlight4 from '../assets/work-click-sounds/starlight4.mp3'
import starlight5 from '../assets/work-click-sounds/starlight5.mp3'
import ocean1 from '../assets/work-click-sounds/ocean1.mp3'
import ocean2 from '../assets/work-click-sounds/ocean2.mp3'
import ocean3 from '../assets/work-click-sounds/ocean3.mp3'
import ocean4 from '../assets/work-click-sounds/ocean4.mp3'
import ocean5 from '../assets/work-click-sounds/ocean5.mp3'
import woof1 from '../assets/work-click-sounds/woof1.mp3'
import woof2 from '../assets/work-click-sounds/woof2.mp3'
import woof3 from '../assets/work-click-sounds/woof3.mp3'
import woof4 from '../assets/work-click-sounds/woof4.mp3'
import woof5 from '../assets/work-click-sounds/woof5.mp3'
// Each theme photo ships as two pre-resized files rather than one full-resolution original scaled down by the
// browser: a small one for the Shop's own little cards (shop/, ~480px wide) and a bigger one for the Terminal
// Board's full-bleed, heavily-dimmed background (board/, ~1600px wide) - both already sharp at the size they're
// actually shown at, so the Shop no longer has to download a multi-megabyte photo just to paint a 200px-wide card.
import fairyThemePicShop from '../assets/theme-pics/shop/fairy.jpg'
import fairyThemePicBoard from '../assets/theme-pics/board/fairy.jpg'
import poltergeistThemePicShop from '../assets/theme-pics/shop/poltergeist.jpg'
import poltergeistThemePicBoard from '../assets/theme-pics/board/poltergeist.jpg'
import kittyThemePicShop from '../assets/theme-pics/shop/kitty.jpg'
import kittyThemePicBoard from '../assets/theme-pics/board/kitty.jpg'
import playroomThemePicShop from '../assets/theme-pics/shop/playroom.jpg'
import playroomThemePicBoard from '../assets/theme-pics/board/playroom.jpg'
import starlightThemePicShop from '../assets/theme-pics/shop/starlight.jpg'
import starlightThemePicBoard from '../assets/theme-pics/board/starlight.jpg'
import buccaneerThemePicShop from '../assets/theme-pics/shop/buccaneer.jpg'
import buccaneerThemePicBoard from '../assets/theme-pics/board/buccaneer.jpg'
import jazzThemePicShop from '../assets/theme-pics/shop/jazz.jpg'
import jazzThemePicBoard from '../assets/theme-pics/board/jazz.jpg'
import duckThemePicShop from '../assets/theme-pics/shop/duck.jpg'
import duckThemePicBoard from '../assets/theme-pics/board/duck.jpg'
import princessThemePicShop from '../assets/theme-pics/shop/princess.jpg'
import princessThemePicBoard from '../assets/theme-pics/board/princess.jpg'
import woofThemePicShop from '../assets/theme-pics/shop/woof.jpg'
import woofThemePicBoard from '../assets/theme-pics/board/woof.jpg'
import oceanThemePicShop from '../assets/theme-pics/shop/ocean.jpg'
import oceanThemePicBoard from '../assets/theme-pics/board/ocean.jpg'

// A theme's photo, shown dimmed in the background of every Shop card for that theme (work click, opening audio,
// board/Hyper-Link/general theme, cursor...) and, once its General theme is equipped, as the Terminal Board's own
// background image too (see applyCosmetics() in utils/cosmetics.js) - in front of whatever Board theme the
// player has equipped, since it's the General theme that owns the photo. Keyed by the same id every piece of
// that bundle shares. Add an entry here (both sizes - see the import comment above) as each theme's photo comes
// in - nothing else needs to change.
export const THEME_PICS = {
    fairy: fairyThemePicShop,
    poltergeist: poltergeistThemePicShop,
    kitty: kittyThemePicShop,
    playroom: playroomThemePicShop,
    starlight: starlightThemePicShop,
    buccaneer: buccaneerThemePicShop,
    jazz: jazzThemePicShop,
    duck: duckThemePicShop,
    princess: princessThemePicShop,
    woof: woofThemePicShop,
    ocean: oceanThemePicShop,
}

// The bigger variant of the same photos, used only for the Terminal Board's own background (see applyCosmetics()
// in utils/cosmetics.js) - same keys as THEME_PICS above.
export const THEME_PICS_BOARD = {
    fairy: fairyThemePicBoard,
    poltergeist: poltergeistThemePicBoard,
    kitty: kittyThemePicBoard,
    playroom: playroomThemePicBoard,
    starlight: starlightThemePicBoard,
    buccaneer: buccaneerThemePicBoard,
    jazz: jazzThemePicBoard,
    duck: duckThemePicBoard,
    princess: princessThemePicBoard,
    woof: woofThemePicBoard,
    ocean: oceanThemePicBoard,
}

// The theme id the Shop spotlights in a "Featured" group at the top of every category tab (see ShopModal.jsx) -
// one setting to change for a future promo rather than anything in the component itself. Only meaningful for an
// id that actually has a piece in every category, so the Featured group has something to show on every tab.
export const FEATURED_THEME_ID = 'poltergeist'
// The short line shown under the "★ Featured" heading - left blank for now (no promo/seasonal copy to commit
// to yet). Give it a value alongside FEATURED_THEME_ID when there's a real reason to show, not just a label.
export const FEATURED_TAGLINE = null

export const SHOP_CATEGORIES = [
    { id: 'workSound', name: 'Work sounds', blurb: 'The sound the Work button makes.' },
    { id: 'openingAudio', name: 'Opening audios', blurb: "The sound that plays when you step into the terminal." },
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
        barText:      { cssVar: '--ui-bar-text',       default: '#111',  note: 'terminal name and top-bar readouts (time/rank/balance/reputation) and bottom-tab labels - set this alongside a dark barBg so the text stays readable' },
        barTextMuted: { cssVar: '--ui-bar-text-muted', default: '#666',  note: 'the softer home-city line under the terminal name - set alongside barText for a dark barBg' },
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

// Same shape as workSound (one file, or several to pick a different one from) - reused for Opening audios, the
// sound that plays when you first click through the loading screen and when you finish building your first city.
const openingSound = workSound

// Builds a complete cursor set (default/pointer/grab/grabbing) by recolouring the same shapes the Ocean cursor
// above uses - give it five hex colours and get a full, working cursor theme with no SVG-writing. Every
// bundle's cursor piece below is built this way: a real recolour to start from, not a redrawn shape. Swap in a
// genuinely new shape instead for something more special, or just tweak these five colours.
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

        // PLACEHOLDER - 'supporter' tier: locked until the Supporter's Set DLC exists (see TIERS above)
        workSound('fanfare', 'Fanfare', 0, workClickSound, 'A little flourish on every click. Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above) - reused existing samples as stand-ins. Swap
        // each src for a real themed sample (a meow, a chime, a parrot squawk...) whenever you get to it.
        workSound('kitty', 'Kitty click', 25, [kitty1, kitty2, kitty3, kitty4, kitty5], 'Meows like a cat. Part of the Kitty bundle.'),
        workSound('fairy', 'Fairy click', 25, [fairy1, fairy2, fairy3, fairy4], 'Whimsy, magical sounds. Part of the Fairy bundle.'),
        workSound('poltergeist', 'Poltergeist click', 25, [poltergeist1, poltergeist2, poltergeist3, poltergeist4, poltergeist5], 'Screams galore! Part of the Poltergeist bundle.'),
        workSound('playroom', 'Playroom click', 25, [playroom1, playroom2, playroom3, playroom4, playroom5], 'Like a child\'s xylophone. Part of the Playroom bundle.'),
        workSound('starlight', 'Starlight click', 25, [starlight1, starlight2, starlight3, starlight4, starlight5], 'Zap zap. Part of the Starlight bundle.'),
        workSound('buccaneer', 'Buccaneer click', 25, [pirate1, pirate2, pirate3, pirate4], 'Pirates have taken over the work button! Part of the Buccaneer bundle.'),
        workSound('princess', 'Princess click', 25, [princess1, princess2, princess3, princess4], 'Turn the work button into an elegant harp. Part of the Princess bundle.'),
        workSound('jazz', 'Jazz click', 25, [jazz1, jazz2, jazz3, jazz4, jazz5], 'Smooth saxophone notes. Part of the Jazz bundle.'),
        workSound('duck', 'Duck click', 25, [duck1, duck2, duck3], 'Make the work button quack like a duck! Part of the Duck bundle.'),
        workSound('woof', 'Woof click', 25, [woof1, woof2, woof3, woof4, woof5], 'Now it barks at you! Part of the Woof bundle.'),
        workSound('ocean', 'Ocean click', 25, [ocean1, ocean2, ocean3, ocean4, ocean5], 'Bubbles! Part of the Ocean bundle.'),
    ],
    openingAudio: [
        openingSound('default', 'Classic opening', 0, classicOpeningAudio, 'The original.'),

        // One opening audio per themed bundle, same as the work-click sounds above - added as the real
        // recordings come in, so there's no placeholder list to keep in sync here.
        openingSound('kitty', 'Kitty opening', 25, kittyOpening, 'Part of the Kitty bundle.'),
        openingSound('fairy', 'Fairy opening', 25, fairyOpening, 'Part of the Fairy bundle.'),
        openingSound('poltergeist', 'Poltergeist opening', 25, poltergeistOpening, 'Part of the Poltergeist bundle.'),
        // id matches every other Buccaneer piece ('buccaneer', not 'pirate') so this card picks up the
        // Buccaneer theme photo (THEME_PICS is keyed by id) the same way its other pieces do.
        openingSound('buccaneer', 'Buccaneer opening', 25, pirateOpening, 'Part of the Buccaneer bundle.'),
        openingSound('princess', 'Princess opening', 25, princessOpening, 'Part of the Princess bundle.'),
        openingSound('jazz', 'Jazz opening', 25, jazzOpening, 'Part of the Jazz bundle.'),
        openingSound('playroom', 'Playroom opening', 25, playroomOpening, 'Part of the Playroom bundle.'),
        openingSound('starlight', 'Starlight opening', 25, starlightOpening, 'Part of the Starlight bundle.'),
        openingSound('duck', 'Duck opening', 25, duckOpening, 'Part of the Duck bundle.'),
        openingSound('woof', 'Woof opening', 25, woofOpening, 'Part of the Woof bundle.'),
        openingSound('ocean', 'Ocean opening', 25, oceanOpening, 'Part of the Ocean bundle.'),
    ],

    boardTheme: [
        boardTheme('default', 'Classic board', 0, {}, 'The classic amber-on-black board.'),
        // PLACEHOLDER
        boardTheme('ocean', 'Ocean board', 40, { accent: '#4fc3f7' }, 'Cool blue lettering. Part of the Ocean bundle.'),

        // Moved to 'standard' tier at the user's request (used to be 'special' - a custom background image plus
        // its own hover/click sounds, not just a recoloured accent, which is otherwise what makes something 'special').
        boardTheme('starlight', 'Starlight board', 90, {
            accent: '#c4b5fd',
            bgImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23030712'/%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='14' cy='18' r='1.1' opacity='0.8'/%3E%3Ccircle cx='40' cy='8' r='0.8' opacity='0.5'/%3E%3Ccircle cx='66' cy='26' r='1.3' opacity='0.9'/%3E%3Ccircle cx='92' cy='14' r='0.9' opacity='0.6'/%3E%3Ccircle cx='110' cy='40' r='1.1' opacity='0.7'/%3E%3Ccircle cx='22' cy='52' r='0.9' opacity='0.5'/%3E%3Ccircle cx='54' cy='60' r='1.2' opacity='0.8'/%3E%3Ccircle cx='80' cy='70' r='0.8' opacity='0.5'/%3E%3Ccircle cx='104' cy='84' r='1.3' opacity='0.9'/%3E%3Ccircle cx='10' cy='92' r='1' opacity='0.6'/%3E%3Ccircle cx='36' cy='104' r='0.9' opacity='0.5'/%3E%3Ccircle cx='62' cy='96' r='1.2' opacity='0.8'/%3E%3Ccircle cx='90' cy='110' r='1' opacity='0.6'/%3E%3Ccircle cx='116' cy='100' r='0.9' opacity='0.5'/%3E%3C/g%3E%3C/svg%3E\")",
        }, 'Lilac lettering. Part of the Starlight bundle.', 'standard', { hoverSound: hoverSoundAsset, clickSource: clickSound3 }),

        // PLACEHOLDER - 'supporter' tier
        boardTheme('aurora', 'Aurora', 0, { accent: '#39ffc9' }, 'Shifting aurora colours behind the board. Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above) - plain accent recolours for now. Give any of
        // these a real bgImage (and hoverSound/clickSource) the same way 'starlight' above does when you're
        // ready. The Starlight BUNDLE itself reuses the 'starlight' item above rather than duplicating it.
        boardTheme('kitty', 'Kitty board', 40, { accent: '#ff8fab' }, 'Pink lettering. Part of the Kitty bundle.'),
        boardTheme('fairy', 'Fairy board', 40, { accent: '#b794f6' }, 'Lavender lettering. Part of the Fairy bundle.'),
        boardTheme('poltergeist', 'Poltergeist board', 40, { accent: '#7cff6b' }, 'Sickly green lettering. Part of the Poltergeist bundle.'),
        boardTheme('playroom', 'Playroom board', 40, { accent: '#ffd166' }, 'Crayon-yellow lettering. Part of the Playroom bundle.'),
        boardTheme('buccaneer', 'Buccaneer board', 40, { accent: '#c9972a' }, 'Old-gold lettering. Part of the Buccaneer bundle.'),
        boardTheme('princess', 'Princess board', 40, { accent: '#f0a8d0' }, 'Rose-gold lettering. Part of the Princess bundle.'),
        boardTheme('jazz', 'Jazz board', 40, { accent: '#b8860b' }, 'Smoky goldenrod lettering. Part of the Jazz bundle.'),
        boardTheme('duck', 'Duck board', 40, { accent: '#f9f500' }, 'Sunny-yellow lettering. Part of the Duck bundle.'),
        boardTheme('woof', 'Woof board', 40, { accent: '#4a7fc9' }, 'Denim-blue lettering. Part of the Woof bundle.'),
    ],

    hyperLinkTheme: [
        hyperLinkTheme('default', 'Classic Hyper-Link', 0, {}, 'The classic amber Hyper-Link.'),
        // PLACEHOLDER
        hyperLinkTheme('ocean', 'Ocean Hyper-Link', 40, { accent: '#3b82f6', accentDark: '#2563eb' }, 'Part of the Ocean bundle.'),

        // PLACEHOLDER - 'supporter' tier
        hyperLinkTheme('neon', 'Neon', 0, { accent: '#39ffc9', accentDark: '#00c2a8' }, 'Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above)
        hyperLinkTheme('kitty', 'Kitty Hyper-Link', 40, { accent: '#ff8fab', accentDark: '#e85d87' }, 'Part of the Kitty bundle.'),
        hyperLinkTheme('fairy', 'Fairy Hyper-Link', 40, { accent: '#b794f6', accentDark: '#9061d9' }, 'Part of the Fairy bundle.'),
        hyperLinkTheme('poltergeist', 'Poltergeist Hyper-Link', 40, { accent: '#7cff6b', accentDark: '#4fc43f' }, 'Part of the Poltergeist bundle.'),
        hyperLinkTheme('playroom', 'Playroom Hyper-Link', 40, { accent: '#ff6b6b', accentDark: '#e85252' }, 'Part of the Playroom bundle.'),
        hyperLinkTheme('starlight', 'Starlight Hyper-Link', 40, { accent: '#c4b5fd', accentDark: '#7c6fd1' }, 'Part of the Starlight bundle.'),
        hyperLinkTheme('buccaneer', 'Buccaneer Hyper-Link', 40, { accent: '#c9972a', accentDark: '#a87a1c' }, 'Part of the Buccaneer bundle.'),
        hyperLinkTheme('princess', 'Princess Hyper-Link', 40, { accent: '#f0a8d0', accentDark: '#d4af37' }, 'Part of the Princess bundle.'),
        hyperLinkTheme('jazz', 'Jazz Hyper-Link', 40, { accent: '#b8860b', accentDark: '#8b0000' }, 'Part of the Jazz bundle.'),
        hyperLinkTheme('duck', 'Duck Hyper-Link', 40, { accent: '#f9f500', accentDark: '#e0a800' }, 'Part of the Duck bundle.'),
        hyperLinkTheme('woof', 'Woof Hyper-Link', 40, { accent: '#4a7fc9', accentDark: '#2e5a99' }, 'Part of the Woof bundle.'),
    ],

    generalTheme: [
        generalTheme('default', 'Classic', 0, {}, 'The classic look.'),
        // PLACEHOLDER
        generalTheme('ocean', 'Ocean', 75, {
            barBg: 'rgb(228, 240, 255)', accent: '#3b82f6',
            tickerBg: '#06101c', tickerText: '#4fc3f7',
            departureArc: '#3b82f6', arrivalArc: '#f5a623',
        }, 'Light blue and gold. Part of the Ocean bundle.'),

        // PLACEHOLDER - 'supporter' tier
        generalTheme('prestige', 'Prestige', 0, {
            barBg: 'rgb(20, 18, 14)', barText: '#fbf1d9', barTextMuted: '#c7b989', accent: '#ffd86b',
            tickerBg: '#000000', tickerText: '#ffd86b',
            departureArc: '#ffd86b', arrivalArc: '#c4b5fd',
        }, 'Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above)
        generalTheme('kitty', 'Kitty', 75, {
            barBg: 'rgb(255, 240, 246)', accent: '#ff8fab',
            tickerBg: '#2b0f1a', tickerText: '#ffb6c9',
            departureArc: '#ff8fab', arrivalArc: '#ffd86b',
        }, 'Pink and cream. Part of the Kitty bundle.'),
        generalTheme('fairy', 'Fairy', 75, {
            barBg: 'rgb(243, 235, 255)', accent: '#b794f6',
            tickerBg: '#160f26', tickerText: '#d9c7ff',
            departureArc: '#b794f6', arrivalArc: '#6ee7b7',
        }, 'Lavender and mint. Part of the Fairy bundle.'),
        generalTheme('poltergeist', 'Poltergeist', 75, {
            barBg: 'rgb(18, 20, 18)', barText: '#a8d6a0', barTextMuted: '#a8d6a0', accent: '#9fffb0',
            tickerBg: '#000000', tickerText: '#7cff6b',
            departureArc: '#9fffb0', arrivalArc: '#c4b5fd',
        }, 'Sickly green on near-black. Part of the Poltergeist bundle.'),
        generalTheme('playroom', 'Playroom', 75, {
            barBg: 'rgb(255, 249, 224)', accent: '#ff6b6b',
            tickerBg: '#1a1406', tickerText: '#ffe08a',
            departureArc: '#ffd166', arrivalArc: '#4ecdc4',
        }, 'Crayon-box colours. Part of the Playroom bundle.'),
        generalTheme('starlight', 'Starlight', 75, {
            barBg: 'rgb(10, 10, 20)', barText: '#39ffc9', barTextMuted: '#a79fc9', accent: '#c4b5fd',
            tickerBg: '#000000', tickerText: '#39ffc9',
            departureArc: '#c4b5fd', arrivalArc: '#39ffc9',
        }, 'Indigo and cyan. Part of the Starlight bundle.'),
        generalTheme('buccaneer', 'Buccaneer', 75, {
            barBg: 'rgb(245, 235, 210)', accent: '#c9972a',
            tickerBg: '#1a1206', tickerText: '#e8c468',
            departureArc: '#c9972a', arrivalArc: '#2e8b8b',
        }, 'Old gold and sea teal. Part of the Buccaneer bundle.'),
        generalTheme('princess', 'Princess', 75, {
            barBg: 'rgb(255, 244, 250)', accent: '#f0a8d0',
            tickerBg: '#1a0514', tickerText: '#f6c7e4',
            departureArc: '#f0a8d0', arrivalArc: '#d4af37',
        }, 'Rose and gold. Part of the Princess bundle.'),
        generalTheme('jazz', 'Jazz', 75, {
            barBg: 'rgb(30, 20, 22)', barText: '#e0b25c', barTextMuted: '#e0b25c', accent: '#b8860b',
            tickerBg: '#000000', tickerText: '#e0b25c',
            departureArc: '#b8860b', arrivalArc: '#8b0000',
        }, 'Smoky goldenrod and burgundy. Part of the Jazz bundle.'),
        generalTheme('duck', 'Duck', 75, {
            barBg: 'rgb(255, 248, 224)', accent: '#ffcc33',
            tickerBg: '#1a1506', tickerText: '#f9f500',
            departureArc: '#f9f500', arrivalArc: '#2e8b8b',
        }, 'Sunny yellow and pond teal. Part of the Duck bundle.'),
        generalTheme('woof', 'Woof', 75, {
            barBg: 'rgb(230, 238, 250)', accent: '#4a7fc9',
            tickerBg: '#0d1a2e', tickerText: '#9acd32',
            departureArc: '#4a7fc9', arrivalArc: '#9acd32',
        }, 'Denim blue and tennis-ball green. Part of the Woof bundle.'),
    ],

    cursorTheme: [
        cursorTheme('default', 'Classic cursor', 0, {}, 'The original gold hand and arrow.'),

        // PLACEHOLDER - 'standard' tier: a recolour of the same shapes
        cursorTheme('ocean', 'Ocean cursor', 20, {
            cursorDefault: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2399d6ff'/%3E%3Cstop offset='1' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='%230d1b2e' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default",
            cursorPointer: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%230d1b2e' stroke='%230d1b2e' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cg fill='%234fc3f7'%3E%3Crect x='10' y='2.5' width='5.2' height='15' rx='2.6'/%3E%3Crect x='15' y='10.5' width='4.6' height='9' rx='2.3'/%3E%3Crect x='19.2' y='11.8' width='4.4' height='9' rx='2.2'/%3E%3Crect x='23' y='13.6' width='3.8' height='8.4' rx='1.9'/%3E%3Crect x='8' y='15' width='18.8' height='11.5' rx='5.5'/%3E%3Cellipse cx='8.4' cy='18' rx='2.7' ry='5' transform='rotate(-28 8.4 18)'/%3E%3C/g%3E%3Cpath d='M12.6 5 L12.6 13' stroke='%23e0f4ff' stroke-width='1.2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 13 3, pointer",
            cursorGrab: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%230d1b2e' stroke='%230d1b2e' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cg fill='%234fc3f7'%3E%3Crect x='8.2' y='7' width='4.2' height='14' rx='2.1'/%3E%3Crect x='12.6' y='4.5' width='4.2' height='15' rx='2.1'/%3E%3Crect x='17' y='5.5' width='4.2' height='14' rx='2.1'/%3E%3Crect x='21.4' y='8.5' width='4' height='12' rx='2'/%3E%3Crect x='8' y='14' width='17.4' height='12.5' rx='6'/%3E%3Cellipse cx='7.2' cy='19' rx='2.6' ry='4.6' transform='rotate(-32 7.2 19)'/%3E%3C/g%3E%3Cpath d='M10.3 10 L10.3 15 M14.7 8 L14.7 14 M19.1 9 L19.1 14' stroke='%23e0f4ff' stroke-width='1' stroke-linecap='round' fill='none'/%3E%3C/svg%3E\") 16 16, grab",
            cursorGrabbing: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg fill='%230d1b2e' stroke='%230d1b2e' stroke-width='2.4' stroke-linejoin='round'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3Cg fill='%234fc3f7'%3E%3Crect x='7.5' y='11' width='4.6' height='9' rx='2.3'/%3E%3Crect x='12' y='9.5' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='16.5' y='9.8' width='4.6' height='9.5' rx='2.3'/%3E%3Crect x='21' y='11.5' width='4.4' height='8.5' rx='2.2'/%3E%3Crect x='7.5' y='15' width='17.9' height='11' rx='5.5'/%3E%3Cellipse cx='13' cy='21.5' rx='5.5' ry='2.6'/%3E%3C/g%3E%3C/svg%3E\") 16 16, grabbing",
        }, 'Part of the Ocean bundle.'),

        // PLACEHOLDER - 'supporter' tier (reuses the Ocean shapes recoloured gold, as a stand-in until real art exists)
        cursorTheme('vip', 'VIP', 0, {
            cursorDefault: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23fff3c4'/%3E%3Cstop offset='1' stop-color='%23ffd86b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3.5 2.2 L3.5 19.4 L7.9 15.3 L11 22 L13.7 20.8 L10.6 14.2 L16.6 14.2 Z' fill='url(%23g)' stroke='%232b1a00' stroke-width='1.1' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 2, default",
        }, 'Part of the Supporter’s Set.', 'supporter'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above) - built with recolorCursor(), so each one is a
        // real working recolour already. Give any of them a genuinely new shape later if you want that bundle's
        // cursor to feel more special.
        cursorTheme('kitty', 'Kitty cursor', 20, recolorCursor({ a: '#ffd6e8', b: '#ff8fab', stroke: '#5a1a2e', fill: '#ff8fab', hilite: '#fff0f5' }), 'Part of the Kitty bundle.'),
        cursorTheme('fairy', 'Fairy cursor', 20, recolorCursor({ a: '#e9d8ff', b: '#b794f6', stroke: '#2e1a4d', fill: '#b794f6', hilite: '#f5f0ff' }), 'Part of the Fairy bundle.'),
        cursorTheme('poltergeist', 'Poltergeist cursor', 20, recolorCursor({ a: '#d4ffd0', b: '#5fdb5a', stroke: '#0d140d', fill: '#5fdb5a', hilite: '#eafff0' }), 'Part of the Poltergeist bundle.'),
        cursorTheme('playroom', 'Playroom cursor', 20, recolorCursor({ a: '#fff3b0', b: '#ff6b6b', stroke: '#3a2a05', fill: '#ff6b6b', hilite: '#fffdf0' }), 'Part of the Playroom bundle.'),
        cursorTheme('starlight', 'Starlight cursor', 20, recolorCursor({ a: '#c4b5fd', b: '#39ffc9', stroke: '#05050f', fill: '#8b7cf6', hilite: '#eafff8' }), 'Part of the Starlight bundle.'),
        cursorTheme('buccaneer', 'Buccaneer cursor', 20, recolorCursor({ a: '#ffe6a8', b: '#c9972a', stroke: '#2e1c05', fill: '#c9972a', hilite: '#fff6e0' }), 'Part of the Buccaneer bundle.'),
        cursorTheme('princess', 'Princess cursor', 20, recolorCursor({ a: '#ffe3f0', b: '#f0a8d0', stroke: '#3a0d22', fill: '#f0a8d0', hilite: '#fff5fb' }), 'Part of the Princess bundle.'),
        cursorTheme('jazz', 'Jazz cursor', 20, recolorCursor({ a: '#f0d890', b: '#b8860b', stroke: '#1a0c0c', fill: '#b8860b', hilite: '#fff6dc' }), 'Part of the Jazz bundle.'),
        cursorTheme('duck', 'Duck cursor', 20, recolorCursor({ a: '#fff3c4', b: '#f9f500', stroke: '#1a1506', fill: '#f9f500', hilite: '#fffdf0' }), 'Part of the Duck bundle.'),
        cursorTheme('woof', 'Woof cursor', 20, recolorCursor({ a: '#cfe0f7', b: '#4a7fc9', stroke: '#0d1a2e', fill: '#4a7fc9', hilite: '#f0f6ff' }), 'Part of the Woof bundle.'),
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
    {
        id: 'duck', name: 'Duck', tier: 'special',
        blurb: 'Pond-themed: sunny yellow and teal, a quack on every click.',
        items: { generalTheme: 'duck', boardTheme: 'duck', hyperLinkTheme: 'duck', workSound: 'duck', cursorTheme: 'duck' },
    },
    {
        id: 'woof', name: 'Woof', tier: 'special',
        blurb: 'Dog-themed: denim blue and tennis-ball green, a bark on every click.',
        items: { generalTheme: 'woof', boardTheme: 'woof', hyperLinkTheme: 'woof', workSound: 'woof', cursorTheme: 'woof' },
    },
    {
        id: 'ocean', name: 'Ocean', tier: 'special',
        blurb: 'Sea-themed: deep blue bars, a wave-blue Hyper-Link, a splash on every click.',
        items: { generalTheme: 'ocean', boardTheme: 'ocean', hyperLinkTheme: 'ocean', workSound: 'ocean', cursorTheme: 'ocean' },
    },
]

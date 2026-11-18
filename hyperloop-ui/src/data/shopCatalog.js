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
//     cursorTheme('lime', 'Lime', 20, { cursorDefault: '...', cursorPointer: '...', cursorGrab: '...', cursorGrabbing: '...', cursorHelp: '...' }),
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
//     DLC - its pieces should then be tier:'supporter' themselves, the same locking TIERS already does). The one
//     'standard' bundle is Classic: every piece is the free default, so it is owned and equipped from the start.
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
import rockstarOpening from '../assets/opening-intros/rockstar.mp3'
import westernOpening from '../assets/opening-intros/western.mp3'
import paradiseOpening from '../assets/opening-intros/paradise.mp3'
import wartimeOpening from '../assets/opening-intros/wartime.mp3'
import gingerbreadOpening from '../assets/opening-intros/gingerbread.mp3'
import dystopiaOpening from '../assets/opening-intros/dystopia.mp3'
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
import rockstar1 from '../assets/work-click-sounds/rockstar1.mp3'
import rockstar2 from '../assets/work-click-sounds/rockstar2.mp3'
import rockstar3 from '../assets/work-click-sounds/rockstar3.mp3'
import rockstar4 from '../assets/work-click-sounds/rockstar4.mp3'
import rockstar5 from '../assets/work-click-sounds/rockstar5.mp3'
import rockstar6 from '../assets/work-click-sounds/rockstar6.mp3'
import western1 from '../assets/work-click-sounds/western1.mp3'
import western2 from '../assets/work-click-sounds/western2.mp3'
import western3 from '../assets/work-click-sounds/western3.mp3'
import western4 from '../assets/work-click-sounds/western4.mp3'
import western5 from '../assets/work-click-sounds/western5.mp3'
import paradise1 from '../assets/work-click-sounds/paradise1.mp3'
import paradise2 from '../assets/work-click-sounds/paradise2.mp3'
import paradise3 from '../assets/work-click-sounds/paradise3.mp3'
import paradise4 from '../assets/work-click-sounds/paradise4.mp3'
import paradise5 from '../assets/work-click-sounds/paradise5.mp3'
import wartime1 from '../assets/work-click-sounds/wartime1.mp3'
import wartime2 from '../assets/work-click-sounds/wartime2.mp3'
import wartime3 from '../assets/work-click-sounds/wartime3.mp3'
import wartime4 from '../assets/work-click-sounds/wartime4.mp3'
import wartime5 from '../assets/work-click-sounds/wartime5.mp3'
import wartime7 from '../assets/work-click-sounds/wartime7.mp3'
import gingerbread1 from '../assets/work-click-sounds/gingerbread1.mp3'
import gingerbread2 from '../assets/work-click-sounds/gingerbread2.mp3'
import gingerbread3 from '../assets/work-click-sounds/gingerbread3.mp3'
import gingerbread4 from '../assets/work-click-sounds/gingerbread4.mp3'
import gingerbread5 from '../assets/work-click-sounds/gingerbread5.mp3'
import dystopia1 from '../assets/work-click-sounds/dystopia1.mp3'
import dystopia2 from '../assets/work-click-sounds/dystopia2.mp3'
import dystopia3 from '../assets/work-click-sounds/dystopia3.mp3'
import dystopia4 from '../assets/work-click-sounds/dystopia4.mp3'
import dystopia5 from '../assets/work-click-sounds/dystopia5.mp3'
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
import rockstarThemePicShop from '../assets/theme-pics/shop/rockstar.jpg'
import rockstarThemePicBoard from '../assets/theme-pics/board/rockstar.jpg'
import westernThemePicShop from '../assets/theme-pics/shop/western.jpg'
import westernThemePicBoard from '../assets/theme-pics/board/western.jpg'
import paradiseThemePicShop from '../assets/theme-pics/shop/paradise.jpg'
import paradiseThemePicBoard from '../assets/theme-pics/board/paradise.jpg'
import wartimeThemePicShop from '../assets/theme-pics/shop/wartime.jpg'
import wartimeThemePicBoard from '../assets/theme-pics/board/wartime.jpg'
import gingerbreadThemePicShop from '../assets/theme-pics/shop/gingerbread.jpg'
import gingerbreadThemePicBoard from '../assets/theme-pics/board/gingerbread.jpg'
import dystopiaThemePicShop from '../assets/theme-pics/shop/dystopia.jpg'
import dystopiaThemePicBoard from '../assets/theme-pics/board/dystopia.jpg'

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
    rockstar: rockstarThemePicShop,
    western: westernThemePicShop,
    paradise: paradiseThemePicShop,
    wartime: wartimeThemePicShop,
    gingerbread: gingerbreadThemePicShop,
    dystopia: dystopiaThemePicShop,
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
    rockstar: rockstarThemePicBoard,
    western: westernThemePicBoard,
    paradise: paradiseThemePicBoard,
    wartime: wartimeThemePicBoard,
    gingerbread: gingerbreadThemePicBoard,
    dystopia: dystopiaThemePicBoard,
}

// The theme id the Shop spotlights in a "Featured" group at the top of every category tab (see ShopModal.jsx) -
// one setting to change for a future promo rather than anything in the component itself. Only meaningful for an
// id that actually has a piece in every category, so the Featured group has something to show on every tab.
// null means no Featured group is shown at all. Poltergeist was here for Halloween; that's passed. Gingerbread
// (fully built out - all six categories plus its own bundle) is the Christmas one this was left waiting for.
export const FEATURED_THEME_ID = 'gingerbread'
// The short line shown under the "★ Featured" heading.
export const FEATURED_TAGLINE = 'Deck your terminal for the holidays! 🎄'

// Listed alphabetically by name, so the sidebar order matches what the player reads top to bottom -
// Bundles is appended separately in ShopModal and stays last, since it isn't really a category of its own.
export const SHOP_CATEGORIES = [
    { id: 'boardTheme', name: 'Board themes', blurb: 'The look of the Terminal Board.' },
    { id: 'cursorTheme', name: 'Cursors', blurb: 'The pointer, arrow and drag cursors.' },
    { id: 'generalTheme', name: 'General themes', blurb: 'The top and bottom bars, ticker, Work button and route colours.' },
    { id: 'hyperLinkTheme', name: 'Hyper-Link themes', blurb: 'The look of the Hyper-Link phone.' },
    { id: 'openingAudio', name: 'Opening audios', blurb: "The sound that plays when you step into the terminal." },
    { id: 'workSound', name: 'Work sounds', blurb: 'The sound the Work button makes.' },
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
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffd86b'/%3E%3Cstop offset='1' stop-color='%23f5a623'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M1.7 1.0 L1.7 1.0 L1.6 1.1 L1.4 1.1 L1.2 1.3 L1.1 1.5 L1.1 1.6 L1.0 1.6 L1.0 1.7 L1.0 1.8 L1.0 18.6 L1.0 18.8 L1.0 18.8 L1.1 19.0 L1.2 19.1 L1.4 19.3 L1.5 19.3 L1.6 19.3 L1.7 19.4 L1.8 19.4 L2.0 19.4 L2.2 19.4 L2.4 19.3 L2.5 19.2 L2.7 19.0 L3.2 18.6 L3.4 18.4 L3.5 18.3 L5.5 16.5 L5.6 16.5 L5.6 16.6 L5.6 16.7 L5.7 16.8 L5.7 16.8 L5.7 16.9 L5.7 16.9 L5.8 17.0 L5.8 17.0 L5.8 17.1 L5.8 17.1 L5.9 17.2 L5.9 17.2 L6.0 17.6 L6.0 17.6 L6.1 17.7 L6.1 17.7 L6.1 17.8 L6.1 17.8 L6.2 17.9 L6.2 17.9 L6.2 18.1 L6.2 18.1 L6.3 18.2 L6.3 18.2 L6.4 18.4 L6.4 18.4 L6.4 18.5 L6.5 18.6 L6.5 18.7 L6.5 18.7 L6.6 18.9 L6.6 19.1 L6.7 19.1 L6.7 19.2 L6.8 19.3 L6.8 19.3 L6.8 19.5 L6.8 19.5 L6.9 19.6 L6.9 19.7 L6.9 19.7 L6.9 19.7 L7.0 19.8 L7.0 19.9 L7.1 20.0 L7.1 20.0 L7.1 20.1 L7.1 20.2 L7.1 20.2 L7.1 20.2 L7.2 20.3 L7.2 20.4 L7.3 20.5 L7.3 20.6 L7.3 20.6 L7.3 20.7 L7.4 20.8 L7.5 21.0 L7.5 21.0 L7.5 21.1 L7.5 21.1 L7.5 21.2 L7.6 21.2 L7.6 21.4 L7.7 21.4 L7.7 21.5 L7.7 21.5 L7.7 21.6 L7.7 21.6 L7.7 21.7 L7.8 21.9 L7.8 21.9 L7.9 22.1 L7.9 22.1 L8.0 22.3 L8.0 22.3 L8.2 22.7 L8.3 22.8 L8.5 23.0 L8.6 23.0 L8.6 23.0 L8.9 23.0 L8.9 23.0 L9.0 23.0 L9.1 22.9 L9.1 22.9 L9.3 22.8 L9.3 22.8 L9.5 22.7 L9.5 22.7 L9.6 22.7 L9.6 22.7 L9.8 22.6 L9.9 22.6 L10.0 22.5 L10.0 22.5 L10.1 22.5 L10.1 22.5 L10.5 22.3 L10.5 22.3 L10.6 22.3 L10.6 22.3 L10.7 22.2 L10.9 22.1 L11.0 22.1 L11.0 22.1 L11.1 22.1 L11.1 22.1 L12.0 21.7 L12.1 21.5 L12.2 21.4 L12.3 21.3 L12.3 21.3 L12.3 21.2 L12.3 21.2 L12.3 21.0 L12.2 20.8 L12.2 20.8 L12.2 20.6 L12.1 20.6 L12.1 20.5 L12.1 20.4 L12.1 20.4 L12.0 20.3 L12.0 20.2 L12.0 20.1 L12.0 20.1 L11.9 20.0 L11.9 20.0 L11.9 20.0 L11.8 19.8 L11.8 19.8 L11.8 19.7 L11.7 19.5 L11.7 19.5 L11.6 19.3 L11.6 19.3 L11.6 19.2 L11.6 19.2 L11.5 19.1 L11.5 19.1 L11.5 19.0 L11.5 19.0 L11.4 18.8 L11.4 18.8 L11.3 18.7 L11.3 18.7 L11.3 18.6 L11.3 18.6 L11.3 18.5 L11.3 18.5 L11.2 18.3 L11.2 18.3 L11.1 18.1 L11.1 18.1 L11.1 18.0 L11.0 18.0 L11.0 17.9 L11.0 17.9 L11.0 17.8 L11.0 17.8 L10.9 17.7 L10.9 17.7 L10.8 17.5 L10.8 17.5 L10.8 17.4 L10.8 17.4 L10.7 17.2 L10.7 17.0 L10.6 17.0 L10.6 16.9 L10.6 16.9 L10.6 16.8 L10.5 16.8 L10.5 16.6 L10.4 16.6 L10.4 16.5 L10.4 16.4 L10.3 16.2 L10.3 16.2 L10.3 16.1 L10.2 16.1 L10.2 16.0 L10.2 16.0 L10.2 15.9 L10.1 15.8 L10.1 15.7 L10.0 15.6 L10.0 15.5 L9.9 15.3 L9.9 15.3 L9.9 15.3 L9.9 15.2 L9.8 15.0 L9.8 14.9 L13.8 14.9 L14.0 14.9 L14.3 14.8 L14.4 14.7 L14.5 14.6 L14.6 14.4 L14.7 14.3 L14.7 14.1 L14.7 13.9 L14.7 13.7 L14.6 13.6 L14.4 13.3 L2.5 1.2 L2.3 1.1 L2.2 1.0 L2.1 1.0 L2.1 1.0Z' fill='url(%23g)'/%3E%3Cpath d='M1.7 1.0 L1.7 1.0 L1.6 1.1 L1.4 1.1 L1.2 1.3 L1.1 1.5 L1.1 1.6 L1.0 1.6 L1.0 1.7 L1.0 1.8 L1.0 18.6 L1.0 18.8 L1.0 18.8 L1.1 19.0 L1.2 19.1 L1.4 19.3 L1.5 19.3 L1.6 19.3 L1.7 19.4 L1.8 19.4 L2.0 19.4 L2.2 19.4 L2.4 19.3 L2.5 19.2 L2.7 19.0 L3.2 18.6 L3.4 18.4 L3.5 18.3 L5.5 16.5 L5.6 16.5 L5.6 16.6 L5.6 16.7 L5.7 16.8 L5.7 16.8 L5.7 16.9 L5.7 16.9 L5.8 17.0 L5.8 17.0 L5.8 17.1 L5.8 17.1 L5.9 17.2 L5.9 17.2 L6.0 17.6 L6.0 17.6 L6.1 17.7 L6.1 17.7 L6.1 17.8 L6.1 17.8 L6.2 17.9 L6.2 17.9 L6.2 18.1 L6.2 18.1 L6.3 18.2 L6.3 18.2 L6.4 18.4 L6.4 18.4 L6.4 18.5 L6.5 18.6 L6.5 18.7 L6.5 18.7 L6.6 18.9 L6.6 19.1 L6.7 19.1 L6.7 19.2 L6.8 19.3 L6.8 19.3 L6.8 19.5 L6.8 19.5 L6.9 19.6 L6.9 19.7 L6.9 19.7 L6.9 19.7 L7.0 19.8 L7.0 19.9 L7.1 20.0 L7.1 20.0 L7.1 20.1 L7.1 20.2 L7.1 20.2 L7.1 20.2 L7.2 20.3 L7.2 20.4 L7.3 20.5 L7.3 20.6 L7.3 20.6 L7.3 20.7 L7.4 20.8 L7.5 21.0 L7.5 21.0 L7.5 21.1 L7.5 21.1 L7.5 21.2 L7.6 21.2 L7.6 21.4 L7.7 21.4 L7.7 21.5 L7.7 21.5 L7.7 21.6 L7.7 21.6 L7.7 21.7 L7.8 21.9 L7.8 21.9 L7.9 22.1 L7.9 22.1 L8.0 22.3 L8.0 22.3 L8.2 22.7 L8.3 22.8 L8.5 23.0 L8.6 23.0 L8.6 23.0 L8.9 23.0 L8.9 23.0 L9.0 23.0 L9.1 22.9 L9.1 22.9 L9.3 22.8 L9.3 22.8 L9.5 22.7 L9.5 22.7 L9.6 22.7 L9.6 22.7 L9.8 22.6 L9.9 22.6 L10.0 22.5 L10.0 22.5 L10.1 22.5 L10.1 22.5 L10.5 22.3 L10.5 22.3 L10.6 22.3 L10.6 22.3 L10.7 22.2 L10.9 22.1 L11.0 22.1 L11.0 22.1 L11.1 22.1 L11.1 22.1 L12.0 21.7 L12.1 21.5 L12.2 21.4 L12.3 21.3 L12.3 21.3 L12.3 21.2 L12.3 21.2 L12.3 21.0 L12.2 20.8 L12.2 20.8 L12.2 20.6 L12.1 20.6 L12.1 20.5 L12.1 20.4 L12.1 20.4 L12.0 20.3 L12.0 20.2 L12.0 20.1 L12.0 20.1 L11.9 20.0 L11.9 20.0 L11.9 20.0 L11.8 19.8 L11.8 19.8 L11.8 19.7 L11.7 19.5 L11.7 19.5 L11.6 19.3 L11.6 19.3 L11.6 19.2 L11.6 19.2 L11.5 19.1 L11.5 19.1 L11.5 19.0 L11.5 19.0 L11.4 18.8 L11.4 18.8 L11.3 18.7 L11.3 18.7 L11.3 18.6 L11.3 18.6 L11.3 18.5 L11.3 18.5 L11.2 18.3 L11.2 18.3 L11.1 18.1 L11.1 18.1 L11.1 18.0 L11.0 18.0 L11.0 17.9 L11.0 17.9 L11.0 17.8 L11.0 17.8 L10.9 17.7 L10.9 17.7 L10.8 17.5 L10.8 17.5 L10.8 17.4 L10.8 17.4 L10.7 17.2 L10.7 17.0 L10.6 17.0 L10.6 16.9 L10.6 16.9 L10.6 16.8 L10.5 16.8 L10.5 16.6 L10.4 16.6 L10.4 16.5 L10.4 16.4 L10.3 16.2 L10.3 16.2 L10.3 16.1 L10.2 16.1 L10.2 16.0 L10.2 16.0 L10.2 15.9 L10.1 15.8 L10.1 15.7 L10.0 15.6 L10.0 15.5 L9.9 15.3 L9.9 15.3 L9.9 15.3 L9.9 15.2 L9.8 15.0 L9.8 14.9 L13.8 14.9 L14.0 14.9 L14.3 14.8 L14.4 14.7 L14.5 14.6 L14.6 14.4 L14.7 14.3 L14.7 14.1 L14.7 13.9 L14.7 13.7 L14.6 13.6 L14.4 13.3 L2.5 1.2 L2.3 1.1 L2.2 1.0 L2.1 1.0 L2.1 1.0ZM2.4 3.1 L12.7 13.5 L12.7 13.6 L8.6 13.6 L8.5 13.6 L8.3 13.7 L8.2 13.8 L8.1 14.0 L8.1 14.1 L8.1 14.3 L8.1 14.5 L8.2 14.8 L8.2 14.8 L8.3 14.9 L8.3 15.0 L8.4 15.1 L8.4 15.1 L8.4 15.3 L8.5 15.4 L8.5 15.5 L8.5 15.5 L8.6 15.6 L8.6 15.6 L8.6 15.7 L8.7 15.8 L8.7 15.9 L8.7 15.9 L8.7 16.0 L8.7 16.1 L8.8 16.1 L8.8 16.1 L8.8 16.2 L8.8 16.3 L8.9 16.3 L8.9 16.4 L9.0 16.5 L9.0 16.5 L9.0 16.7 L9.0 16.7 L9.1 16.8 L9.1 16.9 L9.1 16.9 L9.1 16.9 L9.2 17.0 L9.2 17.1 L9.2 17.2 L9.3 17.3 L9.5 17.7 L9.5 17.8 L9.5 17.8 L9.5 17.9 L9.6 17.9 L9.6 18.0 L9.6 18.0 L9.6 18.1 L9.6 18.1 L9.6 18.2 L9.7 18.2 L9.7 18.3 L9.7 18.3 L9.7 18.4 L9.8 18.6 L9.8 18.6 L10.1 19.2 L10.1 19.2 L10.1 19.3 L10.1 19.3 L10.2 19.5 L10.2 19.5 L10.3 19.6 L10.3 19.8 L10.4 19.9 L10.4 19.9 L10.4 20.0 L10.4 20.0 L10.5 20.1 L10.5 20.1 L10.5 20.3 L10.5 20.3 L10.6 20.4 L10.6 20.4 L10.6 20.5 L10.6 20.5 L10.7 20.6 L10.7 20.6 L10.7 20.7 L10.7 20.7 L10.7 20.7 L10.6 20.8 L10.6 20.8 L10.4 20.9 L10.4 20.9 L10.2 20.9 L10.2 20.9 L10.1 21.0 L10.1 21.0 L10.0 21.1 L9.9 21.1 L9.7 21.2 L9.7 21.2 L9.6 21.2 L9.6 21.2 L9.6 21.2 L9.3 21.3 L9.2 21.4 L9.2 21.4 L9.2 21.4 L9.1 21.4 L9.1 21.3 L9.1 21.3 L9.0 21.1 L8.9 20.9 L8.9 20.9 L8.9 20.9 L8.9 20.8 L8.9 20.8 L8.8 20.7 L8.8 20.7 L8.7 20.5 L8.7 20.5 L8.7 20.4 L8.7 20.3 L8.6 20.3 L8.6 20.2 L8.6 20.2 L8.6 20.1 L8.5 20.0 L8.5 19.9 L8.5 19.9 L8.5 19.8 L8.4 19.8 L8.4 19.7 L8.4 19.7 L8.4 19.6 L8.3 19.5 L8.3 19.4 L8.0 18.9 L8.0 18.8 L8.0 18.8 L8.0 18.6 L7.9 18.6 L7.9 18.5 L7.9 18.4 L7.9 18.4 L7.8 18.4 L7.8 18.2 L7.7 18.1 L7.7 18.1 L7.7 17.9 L7.7 17.9 L7.6 17.7 L7.6 17.7 L7.5 17.5 L7.5 17.5 L7.4 17.3 L7.4 17.3 L7.4 17.3 L7.4 17.2 L7.3 17.1 L7.3 17.1 L7.3 17.0 L7.3 17.0 L7.2 16.9 L7.2 16.9 L7.1 16.7 L7.1 16.7 L7.1 16.6 L7.1 16.6 L7.0 16.4 L7.0 16.3 L6.9 16.2 L6.9 16.2 L6.9 16.1 L6.9 16.1 L6.8 16.0 L6.8 15.9 L6.7 15.8 L6.7 15.8 L6.7 15.6 L6.7 15.6 L6.6 15.4 L6.6 15.4 L6.5 15.3 L6.4 15.1 L6.3 14.9 L6.2 14.8 L6.0 14.7 L5.9 14.7 L5.7 14.7 L5.4 14.8 L2.4 17.4 L2.4 17.5 L2.4 17.4 L2.4 3.1Z' fill='%232b1a00' fill-rule='evenodd'/%3E%3C/svg%3E\") 1 1, default" },
        cursorPointer:  { cssVar: '--cursor-pointer',  note: 'over anything clickable',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffd86b'/%3E%3Cstop offset='1' stop-color='%23f5a623'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M10.1 1.2 L9.7 1.4 L9.6 1.5 L9.5 1.5 L9.1 1.8 L8.8 2.1 L8.8 2.2 L8.7 2.3 L8.7 2.3 L8.5 2.5 L8.4 2.8 L8.4 2.8 L8.4 2.9 L8.2 3.3 L8.2 3.4 L8.2 3.7 L8.2 16.5 L8.1 16.5 L7.5 16.1 L7.4 16.1 L7.3 16.0 L7.2 15.9 L6.6 15.5 L6.5 15.5 L6.4 15.4 L6.2 15.3 L6.1 15.2 L6.1 15.2 L5.9 15.1 L5.9 15.1 L5.6 14.9 L5.6 14.9 L5.4 14.8 L5.4 14.8 L5.3 14.7 L5.1 14.6 L4.5 14.4 L4.4 14.4 L4.2 14.4 L3.7 14.4 L3.5 14.4 L3.3 14.4 L3.2 14.5 L3.1 14.5 L3.0 14.5 L2.9 14.5 L2.8 14.6 L2.8 14.6 L2.7 14.7 L2.5 14.7 L2.1 15.0 L1.7 15.5 L1.4 15.8 L1.4 15.8 L1.4 15.8 L1.3 16.1 L1.1 16.6 L1.1 16.6 L1.0 16.9 L1.0 17.2 L1.0 17.2 L1.0 17.8 L1.1 18.0 L1.1 18.1 L1.1 18.1 L1.1 18.2 L1.2 18.3 L1.2 18.4 L1.3 18.5 L1.3 18.5 L1.3 18.7 L1.6 19.0 L1.6 19.1 L1.6 19.1 L1.7 19.2 L1.7 19.3 L2.2 20.1 L2.3 20.3 L2.3 20.3 L2.7 20.8 L2.7 21.0 L2.8 21.0 L2.8 21.0 L2.8 21.1 L2.9 21.2 L3.3 21.8 L3.3 21.8 L3.4 22.0 L3.4 22.0 L3.4 22.0 L3.4 22.1 L3.5 22.2 L3.8 22.7 L3.8 22.8 L4.0 23.0 L4.0 23.0 L4.4 23.6 L4.4 23.7 L4.4 23.7 L4.5 23.8 L4.5 23.8 L4.6 24.0 L4.6 24.0 L4.6 24.0 L4.9 24.5 L5.0 24.5 L5.0 24.6 L5.1 24.7 L5.1 24.8 L5.4 25.3 L5.4 25.3 L5.5 25.5 L5.5 25.5 L5.6 25.6 L5.6 25.6 L5.7 25.7 L6.0 26.3 L6.0 26.3 L6.2 26.5 L6.2 26.6 L7.3 28.3 L7.7 28.8 L8.2 29.4 L8.7 29.8 L9.2 30.1 L9.3 30.1 L9.4 30.2 L9.8 30.4 L9.8 30.4 L10.0 30.5 L10.2 30.6 L10.3 30.6 L10.4 30.6 L10.5 30.7 L10.6 30.7 L10.7 30.8 L10.8 30.8 L10.9 30.8 L11.1 30.8 L11.2 30.9 L11.3 30.9 L11.5 30.9 L11.8 31.0 L11.8 31.0 L11.9 31.0 L20.1 31.0 L20.2 31.0 L20.5 30.9 L20.7 30.9 L20.8 30.9 L21.0 30.8 L21.2 30.8 L21.2 30.8 L21.3 30.8 L21.4 30.7 L21.5 30.7 L21.6 30.7 L21.7 30.6 L21.9 30.5 L22.0 30.5 L22.5 30.3 L22.9 30.0 L22.9 30.0 L23.0 30.0 L23.1 29.9 L23.1 29.9 L23.7 29.4 L24.3 28.8 L24.7 28.3 L24.9 28.1 L24.9 27.9 L25.0 27.8 L25.0 27.8 L25.0 27.7 L25.2 27.4 L25.3 27.3 L25.3 27.2 L25.4 27.0 L25.6 26.2 L25.8 25.5 L25.8 25.0 L25.8 25.0 L25.8 14.3 L25.7 13.8 L25.7 13.7 L25.7 13.6 L25.6 13.4 L25.6 13.4 L25.6 13.2 L25.4 12.9 L25.2 12.6 L24.8 12.2 L24.6 12.0 L24.3 11.8 L23.9 11.6 L23.5 11.5 L23.3 11.5 L23.2 11.4 L22.7 11.4 L22.7 11.4 L22.5 11.4 L22.4 11.5 L22.3 11.5 L22.1 11.5 L22.0 11.6 L21.9 11.6 L21.8 11.6 L21.8 11.7 L21.7 11.7 L21.6 11.7 L21.6 11.7 L21.2 11.2 L20.8 10.8 L20.6 10.7 L20.4 10.5 L20.1 10.4 L20.1 10.4 L20.0 10.3 L19.6 10.2 L19.4 10.2 L19.3 10.1 L18.6 10.1 L18.4 10.2 L18.3 10.2 L18.1 10.3 L18.1 10.3 L17.8 10.4 L17.7 10.4 L17.6 10.4 L17.4 10.0 L17.0 9.6 L16.6 9.3 L16.1 9.0 L16.1 9.0 L16.0 9.0 L15.9 9.0 L15.7 8.9 L15.7 8.9 L15.5 8.9 L15.3 8.9 L15.3 8.8 L14.6 8.9 L14.1 9.0 L14.0 8.9 L14.0 3.6 L14.0 3.4 L14.0 3.3 L13.9 3.1 L13.9 3.1 L13.9 3.0 L13.8 2.7 L13.7 2.5 L13.4 2.1 L13.0 1.7 L12.7 1.5 L12.7 1.5 L12.6 1.4 L12.3 1.2 L12.2 1.2 L12.1 1.2 L12.0 1.2 L12.0 1.1 L11.9 1.1 L11.7 1.1 L11.5 1.0 L11.5 1.0 L11.5 1.0 L10.7 1.0 L10.7 1.0 L10.5 1.1Z' fill='%23ffb81c'/%3E%3Cpath d='M10.1 1.2 L9.7 1.4 L9.6 1.5 L9.5 1.5 L9.1 1.8 L8.8 2.1 L8.8 2.2 L8.7 2.3 L8.7 2.3 L8.5 2.5 L8.4 2.8 L8.4 2.8 L8.4 2.9 L8.2 3.3 L8.2 3.4 L8.2 3.7 L8.2 16.5 L8.1 16.5 L7.5 16.1 L7.4 16.1 L7.3 16.0 L7.2 15.9 L6.6 15.5 L6.5 15.5 L6.4 15.4 L6.2 15.3 L6.1 15.2 L6.1 15.2 L5.9 15.1 L5.9 15.1 L5.6 14.9 L5.6 14.9 L5.4 14.8 L5.4 14.8 L5.3 14.7 L5.1 14.6 L4.5 14.4 L4.4 14.4 L4.2 14.4 L3.7 14.4 L3.5 14.4 L3.3 14.4 L3.2 14.5 L3.1 14.5 L3.0 14.5 L2.9 14.5 L2.8 14.6 L2.8 14.6 L2.7 14.7 L2.5 14.7 L2.1 15.0 L1.7 15.5 L1.4 15.8 L1.4 15.8 L1.4 15.8 L1.3 16.1 L1.1 16.6 L1.1 16.6 L1.0 16.9 L1.0 17.2 L1.0 17.2 L1.0 17.8 L1.1 18.0 L1.1 18.1 L1.1 18.1 L1.1 18.2 L1.2 18.3 L1.2 18.4 L1.3 18.5 L1.3 18.5 L1.3 18.7 L1.6 19.0 L1.6 19.1 L1.6 19.1 L1.7 19.2 L1.7 19.3 L2.2 20.1 L2.3 20.3 L2.3 20.3 L2.7 20.8 L2.7 21.0 L2.8 21.0 L2.8 21.0 L2.8 21.1 L2.9 21.2 L3.3 21.8 L3.3 21.8 L3.4 22.0 L3.4 22.0 L3.4 22.0 L3.4 22.1 L3.5 22.2 L3.8 22.7 L3.8 22.8 L4.0 23.0 L4.0 23.0 L4.4 23.6 L4.4 23.7 L4.4 23.7 L4.5 23.8 L4.5 23.8 L4.6 24.0 L4.6 24.0 L4.6 24.0 L4.9 24.5 L5.0 24.5 L5.0 24.6 L5.1 24.7 L5.1 24.8 L5.4 25.3 L5.4 25.3 L5.5 25.5 L5.5 25.5 L5.6 25.6 L5.6 25.6 L5.7 25.7 L6.0 26.3 L6.0 26.3 L6.2 26.5 L6.2 26.6 L7.3 28.3 L7.7 28.8 L8.2 29.4 L8.7 29.8 L9.2 30.1 L9.3 30.1 L9.4 30.2 L9.8 30.4 L9.8 30.4 L10.0 30.5 L10.2 30.6 L10.3 30.6 L10.4 30.6 L10.5 30.7 L10.6 30.7 L10.7 30.8 L10.8 30.8 L10.9 30.8 L11.1 30.8 L11.2 30.9 L11.3 30.9 L11.5 30.9 L11.8 31.0 L11.8 31.0 L11.9 31.0 L20.1 31.0 L20.2 31.0 L20.5 30.9 L20.7 30.9 L20.8 30.9 L21.0 30.8 L21.2 30.8 L21.2 30.8 L21.3 30.8 L21.4 30.7 L21.5 30.7 L21.6 30.7 L21.7 30.6 L21.9 30.5 L22.0 30.5 L22.5 30.3 L22.9 30.0 L22.9 30.0 L23.0 30.0 L23.1 29.9 L23.1 29.9 L23.7 29.4 L24.3 28.8 L24.7 28.3 L24.9 28.1 L24.9 27.9 L25.0 27.8 L25.0 27.8 L25.0 27.7 L25.2 27.4 L25.3 27.3 L25.3 27.2 L25.4 27.0 L25.6 26.2 L25.8 25.5 L25.8 25.0 L25.8 25.0 L25.8 14.3 L25.7 13.8 L25.7 13.7 L25.7 13.6 L25.6 13.4 L25.6 13.4 L25.6 13.2 L25.4 12.9 L25.2 12.6 L24.8 12.2 L24.6 12.0 L24.3 11.8 L23.9 11.6 L23.5 11.5 L23.3 11.5 L23.2 11.4 L22.7 11.4 L22.7 11.4 L22.5 11.4 L22.4 11.5 L22.3 11.5 L22.1 11.5 L22.0 11.6 L21.9 11.6 L21.8 11.6 L21.8 11.7 L21.7 11.7 L21.6 11.7 L21.6 11.7 L21.2 11.2 L20.8 10.8 L20.6 10.7 L20.4 10.5 L20.1 10.4 L20.1 10.4 L20.0 10.3 L19.6 10.2 L19.4 10.2 L19.3 10.1 L18.6 10.1 L18.4 10.2 L18.3 10.2 L18.1 10.3 L18.1 10.3 L17.8 10.4 L17.7 10.4 L17.6 10.4 L17.4 10.0 L17.0 9.6 L16.6 9.3 L16.1 9.0 L16.1 9.0 L16.0 9.0 L15.9 9.0 L15.7 8.9 L15.7 8.9 L15.5 8.9 L15.3 8.9 L15.3 8.8 L14.6 8.9 L14.1 9.0 L14.0 8.9 L14.0 3.6 L14.0 3.4 L14.0 3.3 L13.9 3.1 L13.9 3.1 L13.9 3.0 L13.8 2.7 L13.7 2.5 L13.4 2.1 L13.0 1.7 L12.7 1.5 L12.7 1.5 L12.6 1.4 L12.3 1.2 L12.2 1.2 L12.1 1.2 L12.0 1.2 L12.0 1.1 L11.9 1.1 L11.7 1.1 L11.5 1.0 L11.5 1.0 L11.5 1.0 L10.7 1.0 L10.7 1.0 L10.5 1.1ZM10.7 3.0 L10.8 3.0 L11.1 2.9 L11.4 3.0 L11.6 3.1 L11.8 3.2 L11.9 3.4 L12.0 3.6 L12.1 3.8 L12.1 11.7 L12.1 11.7 L12.1 11.8 L12.1 17.1 L12.1 17.2 L12.2 17.3 L12.2 17.4 L12.2 17.5 L12.4 17.7 L12.5 17.8 L12.8 17.9 L12.9 17.9 L13.3 17.9 L13.4 17.9 L13.5 17.9 L13.7 17.8 L13.8 17.6 L14.0 17.4 L14.0 17.2 L14.0 11.8 L14.0 11.8 L14.0 11.6 L14.1 11.4 L14.1 11.3 L14.1 11.3 L14.3 11.1 L14.5 11.0 L14.7 10.8 L14.9 10.8 L15.2 10.8 L15.4 10.8 L15.6 11.0 L15.8 11.2 L15.9 11.3 L15.9 11.4 L16.0 11.5 L16.0 11.6 L16.0 11.7 L16.0 12.8 L16.0 12.8 L16.0 17.0 L16.0 17.2 L16.1 17.4 L16.3 17.6 L16.4 17.8 L16.7 17.9 L17.1 17.9 L17.2 17.9 L17.4 17.9 L17.7 17.7 L17.8 17.5 L17.9 17.3 L18.0 17.1 L18.0 12.9 L18.0 12.7 L18.1 12.5 L18.3 12.3 L18.5 12.2 L18.6 12.1 L18.8 12.1 L19.1 12.1 L19.1 12.1 L19.3 12.1 L19.4 12.2 L19.6 12.3 L19.7 12.5 L19.8 12.7 L19.8 12.7 L19.9 12.8 L19.9 13.0 L19.9 14.0 L19.9 14.1 L19.9 17.1 L20.0 17.3 L20.0 17.4 L20.0 17.4 L20.2 17.6 L20.4 17.8 L20.6 17.9 L20.8 17.9 L21.0 17.9 L21.1 17.9 L21.3 17.9 L21.5 17.8 L21.6 17.6 L21.8 17.4 L21.8 17.3 L21.8 17.2 L21.9 17.1 L21.9 14.1 L21.9 14.0 L21.9 14.0 L22.1 13.8 L22.2 13.7 L22.4 13.5 L22.5 13.5 L22.6 13.4 L22.7 13.4 L22.7 13.4 L23.0 13.4 L23.0 13.4 L23.1 13.4 L23.4 13.5 L23.7 13.8 L23.8 14.0 L23.8 14.2 L23.8 25.2 L23.8 25.5 L23.8 25.6 L23.7 25.8 L23.7 25.9 L23.7 26.0 L23.7 26.1 L23.6 26.2 L23.6 26.2 L23.6 26.3 L23.5 26.4 L23.5 26.5 L23.5 26.5 L23.2 27.1 L22.9 27.4 L22.6 27.8 L22.1 28.2 L21.6 28.5 L21.2 28.7 L21.2 28.7 L21.1 28.8 L20.5 29.0 L20.4 29.0 L20.2 29.0 L19.7 29.1 L19.6 29.1 L12.4 29.1 L12.3 29.1 L11.8 29.0 L11.2 28.9 L10.7 28.7 L10.3 28.5 L9.9 28.3 L9.5 27.9 L9.2 27.7 L8.9 27.3 L8.7 26.9 L8.7 26.9 L8.3 26.3 L8.3 26.3 L8.3 26.2 L8.2 26.2 L8.2 26.1 L8.1 26.0 L8.1 25.9 L7.8 25.4 L7.8 25.4 L7.6 25.2 L7.6 25.2 L7.5 25.0 L7.5 25.0 L7.4 24.8 L6.6 23.6 L6.5 23.4 L6.5 23.4 L6.2 22.8 L6.1 22.8 L6.1 22.7 L6.1 22.6 L6.1 22.6 L5.9 22.5 L5.9 22.4 L5.6 21.9 L5.6 21.9 L5.5 21.7 L5.5 21.7 L5.4 21.5 L5.4 21.5 L5.2 21.3 L4.5 20.1 L4.4 19.9 L4.4 19.9 L4.0 19.3 L4.0 19.2 L3.9 19.2 L3.9 19.1 L3.9 19.1 L3.8 18.9 L3.8 18.9 L3.7 18.9 L3.0 17.7 L2.9 17.5 L2.9 17.1 L3.0 16.9 L3.1 16.7 L3.4 16.5 L3.6 16.4 L3.8 16.3 L4.2 16.3 L4.4 16.4 L4.7 16.6 L4.7 16.6 L4.9 16.7 L5.5 17.1 L5.6 17.2 L5.7 17.2 L5.8 17.3 L5.9 17.3 L6.0 17.4 L6.6 17.8 L6.7 17.9 L6.8 17.9 L6.9 18.0 L7.0 18.0 L7.1 18.1 L7.2 18.2 L8.0 18.7 L8.2 18.8 L8.3 18.9 L8.4 18.9 L8.7 19.2 L8.7 19.2 L8.8 19.2 L8.9 19.2 L9.0 19.3 L9.2 19.3 L9.4 19.2 L9.5 19.2 L9.8 19.1 L9.9 18.9 L10.0 18.7 L10.0 18.7 L10.1 18.6 L10.1 18.5 L10.1 18.4 L10.1 18.1 L10.1 18.1 L10.1 3.9 L10.2 3.7 L10.2 3.6 L10.3 3.4 L10.5 3.1Z' fill='%232b1a00' fill-rule='evenodd'/%3E%3C/svg%3E\") 11 2, pointer" },
        cursorGrab:     { cssVar: '--cursor-grab',     note: 'hovering a draggable (the Home globe)',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffd86b'/%3E%3Cstop offset='1' stop-color='%23f5a623'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M15.9 1.0 L15.9 1.0 L15.7 1.1 L15.6 1.1 L15.5 1.1 L15.4 1.2 L15.3 1.2 L14.9 1.4 L14.8 1.4 L14.7 1.5 L14.5 1.6 L14.1 2.0 L13.9 2.3 L13.8 2.5 L13.7 2.6 L13.5 2.5 L13.5 2.5 L13.4 2.5 L13.3 2.5 L13.2 2.4 L13.1 2.4 L13.0 2.3 L12.8 2.3 L12.7 2.3 L12.6 2.3 L12.6 2.3 L12.2 2.3 L12.2 2.3 L12.1 2.3 L12.0 2.3 L11.9 2.3 L11.7 2.4 L11.6 2.4 L11.4 2.5 L11.3 2.5 L11.0 2.7 L10.9 2.8 L10.8 2.8 L10.5 3.1 L10.1 3.4 L9.8 3.8 L9.7 4.1 L9.7 4.2 L9.6 4.5 L9.6 4.5 L9.5 4.7 L9.5 5.2 L9.5 5.2 L9.5 13.6 L9.5 13.7 L9.4 13.7 L9.2 13.7 L8.8 13.8 L8.7 13.8 L8.5 13.8 L8.4 13.9 L8.3 13.9 L8.2 13.9 L8.1 13.9 L8.0 14.0 L7.9 14.0 L7.9 14.0 L7.8 14.1 L7.7 14.1 L7.3 14.3 L7.2 14.4 L7.2 14.4 L6.7 14.7 L6.4 15.0 L6.1 15.2 L5.9 15.5 L5.5 16.1 L5.2 16.6 L5.2 16.7 L5.2 16.7 L5.2 16.8 L5.1 17.1 L4.9 17.7 L4.9 18.1 L4.9 18.2 L4.9 19.0 L4.9 19.3 L4.9 19.7 L5.0 20.1 L5.0 20.4 L5.1 21.0 L5.1 21.2 L5.2 21.7 L5.3 21.8 L5.4 22.2 L5.4 22.3 L5.4 22.4 L5.4 22.6 L5.5 22.9 L5.5 22.9 L5.6 23.1 L5.6 23.2 L5.6 23.2 L5.7 23.3 L5.7 23.4 L5.8 23.7 L5.8 23.8 L5.8 23.8 L5.9 23.9 L5.9 24.0 L5.9 24.0 L6.0 24.2 L6.1 24.4 L6.1 24.4 L6.1 24.5 L6.1 24.6 L6.3 24.9 L6.5 25.4 L6.6 25.6 L6.7 25.8 L6.8 25.8 L6.8 25.9 L6.8 25.9 L6.8 26.0 L7.1 26.4 L7.4 26.9 L7.8 27.5 L8.3 28.1 L8.7 28.5 L9.2 28.9 L9.6 29.3 L10.1 29.7 L10.5 29.9 L11.1 30.3 L11.3 30.4 L11.4 30.4 L11.6 30.5 L11.6 30.5 L11.7 30.6 L11.8 30.6 L11.9 30.6 L11.9 30.7 L12.2 30.8 L12.3 30.8 L12.4 30.8 L12.4 30.8 L12.8 30.9 L13.2 31.0 L13.2 31.0 L21.4 31.0 L21.5 31.0 L21.8 30.9 L22.0 30.9 L22.1 30.9 L22.3 30.8 L22.4 30.8 L23.0 30.6 L23.0 30.6 L23.1 30.6 L23.3 30.5 L23.4 30.5 L23.5 30.4 L23.5 30.4 L23.7 30.3 L23.8 30.3 L23.8 30.2 L23.9 30.2 L24.2 30.0 L24.3 29.9 L24.4 29.9 L24.8 29.6 L25.4 29.1 L25.7 28.8 L25.9 28.4 L26.1 28.1 L26.3 27.8 L26.3 27.8 L26.5 27.4 L26.6 27.3 L26.6 27.2 L26.6 27.1 L26.7 26.9 L26.7 26.8 L26.8 26.6 L26.9 26.4 L26.9 26.3 L26.9 26.2 L27.0 26.0 L27.0 25.9 L27.0 25.7 L27.0 25.5 L27.1 25.4 L27.1 25.1 L27.1 25.0 L27.1 7.7 L27.1 7.7 L27.1 7.5 L27.0 7.4 L27.0 7.2 L27.0 7.1 L27.0 7.0 L26.9 6.9 L26.9 6.7 L26.7 6.4 L26.6 6.3 L26.6 6.2 L26.4 5.9 L26.1 5.6 L25.9 5.5 L25.6 5.3 L25.0 5.0 L24.5 4.9 L24.2 4.9 L24.2 4.9 L23.8 4.9 L23.3 5.0 L23.2 5.1 L23.1 5.1 L23.0 5.1 L23.0 5.0 L23.0 4.9 L23.0 4.8 L22.8 4.4 L22.6 4.1 L22.2 3.7 L21.9 3.5 L21.8 3.4 L21.7 3.3 L21.7 3.3 L21.5 3.2 L21.4 3.2 L21.4 3.2 L21.3 3.2 L21.2 3.1 L20.8 3.0 L20.5 3.0 L20.2 2.9 L20.2 3.0 L20.0 3.0 L19.9 3.0 L19.7 3.0 L19.6 3.1 L19.4 3.1 L19.2 3.2 L19.2 3.2 L19.1 3.1 L19.1 3.0 L19.1 2.9 L19.1 2.9 L18.9 2.6 L18.7 2.3 L18.5 2.0 L18.3 1.7 L18.0 1.5 L17.6 1.3 L17.6 1.3 L17.3 1.2 L17.0 1.1 L16.8 1.0 L16.7 1.0 L16.7 1.0Z' fill='%23ffb81c'/%3E%3Cpath d='M15.9 1.0 L15.9 1.0 L15.7 1.1 L15.6 1.1 L15.5 1.1 L15.4 1.2 L15.3 1.2 L14.9 1.4 L14.8 1.4 L14.7 1.5 L14.5 1.6 L14.1 2.0 L13.9 2.3 L13.8 2.5 L13.7 2.6 L13.5 2.5 L13.5 2.5 L13.4 2.5 L13.3 2.5 L13.2 2.4 L13.1 2.4 L13.0 2.3 L12.8 2.3 L12.7 2.3 L12.6 2.3 L12.6 2.3 L12.2 2.3 L12.2 2.3 L12.1 2.3 L12.0 2.3 L11.9 2.3 L11.7 2.4 L11.6 2.4 L11.4 2.5 L11.3 2.5 L11.0 2.7 L10.9 2.8 L10.8 2.8 L10.5 3.1 L10.1 3.4 L9.8 3.8 L9.7 4.1 L9.7 4.2 L9.6 4.5 L9.6 4.5 L9.5 4.7 L9.5 5.2 L9.5 5.2 L9.5 13.6 L9.5 13.7 L9.4 13.7 L9.2 13.7 L8.8 13.8 L8.7 13.8 L8.5 13.8 L8.4 13.9 L8.3 13.9 L8.2 13.9 L8.1 13.9 L8.0 14.0 L7.9 14.0 L7.9 14.0 L7.8 14.1 L7.7 14.1 L7.3 14.3 L7.2 14.4 L7.2 14.4 L6.7 14.7 L6.4 15.0 L6.1 15.2 L5.9 15.5 L5.5 16.1 L5.2 16.6 L5.2 16.7 L5.2 16.7 L5.2 16.8 L5.1 17.1 L4.9 17.7 L4.9 18.1 L4.9 18.2 L4.9 19.0 L4.9 19.3 L4.9 19.7 L5.0 20.1 L5.0 20.4 L5.1 21.0 L5.1 21.2 L5.2 21.7 L5.3 21.8 L5.4 22.2 L5.4 22.3 L5.4 22.4 L5.4 22.6 L5.5 22.9 L5.5 22.9 L5.6 23.1 L5.6 23.2 L5.6 23.2 L5.7 23.3 L5.7 23.4 L5.8 23.7 L5.8 23.8 L5.8 23.8 L5.9 23.9 L5.9 24.0 L5.9 24.0 L6.0 24.2 L6.1 24.4 L6.1 24.4 L6.1 24.5 L6.1 24.6 L6.3 24.9 L6.5 25.4 L6.6 25.6 L6.7 25.8 L6.8 25.8 L6.8 25.9 L6.8 25.9 L6.8 26.0 L7.1 26.4 L7.4 26.9 L7.8 27.5 L8.3 28.1 L8.7 28.5 L9.2 28.9 L9.6 29.3 L10.1 29.7 L10.5 29.9 L11.1 30.3 L11.3 30.4 L11.4 30.4 L11.6 30.5 L11.6 30.5 L11.7 30.6 L11.8 30.6 L11.9 30.6 L11.9 30.7 L12.2 30.8 L12.3 30.8 L12.4 30.8 L12.4 30.8 L12.8 30.9 L13.2 31.0 L13.2 31.0 L21.4 31.0 L21.5 31.0 L21.8 30.9 L22.0 30.9 L22.1 30.9 L22.3 30.8 L22.4 30.8 L23.0 30.6 L23.0 30.6 L23.1 30.6 L23.3 30.5 L23.4 30.5 L23.5 30.4 L23.5 30.4 L23.7 30.3 L23.8 30.3 L23.8 30.2 L23.9 30.2 L24.2 30.0 L24.3 29.9 L24.4 29.9 L24.8 29.6 L25.4 29.1 L25.7 28.8 L25.9 28.4 L26.1 28.1 L26.3 27.8 L26.3 27.8 L26.5 27.4 L26.6 27.3 L26.6 27.2 L26.6 27.1 L26.7 26.9 L26.7 26.8 L26.8 26.6 L26.9 26.4 L26.9 26.3 L26.9 26.2 L27.0 26.0 L27.0 25.9 L27.0 25.7 L27.0 25.5 L27.1 25.4 L27.1 25.1 L27.1 25.0 L27.1 7.7 L27.1 7.7 L27.1 7.5 L27.0 7.4 L27.0 7.2 L27.0 7.1 L27.0 7.0 L26.9 6.9 L26.9 6.7 L26.7 6.4 L26.6 6.3 L26.6 6.2 L26.4 5.9 L26.1 5.6 L25.9 5.5 L25.6 5.3 L25.0 5.0 L24.5 4.9 L24.2 4.9 L24.2 4.9 L23.8 4.9 L23.3 5.0 L23.2 5.1 L23.1 5.1 L23.0 5.1 L23.0 5.0 L23.0 4.9 L23.0 4.8 L22.8 4.4 L22.6 4.1 L22.2 3.7 L21.9 3.5 L21.8 3.4 L21.7 3.3 L21.7 3.3 L21.5 3.2 L21.4 3.2 L21.4 3.2 L21.3 3.2 L21.2 3.1 L20.8 3.0 L20.5 3.0 L20.2 2.9 L20.2 3.0 L20.0 3.0 L19.9 3.0 L19.7 3.0 L19.6 3.1 L19.4 3.1 L19.2 3.2 L19.2 3.2 L19.1 3.1 L19.1 3.0 L19.1 2.9 L19.1 2.9 L18.9 2.6 L18.7 2.3 L18.5 2.0 L18.3 1.7 L18.0 1.5 L17.6 1.3 L17.6 1.3 L17.3 1.2 L17.0 1.1 L16.8 1.0 L16.7 1.0 L16.7 1.0ZM16.0 3.0 L16.3 2.9 L16.5 2.9 L16.7 3.0 L16.9 3.1 L17.1 3.3 L17.3 3.6 L17.3 3.8 L17.3 17.1 L17.4 17.3 L17.4 17.5 L17.5 17.6 L17.7 17.7 L17.9 17.9 L18.1 17.9 L18.4 17.9 L18.5 17.9 L18.7 17.9 L18.9 17.7 L19.1 17.5 L19.2 17.4 L19.2 17.2 L19.2 17.1 L19.3 5.9 L19.3 5.6 L19.4 5.4 L19.6 5.1 L19.8 5.0 L20.0 4.9 L20.2 4.9 L20.2 4.9 L20.4 4.9 L20.6 5.0 L20.8 5.1 L21.0 5.3 L21.1 5.4 L21.2 5.6 L21.2 5.8 L21.2 7.8 L21.2 7.8 L21.2 7.9 L21.2 17.0 L21.2 17.2 L21.3 17.3 L21.3 17.4 L21.5 17.6 L21.7 17.8 L22.0 17.9 L22.1 17.9 L22.4 17.9 L22.7 17.8 L23.0 17.6 L23.1 17.4 L23.2 17.2 L23.2 7.9 L23.2 7.9 L23.2 7.7 L23.2 7.5 L23.4 7.2 L23.5 7.1 L23.7 7.0 L23.8 6.9 L24.0 6.9 L24.3 6.9 L24.5 6.9 L24.6 7.0 L24.8 7.1 L25.0 7.3 L25.1 7.6 L25.1 7.7 L25.1 25.0 L25.1 25.0 L25.1 25.4 L25.0 25.9 L24.9 26.2 L24.9 26.3 L24.9 26.3 L24.8 26.4 L24.8 26.5 L24.8 26.5 L24.7 26.6 L24.6 26.9 L24.6 26.9 L24.4 27.2 L24.1 27.6 L23.6 28.1 L23.3 28.3 L23.0 28.5 L23.0 28.5 L22.9 28.6 L22.5 28.7 L22.5 28.7 L22.4 28.8 L21.8 29.0 L21.7 29.0 L21.5 29.0 L21.0 29.1 L21.0 29.1 L13.6 29.1 L13.2 29.0 L13.0 29.0 L12.9 28.9 L12.8 28.9 L12.6 28.8 L12.1 28.7 L11.6 28.4 L11.3 28.1 L10.5 27.5 L10.1 27.1 L9.7 26.6 L9.0 25.8 L8.7 25.3 L8.7 25.2 L8.6 25.2 L8.5 24.9 L8.4 24.9 L8.4 24.8 L8.3 24.7 L8.3 24.6 L8.1 24.2 L7.8 23.5 L7.8 23.5 L7.7 23.3 L7.7 23.2 L7.6 23.0 L7.6 22.9 L7.4 22.6 L7.4 22.5 L7.3 22.2 L7.3 22.1 L7.3 22.0 L7.3 21.9 L7.2 21.5 L7.2 21.4 L7.1 21.2 L7.1 21.1 L7.1 20.9 L7.0 20.8 L7.0 20.5 L7.0 20.4 L6.9 20.0 L6.9 19.8 L6.9 19.5 L6.9 19.3 L6.9 19.2 L6.9 18.1 L6.9 18.0 L6.9 17.9 L6.9 17.7 L7.1 17.3 L7.2 17.0 L7.3 16.9 L7.3 16.9 L7.5 16.6 L7.8 16.3 L8.1 16.1 L8.4 15.9 L8.6 15.8 L8.7 15.8 L9.0 15.7 L9.4 15.7 L9.5 15.7 L9.5 15.7 L9.5 15.8 L9.5 18.3 L9.5 18.4 L9.5 18.5 L9.5 18.6 L9.6 18.8 L9.9 19.1 L10.1 19.2 L10.4 19.3 L10.5 19.3 L10.7 19.2 L10.9 19.1 L11.1 19.0 L11.3 18.8 L11.4 18.6 L11.4 18.5 L11.4 18.4 L11.4 15.0 L11.4 15.0 L11.4 14.4 L11.4 14.4 L11.4 5.2 L11.4 5.0 L11.6 4.6 L11.9 4.4 L12.0 4.3 L12.1 4.3 L12.2 4.3 L12.3 4.3 L12.6 4.3 L12.8 4.3 L12.8 4.3 L12.9 4.4 L13.2 4.6 L13.3 4.7 L13.4 5.0 L13.4 6.5 L13.4 6.5 L13.4 6.6 L13.4 17.0 L13.4 17.0 L13.4 17.1 L13.4 17.2 L13.4 17.3 L13.6 17.6 L13.8 17.8 L13.9 17.8 L14.1 17.9 L14.5 17.9 L14.6 17.9 L14.7 17.9 L14.8 17.9 L15.0 17.7 L15.1 17.6 L15.2 17.4 L15.3 17.3 L15.3 17.1 L15.3 6.5 L15.4 6.2 L15.3 3.9 L15.4 3.7 L15.5 3.4 L15.6 3.3 L15.9 3.1Z' fill='%232b1a00' fill-rule='evenodd'/%3E%3C/svg%3E\") 16 16, grab" },
        cursorGrabbing: { cssVar: '--cursor-grabbing', note: 'dragging the Home globe',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffd86b'/%3E%3Cstop offset='1' stop-color='%23f5a623'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M14.5 1.1 L14.4 1.1 L14.0 1.2 L13.6 1.4 L13.6 1.4 L13.1 1.6 L12.7 2.0 L12.3 2.4 L12.0 2.8 L12.0 2.9 L12.0 3.0 L11.9 3.1 L11.9 3.1 L11.8 3.2 L11.8 3.3 L11.8 3.3 L11.7 3.3 L11.7 3.3 L11.4 3.1 L11.2 3.1 L11.2 3.1 L11.1 3.0 L11.0 3.0 L11.0 2.9 L10.7 2.9 L10.6 2.9 L10.4 2.8 L9.8 2.8 L9.7 2.8 L9.5 2.8 L9.3 2.8 L9.1 2.8 L9.0 2.9 L8.9 2.9 L8.7 2.9 L8.4 3.1 L7.9 3.3 L7.4 3.7 L7.1 4.0 L6.9 4.3 L6.7 4.7 L6.5 5.2 L6.3 5.7 L6.3 5.9 L6.3 6.0 L6.3 6.2 L6.3 6.2 L6.3 10.3 L4.6 12.1 L4.1 12.6 L3.8 13.1 L3.8 13.1 L3.5 13.5 L3.4 13.7 L3.3 13.9 L3.3 14.0 L3.2 14.1 L3.2 14.1 L3.2 14.2 L3.2 14.3 L3.1 14.3 L3.1 14.4 L3.0 14.7 L3.0 14.8 L2.9 15.0 L2.9 15.1 L2.9 15.2 L2.9 15.4 L2.8 15.6 L2.8 16.1 L2.8 16.1 L2.8 16.3 L2.8 16.4 L2.8 19.2 L2.8 19.2 L2.8 19.7 L2.8 19.8 L2.8 19.9 L2.9 20.2 L2.9 20.3 L2.9 20.5 L2.9 20.6 L3.1 21.0 L3.1 21.1 L3.2 21.4 L3.2 21.4 L3.2 21.5 L3.3 21.6 L3.5 22.0 L3.8 22.6 L4.1 23.0 L4.4 23.3 L6.3 25.2 L8.6 27.5 L9.1 27.9 L9.7 28.3 L10.1 28.7 L10.2 28.7 L10.2 28.7 L10.7 29.1 L10.9 29.1 L11.3 29.4 L11.9 29.7 L12.0 29.7 L12.1 29.8 L12.1 29.8 L12.2 29.8 L12.2 29.8 L12.3 29.9 L12.4 29.9 L12.5 29.9 L12.5 29.9 L12.8 30.1 L13.0 30.1 L13.1 30.2 L13.1 30.2 L13.2 30.2 L13.3 30.2 L13.4 30.3 L13.7 30.4 L13.8 30.4 L13.8 30.4 L14.2 30.5 L14.2 30.5 L14.3 30.6 L14.5 30.6 L14.6 30.6 L14.7 30.6 L14.9 30.7 L15.0 30.7 L15.1 30.8 L15.3 30.8 L15.5 30.8 L15.6 30.8 L15.9 30.9 L16.1 30.9 L16.4 30.9 L16.9 31.0 L16.9 31.0 L17.0 31.0 L18.5 31.0 L18.5 31.0 L18.6 31.0 L19.0 30.9 L19.3 30.9 L19.5 30.9 L19.6 30.8 L19.8 30.8 L19.9 30.8 L20.1 30.8 L20.2 30.7 L20.3 30.7 L20.5 30.6 L20.6 30.6 L20.7 30.6 L20.8 30.6 L20.9 30.5 L21.3 30.5 L21.3 30.4 L21.6 30.3 L21.6 30.3 L21.8 30.3 L21.8 30.3 L21.9 30.2 L22.0 30.2 L22.0 30.2 L22.1 30.1 L22.2 30.1 L23.1 29.7 L23.2 29.7 L23.7 29.3 L23.7 29.3 L23.8 29.3 L24.0 29.1 L24.2 29.1 L25.1 28.4 L25.9 27.7 L26.4 27.1 L26.7 26.7 L26.8 26.6 L27.2 26.0 L27.9 24.9 L28.0 24.6 L28.4 23.9 L28.4 23.8 L28.4 23.8 L28.4 23.7 L28.5 23.6 L28.6 23.4 L28.6 23.3 L28.6 23.2 L28.6 23.2 L28.7 23.1 L28.7 23.0 L28.7 22.9 L28.8 22.8 L28.8 22.7 L28.8 22.6 L28.8 22.4 L28.9 22.3 L28.9 22.2 L29.0 21.9 L29.0 21.7 L29.1 21.6 L29.1 21.4 L29.2 20.7 L29.2 20.5 L29.2 20.1 L29.2 19.7 L29.2 19.7 L29.2 8.0 L29.2 7.4 L29.1 7.2 L29.1 7.2 L29.1 7.0 L29.1 7.0 L28.9 6.7 L28.9 6.6 L28.8 6.4 L28.7 6.2 L28.7 6.2 L28.5 5.9 L28.2 5.5 L27.7 5.2 L27.5 5.0 L27.4 5.0 L27.4 4.9 L27.2 4.9 L27.1 4.8 L27.1 4.8 L26.8 4.7 L26.7 4.7 L26.4 4.6 L25.9 4.5 L25.6 4.5 L25.4 4.6 L25.1 4.6 L24.9 4.6 L24.9 4.6 L24.6 4.7 L24.4 4.8 L24.3 4.8 L24.2 4.9 L24.2 4.9 L23.8 5.1 L23.7 5.1 L23.7 5.0 L23.7 4.9 L23.6 4.7 L23.6 4.7 L23.3 4.2 L23.3 4.2 L22.9 3.8 L22.4 3.4 L21.9 3.1 L21.9 3.1 L21.5 2.9 L21.4 2.9 L21.0 2.8 L20.4 2.8 L19.8 2.8 L19.7 2.9 L19.3 2.9 L19.2 3.0 L19.2 3.0 L19.1 3.1 L18.9 3.1 L18.8 3.2 L18.6 3.3 L18.5 3.3 L18.5 3.3 L18.4 3.3 L18.4 3.2 L18.4 3.2 L18.3 3.1 L18.3 3.0 L18.3 3.0 L18.2 2.8 L18.2 2.8 L18.0 2.5 L17.6 2.0 L17.2 1.6 L16.8 1.5 L16.8 1.4 L16.2 1.2 L16.1 1.2 L16.0 1.1 L15.9 1.1 L15.8 1.1 L15.5 1.0 L15.4 1.0 L14.8 1.0 L14.8 1.0Z' fill='%23ffb81c'/%3E%3Cpath d='M14.5 1.1 L14.4 1.1 L14.0 1.2 L13.6 1.4 L13.6 1.4 L13.1 1.6 L12.7 2.0 L12.3 2.4 L12.0 2.8 L12.0 2.9 L12.0 3.0 L11.9 3.1 L11.9 3.1 L11.8 3.2 L11.8 3.3 L11.8 3.3 L11.7 3.3 L11.7 3.3 L11.4 3.1 L11.2 3.1 L11.2 3.1 L11.1 3.0 L11.0 3.0 L11.0 2.9 L10.7 2.9 L10.6 2.9 L10.4 2.8 L9.8 2.8 L9.7 2.8 L9.5 2.8 L9.3 2.8 L9.1 2.8 L9.0 2.9 L8.9 2.9 L8.7 2.9 L8.4 3.1 L7.9 3.3 L7.4 3.7 L7.1 4.0 L6.9 4.3 L6.7 4.7 L6.5 5.2 L6.3 5.7 L6.3 5.9 L6.3 6.0 L6.3 6.2 L6.3 6.2 L6.3 10.3 L4.6 12.1 L4.1 12.6 L3.8 13.1 L3.8 13.1 L3.5 13.5 L3.4 13.7 L3.3 13.9 L3.3 14.0 L3.2 14.1 L3.2 14.1 L3.2 14.2 L3.2 14.3 L3.1 14.3 L3.1 14.4 L3.0 14.7 L3.0 14.8 L2.9 15.0 L2.9 15.1 L2.9 15.2 L2.9 15.4 L2.8 15.6 L2.8 16.1 L2.8 16.1 L2.8 16.3 L2.8 16.4 L2.8 19.2 L2.8 19.2 L2.8 19.7 L2.8 19.8 L2.8 19.9 L2.9 20.2 L2.9 20.3 L2.9 20.5 L2.9 20.6 L3.1 21.0 L3.1 21.1 L3.2 21.4 L3.2 21.4 L3.2 21.5 L3.3 21.6 L3.5 22.0 L3.8 22.6 L4.1 23.0 L4.4 23.3 L6.3 25.2 L8.6 27.5 L9.1 27.9 L9.7 28.3 L10.1 28.7 L10.2 28.7 L10.2 28.7 L10.7 29.1 L10.9 29.1 L11.3 29.4 L11.9 29.7 L12.0 29.7 L12.1 29.8 L12.1 29.8 L12.2 29.8 L12.2 29.8 L12.3 29.9 L12.4 29.9 L12.5 29.9 L12.5 29.9 L12.8 30.1 L13.0 30.1 L13.1 30.2 L13.1 30.2 L13.2 30.2 L13.3 30.2 L13.4 30.3 L13.7 30.4 L13.8 30.4 L13.8 30.4 L14.2 30.5 L14.2 30.5 L14.3 30.6 L14.5 30.6 L14.6 30.6 L14.7 30.6 L14.9 30.7 L15.0 30.7 L15.1 30.8 L15.3 30.8 L15.5 30.8 L15.6 30.8 L15.9 30.9 L16.1 30.9 L16.4 30.9 L16.9 31.0 L16.9 31.0 L17.0 31.0 L18.5 31.0 L18.5 31.0 L18.6 31.0 L19.0 30.9 L19.3 30.9 L19.5 30.9 L19.6 30.8 L19.8 30.8 L19.9 30.8 L20.1 30.8 L20.2 30.7 L20.3 30.7 L20.5 30.6 L20.6 30.6 L20.7 30.6 L20.8 30.6 L20.9 30.5 L21.3 30.5 L21.3 30.4 L21.6 30.3 L21.6 30.3 L21.8 30.3 L21.8 30.3 L21.9 30.2 L22.0 30.2 L22.0 30.2 L22.1 30.1 L22.2 30.1 L23.1 29.7 L23.2 29.7 L23.7 29.3 L23.7 29.3 L23.8 29.3 L24.0 29.1 L24.2 29.1 L25.1 28.4 L25.9 27.7 L26.4 27.1 L26.7 26.7 L26.8 26.6 L27.2 26.0 L27.9 24.9 L28.0 24.6 L28.4 23.9 L28.4 23.8 L28.4 23.8 L28.4 23.7 L28.5 23.6 L28.6 23.4 L28.6 23.3 L28.6 23.2 L28.6 23.2 L28.7 23.1 L28.7 23.0 L28.7 22.9 L28.8 22.8 L28.8 22.7 L28.8 22.6 L28.8 22.4 L28.9 22.3 L28.9 22.2 L29.0 21.9 L29.0 21.7 L29.1 21.6 L29.1 21.4 L29.2 20.7 L29.2 20.5 L29.2 20.1 L29.2 19.7 L29.2 19.7 L29.2 8.0 L29.2 7.4 L29.1 7.2 L29.1 7.2 L29.1 7.0 L29.1 7.0 L28.9 6.7 L28.9 6.6 L28.8 6.4 L28.7 6.2 L28.7 6.2 L28.5 5.9 L28.2 5.5 L27.7 5.2 L27.5 5.0 L27.4 5.0 L27.4 4.9 L27.2 4.9 L27.1 4.8 L27.1 4.8 L26.8 4.7 L26.7 4.7 L26.4 4.6 L25.9 4.5 L25.6 4.5 L25.4 4.6 L25.1 4.6 L24.9 4.6 L24.9 4.6 L24.6 4.7 L24.4 4.8 L24.3 4.8 L24.2 4.9 L24.2 4.9 L23.8 5.1 L23.7 5.1 L23.7 5.0 L23.7 4.9 L23.6 4.7 L23.6 4.7 L23.3 4.2 L23.3 4.2 L22.9 3.8 L22.4 3.4 L21.9 3.1 L21.9 3.1 L21.5 2.9 L21.4 2.9 L21.0 2.8 L20.4 2.8 L19.8 2.8 L19.7 2.9 L19.3 2.9 L19.2 3.0 L19.2 3.0 L19.1 3.1 L18.9 3.1 L18.8 3.2 L18.6 3.3 L18.5 3.3 L18.5 3.3 L18.4 3.3 L18.4 3.2 L18.4 3.2 L18.3 3.1 L18.3 3.0 L18.3 3.0 L18.2 2.8 L18.2 2.8 L18.0 2.5 L17.6 2.0 L17.2 1.6 L16.8 1.5 L16.8 1.4 L16.2 1.2 L16.1 1.2 L16.0 1.1 L15.9 1.1 L15.8 1.1 L15.5 1.0 L15.4 1.0 L14.8 1.0 L14.8 1.0ZM14.7 2.8 L15.1 2.7 L15.6 2.8 L15.9 2.9 L15.9 3.0 L16.1 3.1 L16.4 3.3 L16.6 3.6 L16.8 3.9 L16.8 3.9 L16.9 4.2 L16.9 4.4 L16.9 9.0 L16.9 9.3 L17.0 9.4 L17.2 9.6 L17.5 9.8 L17.7 9.8 L17.9 9.8 L18.1 9.8 L18.3 9.6 L18.5 9.4 L18.6 9.3 L18.6 9.3 L18.6 9.1 L18.6 8.9 L18.6 8.9 L18.6 6.3 L18.6 6.3 L18.7 5.9 L18.7 5.7 L18.8 5.6 L18.9 5.4 L18.9 5.4 L18.9 5.3 L19.1 5.1 L19.5 4.8 L19.8 4.6 L19.9 4.6 L20.0 4.6 L20.2 4.5 L20.3 4.5 L20.5 4.5 L20.6 4.5 L20.8 4.6 L21.0 4.6 L21.1 4.6 L21.4 4.8 L21.6 5.0 L21.9 5.3 L22.0 5.6 L22.2 6.0 L22.2 6.2 L22.2 6.3 L22.2 6.3 L22.2 8.9 L22.2 9.2 L22.3 9.3 L22.4 9.5 L22.5 9.6 L22.8 9.8 L23.0 9.8 L23.2 9.8 L23.3 9.8 L23.6 9.7 L23.7 9.6 L23.8 9.5 L23.8 9.3 L23.9 9.1 L23.9 9.0 L23.9 8.0 L24.0 7.9 L24.0 7.7 L24.1 7.3 L24.2 7.2 L24.2 7.1 L24.4 6.9 L24.7 6.6 L25.0 6.4 L25.0 6.4 L25.1 6.4 L25.3 6.3 L25.3 6.3 L25.4 6.3 L25.7 6.3 L26.1 6.3 L26.4 6.4 L26.8 6.7 L27.1 7.0 L27.3 7.2 L27.4 7.4 L27.4 7.5 L27.4 7.6 L27.5 7.8 L27.5 8.0 L27.5 19.7 L27.5 19.7 L27.5 20.2 L27.4 20.2 L27.4 20.6 L27.4 20.8 L27.4 20.9 L27.3 21.2 L27.3 21.4 L27.3 21.5 L27.3 21.6 L27.2 21.8 L27.2 21.8 L27.2 21.9 L27.1 22.1 L27.1 22.2 L27.1 22.4 L27.0 22.4 L27.0 22.5 L27.0 22.6 L27.0 22.7 L26.9 22.7 L26.9 22.8 L26.9 22.9 L26.9 23.0 L26.7 23.2 L26.7 23.3 L26.6 23.5 L26.3 24.2 L26.3 24.2 L26.1 24.4 L25.9 24.9 L25.9 24.9 L25.2 25.8 L24.8 26.2 L24.5 26.6 L24.0 27.0 L23.2 27.6 L23.1 27.6 L23.1 27.7 L22.4 28.1 L22.1 28.2 L22.0 28.3 L21.7 28.4 L20.6 28.8 L20.5 28.8 L20.3 28.9 L20.3 28.9 L20.1 29.0 L20.0 29.0 L19.9 29.0 L19.8 29.0 L19.6 29.1 L19.5 29.1 L19.3 29.1 L19.1 29.1 L18.8 29.2 L18.6 29.2 L18.6 29.2 L17.7 29.3 L17.7 29.2 L17.4 29.2 L17.4 29.2 L16.9 29.2 L16.9 29.2 L16.5 29.2 L16.3 29.1 L16.1 29.1 L15.9 29.1 L15.8 29.1 L15.6 29.0 L15.4 29.0 L15.3 29.0 L15.2 29.0 L15.0 28.9 L14.9 28.9 L14.8 28.8 L14.7 28.8 L14.5 28.8 L14.5 28.8 L14.3 28.7 L14.2 28.7 L14.0 28.6 L13.9 28.6 L13.8 28.6 L13.7 28.5 L13.7 28.5 L13.2 28.4 L12.9 28.2 L12.9 28.2 L12.7 28.1 L12.6 28.1 L12.4 28.0 L12.1 27.8 L11.3 27.3 L10.2 26.6 L9.4 25.8 L5.6 22.0 L5.2 21.5 L4.9 20.9 L4.9 20.9 L4.9 20.8 L4.7 20.3 L4.7 20.2 L4.6 19.9 L4.5 19.3 L4.5 16.2 L4.5 16.2 L4.5 16.0 L4.6 15.9 L4.6 15.8 L4.6 15.5 L4.6 15.5 L4.7 15.3 L4.7 15.2 L4.7 15.1 L4.8 14.9 L4.9 14.7 L4.9 14.6 L5.2 14.0 L5.6 13.6 L6.2 12.9 L6.3 12.9 L6.3 12.9 L6.3 14.3 L6.3 14.6 L6.5 14.8 L6.6 14.9 L6.8 15.1 L7.1 15.1 L7.3 15.1 L7.4 15.1 L7.5 15.1 L7.6 15.0 L7.8 14.8 L7.9 14.7 L8.0 14.5 L8.0 14.3 L8.0 6.2 L8.1 6.1 L8.1 5.9 L8.1 5.8 L8.1 5.7 L8.2 5.6 L8.3 5.3 L8.5 5.1 L8.8 4.8 L9.2 4.6 L9.5 4.5 L9.9 4.5 L10.0 4.5 L10.2 4.6 L10.6 4.7 L10.6 4.7 L10.8 4.8 L11.0 4.9 L11.2 5.1 L11.3 5.3 L11.5 5.7 L11.5 5.8 L11.6 5.9 L11.6 6.1 L11.6 6.2 L11.6 9.0 L11.6 9.0 L11.6 9.1 L11.7 9.3 L11.8 9.5 L11.9 9.6 L12.2 9.8 L12.4 9.8 L12.6 9.8 L12.8 9.8 L13.0 9.7 L13.1 9.5 L13.3 9.3 L13.3 9.2 L13.3 9.1 L13.3 8.9 L13.4 8.9 L13.4 4.6 L13.3 4.5 L13.4 4.5 L13.4 4.2 L13.4 4.1 L13.4 4.0 L13.5 3.9 L13.5 3.8 L13.5 3.8 L13.6 3.6 L13.8 3.3 L13.9 3.2 L14.1 3.0 L14.2 3.0 L14.5 2.9 L14.6 2.9Z' fill='%232b1a00' fill-rule='evenodd'/%3E%3C/svg%3E\") 16 16, grabbing" },
        cursorHelp:     { cssVar: '--cursor-help',     note: 'hovering a number explained by a tooltip (e.g. the busy-footfall readouts)',
            default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffd86b'/%3E%3Cstop offset='1' stop-color='%23f5a623'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M26.1 29.7 L25.9 29.8 L25.7 30.0 L25.6 30.2 L25.6 30.5 L25.7 30.7 L25.8 30.8 L26.0 30.9 L26.1 31.0 L26.1 31.0 L26.4 31.0 L26.4 31.0 L26.5 30.9 L26.6 30.8 L26.8 30.7 L26.8 30.6 L26.9 30.4 L26.9 30.4 L26.8 30.1 L26.7 29.9 L26.5 29.7 L26.4 29.7 L26.3 29.7ZM25.6 20.1 L25.0 20.2 L24.7 20.3 L24.5 20.4 L24.0 20.7 L23.7 21.0 L23.5 21.2 L23.3 21.5 L23.0 22.0 L23.0 22.1 L22.9 22.2 L22.9 22.3 L22.9 22.4 L22.9 22.5 L22.8 22.6 L22.8 22.8 L22.9 23.0 L23.0 23.1 L23.2 23.3 L23.5 23.4 L23.7 23.3 L23.9 23.2 L24.1 23.0 L24.2 22.6 L24.2 22.5 L24.3 22.3 L24.6 22.0 L24.8 21.8 L25.2 21.6 L25.7 21.5 L25.8 21.5 L26.0 21.5 L26.2 21.4 L26.8 21.5 L27.0 21.6 L27.0 21.6 L27.1 21.6 L27.3 21.7 L27.7 21.9 L27.9 22.1 L28.1 22.3 L28.3 22.6 L28.3 22.8 L28.3 23.0 L28.2 23.1 L28.2 23.2 L28.1 23.3 L27.9 23.6 L27.7 23.7 L27.2 23.9 L27.2 23.9 L27.1 24.0 L27.0 24.0 L26.9 24.0 L26.7 24.1 L26.3 24.3 L26.2 24.5 L25.9 24.7 L25.8 24.9 L25.6 25.3 L25.6 25.4 L25.6 25.5 L25.6 25.7 L25.6 25.8 L25.6 27.5 L25.6 27.7 L25.6 27.8 L25.6 27.9 L25.7 28.0 L25.7 28.0 L25.8 28.1 L25.9 28.2 L26.0 28.2 L26.3 28.3 L26.5 28.2 L26.6 28.1 L26.7 28.0 L26.8 27.8 L26.9 27.6 L26.9 25.7 L27.0 25.6 L27.1 25.4 L27.3 25.3 L27.4 25.3 L27.5 25.3 L27.5 25.3 L27.6 25.2 L27.7 25.2 L27.8 25.1 L28.0 25.1 L28.3 24.9 L28.5 24.8 L28.8 24.5 L29.0 24.4 L29.2 24.1 L29.4 23.8 L29.4 23.7 L29.5 23.5 L29.6 23.3 L29.6 23.2 L29.6 22.8 L29.5 22.3 L29.4 22.1 L29.4 22.0 L29.2 21.7 L28.9 21.2 L28.4 20.7 L28.3 20.7 L28.0 20.5 L27.4 20.2 L27.4 20.2 L27.2 20.2 L27.1 20.2 L26.9 20.1ZM1.5 1.0 L1.5 1.0 L1.4 1.1 L1.2 1.2 L1.0 1.5 L1.0 1.7 L1.0 26.2 L1.0 26.2 L1.0 26.4 L1.1 26.6 L1.4 26.8 L1.6 26.9 L1.8 26.9 L2.1 26.8 L4.4 25.0 L4.4 25.0 L4.5 24.9 L4.6 24.8 L4.8 24.7 L4.8 24.7 L6.3 23.6 L6.8 23.2 L6.9 23.2 L6.9 23.2 L10.6 30.6 L10.7 30.7 L10.8 30.9 L10.9 30.9 L11.0 30.9 L11.1 31.0 L11.4 31.0 L11.4 31.0 L11.5 30.9 L15.9 28.8 L16.0 28.7 L16.9 28.2 L17.2 28.0 L17.3 27.8 L17.3 27.5 L17.3 27.5 L17.3 27.3 L14.5 21.7 L14.4 21.4 L13.7 20.2 L13.7 20.1 L13.8 20.1 L13.8 20.1 L19.4 20.1 L19.5 20.0 L19.7 20.0 L19.8 20.0 L19.9 19.8 L20.0 19.7 L20.0 19.6 L20.1 19.5 L20.0 19.2 L20.0 19.1 L19.8 18.9 L2.1 1.2 L1.9 1.1 L1.8 1.0 L1.8 1.0Z' fill='url(%23g)'/%3E%3Cpath d='M26.1 29.7 L25.9 29.8 L25.7 30.0 L25.6 30.2 L25.6 30.5 L25.7 30.7 L25.8 30.8 L26.0 30.9 L26.1 31.0 L26.1 31.0 L26.4 31.0 L26.4 31.0 L26.5 30.9 L26.6 30.8 L26.8 30.7 L26.8 30.6 L26.9 30.4 L26.9 30.4 L26.8 30.1 L26.7 29.9 L26.5 29.7 L26.4 29.7 L26.3 29.7ZM25.6 20.1 L25.0 20.2 L24.7 20.3 L24.5 20.4 L24.0 20.7 L23.7 21.0 L23.5 21.2 L23.3 21.5 L23.0 22.0 L23.0 22.1 L22.9 22.2 L22.9 22.3 L22.9 22.4 L22.9 22.5 L22.8 22.6 L22.8 22.8 L22.9 23.0 L23.0 23.1 L23.2 23.3 L23.5 23.4 L23.7 23.3 L23.9 23.2 L24.1 23.0 L24.2 22.6 L24.2 22.5 L24.3 22.3 L24.6 22.0 L24.8 21.8 L25.2 21.6 L25.7 21.5 L25.8 21.5 L26.0 21.5 L26.2 21.4 L26.8 21.5 L27.0 21.6 L27.0 21.6 L27.1 21.6 L27.3 21.7 L27.7 21.9 L27.9 22.1 L28.1 22.3 L28.3 22.6 L28.3 22.8 L28.3 23.0 L28.2 23.1 L28.2 23.2 L28.1 23.3 L27.9 23.6 L27.7 23.7 L27.2 23.9 L27.2 23.9 L27.1 24.0 L27.0 24.0 L26.9 24.0 L26.7 24.1 L26.3 24.3 L26.2 24.5 L25.9 24.7 L25.8 24.9 L25.6 25.3 L25.6 25.4 L25.6 25.5 L25.6 25.7 L25.6 25.8 L25.6 27.5 L25.6 27.7 L25.6 27.8 L25.6 27.9 L25.7 28.0 L25.7 28.0 L25.8 28.1 L25.9 28.2 L26.0 28.2 L26.3 28.3 L26.5 28.2 L26.6 28.1 L26.7 28.0 L26.8 27.8 L26.9 27.6 L26.9 25.7 L27.0 25.6 L27.1 25.4 L27.3 25.3 L27.4 25.3 L27.5 25.3 L27.5 25.3 L27.6 25.2 L27.7 25.2 L27.8 25.1 L28.0 25.1 L28.3 24.9 L28.5 24.8 L28.8 24.5 L29.0 24.4 L29.2 24.1 L29.4 23.8 L29.4 23.7 L29.5 23.5 L29.6 23.3 L29.6 23.2 L29.6 22.8 L29.5 22.3 L29.4 22.1 L29.4 22.0 L29.2 21.7 L28.9 21.2 L28.4 20.7 L28.3 20.7 L28.0 20.5 L27.4 20.2 L27.4 20.2 L27.2 20.2 L27.1 20.2 L26.9 20.1ZM1.5 1.0 L1.5 1.0 L1.4 1.1 L1.2 1.2 L1.0 1.5 L1.0 1.7 L1.0 26.2 L1.0 26.2 L1.0 26.4 L1.1 26.6 L1.4 26.8 L1.6 26.9 L1.8 26.9 L2.1 26.8 L4.4 25.0 L4.4 25.0 L4.5 24.9 L4.6 24.8 L4.8 24.7 L4.8 24.7 L6.3 23.6 L6.8 23.2 L6.9 23.2 L6.9 23.2 L10.6 30.6 L10.7 30.7 L10.8 30.9 L10.9 30.9 L11.0 30.9 L11.1 31.0 L11.4 31.0 L11.4 31.0 L11.5 30.9 L15.9 28.8 L16.0 28.7 L16.9 28.2 L17.2 28.0 L17.3 27.8 L17.3 27.5 L17.3 27.5 L17.3 27.3 L14.5 21.7 L14.4 21.4 L13.7 20.2 L13.7 20.1 L13.8 20.1 L13.8 20.1 L19.4 20.1 L19.5 20.0 L19.7 20.0 L19.8 20.0 L19.9 19.8 L20.0 19.7 L20.0 19.6 L20.1 19.5 L20.0 19.2 L20.0 19.1 L19.8 18.9 L2.1 1.2 L1.9 1.1 L1.8 1.0 L1.8 1.0ZM2.4 3.4 L2.4 3.4 L17.7 18.7 L17.7 18.7 L13.0 18.7 L13.0 18.8 L12.5 18.8 L12.4 18.8 L12.2 18.8 L12.1 18.9 L12.0 19.0 L12.0 19.2 L11.9 19.4 L12.0 19.7 L14.6 25.0 L15.3 26.2 L15.3 26.4 L15.7 27.2 L15.7 27.3 L15.6 27.4 L15.1 27.6 L11.6 29.4 L11.5 29.4 L11.5 29.3 L7.7 21.9 L7.6 21.7 L7.5 21.6 L7.4 21.5 L7.2 21.5 L7.1 21.5 L6.9 21.5 L6.8 21.6 L4.9 22.9 L2.6 24.7 L2.4 24.8 L2.3 24.8 L2.3 3.4Z' fill='%232b1a00' fill-rule='evenodd'/%3E%3C/svg%3E\") 1 1, help" },
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
    default: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='{{A}}'/%3E%3Cstop offset='1' stop-color='{{B}}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M1.7 1.0 L1.7 1.0 L1.6 1.1 L1.4 1.1 L1.2 1.3 L1.1 1.5 L1.1 1.6 L1.0 1.6 L1.0 1.7 L1.0 1.8 L1.0 18.6 L1.0 18.8 L1.0 18.8 L1.1 19.0 L1.2 19.1 L1.4 19.3 L1.5 19.3 L1.6 19.3 L1.7 19.4 L1.8 19.4 L2.0 19.4 L2.2 19.4 L2.4 19.3 L2.5 19.2 L2.7 19.0 L3.2 18.6 L3.4 18.4 L3.5 18.3 L5.5 16.5 L5.6 16.5 L5.6 16.6 L5.6 16.7 L5.7 16.8 L5.7 16.8 L5.7 16.9 L5.7 16.9 L5.8 17.0 L5.8 17.0 L5.8 17.1 L5.8 17.1 L5.9 17.2 L5.9 17.2 L6.0 17.6 L6.0 17.6 L6.1 17.7 L6.1 17.7 L6.1 17.8 L6.1 17.8 L6.2 17.9 L6.2 17.9 L6.2 18.1 L6.2 18.1 L6.3 18.2 L6.3 18.2 L6.4 18.4 L6.4 18.4 L6.4 18.5 L6.5 18.6 L6.5 18.7 L6.5 18.7 L6.6 18.9 L6.6 19.1 L6.7 19.1 L6.7 19.2 L6.8 19.3 L6.8 19.3 L6.8 19.5 L6.8 19.5 L6.9 19.6 L6.9 19.7 L6.9 19.7 L6.9 19.7 L7.0 19.8 L7.0 19.9 L7.1 20.0 L7.1 20.0 L7.1 20.1 L7.1 20.2 L7.1 20.2 L7.1 20.2 L7.2 20.3 L7.2 20.4 L7.3 20.5 L7.3 20.6 L7.3 20.6 L7.3 20.7 L7.4 20.8 L7.5 21.0 L7.5 21.0 L7.5 21.1 L7.5 21.1 L7.5 21.2 L7.6 21.2 L7.6 21.4 L7.7 21.4 L7.7 21.5 L7.7 21.5 L7.7 21.6 L7.7 21.6 L7.7 21.7 L7.8 21.9 L7.8 21.9 L7.9 22.1 L7.9 22.1 L8.0 22.3 L8.0 22.3 L8.2 22.7 L8.3 22.8 L8.5 23.0 L8.6 23.0 L8.6 23.0 L8.9 23.0 L8.9 23.0 L9.0 23.0 L9.1 22.9 L9.1 22.9 L9.3 22.8 L9.3 22.8 L9.5 22.7 L9.5 22.7 L9.6 22.7 L9.6 22.7 L9.8 22.6 L9.9 22.6 L10.0 22.5 L10.0 22.5 L10.1 22.5 L10.1 22.5 L10.5 22.3 L10.5 22.3 L10.6 22.3 L10.6 22.3 L10.7 22.2 L10.9 22.1 L11.0 22.1 L11.0 22.1 L11.1 22.1 L11.1 22.1 L12.0 21.7 L12.1 21.5 L12.2 21.4 L12.3 21.3 L12.3 21.3 L12.3 21.2 L12.3 21.2 L12.3 21.0 L12.2 20.8 L12.2 20.8 L12.2 20.6 L12.1 20.6 L12.1 20.5 L12.1 20.4 L12.1 20.4 L12.0 20.3 L12.0 20.2 L12.0 20.1 L12.0 20.1 L11.9 20.0 L11.9 20.0 L11.9 20.0 L11.8 19.8 L11.8 19.8 L11.8 19.7 L11.7 19.5 L11.7 19.5 L11.6 19.3 L11.6 19.3 L11.6 19.2 L11.6 19.2 L11.5 19.1 L11.5 19.1 L11.5 19.0 L11.5 19.0 L11.4 18.8 L11.4 18.8 L11.3 18.7 L11.3 18.7 L11.3 18.6 L11.3 18.6 L11.3 18.5 L11.3 18.5 L11.2 18.3 L11.2 18.3 L11.1 18.1 L11.1 18.1 L11.1 18.0 L11.0 18.0 L11.0 17.9 L11.0 17.9 L11.0 17.8 L11.0 17.8 L10.9 17.7 L10.9 17.7 L10.8 17.5 L10.8 17.5 L10.8 17.4 L10.8 17.4 L10.7 17.2 L10.7 17.0 L10.6 17.0 L10.6 16.9 L10.6 16.9 L10.6 16.8 L10.5 16.8 L10.5 16.6 L10.4 16.6 L10.4 16.5 L10.4 16.4 L10.3 16.2 L10.3 16.2 L10.3 16.1 L10.2 16.1 L10.2 16.0 L10.2 16.0 L10.2 15.9 L10.1 15.8 L10.1 15.7 L10.0 15.6 L10.0 15.5 L9.9 15.3 L9.9 15.3 L9.9 15.3 L9.9 15.2 L9.8 15.0 L9.8 14.9 L13.8 14.9 L14.0 14.9 L14.3 14.8 L14.4 14.7 L14.5 14.6 L14.6 14.4 L14.7 14.3 L14.7 14.1 L14.7 13.9 L14.7 13.7 L14.6 13.6 L14.4 13.3 L2.5 1.2 L2.3 1.1 L2.2 1.0 L2.1 1.0 L2.1 1.0Z' fill='url(%23g)'/%3E%3Cpath d='M1.7 1.0 L1.7 1.0 L1.6 1.1 L1.4 1.1 L1.2 1.3 L1.1 1.5 L1.1 1.6 L1.0 1.6 L1.0 1.7 L1.0 1.8 L1.0 18.6 L1.0 18.8 L1.0 18.8 L1.1 19.0 L1.2 19.1 L1.4 19.3 L1.5 19.3 L1.6 19.3 L1.7 19.4 L1.8 19.4 L2.0 19.4 L2.2 19.4 L2.4 19.3 L2.5 19.2 L2.7 19.0 L3.2 18.6 L3.4 18.4 L3.5 18.3 L5.5 16.5 L5.6 16.5 L5.6 16.6 L5.6 16.7 L5.7 16.8 L5.7 16.8 L5.7 16.9 L5.7 16.9 L5.8 17.0 L5.8 17.0 L5.8 17.1 L5.8 17.1 L5.9 17.2 L5.9 17.2 L6.0 17.6 L6.0 17.6 L6.1 17.7 L6.1 17.7 L6.1 17.8 L6.1 17.8 L6.2 17.9 L6.2 17.9 L6.2 18.1 L6.2 18.1 L6.3 18.2 L6.3 18.2 L6.4 18.4 L6.4 18.4 L6.4 18.5 L6.5 18.6 L6.5 18.7 L6.5 18.7 L6.6 18.9 L6.6 19.1 L6.7 19.1 L6.7 19.2 L6.8 19.3 L6.8 19.3 L6.8 19.5 L6.8 19.5 L6.9 19.6 L6.9 19.7 L6.9 19.7 L6.9 19.7 L7.0 19.8 L7.0 19.9 L7.1 20.0 L7.1 20.0 L7.1 20.1 L7.1 20.2 L7.1 20.2 L7.1 20.2 L7.2 20.3 L7.2 20.4 L7.3 20.5 L7.3 20.6 L7.3 20.6 L7.3 20.7 L7.4 20.8 L7.5 21.0 L7.5 21.0 L7.5 21.1 L7.5 21.1 L7.5 21.2 L7.6 21.2 L7.6 21.4 L7.7 21.4 L7.7 21.5 L7.7 21.5 L7.7 21.6 L7.7 21.6 L7.7 21.7 L7.8 21.9 L7.8 21.9 L7.9 22.1 L7.9 22.1 L8.0 22.3 L8.0 22.3 L8.2 22.7 L8.3 22.8 L8.5 23.0 L8.6 23.0 L8.6 23.0 L8.9 23.0 L8.9 23.0 L9.0 23.0 L9.1 22.9 L9.1 22.9 L9.3 22.8 L9.3 22.8 L9.5 22.7 L9.5 22.7 L9.6 22.7 L9.6 22.7 L9.8 22.6 L9.9 22.6 L10.0 22.5 L10.0 22.5 L10.1 22.5 L10.1 22.5 L10.5 22.3 L10.5 22.3 L10.6 22.3 L10.6 22.3 L10.7 22.2 L10.9 22.1 L11.0 22.1 L11.0 22.1 L11.1 22.1 L11.1 22.1 L12.0 21.7 L12.1 21.5 L12.2 21.4 L12.3 21.3 L12.3 21.3 L12.3 21.2 L12.3 21.2 L12.3 21.0 L12.2 20.8 L12.2 20.8 L12.2 20.6 L12.1 20.6 L12.1 20.5 L12.1 20.4 L12.1 20.4 L12.0 20.3 L12.0 20.2 L12.0 20.1 L12.0 20.1 L11.9 20.0 L11.9 20.0 L11.9 20.0 L11.8 19.8 L11.8 19.8 L11.8 19.7 L11.7 19.5 L11.7 19.5 L11.6 19.3 L11.6 19.3 L11.6 19.2 L11.6 19.2 L11.5 19.1 L11.5 19.1 L11.5 19.0 L11.5 19.0 L11.4 18.8 L11.4 18.8 L11.3 18.7 L11.3 18.7 L11.3 18.6 L11.3 18.6 L11.3 18.5 L11.3 18.5 L11.2 18.3 L11.2 18.3 L11.1 18.1 L11.1 18.1 L11.1 18.0 L11.0 18.0 L11.0 17.9 L11.0 17.9 L11.0 17.8 L11.0 17.8 L10.9 17.7 L10.9 17.7 L10.8 17.5 L10.8 17.5 L10.8 17.4 L10.8 17.4 L10.7 17.2 L10.7 17.0 L10.6 17.0 L10.6 16.9 L10.6 16.9 L10.6 16.8 L10.5 16.8 L10.5 16.6 L10.4 16.6 L10.4 16.5 L10.4 16.4 L10.3 16.2 L10.3 16.2 L10.3 16.1 L10.2 16.1 L10.2 16.0 L10.2 16.0 L10.2 15.9 L10.1 15.8 L10.1 15.7 L10.0 15.6 L10.0 15.5 L9.9 15.3 L9.9 15.3 L9.9 15.3 L9.9 15.2 L9.8 15.0 L9.8 14.9 L13.8 14.9 L14.0 14.9 L14.3 14.8 L14.4 14.7 L14.5 14.6 L14.6 14.4 L14.7 14.3 L14.7 14.1 L14.7 13.9 L14.7 13.7 L14.6 13.6 L14.4 13.3 L2.5 1.2 L2.3 1.1 L2.2 1.0 L2.1 1.0 L2.1 1.0ZM2.4 3.1 L12.7 13.5 L12.7 13.6 L8.6 13.6 L8.5 13.6 L8.3 13.7 L8.2 13.8 L8.1 14.0 L8.1 14.1 L8.1 14.3 L8.1 14.5 L8.2 14.8 L8.2 14.8 L8.3 14.9 L8.3 15.0 L8.4 15.1 L8.4 15.1 L8.4 15.3 L8.5 15.4 L8.5 15.5 L8.5 15.5 L8.6 15.6 L8.6 15.6 L8.6 15.7 L8.7 15.8 L8.7 15.9 L8.7 15.9 L8.7 16.0 L8.7 16.1 L8.8 16.1 L8.8 16.1 L8.8 16.2 L8.8 16.3 L8.9 16.3 L8.9 16.4 L9.0 16.5 L9.0 16.5 L9.0 16.7 L9.0 16.7 L9.1 16.8 L9.1 16.9 L9.1 16.9 L9.1 16.9 L9.2 17.0 L9.2 17.1 L9.2 17.2 L9.3 17.3 L9.5 17.7 L9.5 17.8 L9.5 17.8 L9.5 17.9 L9.6 17.9 L9.6 18.0 L9.6 18.0 L9.6 18.1 L9.6 18.1 L9.6 18.2 L9.7 18.2 L9.7 18.3 L9.7 18.3 L9.7 18.4 L9.8 18.6 L9.8 18.6 L10.1 19.2 L10.1 19.2 L10.1 19.3 L10.1 19.3 L10.2 19.5 L10.2 19.5 L10.3 19.6 L10.3 19.8 L10.4 19.9 L10.4 19.9 L10.4 20.0 L10.4 20.0 L10.5 20.1 L10.5 20.1 L10.5 20.3 L10.5 20.3 L10.6 20.4 L10.6 20.4 L10.6 20.5 L10.6 20.5 L10.7 20.6 L10.7 20.6 L10.7 20.7 L10.7 20.7 L10.7 20.7 L10.6 20.8 L10.6 20.8 L10.4 20.9 L10.4 20.9 L10.2 20.9 L10.2 20.9 L10.1 21.0 L10.1 21.0 L10.0 21.1 L9.9 21.1 L9.7 21.2 L9.7 21.2 L9.6 21.2 L9.6 21.2 L9.6 21.2 L9.3 21.3 L9.2 21.4 L9.2 21.4 L9.2 21.4 L9.1 21.4 L9.1 21.3 L9.1 21.3 L9.0 21.1 L8.9 20.9 L8.9 20.9 L8.9 20.9 L8.9 20.8 L8.9 20.8 L8.8 20.7 L8.8 20.7 L8.7 20.5 L8.7 20.5 L8.7 20.4 L8.7 20.3 L8.6 20.3 L8.6 20.2 L8.6 20.2 L8.6 20.1 L8.5 20.0 L8.5 19.9 L8.5 19.9 L8.5 19.8 L8.4 19.8 L8.4 19.7 L8.4 19.7 L8.4 19.6 L8.3 19.5 L8.3 19.4 L8.0 18.9 L8.0 18.8 L8.0 18.8 L8.0 18.6 L7.9 18.6 L7.9 18.5 L7.9 18.4 L7.9 18.4 L7.8 18.4 L7.8 18.2 L7.7 18.1 L7.7 18.1 L7.7 17.9 L7.7 17.9 L7.6 17.7 L7.6 17.7 L7.5 17.5 L7.5 17.5 L7.4 17.3 L7.4 17.3 L7.4 17.3 L7.4 17.2 L7.3 17.1 L7.3 17.1 L7.3 17.0 L7.3 17.0 L7.2 16.9 L7.2 16.9 L7.1 16.7 L7.1 16.7 L7.1 16.6 L7.1 16.6 L7.0 16.4 L7.0 16.3 L6.9 16.2 L6.9 16.2 L6.9 16.1 L6.9 16.1 L6.8 16.0 L6.8 15.9 L6.7 15.8 L6.7 15.8 L6.7 15.6 L6.7 15.6 L6.6 15.4 L6.6 15.4 L6.5 15.3 L6.4 15.1 L6.3 14.9 L6.2 14.8 L6.0 14.7 L5.9 14.7 L5.7 14.7 L5.4 14.8 L2.4 17.4 L2.4 17.5 L2.4 17.4 L2.4 3.1Z' fill='{{STROKE}}' fill-rule='evenodd'/%3E%3C/svg%3E\") 1 1, default",
    pointer: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='{{A}}'/%3E%3Cstop offset='1' stop-color='{{B}}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M10.1 1.2 L9.7 1.4 L9.6 1.5 L9.5 1.5 L9.1 1.8 L8.8 2.1 L8.8 2.2 L8.7 2.3 L8.7 2.3 L8.5 2.5 L8.4 2.8 L8.4 2.8 L8.4 2.9 L8.2 3.3 L8.2 3.4 L8.2 3.7 L8.2 16.5 L8.1 16.5 L7.5 16.1 L7.4 16.1 L7.3 16.0 L7.2 15.9 L6.6 15.5 L6.5 15.5 L6.4 15.4 L6.2 15.3 L6.1 15.2 L6.1 15.2 L5.9 15.1 L5.9 15.1 L5.6 14.9 L5.6 14.9 L5.4 14.8 L5.4 14.8 L5.3 14.7 L5.1 14.6 L4.5 14.4 L4.4 14.4 L4.2 14.4 L3.7 14.4 L3.5 14.4 L3.3 14.4 L3.2 14.5 L3.1 14.5 L3.0 14.5 L2.9 14.5 L2.8 14.6 L2.8 14.6 L2.7 14.7 L2.5 14.7 L2.1 15.0 L1.7 15.5 L1.4 15.8 L1.4 15.8 L1.4 15.8 L1.3 16.1 L1.1 16.6 L1.1 16.6 L1.0 16.9 L1.0 17.2 L1.0 17.2 L1.0 17.8 L1.1 18.0 L1.1 18.1 L1.1 18.1 L1.1 18.2 L1.2 18.3 L1.2 18.4 L1.3 18.5 L1.3 18.5 L1.3 18.7 L1.6 19.0 L1.6 19.1 L1.6 19.1 L1.7 19.2 L1.7 19.3 L2.2 20.1 L2.3 20.3 L2.3 20.3 L2.7 20.8 L2.7 21.0 L2.8 21.0 L2.8 21.0 L2.8 21.1 L2.9 21.2 L3.3 21.8 L3.3 21.8 L3.4 22.0 L3.4 22.0 L3.4 22.0 L3.4 22.1 L3.5 22.2 L3.8 22.7 L3.8 22.8 L4.0 23.0 L4.0 23.0 L4.4 23.6 L4.4 23.7 L4.4 23.7 L4.5 23.8 L4.5 23.8 L4.6 24.0 L4.6 24.0 L4.6 24.0 L4.9 24.5 L5.0 24.5 L5.0 24.6 L5.1 24.7 L5.1 24.8 L5.4 25.3 L5.4 25.3 L5.5 25.5 L5.5 25.5 L5.6 25.6 L5.6 25.6 L5.7 25.7 L6.0 26.3 L6.0 26.3 L6.2 26.5 L6.2 26.6 L7.3 28.3 L7.7 28.8 L8.2 29.4 L8.7 29.8 L9.2 30.1 L9.3 30.1 L9.4 30.2 L9.8 30.4 L9.8 30.4 L10.0 30.5 L10.2 30.6 L10.3 30.6 L10.4 30.6 L10.5 30.7 L10.6 30.7 L10.7 30.8 L10.8 30.8 L10.9 30.8 L11.1 30.8 L11.2 30.9 L11.3 30.9 L11.5 30.9 L11.8 31.0 L11.8 31.0 L11.9 31.0 L20.1 31.0 L20.2 31.0 L20.5 30.9 L20.7 30.9 L20.8 30.9 L21.0 30.8 L21.2 30.8 L21.2 30.8 L21.3 30.8 L21.4 30.7 L21.5 30.7 L21.6 30.7 L21.7 30.6 L21.9 30.5 L22.0 30.5 L22.5 30.3 L22.9 30.0 L22.9 30.0 L23.0 30.0 L23.1 29.9 L23.1 29.9 L23.7 29.4 L24.3 28.8 L24.7 28.3 L24.9 28.1 L24.9 27.9 L25.0 27.8 L25.0 27.8 L25.0 27.7 L25.2 27.4 L25.3 27.3 L25.3 27.2 L25.4 27.0 L25.6 26.2 L25.8 25.5 L25.8 25.0 L25.8 25.0 L25.8 14.3 L25.7 13.8 L25.7 13.7 L25.7 13.6 L25.6 13.4 L25.6 13.4 L25.6 13.2 L25.4 12.9 L25.2 12.6 L24.8 12.2 L24.6 12.0 L24.3 11.8 L23.9 11.6 L23.5 11.5 L23.3 11.5 L23.2 11.4 L22.7 11.4 L22.7 11.4 L22.5 11.4 L22.4 11.5 L22.3 11.5 L22.1 11.5 L22.0 11.6 L21.9 11.6 L21.8 11.6 L21.8 11.7 L21.7 11.7 L21.6 11.7 L21.6 11.7 L21.2 11.2 L20.8 10.8 L20.6 10.7 L20.4 10.5 L20.1 10.4 L20.1 10.4 L20.0 10.3 L19.6 10.2 L19.4 10.2 L19.3 10.1 L18.6 10.1 L18.4 10.2 L18.3 10.2 L18.1 10.3 L18.1 10.3 L17.8 10.4 L17.7 10.4 L17.6 10.4 L17.4 10.0 L17.0 9.6 L16.6 9.3 L16.1 9.0 L16.1 9.0 L16.0 9.0 L15.9 9.0 L15.7 8.9 L15.7 8.9 L15.5 8.9 L15.3 8.9 L15.3 8.8 L14.6 8.9 L14.1 9.0 L14.0 8.9 L14.0 3.6 L14.0 3.4 L14.0 3.3 L13.9 3.1 L13.9 3.1 L13.9 3.0 L13.8 2.7 L13.7 2.5 L13.4 2.1 L13.0 1.7 L12.7 1.5 L12.7 1.5 L12.6 1.4 L12.3 1.2 L12.2 1.2 L12.1 1.2 L12.0 1.2 L12.0 1.1 L11.9 1.1 L11.7 1.1 L11.5 1.0 L11.5 1.0 L11.5 1.0 L10.7 1.0 L10.7 1.0 L10.5 1.1Z' fill='{{FILL}}'/%3E%3Cpath d='M10.1 1.2 L9.7 1.4 L9.6 1.5 L9.5 1.5 L9.1 1.8 L8.8 2.1 L8.8 2.2 L8.7 2.3 L8.7 2.3 L8.5 2.5 L8.4 2.8 L8.4 2.8 L8.4 2.9 L8.2 3.3 L8.2 3.4 L8.2 3.7 L8.2 16.5 L8.1 16.5 L7.5 16.1 L7.4 16.1 L7.3 16.0 L7.2 15.9 L6.6 15.5 L6.5 15.5 L6.4 15.4 L6.2 15.3 L6.1 15.2 L6.1 15.2 L5.9 15.1 L5.9 15.1 L5.6 14.9 L5.6 14.9 L5.4 14.8 L5.4 14.8 L5.3 14.7 L5.1 14.6 L4.5 14.4 L4.4 14.4 L4.2 14.4 L3.7 14.4 L3.5 14.4 L3.3 14.4 L3.2 14.5 L3.1 14.5 L3.0 14.5 L2.9 14.5 L2.8 14.6 L2.8 14.6 L2.7 14.7 L2.5 14.7 L2.1 15.0 L1.7 15.5 L1.4 15.8 L1.4 15.8 L1.4 15.8 L1.3 16.1 L1.1 16.6 L1.1 16.6 L1.0 16.9 L1.0 17.2 L1.0 17.2 L1.0 17.8 L1.1 18.0 L1.1 18.1 L1.1 18.1 L1.1 18.2 L1.2 18.3 L1.2 18.4 L1.3 18.5 L1.3 18.5 L1.3 18.7 L1.6 19.0 L1.6 19.1 L1.6 19.1 L1.7 19.2 L1.7 19.3 L2.2 20.1 L2.3 20.3 L2.3 20.3 L2.7 20.8 L2.7 21.0 L2.8 21.0 L2.8 21.0 L2.8 21.1 L2.9 21.2 L3.3 21.8 L3.3 21.8 L3.4 22.0 L3.4 22.0 L3.4 22.0 L3.4 22.1 L3.5 22.2 L3.8 22.7 L3.8 22.8 L4.0 23.0 L4.0 23.0 L4.4 23.6 L4.4 23.7 L4.4 23.7 L4.5 23.8 L4.5 23.8 L4.6 24.0 L4.6 24.0 L4.6 24.0 L4.9 24.5 L5.0 24.5 L5.0 24.6 L5.1 24.7 L5.1 24.8 L5.4 25.3 L5.4 25.3 L5.5 25.5 L5.5 25.5 L5.6 25.6 L5.6 25.6 L5.7 25.7 L6.0 26.3 L6.0 26.3 L6.2 26.5 L6.2 26.6 L7.3 28.3 L7.7 28.8 L8.2 29.4 L8.7 29.8 L9.2 30.1 L9.3 30.1 L9.4 30.2 L9.8 30.4 L9.8 30.4 L10.0 30.5 L10.2 30.6 L10.3 30.6 L10.4 30.6 L10.5 30.7 L10.6 30.7 L10.7 30.8 L10.8 30.8 L10.9 30.8 L11.1 30.8 L11.2 30.9 L11.3 30.9 L11.5 30.9 L11.8 31.0 L11.8 31.0 L11.9 31.0 L20.1 31.0 L20.2 31.0 L20.5 30.9 L20.7 30.9 L20.8 30.9 L21.0 30.8 L21.2 30.8 L21.2 30.8 L21.3 30.8 L21.4 30.7 L21.5 30.7 L21.6 30.7 L21.7 30.6 L21.9 30.5 L22.0 30.5 L22.5 30.3 L22.9 30.0 L22.9 30.0 L23.0 30.0 L23.1 29.9 L23.1 29.9 L23.7 29.4 L24.3 28.8 L24.7 28.3 L24.9 28.1 L24.9 27.9 L25.0 27.8 L25.0 27.8 L25.0 27.7 L25.2 27.4 L25.3 27.3 L25.3 27.2 L25.4 27.0 L25.6 26.2 L25.8 25.5 L25.8 25.0 L25.8 25.0 L25.8 14.3 L25.7 13.8 L25.7 13.7 L25.7 13.6 L25.6 13.4 L25.6 13.4 L25.6 13.2 L25.4 12.9 L25.2 12.6 L24.8 12.2 L24.6 12.0 L24.3 11.8 L23.9 11.6 L23.5 11.5 L23.3 11.5 L23.2 11.4 L22.7 11.4 L22.7 11.4 L22.5 11.4 L22.4 11.5 L22.3 11.5 L22.1 11.5 L22.0 11.6 L21.9 11.6 L21.8 11.6 L21.8 11.7 L21.7 11.7 L21.6 11.7 L21.6 11.7 L21.2 11.2 L20.8 10.8 L20.6 10.7 L20.4 10.5 L20.1 10.4 L20.1 10.4 L20.0 10.3 L19.6 10.2 L19.4 10.2 L19.3 10.1 L18.6 10.1 L18.4 10.2 L18.3 10.2 L18.1 10.3 L18.1 10.3 L17.8 10.4 L17.7 10.4 L17.6 10.4 L17.4 10.0 L17.0 9.6 L16.6 9.3 L16.1 9.0 L16.1 9.0 L16.0 9.0 L15.9 9.0 L15.7 8.9 L15.7 8.9 L15.5 8.9 L15.3 8.9 L15.3 8.8 L14.6 8.9 L14.1 9.0 L14.0 8.9 L14.0 3.6 L14.0 3.4 L14.0 3.3 L13.9 3.1 L13.9 3.1 L13.9 3.0 L13.8 2.7 L13.7 2.5 L13.4 2.1 L13.0 1.7 L12.7 1.5 L12.7 1.5 L12.6 1.4 L12.3 1.2 L12.2 1.2 L12.1 1.2 L12.0 1.2 L12.0 1.1 L11.9 1.1 L11.7 1.1 L11.5 1.0 L11.5 1.0 L11.5 1.0 L10.7 1.0 L10.7 1.0 L10.5 1.1ZM10.7 3.0 L10.8 3.0 L11.1 2.9 L11.4 3.0 L11.6 3.1 L11.8 3.2 L11.9 3.4 L12.0 3.6 L12.1 3.8 L12.1 11.7 L12.1 11.7 L12.1 11.8 L12.1 17.1 L12.1 17.2 L12.2 17.3 L12.2 17.4 L12.2 17.5 L12.4 17.7 L12.5 17.8 L12.8 17.9 L12.9 17.9 L13.3 17.9 L13.4 17.9 L13.5 17.9 L13.7 17.8 L13.8 17.6 L14.0 17.4 L14.0 17.2 L14.0 11.8 L14.0 11.8 L14.0 11.6 L14.1 11.4 L14.1 11.3 L14.1 11.3 L14.3 11.1 L14.5 11.0 L14.7 10.8 L14.9 10.8 L15.2 10.8 L15.4 10.8 L15.6 11.0 L15.8 11.2 L15.9 11.3 L15.9 11.4 L16.0 11.5 L16.0 11.6 L16.0 11.7 L16.0 12.8 L16.0 12.8 L16.0 17.0 L16.0 17.2 L16.1 17.4 L16.3 17.6 L16.4 17.8 L16.7 17.9 L17.1 17.9 L17.2 17.9 L17.4 17.9 L17.7 17.7 L17.8 17.5 L17.9 17.3 L18.0 17.1 L18.0 12.9 L18.0 12.7 L18.1 12.5 L18.3 12.3 L18.5 12.2 L18.6 12.1 L18.8 12.1 L19.1 12.1 L19.1 12.1 L19.3 12.1 L19.4 12.2 L19.6 12.3 L19.7 12.5 L19.8 12.7 L19.8 12.7 L19.9 12.8 L19.9 13.0 L19.9 14.0 L19.9 14.1 L19.9 17.1 L20.0 17.3 L20.0 17.4 L20.0 17.4 L20.2 17.6 L20.4 17.8 L20.6 17.9 L20.8 17.9 L21.0 17.9 L21.1 17.9 L21.3 17.9 L21.5 17.8 L21.6 17.6 L21.8 17.4 L21.8 17.3 L21.8 17.2 L21.9 17.1 L21.9 14.1 L21.9 14.0 L21.9 14.0 L22.1 13.8 L22.2 13.7 L22.4 13.5 L22.5 13.5 L22.6 13.4 L22.7 13.4 L22.7 13.4 L23.0 13.4 L23.0 13.4 L23.1 13.4 L23.4 13.5 L23.7 13.8 L23.8 14.0 L23.8 14.2 L23.8 25.2 L23.8 25.5 L23.8 25.6 L23.7 25.8 L23.7 25.9 L23.7 26.0 L23.7 26.1 L23.6 26.2 L23.6 26.2 L23.6 26.3 L23.5 26.4 L23.5 26.5 L23.5 26.5 L23.2 27.1 L22.9 27.4 L22.6 27.8 L22.1 28.2 L21.6 28.5 L21.2 28.7 L21.2 28.7 L21.1 28.8 L20.5 29.0 L20.4 29.0 L20.2 29.0 L19.7 29.1 L19.6 29.1 L12.4 29.1 L12.3 29.1 L11.8 29.0 L11.2 28.9 L10.7 28.7 L10.3 28.5 L9.9 28.3 L9.5 27.9 L9.2 27.7 L8.9 27.3 L8.7 26.9 L8.7 26.9 L8.3 26.3 L8.3 26.3 L8.3 26.2 L8.2 26.2 L8.2 26.1 L8.1 26.0 L8.1 25.9 L7.8 25.4 L7.8 25.4 L7.6 25.2 L7.6 25.2 L7.5 25.0 L7.5 25.0 L7.4 24.8 L6.6 23.6 L6.5 23.4 L6.5 23.4 L6.2 22.8 L6.1 22.8 L6.1 22.7 L6.1 22.6 L6.1 22.6 L5.9 22.5 L5.9 22.4 L5.6 21.9 L5.6 21.9 L5.5 21.7 L5.5 21.7 L5.4 21.5 L5.4 21.5 L5.2 21.3 L4.5 20.1 L4.4 19.9 L4.4 19.9 L4.0 19.3 L4.0 19.2 L3.9 19.2 L3.9 19.1 L3.9 19.1 L3.8 18.9 L3.8 18.9 L3.7 18.9 L3.0 17.7 L2.9 17.5 L2.9 17.1 L3.0 16.9 L3.1 16.7 L3.4 16.5 L3.6 16.4 L3.8 16.3 L4.2 16.3 L4.4 16.4 L4.7 16.6 L4.7 16.6 L4.9 16.7 L5.5 17.1 L5.6 17.2 L5.7 17.2 L5.8 17.3 L5.9 17.3 L6.0 17.4 L6.6 17.8 L6.7 17.9 L6.8 17.9 L6.9 18.0 L7.0 18.0 L7.1 18.1 L7.2 18.2 L8.0 18.7 L8.2 18.8 L8.3 18.9 L8.4 18.9 L8.7 19.2 L8.7 19.2 L8.8 19.2 L8.9 19.2 L9.0 19.3 L9.2 19.3 L9.4 19.2 L9.5 19.2 L9.8 19.1 L9.9 18.9 L10.0 18.7 L10.0 18.7 L10.1 18.6 L10.1 18.5 L10.1 18.4 L10.1 18.1 L10.1 18.1 L10.1 3.9 L10.2 3.7 L10.2 3.6 L10.3 3.4 L10.5 3.1Z' fill='{{STROKE}}' fill-rule='evenodd'/%3E%3C/svg%3E\") 11 2, pointer",
    grab: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='{{A}}'/%3E%3Cstop offset='1' stop-color='{{B}}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M15.9 1.0 L15.9 1.0 L15.7 1.1 L15.6 1.1 L15.5 1.1 L15.4 1.2 L15.3 1.2 L14.9 1.4 L14.8 1.4 L14.7 1.5 L14.5 1.6 L14.1 2.0 L13.9 2.3 L13.8 2.5 L13.7 2.6 L13.5 2.5 L13.5 2.5 L13.4 2.5 L13.3 2.5 L13.2 2.4 L13.1 2.4 L13.0 2.3 L12.8 2.3 L12.7 2.3 L12.6 2.3 L12.6 2.3 L12.2 2.3 L12.2 2.3 L12.1 2.3 L12.0 2.3 L11.9 2.3 L11.7 2.4 L11.6 2.4 L11.4 2.5 L11.3 2.5 L11.0 2.7 L10.9 2.8 L10.8 2.8 L10.5 3.1 L10.1 3.4 L9.8 3.8 L9.7 4.1 L9.7 4.2 L9.6 4.5 L9.6 4.5 L9.5 4.7 L9.5 5.2 L9.5 5.2 L9.5 13.6 L9.5 13.7 L9.4 13.7 L9.2 13.7 L8.8 13.8 L8.7 13.8 L8.5 13.8 L8.4 13.9 L8.3 13.9 L8.2 13.9 L8.1 13.9 L8.0 14.0 L7.9 14.0 L7.9 14.0 L7.8 14.1 L7.7 14.1 L7.3 14.3 L7.2 14.4 L7.2 14.4 L6.7 14.7 L6.4 15.0 L6.1 15.2 L5.9 15.5 L5.5 16.1 L5.2 16.6 L5.2 16.7 L5.2 16.7 L5.2 16.8 L5.1 17.1 L4.9 17.7 L4.9 18.1 L4.9 18.2 L4.9 19.0 L4.9 19.3 L4.9 19.7 L5.0 20.1 L5.0 20.4 L5.1 21.0 L5.1 21.2 L5.2 21.7 L5.3 21.8 L5.4 22.2 L5.4 22.3 L5.4 22.4 L5.4 22.6 L5.5 22.9 L5.5 22.9 L5.6 23.1 L5.6 23.2 L5.6 23.2 L5.7 23.3 L5.7 23.4 L5.8 23.7 L5.8 23.8 L5.8 23.8 L5.9 23.9 L5.9 24.0 L5.9 24.0 L6.0 24.2 L6.1 24.4 L6.1 24.4 L6.1 24.5 L6.1 24.6 L6.3 24.9 L6.5 25.4 L6.6 25.6 L6.7 25.8 L6.8 25.8 L6.8 25.9 L6.8 25.9 L6.8 26.0 L7.1 26.4 L7.4 26.9 L7.8 27.5 L8.3 28.1 L8.7 28.5 L9.2 28.9 L9.6 29.3 L10.1 29.7 L10.5 29.9 L11.1 30.3 L11.3 30.4 L11.4 30.4 L11.6 30.5 L11.6 30.5 L11.7 30.6 L11.8 30.6 L11.9 30.6 L11.9 30.7 L12.2 30.8 L12.3 30.8 L12.4 30.8 L12.4 30.8 L12.8 30.9 L13.2 31.0 L13.2 31.0 L21.4 31.0 L21.5 31.0 L21.8 30.9 L22.0 30.9 L22.1 30.9 L22.3 30.8 L22.4 30.8 L23.0 30.6 L23.0 30.6 L23.1 30.6 L23.3 30.5 L23.4 30.5 L23.5 30.4 L23.5 30.4 L23.7 30.3 L23.8 30.3 L23.8 30.2 L23.9 30.2 L24.2 30.0 L24.3 29.9 L24.4 29.9 L24.8 29.6 L25.4 29.1 L25.7 28.8 L25.9 28.4 L26.1 28.1 L26.3 27.8 L26.3 27.8 L26.5 27.4 L26.6 27.3 L26.6 27.2 L26.6 27.1 L26.7 26.9 L26.7 26.8 L26.8 26.6 L26.9 26.4 L26.9 26.3 L26.9 26.2 L27.0 26.0 L27.0 25.9 L27.0 25.7 L27.0 25.5 L27.1 25.4 L27.1 25.1 L27.1 25.0 L27.1 7.7 L27.1 7.7 L27.1 7.5 L27.0 7.4 L27.0 7.2 L27.0 7.1 L27.0 7.0 L26.9 6.9 L26.9 6.7 L26.7 6.4 L26.6 6.3 L26.6 6.2 L26.4 5.9 L26.1 5.6 L25.9 5.5 L25.6 5.3 L25.0 5.0 L24.5 4.9 L24.2 4.9 L24.2 4.9 L23.8 4.9 L23.3 5.0 L23.2 5.1 L23.1 5.1 L23.0 5.1 L23.0 5.0 L23.0 4.9 L23.0 4.8 L22.8 4.4 L22.6 4.1 L22.2 3.7 L21.9 3.5 L21.8 3.4 L21.7 3.3 L21.7 3.3 L21.5 3.2 L21.4 3.2 L21.4 3.2 L21.3 3.2 L21.2 3.1 L20.8 3.0 L20.5 3.0 L20.2 2.9 L20.2 3.0 L20.0 3.0 L19.9 3.0 L19.7 3.0 L19.6 3.1 L19.4 3.1 L19.2 3.2 L19.2 3.2 L19.1 3.1 L19.1 3.0 L19.1 2.9 L19.1 2.9 L18.9 2.6 L18.7 2.3 L18.5 2.0 L18.3 1.7 L18.0 1.5 L17.6 1.3 L17.6 1.3 L17.3 1.2 L17.0 1.1 L16.8 1.0 L16.7 1.0 L16.7 1.0Z' fill='{{FILL}}'/%3E%3Cpath d='M15.9 1.0 L15.9 1.0 L15.7 1.1 L15.6 1.1 L15.5 1.1 L15.4 1.2 L15.3 1.2 L14.9 1.4 L14.8 1.4 L14.7 1.5 L14.5 1.6 L14.1 2.0 L13.9 2.3 L13.8 2.5 L13.7 2.6 L13.5 2.5 L13.5 2.5 L13.4 2.5 L13.3 2.5 L13.2 2.4 L13.1 2.4 L13.0 2.3 L12.8 2.3 L12.7 2.3 L12.6 2.3 L12.6 2.3 L12.2 2.3 L12.2 2.3 L12.1 2.3 L12.0 2.3 L11.9 2.3 L11.7 2.4 L11.6 2.4 L11.4 2.5 L11.3 2.5 L11.0 2.7 L10.9 2.8 L10.8 2.8 L10.5 3.1 L10.1 3.4 L9.8 3.8 L9.7 4.1 L9.7 4.2 L9.6 4.5 L9.6 4.5 L9.5 4.7 L9.5 5.2 L9.5 5.2 L9.5 13.6 L9.5 13.7 L9.4 13.7 L9.2 13.7 L8.8 13.8 L8.7 13.8 L8.5 13.8 L8.4 13.9 L8.3 13.9 L8.2 13.9 L8.1 13.9 L8.0 14.0 L7.9 14.0 L7.9 14.0 L7.8 14.1 L7.7 14.1 L7.3 14.3 L7.2 14.4 L7.2 14.4 L6.7 14.7 L6.4 15.0 L6.1 15.2 L5.9 15.5 L5.5 16.1 L5.2 16.6 L5.2 16.7 L5.2 16.7 L5.2 16.8 L5.1 17.1 L4.9 17.7 L4.9 18.1 L4.9 18.2 L4.9 19.0 L4.9 19.3 L4.9 19.7 L5.0 20.1 L5.0 20.4 L5.1 21.0 L5.1 21.2 L5.2 21.7 L5.3 21.8 L5.4 22.2 L5.4 22.3 L5.4 22.4 L5.4 22.6 L5.5 22.9 L5.5 22.9 L5.6 23.1 L5.6 23.2 L5.6 23.2 L5.7 23.3 L5.7 23.4 L5.8 23.7 L5.8 23.8 L5.8 23.8 L5.9 23.9 L5.9 24.0 L5.9 24.0 L6.0 24.2 L6.1 24.4 L6.1 24.4 L6.1 24.5 L6.1 24.6 L6.3 24.9 L6.5 25.4 L6.6 25.6 L6.7 25.8 L6.8 25.8 L6.8 25.9 L6.8 25.9 L6.8 26.0 L7.1 26.4 L7.4 26.9 L7.8 27.5 L8.3 28.1 L8.7 28.5 L9.2 28.9 L9.6 29.3 L10.1 29.7 L10.5 29.9 L11.1 30.3 L11.3 30.4 L11.4 30.4 L11.6 30.5 L11.6 30.5 L11.7 30.6 L11.8 30.6 L11.9 30.6 L11.9 30.7 L12.2 30.8 L12.3 30.8 L12.4 30.8 L12.4 30.8 L12.8 30.9 L13.2 31.0 L13.2 31.0 L21.4 31.0 L21.5 31.0 L21.8 30.9 L22.0 30.9 L22.1 30.9 L22.3 30.8 L22.4 30.8 L23.0 30.6 L23.0 30.6 L23.1 30.6 L23.3 30.5 L23.4 30.5 L23.5 30.4 L23.5 30.4 L23.7 30.3 L23.8 30.3 L23.8 30.2 L23.9 30.2 L24.2 30.0 L24.3 29.9 L24.4 29.9 L24.8 29.6 L25.4 29.1 L25.7 28.8 L25.9 28.4 L26.1 28.1 L26.3 27.8 L26.3 27.8 L26.5 27.4 L26.6 27.3 L26.6 27.2 L26.6 27.1 L26.7 26.9 L26.7 26.8 L26.8 26.6 L26.9 26.4 L26.9 26.3 L26.9 26.2 L27.0 26.0 L27.0 25.9 L27.0 25.7 L27.0 25.5 L27.1 25.4 L27.1 25.1 L27.1 25.0 L27.1 7.7 L27.1 7.7 L27.1 7.5 L27.0 7.4 L27.0 7.2 L27.0 7.1 L27.0 7.0 L26.9 6.9 L26.9 6.7 L26.7 6.4 L26.6 6.3 L26.6 6.2 L26.4 5.9 L26.1 5.6 L25.9 5.5 L25.6 5.3 L25.0 5.0 L24.5 4.9 L24.2 4.9 L24.2 4.9 L23.8 4.9 L23.3 5.0 L23.2 5.1 L23.1 5.1 L23.0 5.1 L23.0 5.0 L23.0 4.9 L23.0 4.8 L22.8 4.4 L22.6 4.1 L22.2 3.7 L21.9 3.5 L21.8 3.4 L21.7 3.3 L21.7 3.3 L21.5 3.2 L21.4 3.2 L21.4 3.2 L21.3 3.2 L21.2 3.1 L20.8 3.0 L20.5 3.0 L20.2 2.9 L20.2 3.0 L20.0 3.0 L19.9 3.0 L19.7 3.0 L19.6 3.1 L19.4 3.1 L19.2 3.2 L19.2 3.2 L19.1 3.1 L19.1 3.0 L19.1 2.9 L19.1 2.9 L18.9 2.6 L18.7 2.3 L18.5 2.0 L18.3 1.7 L18.0 1.5 L17.6 1.3 L17.6 1.3 L17.3 1.2 L17.0 1.1 L16.8 1.0 L16.7 1.0 L16.7 1.0ZM16.0 3.0 L16.3 2.9 L16.5 2.9 L16.7 3.0 L16.9 3.1 L17.1 3.3 L17.3 3.6 L17.3 3.8 L17.3 17.1 L17.4 17.3 L17.4 17.5 L17.5 17.6 L17.7 17.7 L17.9 17.9 L18.1 17.9 L18.4 17.9 L18.5 17.9 L18.7 17.9 L18.9 17.7 L19.1 17.5 L19.2 17.4 L19.2 17.2 L19.2 17.1 L19.3 5.9 L19.3 5.6 L19.4 5.4 L19.6 5.1 L19.8 5.0 L20.0 4.9 L20.2 4.9 L20.2 4.9 L20.4 4.9 L20.6 5.0 L20.8 5.1 L21.0 5.3 L21.1 5.4 L21.2 5.6 L21.2 5.8 L21.2 7.8 L21.2 7.8 L21.2 7.9 L21.2 17.0 L21.2 17.2 L21.3 17.3 L21.3 17.4 L21.5 17.6 L21.7 17.8 L22.0 17.9 L22.1 17.9 L22.4 17.9 L22.7 17.8 L23.0 17.6 L23.1 17.4 L23.2 17.2 L23.2 7.9 L23.2 7.9 L23.2 7.7 L23.2 7.5 L23.4 7.2 L23.5 7.1 L23.7 7.0 L23.8 6.9 L24.0 6.9 L24.3 6.9 L24.5 6.9 L24.6 7.0 L24.8 7.1 L25.0 7.3 L25.1 7.6 L25.1 7.7 L25.1 25.0 L25.1 25.0 L25.1 25.4 L25.0 25.9 L24.9 26.2 L24.9 26.3 L24.9 26.3 L24.8 26.4 L24.8 26.5 L24.8 26.5 L24.7 26.6 L24.6 26.9 L24.6 26.9 L24.4 27.2 L24.1 27.6 L23.6 28.1 L23.3 28.3 L23.0 28.5 L23.0 28.5 L22.9 28.6 L22.5 28.7 L22.5 28.7 L22.4 28.8 L21.8 29.0 L21.7 29.0 L21.5 29.0 L21.0 29.1 L21.0 29.1 L13.6 29.1 L13.2 29.0 L13.0 29.0 L12.9 28.9 L12.8 28.9 L12.6 28.8 L12.1 28.7 L11.6 28.4 L11.3 28.1 L10.5 27.5 L10.1 27.1 L9.7 26.6 L9.0 25.8 L8.7 25.3 L8.7 25.2 L8.6 25.2 L8.5 24.9 L8.4 24.9 L8.4 24.8 L8.3 24.7 L8.3 24.6 L8.1 24.2 L7.8 23.5 L7.8 23.5 L7.7 23.3 L7.7 23.2 L7.6 23.0 L7.6 22.9 L7.4 22.6 L7.4 22.5 L7.3 22.2 L7.3 22.1 L7.3 22.0 L7.3 21.9 L7.2 21.5 L7.2 21.4 L7.1 21.2 L7.1 21.1 L7.1 20.9 L7.0 20.8 L7.0 20.5 L7.0 20.4 L6.9 20.0 L6.9 19.8 L6.9 19.5 L6.9 19.3 L6.9 19.2 L6.9 18.1 L6.9 18.0 L6.9 17.9 L6.9 17.7 L7.1 17.3 L7.2 17.0 L7.3 16.9 L7.3 16.9 L7.5 16.6 L7.8 16.3 L8.1 16.1 L8.4 15.9 L8.6 15.8 L8.7 15.8 L9.0 15.7 L9.4 15.7 L9.5 15.7 L9.5 15.7 L9.5 15.8 L9.5 18.3 L9.5 18.4 L9.5 18.5 L9.5 18.6 L9.6 18.8 L9.9 19.1 L10.1 19.2 L10.4 19.3 L10.5 19.3 L10.7 19.2 L10.9 19.1 L11.1 19.0 L11.3 18.8 L11.4 18.6 L11.4 18.5 L11.4 18.4 L11.4 15.0 L11.4 15.0 L11.4 14.4 L11.4 14.4 L11.4 5.2 L11.4 5.0 L11.6 4.6 L11.9 4.4 L12.0 4.3 L12.1 4.3 L12.2 4.3 L12.3 4.3 L12.6 4.3 L12.8 4.3 L12.8 4.3 L12.9 4.4 L13.2 4.6 L13.3 4.7 L13.4 5.0 L13.4 6.5 L13.4 6.5 L13.4 6.6 L13.4 17.0 L13.4 17.0 L13.4 17.1 L13.4 17.2 L13.4 17.3 L13.6 17.6 L13.8 17.8 L13.9 17.8 L14.1 17.9 L14.5 17.9 L14.6 17.9 L14.7 17.9 L14.8 17.9 L15.0 17.7 L15.1 17.6 L15.2 17.4 L15.3 17.3 L15.3 17.1 L15.3 6.5 L15.4 6.2 L15.3 3.9 L15.4 3.7 L15.5 3.4 L15.6 3.3 L15.9 3.1Z' fill='{{STROKE}}' fill-rule='evenodd'/%3E%3C/svg%3E\") 16 16, grab",
    grabbing: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='{{A}}'/%3E%3Cstop offset='1' stop-color='{{B}}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M14.5 1.1 L14.4 1.1 L14.0 1.2 L13.6 1.4 L13.6 1.4 L13.1 1.6 L12.7 2.0 L12.3 2.4 L12.0 2.8 L12.0 2.9 L12.0 3.0 L11.9 3.1 L11.9 3.1 L11.8 3.2 L11.8 3.3 L11.8 3.3 L11.7 3.3 L11.7 3.3 L11.4 3.1 L11.2 3.1 L11.2 3.1 L11.1 3.0 L11.0 3.0 L11.0 2.9 L10.7 2.9 L10.6 2.9 L10.4 2.8 L9.8 2.8 L9.7 2.8 L9.5 2.8 L9.3 2.8 L9.1 2.8 L9.0 2.9 L8.9 2.9 L8.7 2.9 L8.4 3.1 L7.9 3.3 L7.4 3.7 L7.1 4.0 L6.9 4.3 L6.7 4.7 L6.5 5.2 L6.3 5.7 L6.3 5.9 L6.3 6.0 L6.3 6.2 L6.3 6.2 L6.3 10.3 L4.6 12.1 L4.1 12.6 L3.8 13.1 L3.8 13.1 L3.5 13.5 L3.4 13.7 L3.3 13.9 L3.3 14.0 L3.2 14.1 L3.2 14.1 L3.2 14.2 L3.2 14.3 L3.1 14.3 L3.1 14.4 L3.0 14.7 L3.0 14.8 L2.9 15.0 L2.9 15.1 L2.9 15.2 L2.9 15.4 L2.8 15.6 L2.8 16.1 L2.8 16.1 L2.8 16.3 L2.8 16.4 L2.8 19.2 L2.8 19.2 L2.8 19.7 L2.8 19.8 L2.8 19.9 L2.9 20.2 L2.9 20.3 L2.9 20.5 L2.9 20.6 L3.1 21.0 L3.1 21.1 L3.2 21.4 L3.2 21.4 L3.2 21.5 L3.3 21.6 L3.5 22.0 L3.8 22.6 L4.1 23.0 L4.4 23.3 L6.3 25.2 L8.6 27.5 L9.1 27.9 L9.7 28.3 L10.1 28.7 L10.2 28.7 L10.2 28.7 L10.7 29.1 L10.9 29.1 L11.3 29.4 L11.9 29.7 L12.0 29.7 L12.1 29.8 L12.1 29.8 L12.2 29.8 L12.2 29.8 L12.3 29.9 L12.4 29.9 L12.5 29.9 L12.5 29.9 L12.8 30.1 L13.0 30.1 L13.1 30.2 L13.1 30.2 L13.2 30.2 L13.3 30.2 L13.4 30.3 L13.7 30.4 L13.8 30.4 L13.8 30.4 L14.2 30.5 L14.2 30.5 L14.3 30.6 L14.5 30.6 L14.6 30.6 L14.7 30.6 L14.9 30.7 L15.0 30.7 L15.1 30.8 L15.3 30.8 L15.5 30.8 L15.6 30.8 L15.9 30.9 L16.1 30.9 L16.4 30.9 L16.9 31.0 L16.9 31.0 L17.0 31.0 L18.5 31.0 L18.5 31.0 L18.6 31.0 L19.0 30.9 L19.3 30.9 L19.5 30.9 L19.6 30.8 L19.8 30.8 L19.9 30.8 L20.1 30.8 L20.2 30.7 L20.3 30.7 L20.5 30.6 L20.6 30.6 L20.7 30.6 L20.8 30.6 L20.9 30.5 L21.3 30.5 L21.3 30.4 L21.6 30.3 L21.6 30.3 L21.8 30.3 L21.8 30.3 L21.9 30.2 L22.0 30.2 L22.0 30.2 L22.1 30.1 L22.2 30.1 L23.1 29.7 L23.2 29.7 L23.7 29.3 L23.7 29.3 L23.8 29.3 L24.0 29.1 L24.2 29.1 L25.1 28.4 L25.9 27.7 L26.4 27.1 L26.7 26.7 L26.8 26.6 L27.2 26.0 L27.9 24.9 L28.0 24.6 L28.4 23.9 L28.4 23.8 L28.4 23.8 L28.4 23.7 L28.5 23.6 L28.6 23.4 L28.6 23.3 L28.6 23.2 L28.6 23.2 L28.7 23.1 L28.7 23.0 L28.7 22.9 L28.8 22.8 L28.8 22.7 L28.8 22.6 L28.8 22.4 L28.9 22.3 L28.9 22.2 L29.0 21.9 L29.0 21.7 L29.1 21.6 L29.1 21.4 L29.2 20.7 L29.2 20.5 L29.2 20.1 L29.2 19.7 L29.2 19.7 L29.2 8.0 L29.2 7.4 L29.1 7.2 L29.1 7.2 L29.1 7.0 L29.1 7.0 L28.9 6.7 L28.9 6.6 L28.8 6.4 L28.7 6.2 L28.7 6.2 L28.5 5.9 L28.2 5.5 L27.7 5.2 L27.5 5.0 L27.4 5.0 L27.4 4.9 L27.2 4.9 L27.1 4.8 L27.1 4.8 L26.8 4.7 L26.7 4.7 L26.4 4.6 L25.9 4.5 L25.6 4.5 L25.4 4.6 L25.1 4.6 L24.9 4.6 L24.9 4.6 L24.6 4.7 L24.4 4.8 L24.3 4.8 L24.2 4.9 L24.2 4.9 L23.8 5.1 L23.7 5.1 L23.7 5.0 L23.7 4.9 L23.6 4.7 L23.6 4.7 L23.3 4.2 L23.3 4.2 L22.9 3.8 L22.4 3.4 L21.9 3.1 L21.9 3.1 L21.5 2.9 L21.4 2.9 L21.0 2.8 L20.4 2.8 L19.8 2.8 L19.7 2.9 L19.3 2.9 L19.2 3.0 L19.2 3.0 L19.1 3.1 L18.9 3.1 L18.8 3.2 L18.6 3.3 L18.5 3.3 L18.5 3.3 L18.4 3.3 L18.4 3.2 L18.4 3.2 L18.3 3.1 L18.3 3.0 L18.3 3.0 L18.2 2.8 L18.2 2.8 L18.0 2.5 L17.6 2.0 L17.2 1.6 L16.8 1.5 L16.8 1.4 L16.2 1.2 L16.1 1.2 L16.0 1.1 L15.9 1.1 L15.8 1.1 L15.5 1.0 L15.4 1.0 L14.8 1.0 L14.8 1.0Z' fill='{{FILL}}'/%3E%3Cpath d='M14.5 1.1 L14.4 1.1 L14.0 1.2 L13.6 1.4 L13.6 1.4 L13.1 1.6 L12.7 2.0 L12.3 2.4 L12.0 2.8 L12.0 2.9 L12.0 3.0 L11.9 3.1 L11.9 3.1 L11.8 3.2 L11.8 3.3 L11.8 3.3 L11.7 3.3 L11.7 3.3 L11.4 3.1 L11.2 3.1 L11.2 3.1 L11.1 3.0 L11.0 3.0 L11.0 2.9 L10.7 2.9 L10.6 2.9 L10.4 2.8 L9.8 2.8 L9.7 2.8 L9.5 2.8 L9.3 2.8 L9.1 2.8 L9.0 2.9 L8.9 2.9 L8.7 2.9 L8.4 3.1 L7.9 3.3 L7.4 3.7 L7.1 4.0 L6.9 4.3 L6.7 4.7 L6.5 5.2 L6.3 5.7 L6.3 5.9 L6.3 6.0 L6.3 6.2 L6.3 6.2 L6.3 10.3 L4.6 12.1 L4.1 12.6 L3.8 13.1 L3.8 13.1 L3.5 13.5 L3.4 13.7 L3.3 13.9 L3.3 14.0 L3.2 14.1 L3.2 14.1 L3.2 14.2 L3.2 14.3 L3.1 14.3 L3.1 14.4 L3.0 14.7 L3.0 14.8 L2.9 15.0 L2.9 15.1 L2.9 15.2 L2.9 15.4 L2.8 15.6 L2.8 16.1 L2.8 16.1 L2.8 16.3 L2.8 16.4 L2.8 19.2 L2.8 19.2 L2.8 19.7 L2.8 19.8 L2.8 19.9 L2.9 20.2 L2.9 20.3 L2.9 20.5 L2.9 20.6 L3.1 21.0 L3.1 21.1 L3.2 21.4 L3.2 21.4 L3.2 21.5 L3.3 21.6 L3.5 22.0 L3.8 22.6 L4.1 23.0 L4.4 23.3 L6.3 25.2 L8.6 27.5 L9.1 27.9 L9.7 28.3 L10.1 28.7 L10.2 28.7 L10.2 28.7 L10.7 29.1 L10.9 29.1 L11.3 29.4 L11.9 29.7 L12.0 29.7 L12.1 29.8 L12.1 29.8 L12.2 29.8 L12.2 29.8 L12.3 29.9 L12.4 29.9 L12.5 29.9 L12.5 29.9 L12.8 30.1 L13.0 30.1 L13.1 30.2 L13.1 30.2 L13.2 30.2 L13.3 30.2 L13.4 30.3 L13.7 30.4 L13.8 30.4 L13.8 30.4 L14.2 30.5 L14.2 30.5 L14.3 30.6 L14.5 30.6 L14.6 30.6 L14.7 30.6 L14.9 30.7 L15.0 30.7 L15.1 30.8 L15.3 30.8 L15.5 30.8 L15.6 30.8 L15.9 30.9 L16.1 30.9 L16.4 30.9 L16.9 31.0 L16.9 31.0 L17.0 31.0 L18.5 31.0 L18.5 31.0 L18.6 31.0 L19.0 30.9 L19.3 30.9 L19.5 30.9 L19.6 30.8 L19.8 30.8 L19.9 30.8 L20.1 30.8 L20.2 30.7 L20.3 30.7 L20.5 30.6 L20.6 30.6 L20.7 30.6 L20.8 30.6 L20.9 30.5 L21.3 30.5 L21.3 30.4 L21.6 30.3 L21.6 30.3 L21.8 30.3 L21.8 30.3 L21.9 30.2 L22.0 30.2 L22.0 30.2 L22.1 30.1 L22.2 30.1 L23.1 29.7 L23.2 29.7 L23.7 29.3 L23.7 29.3 L23.8 29.3 L24.0 29.1 L24.2 29.1 L25.1 28.4 L25.9 27.7 L26.4 27.1 L26.7 26.7 L26.8 26.6 L27.2 26.0 L27.9 24.9 L28.0 24.6 L28.4 23.9 L28.4 23.8 L28.4 23.8 L28.4 23.7 L28.5 23.6 L28.6 23.4 L28.6 23.3 L28.6 23.2 L28.6 23.2 L28.7 23.1 L28.7 23.0 L28.7 22.9 L28.8 22.8 L28.8 22.7 L28.8 22.6 L28.8 22.4 L28.9 22.3 L28.9 22.2 L29.0 21.9 L29.0 21.7 L29.1 21.6 L29.1 21.4 L29.2 20.7 L29.2 20.5 L29.2 20.1 L29.2 19.7 L29.2 19.7 L29.2 8.0 L29.2 7.4 L29.1 7.2 L29.1 7.2 L29.1 7.0 L29.1 7.0 L28.9 6.7 L28.9 6.6 L28.8 6.4 L28.7 6.2 L28.7 6.2 L28.5 5.9 L28.2 5.5 L27.7 5.2 L27.5 5.0 L27.4 5.0 L27.4 4.9 L27.2 4.9 L27.1 4.8 L27.1 4.8 L26.8 4.7 L26.7 4.7 L26.4 4.6 L25.9 4.5 L25.6 4.5 L25.4 4.6 L25.1 4.6 L24.9 4.6 L24.9 4.6 L24.6 4.7 L24.4 4.8 L24.3 4.8 L24.2 4.9 L24.2 4.9 L23.8 5.1 L23.7 5.1 L23.7 5.0 L23.7 4.9 L23.6 4.7 L23.6 4.7 L23.3 4.2 L23.3 4.2 L22.9 3.8 L22.4 3.4 L21.9 3.1 L21.9 3.1 L21.5 2.9 L21.4 2.9 L21.0 2.8 L20.4 2.8 L19.8 2.8 L19.7 2.9 L19.3 2.9 L19.2 3.0 L19.2 3.0 L19.1 3.1 L18.9 3.1 L18.8 3.2 L18.6 3.3 L18.5 3.3 L18.5 3.3 L18.4 3.3 L18.4 3.2 L18.4 3.2 L18.3 3.1 L18.3 3.0 L18.3 3.0 L18.2 2.8 L18.2 2.8 L18.0 2.5 L17.6 2.0 L17.2 1.6 L16.8 1.5 L16.8 1.4 L16.2 1.2 L16.1 1.2 L16.0 1.1 L15.9 1.1 L15.8 1.1 L15.5 1.0 L15.4 1.0 L14.8 1.0 L14.8 1.0ZM14.7 2.8 L15.1 2.7 L15.6 2.8 L15.9 2.9 L15.9 3.0 L16.1 3.1 L16.4 3.3 L16.6 3.6 L16.8 3.9 L16.8 3.9 L16.9 4.2 L16.9 4.4 L16.9 9.0 L16.9 9.3 L17.0 9.4 L17.2 9.6 L17.5 9.8 L17.7 9.8 L17.9 9.8 L18.1 9.8 L18.3 9.6 L18.5 9.4 L18.6 9.3 L18.6 9.3 L18.6 9.1 L18.6 8.9 L18.6 8.9 L18.6 6.3 L18.6 6.3 L18.7 5.9 L18.7 5.7 L18.8 5.6 L18.9 5.4 L18.9 5.4 L18.9 5.3 L19.1 5.1 L19.5 4.8 L19.8 4.6 L19.9 4.6 L20.0 4.6 L20.2 4.5 L20.3 4.5 L20.5 4.5 L20.6 4.5 L20.8 4.6 L21.0 4.6 L21.1 4.6 L21.4 4.8 L21.6 5.0 L21.9 5.3 L22.0 5.6 L22.2 6.0 L22.2 6.2 L22.2 6.3 L22.2 6.3 L22.2 8.9 L22.2 9.2 L22.3 9.3 L22.4 9.5 L22.5 9.6 L22.8 9.8 L23.0 9.8 L23.2 9.8 L23.3 9.8 L23.6 9.7 L23.7 9.6 L23.8 9.5 L23.8 9.3 L23.9 9.1 L23.9 9.0 L23.9 8.0 L24.0 7.9 L24.0 7.7 L24.1 7.3 L24.2 7.2 L24.2 7.1 L24.4 6.9 L24.7 6.6 L25.0 6.4 L25.0 6.4 L25.1 6.4 L25.3 6.3 L25.3 6.3 L25.4 6.3 L25.7 6.3 L26.1 6.3 L26.4 6.4 L26.8 6.7 L27.1 7.0 L27.3 7.2 L27.4 7.4 L27.4 7.5 L27.4 7.6 L27.5 7.8 L27.5 8.0 L27.5 19.7 L27.5 19.7 L27.5 20.2 L27.4 20.2 L27.4 20.6 L27.4 20.8 L27.4 20.9 L27.3 21.2 L27.3 21.4 L27.3 21.5 L27.3 21.6 L27.2 21.8 L27.2 21.8 L27.2 21.9 L27.1 22.1 L27.1 22.2 L27.1 22.4 L27.0 22.4 L27.0 22.5 L27.0 22.6 L27.0 22.7 L26.9 22.7 L26.9 22.8 L26.9 22.9 L26.9 23.0 L26.7 23.2 L26.7 23.3 L26.6 23.5 L26.3 24.2 L26.3 24.2 L26.1 24.4 L25.9 24.9 L25.9 24.9 L25.2 25.8 L24.8 26.2 L24.5 26.6 L24.0 27.0 L23.2 27.6 L23.1 27.6 L23.1 27.7 L22.4 28.1 L22.1 28.2 L22.0 28.3 L21.7 28.4 L20.6 28.8 L20.5 28.8 L20.3 28.9 L20.3 28.9 L20.1 29.0 L20.0 29.0 L19.9 29.0 L19.8 29.0 L19.6 29.1 L19.5 29.1 L19.3 29.1 L19.1 29.1 L18.8 29.2 L18.6 29.2 L18.6 29.2 L17.7 29.3 L17.7 29.2 L17.4 29.2 L17.4 29.2 L16.9 29.2 L16.9 29.2 L16.5 29.2 L16.3 29.1 L16.1 29.1 L15.9 29.1 L15.8 29.1 L15.6 29.0 L15.4 29.0 L15.3 29.0 L15.2 29.0 L15.0 28.9 L14.9 28.9 L14.8 28.8 L14.7 28.8 L14.5 28.8 L14.5 28.8 L14.3 28.7 L14.2 28.7 L14.0 28.6 L13.9 28.6 L13.8 28.6 L13.7 28.5 L13.7 28.5 L13.2 28.4 L12.9 28.2 L12.9 28.2 L12.7 28.1 L12.6 28.1 L12.4 28.0 L12.1 27.8 L11.3 27.3 L10.2 26.6 L9.4 25.8 L5.6 22.0 L5.2 21.5 L4.9 20.9 L4.9 20.9 L4.9 20.8 L4.7 20.3 L4.7 20.2 L4.6 19.9 L4.5 19.3 L4.5 16.2 L4.5 16.2 L4.5 16.0 L4.6 15.9 L4.6 15.8 L4.6 15.5 L4.6 15.5 L4.7 15.3 L4.7 15.2 L4.7 15.1 L4.8 14.9 L4.9 14.7 L4.9 14.6 L5.2 14.0 L5.6 13.6 L6.2 12.9 L6.3 12.9 L6.3 12.9 L6.3 14.3 L6.3 14.6 L6.5 14.8 L6.6 14.9 L6.8 15.1 L7.1 15.1 L7.3 15.1 L7.4 15.1 L7.5 15.1 L7.6 15.0 L7.8 14.8 L7.9 14.7 L8.0 14.5 L8.0 14.3 L8.0 6.2 L8.1 6.1 L8.1 5.9 L8.1 5.8 L8.1 5.7 L8.2 5.6 L8.3 5.3 L8.5 5.1 L8.8 4.8 L9.2 4.6 L9.5 4.5 L9.9 4.5 L10.0 4.5 L10.2 4.6 L10.6 4.7 L10.6 4.7 L10.8 4.8 L11.0 4.9 L11.2 5.1 L11.3 5.3 L11.5 5.7 L11.5 5.8 L11.6 5.9 L11.6 6.1 L11.6 6.2 L11.6 9.0 L11.6 9.0 L11.6 9.1 L11.7 9.3 L11.8 9.5 L11.9 9.6 L12.2 9.8 L12.4 9.8 L12.6 9.8 L12.8 9.8 L13.0 9.7 L13.1 9.5 L13.3 9.3 L13.3 9.2 L13.3 9.1 L13.3 8.9 L13.4 8.9 L13.4 4.6 L13.3 4.5 L13.4 4.5 L13.4 4.2 L13.4 4.1 L13.4 4.0 L13.5 3.9 L13.5 3.8 L13.5 3.8 L13.6 3.6 L13.8 3.3 L13.9 3.2 L14.1 3.0 L14.2 3.0 L14.5 2.9 L14.6 2.9Z' fill='{{STROKE}}' fill-rule='evenodd'/%3E%3C/svg%3E\") 16 16, grabbing",
    help: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='{{A}}'/%3E%3Cstop offset='1' stop-color='{{B}}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M26.1 29.7 L25.9 29.8 L25.7 30.0 L25.6 30.2 L25.6 30.5 L25.7 30.7 L25.8 30.8 L26.0 30.9 L26.1 31.0 L26.1 31.0 L26.4 31.0 L26.4 31.0 L26.5 30.9 L26.6 30.8 L26.8 30.7 L26.8 30.6 L26.9 30.4 L26.9 30.4 L26.8 30.1 L26.7 29.9 L26.5 29.7 L26.4 29.7 L26.3 29.7ZM25.6 20.1 L25.0 20.2 L24.7 20.3 L24.5 20.4 L24.0 20.7 L23.7 21.0 L23.5 21.2 L23.3 21.5 L23.0 22.0 L23.0 22.1 L22.9 22.2 L22.9 22.3 L22.9 22.4 L22.9 22.5 L22.8 22.6 L22.8 22.8 L22.9 23.0 L23.0 23.1 L23.2 23.3 L23.5 23.4 L23.7 23.3 L23.9 23.2 L24.1 23.0 L24.2 22.6 L24.2 22.5 L24.3 22.3 L24.6 22.0 L24.8 21.8 L25.2 21.6 L25.7 21.5 L25.8 21.5 L26.0 21.5 L26.2 21.4 L26.8 21.5 L27.0 21.6 L27.0 21.6 L27.1 21.6 L27.3 21.7 L27.7 21.9 L27.9 22.1 L28.1 22.3 L28.3 22.6 L28.3 22.8 L28.3 23.0 L28.2 23.1 L28.2 23.2 L28.1 23.3 L27.9 23.6 L27.7 23.7 L27.2 23.9 L27.2 23.9 L27.1 24.0 L27.0 24.0 L26.9 24.0 L26.7 24.1 L26.3 24.3 L26.2 24.5 L25.9 24.7 L25.8 24.9 L25.6 25.3 L25.6 25.4 L25.6 25.5 L25.6 25.7 L25.6 25.8 L25.6 27.5 L25.6 27.7 L25.6 27.8 L25.6 27.9 L25.7 28.0 L25.7 28.0 L25.8 28.1 L25.9 28.2 L26.0 28.2 L26.3 28.3 L26.5 28.2 L26.6 28.1 L26.7 28.0 L26.8 27.8 L26.9 27.6 L26.9 25.7 L27.0 25.6 L27.1 25.4 L27.3 25.3 L27.4 25.3 L27.5 25.3 L27.5 25.3 L27.6 25.2 L27.7 25.2 L27.8 25.1 L28.0 25.1 L28.3 24.9 L28.5 24.8 L28.8 24.5 L29.0 24.4 L29.2 24.1 L29.4 23.8 L29.4 23.7 L29.5 23.5 L29.6 23.3 L29.6 23.2 L29.6 22.8 L29.5 22.3 L29.4 22.1 L29.4 22.0 L29.2 21.7 L28.9 21.2 L28.4 20.7 L28.3 20.7 L28.0 20.5 L27.4 20.2 L27.4 20.2 L27.2 20.2 L27.1 20.2 L26.9 20.1ZM1.5 1.0 L1.5 1.0 L1.4 1.1 L1.2 1.2 L1.0 1.5 L1.0 1.7 L1.0 26.2 L1.0 26.2 L1.0 26.4 L1.1 26.6 L1.4 26.8 L1.6 26.9 L1.8 26.9 L2.1 26.8 L4.4 25.0 L4.4 25.0 L4.5 24.9 L4.6 24.8 L4.8 24.7 L4.8 24.7 L6.3 23.6 L6.8 23.2 L6.9 23.2 L6.9 23.2 L10.6 30.6 L10.7 30.7 L10.8 30.9 L10.9 30.9 L11.0 30.9 L11.1 31.0 L11.4 31.0 L11.4 31.0 L11.5 30.9 L15.9 28.8 L16.0 28.7 L16.9 28.2 L17.2 28.0 L17.3 27.8 L17.3 27.5 L17.3 27.5 L17.3 27.3 L14.5 21.7 L14.4 21.4 L13.7 20.2 L13.7 20.1 L13.8 20.1 L13.8 20.1 L19.4 20.1 L19.5 20.0 L19.7 20.0 L19.8 20.0 L19.9 19.8 L20.0 19.7 L20.0 19.6 L20.1 19.5 L20.0 19.2 L20.0 19.1 L19.8 18.9 L2.1 1.2 L1.9 1.1 L1.8 1.0 L1.8 1.0Z' fill='url(%23g)'/%3E%3Cpath d='M26.1 29.7 L25.9 29.8 L25.7 30.0 L25.6 30.2 L25.6 30.5 L25.7 30.7 L25.8 30.8 L26.0 30.9 L26.1 31.0 L26.1 31.0 L26.4 31.0 L26.4 31.0 L26.5 30.9 L26.6 30.8 L26.8 30.7 L26.8 30.6 L26.9 30.4 L26.9 30.4 L26.8 30.1 L26.7 29.9 L26.5 29.7 L26.4 29.7 L26.3 29.7ZM25.6 20.1 L25.0 20.2 L24.7 20.3 L24.5 20.4 L24.0 20.7 L23.7 21.0 L23.5 21.2 L23.3 21.5 L23.0 22.0 L23.0 22.1 L22.9 22.2 L22.9 22.3 L22.9 22.4 L22.9 22.5 L22.8 22.6 L22.8 22.8 L22.9 23.0 L23.0 23.1 L23.2 23.3 L23.5 23.4 L23.7 23.3 L23.9 23.2 L24.1 23.0 L24.2 22.6 L24.2 22.5 L24.3 22.3 L24.6 22.0 L24.8 21.8 L25.2 21.6 L25.7 21.5 L25.8 21.5 L26.0 21.5 L26.2 21.4 L26.8 21.5 L27.0 21.6 L27.0 21.6 L27.1 21.6 L27.3 21.7 L27.7 21.9 L27.9 22.1 L28.1 22.3 L28.3 22.6 L28.3 22.8 L28.3 23.0 L28.2 23.1 L28.2 23.2 L28.1 23.3 L27.9 23.6 L27.7 23.7 L27.2 23.9 L27.2 23.9 L27.1 24.0 L27.0 24.0 L26.9 24.0 L26.7 24.1 L26.3 24.3 L26.2 24.5 L25.9 24.7 L25.8 24.9 L25.6 25.3 L25.6 25.4 L25.6 25.5 L25.6 25.7 L25.6 25.8 L25.6 27.5 L25.6 27.7 L25.6 27.8 L25.6 27.9 L25.7 28.0 L25.7 28.0 L25.8 28.1 L25.9 28.2 L26.0 28.2 L26.3 28.3 L26.5 28.2 L26.6 28.1 L26.7 28.0 L26.8 27.8 L26.9 27.6 L26.9 25.7 L27.0 25.6 L27.1 25.4 L27.3 25.3 L27.4 25.3 L27.5 25.3 L27.5 25.3 L27.6 25.2 L27.7 25.2 L27.8 25.1 L28.0 25.1 L28.3 24.9 L28.5 24.8 L28.8 24.5 L29.0 24.4 L29.2 24.1 L29.4 23.8 L29.4 23.7 L29.5 23.5 L29.6 23.3 L29.6 23.2 L29.6 22.8 L29.5 22.3 L29.4 22.1 L29.4 22.0 L29.2 21.7 L28.9 21.2 L28.4 20.7 L28.3 20.7 L28.0 20.5 L27.4 20.2 L27.4 20.2 L27.2 20.2 L27.1 20.2 L26.9 20.1ZM1.5 1.0 L1.5 1.0 L1.4 1.1 L1.2 1.2 L1.0 1.5 L1.0 1.7 L1.0 26.2 L1.0 26.2 L1.0 26.4 L1.1 26.6 L1.4 26.8 L1.6 26.9 L1.8 26.9 L2.1 26.8 L4.4 25.0 L4.4 25.0 L4.5 24.9 L4.6 24.8 L4.8 24.7 L4.8 24.7 L6.3 23.6 L6.8 23.2 L6.9 23.2 L6.9 23.2 L10.6 30.6 L10.7 30.7 L10.8 30.9 L10.9 30.9 L11.0 30.9 L11.1 31.0 L11.4 31.0 L11.4 31.0 L11.5 30.9 L15.9 28.8 L16.0 28.7 L16.9 28.2 L17.2 28.0 L17.3 27.8 L17.3 27.5 L17.3 27.5 L17.3 27.3 L14.5 21.7 L14.4 21.4 L13.7 20.2 L13.7 20.1 L13.8 20.1 L13.8 20.1 L19.4 20.1 L19.5 20.0 L19.7 20.0 L19.8 20.0 L19.9 19.8 L20.0 19.7 L20.0 19.6 L20.1 19.5 L20.0 19.2 L20.0 19.1 L19.8 18.9 L2.1 1.2 L1.9 1.1 L1.8 1.0 L1.8 1.0ZM2.4 3.4 L2.4 3.4 L17.7 18.7 L17.7 18.7 L13.0 18.7 L13.0 18.8 L12.5 18.8 L12.4 18.8 L12.2 18.8 L12.1 18.9 L12.0 19.0 L12.0 19.2 L11.9 19.4 L12.0 19.7 L14.6 25.0 L15.3 26.2 L15.3 26.4 L15.7 27.2 L15.7 27.3 L15.6 27.4 L15.1 27.6 L11.6 29.4 L11.5 29.4 L11.5 29.3 L7.7 21.9 L7.6 21.7 L7.5 21.6 L7.4 21.5 L7.2 21.5 L7.1 21.5 L6.9 21.5 L6.8 21.6 L4.9 22.9 L2.6 24.7 L2.4 24.8 L2.3 24.8 L2.3 3.4Z' fill='{{STROKE}}' fill-rule='evenodd'/%3E%3C/svg%3E\") 1 1, help",
}
const recolorCursor = ({ a, b, stroke, fill, hilite }) => {
    const hex = c => '%23' + c.replace('#', '')
    const sub = s => s.replaceAll('{{A}}', hex(a)).replaceAll('{{B}}', hex(b)).replaceAll('{{STROKE}}', hex(stroke)).replaceAll('{{FILL}}', hex(fill)).replaceAll('{{HILITE}}', hex(hilite))
    return { cursorDefault: sub(CURSOR_TEMPLATE.default), cursorPointer: sub(CURSOR_TEMPLATE.pointer), cursorGrab: sub(CURSOR_TEMPLATE.grab), cursorGrabbing: sub(CURSOR_TEMPLATE.grabbing), cursorHelp: sub(CURSOR_TEMPLATE.help) }
}

export const SHOP_ITEMS = {
    workSound: [
        workSound('default', 'Classic click', 0, workClickSound, 'The original.'),

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
        workSound('rockstar', 'Rockstar click', 25, [rockstar1, rockstar2, rockstar3, rockstar4, rockstar5, rockstar6], 'Powerful chords on every click. Part of the Rockstar bundle.'),
        workSound('western', 'Western click', 25, [western1, western2, western3, western4, western5], 'Yee-haw! Part of the Western bundle.'),
        workSound('paradise', 'Paradise click', 25, [paradise1, paradise2, paradise3, paradise4, paradise5], 'Peaceful ukulele. Part of the Paradise bundle.'),
        workSound('wartime', 'Wartime click', 25, [wartime1, wartime2, wartime3, wartime4, wartime5, wartime7], 'Intense soldier calls or the sound of gunfire. Part of the Wartime bundle.'),
        workSound('gingerbread', 'Gingerbread click', 25, [gingerbread1, gingerbread2, gingerbread3, gingerbread4, gingerbread5], 'Christmas magic! Part of the Gingerbread bundle.'),
        workSound('dystopia', 'Dystopia click', 25, [dystopia1, dystopia2, dystopia3, dystopia4, dystopia5], 'Synthy beats. Part of the Dystopia bundle.'),
    ],
    openingAudio: [
        openingSound('default', 'Classic opening', 0, classicOpeningAudio, 'The original.'),

        // One opening audio per themed bundle, same as the work-click sounds above - added as the real
        // recordings come in, so there's no placeholder list to keep in sync here.
        openingSound('kitty', 'Kitty opening', 25, kittyOpening, 'Cheerful and whimsy. Part of the Kitty bundle.'),
        openingSound('fairy', 'Fairy opening', 25, fairyOpening, 'A fantastical introduction. Part of the Fairy bundle.'),
        openingSound('poltergeist', 'Poltergeist opening', 25, poltergeistOpening, 'Spooky! Part of the Poltergeist bundle.'),
        // id matches every other Buccaneer piece ('buccaneer', not 'pirate') so this card picks up the
        // Buccaneer theme photo (THEME_PICS is keyed by id) the same way its other pieces do.
        openingSound('buccaneer', 'Buccaneer opening', 25, pirateOpening, 'Salty sea shanty. Part of the Buccaneer bundle.'),
        openingSound('princess', 'Princess opening', 25, princessOpening, 'Fit for royalty! Part of the Princess bundle.'),
        openingSound('jazz', 'Jazz opening', 25, jazzOpening, 'Classy & jazzy. Part of the Jazz bundle.'),
        openingSound('playroom', 'Playroom opening', 25, playroomOpening, 'Childhood nostalgia. Part of the Playroom bundle.'),
        openingSound('starlight', 'Starlight opening', 25, starlightOpening, 'Out of this world! Part of the Starlight bundle.'),
        openingSound('duck', 'Duck opening', 25, duckOpening, 'Silly and unserious. Part of the Duck bundle.'),
        openingSound('woof', 'Woof opening', 25, woofOpening, 'Good vibes. Part of the Woof bundle.'),
        openingSound('ocean', 'Ocean opening', 25, oceanOpening, 'Perfect for exploring the deep blue sea. Part of the Ocean bundle.'),
        openingSound('rockstar', 'Rockstar opening', 25, rockstarOpening, 'For the rock music enthusiasts. Part of the Rockstar bundle.'),
        openingSound('western', 'Western opening', 25, westernOpening, 'Wilder than the west. Part of the Western bundle.'),
        openingSound('paradise', 'Paradise opening', 25, paradiseOpening, 'Relaxing ukulele strums. Part of the Paradise bundle.'),
        openingSound('wartime', 'Wartime opening', 25, wartimeOpening, 'It means business. Part of the Wartime bundle.'),
        openingSound('gingerbread', 'Gingerbread opening', 25, gingerbreadOpening, 'Festive cheer! Part of the Gingerbread bundle.'),
        openingSound('dystopia', 'Dystopia opening', 25, dystopiaOpening, 'Straight out of a dystopian future. Part of the Dystopia bundle.'),
    ],

    boardTheme: [
        boardTheme('default', 'Classic board', 0, {}, 'The classic amber-on-black board.'),
        // PLACEHOLDER
        boardTheme('ocean', 'Ocean board', 40, { accent: '#4fc3f7' }, 'Cool blue lettering. Part of the Ocean bundle.'),

        // Moved to 'standard' tier at the user's request (used to be 'special' - a custom background image plus
        // its own hover/click sounds, not just a recoloured accent, which is otherwise what makes something 'special').
        boardTheme('starlight', 'Starlight board', 40, {
            accent: '#c4b5fd',
            bgImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23030712'/%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='14' cy='18' r='1.1' opacity='0.8'/%3E%3Ccircle cx='40' cy='8' r='0.8' opacity='0.5'/%3E%3Ccircle cx='66' cy='26' r='1.3' opacity='0.9'/%3E%3Ccircle cx='92' cy='14' r='0.9' opacity='0.6'/%3E%3Ccircle cx='110' cy='40' r='1.1' opacity='0.7'/%3E%3Ccircle cx='22' cy='52' r='0.9' opacity='0.5'/%3E%3Ccircle cx='54' cy='60' r='1.2' opacity='0.8'/%3E%3Ccircle cx='80' cy='70' r='0.8' opacity='0.5'/%3E%3Ccircle cx='104' cy='84' r='1.3' opacity='0.9'/%3E%3Ccircle cx='10' cy='92' r='1' opacity='0.6'/%3E%3Ccircle cx='36' cy='104' r='0.9' opacity='0.5'/%3E%3Ccircle cx='62' cy='96' r='1.2' opacity='0.8'/%3E%3Ccircle cx='90' cy='110' r='1' opacity='0.6'/%3E%3Ccircle cx='116' cy='100' r='0.9' opacity='0.5'/%3E%3C/g%3E%3C/svg%3E\")",
        }, 'Lilac lettering. Part of the Starlight bundle.', 'standard', { hoverSound: hoverSoundAsset, clickSource: clickSound3 }),

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
        boardTheme('rockstar', 'Rockstar board', 40, { accent: '#e3122a' }, 'Electric-red lettering. Part of the Rockstar bundle.'),
        boardTheme('western', 'Western board', 40, { accent: '#a0522d' }, 'Saddle-brown lettering. Part of the Western bundle.'),
        boardTheme('paradise', 'Paradise board', 40, { accent: '#00bfa5' }, 'Tropical-teal lettering. Part of the Paradise bundle.'),
        boardTheme('wartime', 'Wartime board', 40, { accent: '#9aab6e' }, 'Khaki lettering. Part of the Wartime bundle.'),
        boardTheme('gingerbread', 'Gingerbread board', 40, { accent: '#efefef' }, 'Snow white lettering. Part of the Gingerbread bundle.'),
        boardTheme('dystopia', 'Dystopia board', 40, { accent: '#ff2fd1' }, 'Neon-pink lettering. Part of the Dystopia bundle.'),
    ],

    hyperLinkTheme: [
        hyperLinkTheme('default', 'Classic Hyper-Link', 0, {}, 'The classic amber Hyper-Link.'),
        // PLACEHOLDER
        hyperLinkTheme('ocean', 'Ocean Hyper-Link', 40, { accent: '#3b82f6', accentDark: '#2563eb' }, 'Part of the Ocean bundle.'),

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
        hyperLinkTheme('rockstar', 'Rockstar Hyper-Link', 40, { accent: '#e3122a', accentDark: '#a10d1e' }, 'Part of the Rockstar bundle.'),
        hyperLinkTheme('western', 'Western Hyper-Link', 40, { accent: '#a0522d', accentDark: '#7a3c1e' }, 'Part of the Western bundle.'),
        hyperLinkTheme('paradise', 'Paradise Hyper-Link', 40, { accent: '#ff5c8a', accentDark: '#e53f70' }, 'Part of the Paradise bundle.'),
        hyperLinkTheme('wartime', 'Wartime Hyper-Link', 40, { accent: '#9aab6e', accentDark: '#4b5320' }, 'Part of the Wartime bundle.'),
        hyperLinkTheme('gingerbread', 'Gingerbread Hyper-Link', 40, { accent: '#6b3410', accentDark: '#7a1414' }, 'Part of the Gingerbread bundle.'),
        hyperLinkTheme('dystopia', 'Dystopia Hyper-Link', 40, { accent: '#ff2fd1', accentDark: '#4b2e83' }, 'Part of the Dystopia bundle.'),
    ],

    generalTheme: [
        generalTheme('default', 'Classic', 0, {}, 'The classic look.'),
        // PLACEHOLDER
        generalTheme('ocean', 'Ocean', 75, {
            barBg: 'rgb(228, 240, 255)', accent: '#3b82f6',
            tickerBg: '#06101c', tickerText: '#4fc3f7',
            departureArc: '#3b82f6', arrivalArc: '#f5a623',
        }, 'Light blue and gold. Part of the Ocean bundle.'),

        // ── Bundle template pieces (see "ADDING A BUNDLE" above)
        generalTheme('kitty', 'Kitty', 75, {
            barBg: 'rgb(255, 240, 246)', accent: '#ff8fab',
            tickerBg: '#2b0f1a', tickerText: '#ffb6c9',
            departureArc: '#ff8fab', arrivalArc: '#ffd86b',
        }, 'Pink and cream. Part of the Kitty bundle.'),
        generalTheme('fairy', 'Fairy', 75, {
            barBg: 'rgb(243, 235, 255)', accent: '#b794f6',
            tickerBg: '#160f26', tickerText: '#6ee7b7',
            departureArc: '#b794f6', arrivalArc: '#6ee7b7',
        }, 'Lavender and mint. Part of the Fairy bundle.'),
        generalTheme('poltergeist', 'Poltergeist', 75, {
            barBg: 'rgb(18, 20, 18)', barText: '#a8d6a0', barTextMuted: '#a8d6a0', accent: '#9fffb0',
            tickerBg: '#000000', tickerText: '#c4b5fd',
            departureArc: '#9fffb0', arrivalArc: '#c4b5fd',
        }, 'Sickly green on near-black. Part of the Poltergeist bundle.'),
        generalTheme('playroom', 'Playroom', 75, {
            barBg: 'rgb(255, 249, 224)', accent: '#ff6b6b',
            tickerBg: '#1a1406', tickerText: '#ffe08a',
            departureArc: '#ffd166', arrivalArc: '#4ecdc4',
        }, 'Crayon-box colours. Part of the Playroom bundle.'),
        generalTheme('starlight', 'Starlight', 75, {
            barBg: 'rgb(10, 10, 20)', barText: '#39ffc9', barTextMuted: '#a79fc9', accent: '#c4b5fd',
            tickerBg: '#000000', tickerText: '#c4b5fd',
            departureArc: '#c4b5fd', arrivalArc: '#39ffc9',
        }, 'Indigo and cyan. Part of the Starlight bundle.'),
        generalTheme('buccaneer', 'Buccaneer', 75, {
            barBg: 'rgb(245, 235, 210)', accent: '#c9972a',
            tickerBg: '#1a1206', tickerText: '#e8c468',
            departureArc: '#c9972a', arrivalArc: '#2e8b8b',
        }, 'Old gold and sea teal. Part of the Buccaneer bundle.'),
        generalTheme('princess', 'Princess', 75, {
            barBg: 'rgb(255, 244, 250)', accent: '#f0a8d0',
            tickerBg: '#1a0514', tickerText: '#d4af37',
            departureArc: '#f0a8d0', arrivalArc: '#d4af37',
        }, 'Rose and gold. Part of the Princess bundle.'),
        generalTheme('jazz', 'Jazz', 75, {
            barBg: 'rgb(30, 20, 22)', barText: '#e0b25c', barTextMuted: '#e0b25c', accent: '#b8860b',
            tickerBg: '#000000', tickerText: '#e0b25c',
            departureArc: '#b8860b', arrivalArc: '#8b0000',
        }, 'Smoky goldenrod and burgundy. Part of the Jazz bundle.'),
        generalTheme('duck', 'Duck', 75, {
            barBg: 'rgb(255, 248, 224)', accent: '#ffcc33',
            tickerBg: '#1a1506', tickerText: '#2e8b8b',
            departureArc: '#f9f500', arrivalArc: '#2e8b8b',
        }, 'Sunny yellow and pond teal. Part of the Duck bundle.'),
        generalTheme('woof', 'Woof', 75, {
            barBg: 'rgb(230, 238, 250)', accent: '#4a7fc9',
            tickerBg: '#0d1a2e', tickerText: '#9acd32',
            departureArc: '#4a7fc9', arrivalArc: '#9acd32',
        }, 'Denim blue and tennis-ball green. Part of the Woof bundle.'),
        generalTheme('rockstar', 'Rockstar', 75, {
            barBg: 'rgb(20, 18, 20)', barText: '#f2f2f2', barTextMuted: '#bdbdbd', accent: '#e3122a',
            tickerBg: '#000000', tickerText: '#e3122a',
            departureArc: '#e3122a', arrivalArc: '#c0c0c0',
        }, 'Black and electric red, chrome highlights. Part of the Rockstar bundle.'),
        generalTheme('western', 'Western', 75, {
            barBg: 'rgb(244, 231, 206)', accent: '#a0522d',
            tickerBg: '#2a1a0e', tickerText: '#d9a566',
            departureArc: '#a0522d', arrivalArc: '#6b8e23',
        }, 'Sun-baked tan and saddle brown, sagebrush green. Part of the Western bundle.'),
        generalTheme('paradise', 'Paradise', 75, {
            barBg: 'rgb(224, 248, 245)', accent: '#00bfa5',
            tickerBg: '#07262a', tickerText: '#ff5c8a',
            departureArc: '#00bfa5', arrivalArc: '#ff5c8a',
        }, 'Turquoise and hibiscus pink. Part of the Paradise bundle.'),

        generalTheme('wartime', 'Wartime', 75, {
            barBg: 'rgb(20, 22, 12)', barText: '#eef0e0', barTextMuted: '#9aab6e', accent: '#9aab6e',
            tickerBg: '#0d0f08', tickerText: '#9aab6e',
            departureArc: '#9aab6e', arrivalArc: '#b5651d',
        }, 'Matte khaki on dark olive drab. Part of the Wartime bundle.'),
        generalTheme('gingerbread', 'Gingerbread', 75, {
            barBg: 'rgb(255, 240, 220)', accent: '#6b3410',
            tickerBg: '#6b3410', tickerText: '#f1f1f1',
            departureArc: '#d93a3a', arrivalArc: '#f1f1f1',
        }, 'Warm gingerbread brown, trimmed in holly red and snow white. Part of the Gingerbread bundle.'),
        generalTheme('dystopia', 'Dystopia', 75, {
            barBg: 'rgb(10, 6, 18)', barText: '#e8d9ff', barTextMuted: '#b06ee0', accent: '#ff2fd1',
            tickerBg: '#000000', tickerText: '#ff2fd1',
            departureArc: '#ff2fd1', arrivalArc: '#b06ee0',
        }, 'Deep violet and cool grey, with a neon glow. Part of the Dystopia bundle.'),
    ],

    cursorTheme: [
        cursorTheme('default', 'Classic cursor', 0, {}, 'The original gold hand and arrow.'),

        // PLACEHOLDER - 'standard' tier: a recolour of the same shapes
        cursorTheme('ocean', 'Ocean cursor', 20, recolorCursor({ a: '#99d6ff', b: '#3b82f6', stroke: '#0d1b2e', fill: '#4fc3f7', hilite: '#eaf6ff' }), 'Part of the Ocean bundle.'),

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
        cursorTheme('rockstar', 'Rockstar cursor', 20, recolorCursor({ a: '#4a4a4a', b: '#e3122a', stroke: '#0a0a0a', fill: '#e3122a', hilite: '#f2f2f2' }), 'Part of the Rockstar bundle.'),
        cursorTheme('western', 'Western cursor', 20, recolorCursor({ a: '#e8c79a', b: '#a0522d', stroke: '#2a1a0e', fill: '#a0522d', hilite: '#fff6e8' }), 'Part of the Western bundle.'),
        cursorTheme('paradise', 'Paradise cursor', 20, recolorCursor({ a: '#9df0e6', b: '#00bfa5', stroke: '#07262a', fill: '#00bfa5', hilite: '#f0fffd' }), 'Part of the Paradise bundle.'),

        cursorTheme('wartime', 'Wartime cursor', 20, recolorCursor({ a: '#9aab6e', b: '#4b5320', stroke: '#14160a', fill: '#4b5320', hilite: '#eef0e0' }), 'Part of the Wartime bundle.'),
        cursorTheme('gingerbread', 'Gingerbread cursor', 20, recolorCursor({ a: '#f0c891', b: '#6b3410', stroke: '#7a1414', fill: '#6b3410', hilite: '#fff0dc' }), 'Part of the Gingerbread bundle.'),
        cursorTheme('dystopia', 'Dystopia cursor', 20, recolorCursor({ a: '#b06ee0', b: '#4b2e83', stroke: '#0a0612', fill: '#3a3a42', hilite: '#ff2fd1' }), 'Part of the Dystopia bundle.'),
    ],
}

// A bundle's blurb is built from what it actually contains, by looking up each piece's real name in SHOP_ITEMS -
// so the text can never list a name that doesn't match what's shown in the Shop. Rename a piece and every
// bundle blurb that uses it updates with it, with nothing to keep in sync by hand. Order follows the same
// category order the piece chips are shown in below (General, Board, Hyper-Link, Work sound, Opening, Cursor).
const BUNDLE_BLURB_ORDER = ['generalTheme', 'boardTheme', 'hyperLinkTheme', 'workSound', 'openingAudio', 'cursorTheme']
function bundleBlurb(items) {
    const names = BUNDLE_BLURB_ORDER
        .map(category => SHOP_ITEMS[category]?.find(item => item.id === items[category])?.name)
        .filter(Boolean)
    return `Includes: ${names.join(', ')}.`
}
const makeBundle = (id, name, items, tier = 'special') => ({ id, name, tier, blurb: bundleBlurb(items), items })

// One bundle per themed set - see "ADDING A BUNDLE" near the top of this file. Prices are computed from these
// (sum of the not-yet-owned pieces, minus 20%) by bundlePrice() in utils/cosmetics.js, so nothing here sets a
// price directly.
export const SHOP_BUNDLES = [
    // Every category's free default piece, so it is owned from the start (nothing to buy) and is what is equipped on a
    // new game. It's here so a player can put the whole original look and sound back in one tap instead of switching
    // six categories one by one. The Shop pins it to the top of the Bundles tab.
    makeBundle('default', 'Classic', { generalTheme: 'default', boardTheme: 'default', hyperLinkTheme: 'default', workSound: 'default', cursorTheme: 'default', openingAudio: 'default' }, 'standard'),
    makeBundle('kitty', 'Kitty', { generalTheme: 'kitty', boardTheme: 'kitty', hyperLinkTheme: 'kitty', workSound: 'kitty', cursorTheme: 'kitty', openingAudio: 'kitty' }),
    makeBundle('fairy', 'Fairy', { generalTheme: 'fairy', boardTheme: 'fairy', hyperLinkTheme: 'fairy', workSound: 'fairy', cursorTheme: 'fairy', openingAudio: 'fairy' }),
    makeBundle('poltergeist', 'Poltergeist', { generalTheme: 'poltergeist', boardTheme: 'poltergeist', hyperLinkTheme: 'poltergeist', workSound: 'poltergeist', cursorTheme: 'poltergeist', openingAudio: 'poltergeist' }),
    makeBundle('playroom', 'Playroom', { generalTheme: 'playroom', boardTheme: 'playroom', hyperLinkTheme: 'playroom', workSound: 'playroom', cursorTheme: 'playroom', openingAudio: 'playroom' }),
    // Reuses the Board theme already built above rather than duplicating it under a second id.
    makeBundle('starlight', 'Starlight', { generalTheme: 'starlight', boardTheme: 'starlight', hyperLinkTheme: 'starlight', workSound: 'starlight', cursorTheme: 'starlight', openingAudio: 'starlight' }),
    makeBundle('buccaneer', 'Buccaneer', { generalTheme: 'buccaneer', boardTheme: 'buccaneer', hyperLinkTheme: 'buccaneer', workSound: 'buccaneer', cursorTheme: 'buccaneer', openingAudio: 'buccaneer' }),
    makeBundle('princess', 'Princess', { generalTheme: 'princess', boardTheme: 'princess', hyperLinkTheme: 'princess', workSound: 'princess', cursorTheme: 'princess', openingAudio: 'princess' }),
    makeBundle('jazz', 'Jazz', { generalTheme: 'jazz', boardTheme: 'jazz', hyperLinkTheme: 'jazz', workSound: 'jazz', cursorTheme: 'jazz', openingAudio: 'jazz' }),
    makeBundle('duck', 'Duck', { generalTheme: 'duck', boardTheme: 'duck', hyperLinkTheme: 'duck', workSound: 'duck', cursorTheme: 'duck', openingAudio: 'duck' }),
    makeBundle('woof', 'Woof', { generalTheme: 'woof', boardTheme: 'woof', hyperLinkTheme: 'woof', workSound: 'woof', cursorTheme: 'woof', openingAudio: 'woof' }),
    makeBundle('ocean', 'Ocean', { generalTheme: 'ocean', boardTheme: 'ocean', hyperLinkTheme: 'ocean', workSound: 'ocean', cursorTheme: 'ocean', openingAudio: 'ocean' }),
    makeBundle('rockstar', 'Rockstar', { generalTheme: 'rockstar', boardTheme: 'rockstar', hyperLinkTheme: 'rockstar', workSound: 'rockstar', cursorTheme: 'rockstar', openingAudio: 'rockstar' }),
    makeBundle('western', 'Western', { generalTheme: 'western', boardTheme: 'western', hyperLinkTheme: 'western', workSound: 'western', cursorTheme: 'western', openingAudio: 'western' }),
    makeBundle('paradise', 'Paradise', { generalTheme: 'paradise', boardTheme: 'paradise', hyperLinkTheme: 'paradise', workSound: 'paradise', cursorTheme: 'paradise', openingAudio: 'paradise' }),
    // The click and opening pieces are still the Classic placeholder sound (see their own comments in SHOP_ITEMS)
    // until real themed recordings exist - swap those two srcs in and this bundle needs no other change.
    makeBundle('wartime', 'Wartime', { generalTheme: 'wartime', boardTheme: 'wartime', hyperLinkTheme: 'wartime', workSound: 'wartime', cursorTheme: 'wartime', openingAudio: 'wartime' }),
    makeBundle('gingerbread', 'Gingerbread', { generalTheme: 'gingerbread', boardTheme: 'gingerbread', hyperLinkTheme: 'gingerbread', workSound: 'gingerbread', cursorTheme: 'gingerbread', openingAudio: 'gingerbread' }),
    makeBundle('dystopia', 'Dystopia', { generalTheme: 'dystopia', boardTheme: 'dystopia', hyperLinkTheme: 'dystopia', workSound: 'dystopia', cursorTheme: 'dystopia', openingAudio: 'dystopia' }),
]

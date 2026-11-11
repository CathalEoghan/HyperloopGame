import { allCities } from '../CityManager/CityRegistry.js'
import { allDevelopments } from '../DevelopmentManager/DevelopmentRegistry.js'
import { allUpgrades } from '../UpgradeManager/UpgradeRegistry.js'
import { MAX_RANK } from './RankManager/RankManager.js'
import { sanitizeDevelopmentName } from './ProgressionManager/ProgressionManager.js'
import { STARTING_BALANCE } from './ProgressionManager/economyConstants.js'
import { PRESTIGE_VALUES } from './PrestigeManager/prestigeUpgrades.js'
import { GRANT_RANK } from './PrestigeManager/governmentGrants.js'

const SAVE_KEY = 'hyperloop_save'

// Whether this run took Government Grants: the cities it connected for free are listed under this key (see
// hyperloop-ui/src/utils/grantedCities.js), which only a grant ever writes to
function hasGrantedCities() {
    try {
        const list = JSON.parse(localStorage.getItem('hyperloop_granted_cities'))
        return Array.isArray(list) && list.length > 0
    } catch { return false }
}

// Names that changed after saving was added (old name → current name). Saves store names,
// so without this an item that was renamed silently disappears on load (bug #86).
const RENAMES = {
    'Lounge Renovations': 'Credit Card Lounges',
    'Business Lounge Expansions': 'Business Lounge Renovations',
    'Dar Es Salaam': 'Dar es Salaam',
    'Quebec City': 'Québec City',
    'PortOfSpain': 'Port of Spain',
}
const currentName = name => RENAMES[name] ?? name

const AUX_KEYS = [
    'hyperloop_shown_reveals',
    'hyperloop_claimed_milestones',
    'hyperloop_progress_rewards',
    // Claimed Prestige-upgrade reward cards. Kept separate from hyperloop_progress_rewards (and also listed in
    // PRESTIGE_KEEP_KEYS below) because Prestige upgrades themselves are never reset by a prestige, so a claim
    // on one of their cards must not reset either - otherwise every retire would hand back 36 free claims for
    // upgrades already owned.
    'hyperloop_prestige_upgrade_rewards',
    'hyperloop_dev_portrait_bonus',
    'hyperloop_hyperlink_feed',
    'hyperloop_hyperlink_unread',
    'hyperloop_hyperlink_used_posts',
    'hyperloop_hyperlink_used_pfps',
    'hyperloop_hyperlink_user_pfps',
    'hyperloop_hyperlink_fired_devposts',
    // Development names a "got upgraded!" HyperLink post has already fired for this run - a development only
    // ever gets one of these, however many levels it's bought (see onUpgrade in App.jsx). Wiped each prestige
    // the same way as hyperloop_hyperlink_fired_devposts above, since it's part of the current run.
    'hyperloop_hyperlink_fired_dev_upgrades',
    'hyperloop_hyperlink_liked',
    'hyperloop_hyperlink_used_month_posts',
    'hyperloop_pending_rankups',
    // The cities a rank-up is currently offering (and whether its free re-roll is still unused), so a reload
    // can't hand out a fresh offer without the Reputation re-roll
    'hyperloop_rankup_offer',
    // Cities Government Grants connected for free: Amicable Breakups refunds nothing for them
    'hyperloop_granted_cities',
    // Kept with the save so a backup can't re-offer today's daily bonus, and an uncollected
    // reward travels with the balance it belongs to (bug #67).
    'hyperloop_last_login',
    'hyperloop_last_farewell_date',
    'hyperloop_pending_daily',
    'hyperloop_pending_offline',
    // Prestige Points and bought Prestige upgrades
    'hyperloop_prestige',
    // One row per finished prestige run
    'hyperloop_prestige_history',
    // Unlocked achievements and their running totals; Hyper-Link mute
    'hyperloop_achievements',
    'hyperloop_achievement_counters',
    'hyperloop_achievements_unseen',
    'hyperloop_hyperlink_muted',
    // Lifetime cash/Reputation earned (ProgressionManager's own keys - see its LIFETIME_CASH_KEY/LIFETIME_REP_KEY)
    'hyperloop_lifetime_cash_earned',
    'hyperloop_lifetime_reputation_earned',
    // The terminal's own creation date, kept across every prestige - see getLifetimeCreatedAt below. Founders'
    // Hall and the Progress page's Terminal Age stat both count from this, not from any one run's own createdAt.
    'hyperloop_lifetime_created_at',
    // How many times Experimental Technology has ever been claimed (ProgressionManager's own key - see its
    // LIFETIME_EXPTECH_CLAIMS_KEY), which decides the Prestige Points/cost tier it's currently on.
    'hyperloop_lifetime_exptech_claims',
    // Per-city lifetime claim/skip counts for the Progress page's Most Claimed/Skipped City (ProgressionManager's
    // own keys - see its LIFETIME_CITY_CLAIMS_KEY/LIFETIME_CITY_SKIPS_KEY).
    'hyperloop_lifetime_city_claims',
    'hyperloop_lifetime_city_skips',
    'hyperloop_progress_collapsed',
    // Where the departure and arrival totals had got to, so the same loops aren't counted twice
    'hyperloop_loop_counted',
    // This run's manual Work clicks, for Livestream Everything. Part of the run: a prestige starts it again.
    'hyperloop_livestream_clicks',
    // What the player bought in the Shop and has equipped
    'hyperloop_cosmetics',
    // The departure timetable (city, time, gate), and whether the first-loop prompt has been shown
    'hyperloop_timetable',
    'hyperloop_first_loop_prompt',
    // Set once an older game's cities have been put on the timetable (income needs a scheduled departure)
    'hyperloop_timetable_autofilled',
    // Whether the first-visit Cities/Development/Progress/Prestige/Terminal Board explainer modals have been
    // shown and dismissed
    'hyperloop_cities_intro_seen',
    'hyperloop_development_intro_seen',
    'hyperloop_progress_intro_seen',
    'hyperloop_prestige_intro_seen',
    'hyperloop_board_intro_seen',
    // This run's loop-number assignments (loopCodes.js) - your own departure pool, and each city's own
    // arrival number. A new run gets fresh numbers rather than inheriting the last one's.
    'hyperloop_loop_dep_numbers',
    'hyperloop_loop_arr_numbers',
]

// Today's live state for the current game. Never exported: an imported or new game starts
// without it and builds its own (bug #92).
const DAY_STATE_KEYS = [
    'hyperloop_active_departure',
    'hyperloop_active_event',
    'hyperloop_pending_delay',
    'hyperloop_triggered_departures',
    'hyperloop_departures_date',
    'hyperloop_pending_injections',
    'hyperloop_onboarding_pending',
    // The departure a Celebrity Sighting marked as the celebrity's
    'hyperloop_celebrity_departure',
]

function removeKeys(keys) {
    keys.forEach(key => localStorage.removeItem(key))
}

function clearDayState() {
    removeKeys(DAY_STATE_KEYS)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('departures_') || key.startsWith('arrivals_')) localStorage.removeItem(key)
    })
}

// Everything that belongs to the current game apart from the save itself. Used by Delete Save.
export function clearGameState() {
    removeKeys(AUX_KEYS)
    removeKeys(['hyperloop_run_start'])
    clearDayState()
}

// The player's settings and view preferences: how the game looks and behaves for them (Settings page toggles, the globe's
// view, the Terminal Board's tab, the Shop's last category). They are not part of any one game, so clearGameState leaves
// them alone and a prestige keeps them (a retire is the same save). Delete Save is the only thing that puts them back to
// the defaults, by calling clearSettings below: a brand-new game then starts with every setting at its default.
// The sound settings (soundEnabled, soundVolumes, soundMuted) are reset separately by resetSoundSettings in sound.js.
// Not listed on purpose: hyperloop_save_backup (a copy of a save that would not load - nothing the game does is meant to
// delete that) and the tab-lock keys (they only stop two tabs running the game at once).
const SETTINGS_KEYS = [
    'hyperloop_event_tint',
    'globeNightMode',
    'globeQuality',
    'globeView',
    'globeShowOwned',
    'globeLoopsPanelOpen',
    'distanceUnit',
    'splitFlap',
    'hyperloop_notifications',
    'terminalBoardTab',
    'hyperloop_shop_last_category',
]

export function clearSettings() {
    removeKeys(SETTINGS_KEYS)
}

// What a prestige keeps. Everything else about the run is cleared. The two date stamps stay so that the
// fresh run can't be handed today's daily bonus or today's first-farewell bonus a second time.
const PRESTIGE_KEEP_KEYS = [
    'hyperloop_prestige',
    'hyperloop_prestige_history',
    'hyperloop_achievements',
    'hyperloop_achievement_counters',
    'hyperloop_achievements_unseen',
    'hyperloop_hyperlink_muted',
    'hyperloop_progress_collapsed',
    'hyperloop_loop_counted',
    'hyperloop_hyperlink_liked',
    'hyperloop_lifetime_cash_earned',
    'hyperloop_lifetime_reputation_earned',
    'hyperloop_lifetime_created_at',
    'hyperloop_lifetime_exptech_claims',
    'hyperloop_lifetime_city_claims',
    'hyperloop_lifetime_city_skips',
    'hyperloop_last_login',
    'hyperloop_last_farewell_date',
    // The credits portrait pays its Reputation once ever, not once per run
    'hyperloop_dev_portrait_bonus',
    // Shop purchases are for keeps
    'hyperloop_cosmetics',
    // Claimed Prestige-upgrade reward cards - the upgrades they belong to are kept too, so the claims stay kept
    'hyperloop_prestige_upgrade_rewards',
    // Seen it once, don't show "Your first city is connected!" again after a prestige
    'hyperloop_first_loop_prompt',
]

// Wipes the current run and leaves a note for the next start-up: keep the terminal name, and the starter
// city that was drawn for it (the player only gets to choose with Personal Favours).
export function startPrestigeRun(terminalName, starterCityName) {
    const kept = {}
    PRESTIGE_KEEP_KEYS.forEach(key => {
        const val = localStorage.getItem(key)
        if (val !== null) kept[key] = val
    })
    deleteSave()
    clearGameState()
    Object.entries(kept).forEach(([key, val]) => localStorage.setItem(key, val))
    localStorage.setItem('hyperloop_run_start', JSON.stringify({ terminalName, city: starterCityName }))
}

// The note left by startPrestigeRun, until the new run's starter city is picked.
export function readRunStart() {
    try {
        const note = JSON.parse(localStorage.getItem('hyperloop_run_start'))
        return note && typeof note.terminalName === 'string' ? note : null
    } catch { return null }
}

// The terminal's own creation date (ms since epoch), kept for good - unlike a save's own createdAt (the CURRENT
// RUN's start, reset by every prestige), this is written once, the very first time a terminal exists, and never
// again: Founders' Hall and the Progress page's Terminal Age stat both read it so neither is reset by retiring.
// `fallbackCreatedAt` seeds it the first time there's nothing saved yet - normally the save's own createdAt, so
// a game that already has a save (one from before this existed) starts its lifetime clock from that run's start
// rather than from right now.
export function getLifetimeCreatedAt(fallbackCreatedAt) {
    try {
        const v = Number(localStorage.getItem('hyperloop_lifetime_created_at'))
        if (Number.isFinite(v) && v > 0) return v
    } catch { /* storage unavailable */ }
    try { localStorage.setItem('hyperloop_lifetime_created_at', String(fallbackCreatedAt)) } catch { /* storage full */ }
    return fallbackCreatedAt
}

function bundleAuxState() {
    const state = {}
    AUX_KEYS.forEach(key => {
        const val = localStorage.getItem(key)
        if (val !== null) state[key] = val
    })
    return state
}

// What each extra value must hold once parsed. Anything else in an imported file is skipped,
// because the game reads these on startup and a wrong type crashed it on every load.
// Keys not listed here hold a list of strings (names or ids); the entries are checked too, since a list holding
// null broke the game loop (bug #178).
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const listOf = ok => v => Array.isArray(v) && v.every(ok)
const AUX_SHAPES = {
    hyperloop_hyperlink_user_pfps: v => v !== null && typeof v === 'object' && !Array.isArray(v),
    hyperloop_hyperlink_unread: v => Number.isFinite(v),
    hyperloop_hyperlink_muted: v => typeof v === 'boolean',
    hyperloop_progress_collapsed: v => v !== null && typeof v === 'object' && !Array.isArray(v),
    hyperloop_achievement_counters: v => v !== null && typeof v === 'object' && !Array.isArray(v),
    // { departure: { t, left }, arrival: { t, left } }: the moment each total was last counted
    hyperloop_loop_counted: v => v !== null && typeof v === 'object' && !Array.isArray(v)
        && ['departure', 'arrival'].every(k => v[k] === undefined || (v[k] !== null && typeof v[k] === 'object' && Number.isFinite(v[k].t))),
    hyperloop_pending_rankups: v => Number.isFinite(v),
    hyperloop_rankup_offer: v => isObj(v) && listOfStrings(v.names) && typeof v.freeReroll === 'boolean',
    hyperloop_dev_portrait_bonus: v => v === 1,
    hyperloop_livestream_clicks: v => Number.isFinite(v) && v >= 0,
    hyperloop_prestige: v => v !== null && typeof v === 'object' && !Array.isArray(v) && Number.isFinite(v.points) && Array.isArray(v.owned),
    hyperloop_pending_daily: v => v !== null && typeof v === 'object' && Number.isFinite(v.cashBonus) && Number.isFinite(v.repBonus),
    hyperloop_pending_offline: v => v !== null && typeof v === 'object' && Number.isFinite(v.offlineSeconds) && Number.isFinite(v.offlineIncome),
    hyperloop_hyperlink_feed: listOf(p => isObj(p) && typeof p.id === 'string' && typeof p.text === 'string' && Number.isFinite(p.timestamp)),
    hyperloop_hyperlink_used_month_posts: listOf(e => isObj(e) && typeof e.id === 'string' && Number.isFinite(e.year)),
    hyperloop_prestige_history: listOf(isObj),
    // { owned: ['workSound:soft', ...], equipped: { workSound: 'soft', ... } }
    hyperloop_timetable: listOf(e => isObj(e) && typeof e.name === 'string' && Number.isFinite(e.minuteOfDay) && Number.isFinite(e.gate)),
    hyperloop_first_loop_prompt: v => v === 1,
    hyperloop_timetable_autofilled: v => v === 1,
    hyperloop_cosmetics: v => isObj(v) && listOfStrings(v.owned) && isObj(v.equipped) && Object.values(v.equipped).every(x => typeof x === 'string'),
    hyperloop_cities_intro_seen: v => typeof v === 'boolean',
    hyperloop_development_intro_seen: v => typeof v === 'boolean',
    hyperloop_progress_intro_seen: v => typeof v === 'boolean',
    hyperloop_prestige_intro_seen: v => typeof v === 'boolean',
    hyperloop_board_intro_seen: v => typeof v === 'boolean',
    // [number, ...] - the terminal's shared departure-number pool (loopCodes.js); which city's departure
    // currently holds which pool number lives on the timetable entries themselves (hyperloop_timetable)
    hyperloop_loop_dep_numbers: listOf(Number.isFinite),
    // { cityName: number, ... } - this run's arrival-number assignments (loopCodes.js)
    hyperloop_loop_arr_numbers: v => isObj(v) && Object.values(v).every(Number.isFinite),
    // Lifetime cash/Reputation earned (ProgressionManager's LIFETIME_CASH_KEY/LIFETIME_REP_KEY): a plain number each.
    // Without these two lines they fell through to the list-of-names check below, failed it, and were dropped - after
    // the import had already cleared them - so every import reset the Progress page's lifetime totals to 0.
    hyperloop_lifetime_cash_earned: v => Number.isFinite(v) && v >= 0,
    hyperloop_lifetime_reputation_earned: v => Number.isFinite(v) && v >= 0,
    // The terminal's own creation date (ms since epoch) and Experimental Technology's lifetime claim count - see
    // getLifetimeCreatedAt below and ProgressionManager's LIFETIME_EXPTECH_CLAIMS_KEY.
    hyperloop_lifetime_created_at: v => Number.isFinite(v) && v > 0,
    hyperloop_lifetime_exptech_claims: v => Number.isFinite(v) && v >= 0,
    // { cityName: number, ... } each - ProgressionManager's LIFETIME_CITY_CLAIMS_KEY/LIFETIME_CITY_SKIPS_KEY
    hyperloop_lifetime_city_claims: v => isObj(v) && Object.values(v).every(Number.isFinite),
    hyperloop_lifetime_city_skips: v => isObj(v) && Object.values(v).every(Number.isFinite),
}
const listOfStrings = listOf(x => typeof x === 'string')
// These two hold a plain date string ("Tue Sep 29 2026"), not JSON.
const AUX_DATE_KEYS = ['hyperloop_last_login', 'hyperloop_last_farewell_date']

function auxValueOk(key, value) {
    if (typeof value !== 'string') return false
    if (AUX_DATE_KEYS.includes(key)) return !Number.isNaN(Date.parse(value))
    let parsed
    try { parsed = JSON.parse(value) } catch { return false }
    return (AUX_SHAPES[key] ?? listOfStrings)(parsed)
}

function restoreAuxState(state) {
    if (!state || typeof state !== 'object') return
    AUX_KEYS.forEach(key => {
        if (state[key] === undefined || !auxValueOk(key, state[key])) return
        // One extra failing (storage full, say) must not undo an import that has already been written
        try { localStorage.setItem(key, state[key]) } catch { /* skip this extra */ }
    })
}

// Simple checksum — hash key fields into a reproducible string
function computeChecksum(save) {
    const str = [
        save.version,
        save.createdAt,
        save.totalCashEarned,
        save.rank,
        save.balance,
        save.purchasedCities?.length ?? 0,
        save.purchasedDevelopments?.length ?? 0,
        save.purchasedUpgrades?.length ?? 0,
    ].join('|')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash |= 0
    }
    return Math.abs(hash).toString(36)
}

const SAVE_NAME_LISTS = ['purchasedCities', 'unlockedCities', 'purchasedDevelopments', 'purchasedUpgrades', 'unlockedDevelopments', 'unlockedUpgrades']
const SAVE_BUILD_LISTS = ['citiesUnderConstruction', 'developmentsUnderConstruction']
const SAVE_NUMBERS = ['balance', 'reputation', 'rank', 'totalCashEarned']

function validateSave(save) {
    if (!save || typeof save !== 'object') return false
    if (!save.version || !save.purchasedCities) return false
    // Every value must have the right type, or the game can crash when it loads.
    if (SAVE_NUMBERS.some(key => !Number.isFinite(save[key]))) return false
    if (SAVE_NAME_LISTS.some(key => save[key] !== undefined && !(Array.isArray(save[key]) && save[key].every(n => typeof n === 'string')))) return false
    if (SAVE_BUILD_LISTS.some(key => save[key] !== undefined && !(Array.isArray(save[key]) && save[key].every(item => item && typeof item.name === 'string' && Number.isFinite(item.finishTime))))) return false
    // Values the game shows or calculates with straight away: a name that isn't text crashed every load, and a creation
    // date that isn't a number wiped the balance through the Founders' Hall bonus (bug #178)
    if (save.terminalName !== undefined && typeof save.terminalName !== 'string') return false
    if (save.createdAt !== undefined && !(Number.isFinite(save.createdAt) && save.createdAt > 0)) return false
    if (save.farewellsGiven !== undefined && !(Number.isFinite(save.farewellsGiven) && save.farewellsGiven >= 0)) return false
    if (save.greetingsGiven !== undefined && !(Number.isFinite(save.greetingsGiven) && save.greetingsGiven >= 0)) return false
    if (save.bonusXp !== undefined && !(Number.isFinite(save.bonusXp) && save.bonusXp >= 0)) return false
    if (save.developmentUpgradeLevels !== undefined && (save.developmentUpgradeLevels === null || typeof save.developmentUpgradeLevels !== 'object' || Array.isArray(save.developmentUpgradeLevels))) return false
    if (save.cityLineLevels !== undefined && (save.cityLineLevels === null || typeof save.cityLineLevels !== 'object' || Array.isArray(save.cityLineLevels))) return false
    // No upper limit on balance or reputation: the game has none, so a long-running save must import (bug #114).
    // Custom development names must be text. Which developments they belong to isn't checked here: a development renamed
    // in an update has its old name in the save (mapped on load), and names for anything not built are dropped on load.
    if (save.developmentNames !== undefined) {
        const names = save.developmentNames
        if (names === null || typeof names !== 'object' || Array.isArray(names)) return false
        if (Object.values(names).some(value => typeof value !== 'string')) return false
    }
    // Connected/built dates are ISO date strings, same shape check as developmentNames above.
    if (save.cityConnectedDates !== undefined) {
        const dates = save.cityConnectedDates
        if (dates === null || typeof dates !== 'object' || Array.isArray(dates)) return false
        if (Object.values(dates).some(value => typeof value !== 'string')) return false
    }
    if (save.developmentBuiltDates !== undefined) {
        const dates = save.developmentBuiltDates
        if (dates === null || typeof dates !== 'object' || Array.isArray(dates)) return false
        if (Object.values(dates).some(value => typeof value !== 'string')) return false
    }
    // Every development upgrade level, and every city line-upgrade level, must be a whole number from 0 to 10
    // (bug #82; raised from a max of 3 when levels 4-10 were added)
    if (save.developmentUpgradeLevels && Object.values(save.developmentUpgradeLevels).some(v => !Number.isInteger(v) || v < 0 || v > 10)) return false
    if (save.cityLineLevels && Object.values(save.cityLineLevels).some(v => !Number.isInteger(v) || v < 0 || v > 10)) return false
    if (save.balance < 0) return false
    if (save.reputation < 0) return false
    if (save.rank < 1 || save.rank > MAX_RANK) return false
    // Every game starts with STARTING_BALANCE and £0 earned, and a Sign-On Bonus adds its amount on top of that
    // straight into the balance (not as earned cash), so the balance can be up to that much above the total earned
    // (bug #56). The bonus is allowed for everyone: a save doesn't say whether the player owns it.
    // The two totals round differently, so allow a pound of slack
    if (save.balance > save.totalCashEarned + STARTING_BALANCE + PRESTIGE_VALUES.signOnBonus + 1) return false
    if (save.purchasedCities.length > allCities.length) return false
    if (save.purchasedDevelopments.length > allDevelopments.length) return false
    if (save.purchasedUpgrades.length > allUpgrades.length) return false

    // There is deliberately no limit on how fast a save may have earned (bug #140): the late game, with Prestige
    // upgrades, can honestly average more than any fixed ceiling, and a hand-edited save
    // harms nobody else (bug #114).

    return true
}

// A save already in storage that cannot be read. loadGame throws this instead of starting a new game, because the
// first autosave of that new game would write over the only copy of the old one (R2-L1). The error screen
// (components/ErrorBoundary.jsx) then offers "Download my save" and a reset.
export class SaveLoadError extends Error {
    constructor(message) {
        super(message)
        this.name = 'SaveLoadError'
    }
}

// Where a copy of an unreadable save is kept, untouched by anything the game does afterwards.
const SAVE_BACKUP_KEY = 'hyperloop_save_backup'

// The part of validateSave that decides whether the game can load a save at all: every value the loader reads must
// have the right type. A value that is missing is fine (older saves lack some, and the loader has a default for each).
// The plausibility checks in validateSave (balance against total earned, rank limits and so on) are left out on
// purpose: they are there to catch hand-edited imports, and a real save must never be refused because of one.
function hasLoadableShape(save) {
    if (!save || typeof save !== 'object' || Array.isArray(save)) return false
    const isMap = value => value === undefined || (value !== null && typeof value === 'object' && !Array.isArray(value))
    if (SAVE_NUMBERS.some(key => save[key] != null && !Number.isFinite(save[key]))) return false
    if (SAVE_NAME_LISTS.some(key => save[key] != null && !(Array.isArray(save[key]) && save[key].every(n => typeof n === 'string')))) return false
    if (SAVE_BUILD_LISTS.some(key => save[key] != null && !(Array.isArray(save[key]) && save[key].every(item => item && typeof item.name === 'string' && Number.isFinite(item.finishTime))))) return false
    if (save.terminalName != null && typeof save.terminalName !== 'string') return false
    if (!isMap(save.developmentUpgradeLevels) || !isMap(save.cityLineLevels)) return false
    return true
}

export function saveGame(progressionManager, rankManager, terminalName, farewellsGiven) {
    const save = buildSave(progressionManager, rankManager, terminalName, farewellsGiven)
    if (!save) return
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    // The new run exists now, so the start-up note from a prestige has done its job
    localStorage.removeItem('hyperloop_run_start')
}

// The save as it stands right now, without writing it anywhere: what saveGame stores, and what Export hands over
// when the browser is refusing to store it. Null before the home city exists.
export function buildSave(progressionManager, rankManager, terminalName, farewellsGiven) {
    // Nothing is saved until the home city exists. A save written during the naming screen
    // or the tutorial build made a reload skip onboarding, or let the player pick a second
    // free starter city (bug #87).
    if (progressionManager.purchasedCities.length === 0) return null
    const existing = getSaveRaw()
    // A creation date that isn't a number is replaced rather than written back (bug #178)
    const createdAt = Number.isFinite(existing?.createdAt) && existing.createdAt > 0 ? Math.min(existing.createdAt, Date.now()) : Date.now()

    const save = {
        version: 1,
        createdAt,
        timestamp: Date.now(),
        terminalName,
        farewellsGiven: farewellsGiven ?? 0,
        greetingsGiven: progressionManager.greetingsGiven ?? 0,
        balance: progressionManager.balance,
        reputation: progressionManager.reputation,
        totalCashEarned: progressionManager.totalCashEarned,
        // Government Grants' XP head start, kept apart from the cash earned (see RankManager.bonusXp)
        bonusXp: rankManager.bonusXp,
        rank: rankManager.rank,
        purchasedCities: progressionManager.purchasedCities.map(c => c.name),
        unlockedCities: progressionManager.unlockedCities.map(c => c.name),
        purchasedDevelopments: progressionManager.purchasedDevelopments.map(d => d.name),
        purchasedUpgrades: progressionManager.purchasedUpgrades.map(u => u.name),
        unlockedDevelopments: progressionManager.unlockedDevelopments.map(d => d.name),
        unlockedUpgrades: progressionManager.unlockedUpgrades.map(u => u.name),
        developmentUpgradeLevels: progressionManager.developmentUpgradeLevels,
        cityLineLevels: progressionManager.cityLineLevels,
        developmentNames: progressionManager.developmentNames,
        cityConnectedDates: progressionManager.cityConnectedDates,
        developmentBuiltDates: progressionManager.developmentBuiltDates,
        citiesUnderConstruction: progressionManager.citiesUnderConstruction.map(c => ({
            name: c.name,
            finishTime: c.finishTime
        })),
        developmentsUnderConstruction: progressionManager.developmentsUnderConstruction.map(d => ({
            name: d.name,
            finishTime: d.finishTime
        })),
    }

    save.checksum = computeChecksum(save)
    return save
}

export function loadGame(progressionManager, rankManager) {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null

    try {
        const save = JSON.parse(raw)
        if (!hasLoadableShape(save)) throw new SaveLoadError('The saved game has values the game cannot read')

        // Bring old names up to date before looking anything up.
        ;['purchasedCities', 'unlockedCities', 'purchasedDevelopments', 'purchasedUpgrades', 'unlockedDevelopments', 'unlockedUpgrades']
            .forEach(key => { save[key] = (save[key] || []).map(currentName) })
        ;['citiesUnderConstruction', 'developmentsUnderConstruction']
            .forEach(key => { save[key] = (save[key] || []).map(item => ({ ...item, name: currentName(item.name) })) })
        if (save.developmentUpgradeLevels) {
            save.developmentUpgradeLevels = Object.fromEntries(
                Object.entries(save.developmentUpgradeLevels).map(([name, level]) => [currentName(name), level])
            )
        }
        if (save.cityLineLevels) {
            save.cityLineLevels = Object.fromEntries(
                Object.entries(save.cityLineLevels).map(([name, level]) => [currentName(name), level])
            )
        }
        if (save.developmentNames && typeof save.developmentNames === 'object' && !Array.isArray(save.developmentNames)) {
            save.developmentNames = Object.fromEntries(
                Object.entries(save.developmentNames).map(([name, custom]) => [currentName(name), custom])
            )
        }
        if (save.cityConnectedDates && typeof save.cityConnectedDates === 'object' && !Array.isArray(save.cityConnectedDates)) {
            save.cityConnectedDates = Object.fromEntries(
                Object.entries(save.cityConnectedDates).map(([name, date]) => [currentName(name), date])
            )
        }
        if (save.developmentBuiltDates && typeof save.developmentBuiltDates === 'object' && !Array.isArray(save.developmentBuiltDates)) {
            save.developmentBuiltDates = Object.fromEntries(
                Object.entries(save.developmentBuiltDates).map(([name, date]) => [currentName(name), date])
            )
        }

        progressionManager.balance = save.balance ?? STARTING_BALANCE
        progressionManager.reputation = save.reputation ?? 50
        let totalCashEarned = save.totalCashEarned ?? 0
        let bonusXp = Number.isFinite(save.bonusXp) && save.bonusXp > 0 ? Math.floor(save.bonusXp) : 0
        // A run that took Government Grants before bonusXp existed has the grant's XP folded into its cash earned. Moved
        // back out, once: a save with no bonusXp field, from a run with granted cities, whose total covers the grant.
        if (save.bonusXp === undefined && hasGrantedCities()) {
            const grantXp = rankManager.getCumulativeXP(GRANT_RANK - 1)
            if (totalCashEarned >= grantXp) { totalCashEarned -= grantXp; bonusXp = grantXp }
        }
        progressionManager.totalCashEarned = totalCashEarned
        // Kept to the game's own range: a rank of 0 or above the top rank (only possible in an edited save) is put back
        // inside it, so the XP bar and rank checks have a real rank to work from
        rankManager.rank = Math.min(MAX_RANK, Math.max(1, Math.floor(save.rank ?? 1)))
        rankManager.bonusXp = bonusXp
        rankManager.convertCashToXP(totalCashEarned)

        save.purchasedCities.forEach(name => {
            const city = allCities.find(c => c.name === name)
            if (city && !progressionManager.purchasedCities.includes(city)) {
                progressionManager.purchasedCities.push(city)
            }
        })

        save.unlockedCities.forEach(name => {
            const city = allCities.find(c => c.name === name)
            if (city && !progressionManager.unlockedCities.includes(city)) {
                progressionManager.unlockedCities.push(city)
            }
        })

        save.purchasedDevelopments.forEach(name => {
            const dev = allDevelopments.find(d => d.name === name)
            if (dev && !progressionManager.purchasedDevelopments.includes(dev)) {
                progressionManager.purchasedDevelopments.push(dev)
            }
        })

        save.purchasedUpgrades.forEach(name => {
            const upgrade = allUpgrades.find(u => u.name === name)
            if (upgrade && !progressionManager.purchasedUpgrades.includes(upgrade)) {
                progressionManager.purchasedUpgrades.push(upgrade)
            }
        })

        save.unlockedDevelopments.forEach(name => {
            const dev = allDevelopments.find(d => d.name === name)
            if (dev && !progressionManager.unlockedDevelopments.includes(dev)) {
                progressionManager.unlockedDevelopments.push(dev)
            }
        })

        save.unlockedUpgrades.forEach(name => {
            const upgrade = allUpgrades.find(u => u.name === name)
            if (upgrade && !progressionManager.unlockedUpgrades.includes(upgrade)) {
                progressionManager.unlockedUpgrades.push(upgrade)
            }
        })

        ;(save.citiesUnderConstruction || []).forEach(({ name, finishTime }) => {
            const city = allCities.find(c => c.name === name)
            if (city && !progressionManager.purchasedCities.includes(city)) {
                city.finishTime = finishTime
                city.underConstruction = true
                progressionManager.citiesUnderConstruction.push(city)
            }
        })

        const allItems = [...allDevelopments, ...allUpgrades]
        ;(save.developmentsUnderConstruction || []).forEach(({ name, finishTime }) => {
            const dev = allItems.find(d => d.name === name)
            if (dev && !progressionManager.purchasedDevelopments.includes(dev) && !progressionManager.purchasedUpgrades.includes(dev)) {
                dev.finishTime = finishTime
                dev.underConstruction = true
                progressionManager.developmentsUnderConstruction.push(dev)
            }
        })

        progressionManager.developmentUpgradeLevels = save.developmentUpgradeLevels || {}
        progressionManager.cityLineLevels = save.cityLineLevels || {}
        // The home city's line can't be upgraded (the Cities page and the globe never offer it), so a level on it can only
        // be the free one older versions of Colour Theory handed out - dropped, so its card stops showing LVL 1
        const homeCity = progressionManager.purchasedCities[0]
        if (homeCity) delete progressionManager.cityLineLevels[homeCity.name]
        progressionManager.cityConnectedDates = save.cityConnectedDates || {}
        progressionManager.developmentBuiltDates = save.developmentBuiltDates || {}
        progressionManager.greetingsGiven = Number.isFinite(save.greetingsGiven) && save.greetingsGiven >= 0 ? Math.floor(save.greetingsGiven) : 0

        // Custom names only count for developments that are built, and are cleaned the same way as when typed
        const customNames = {}
        Object.entries(save.developmentNames || {}).forEach(([name, custom]) => {
            const clean = sanitizeDevelopmentName(custom)
            if (clean && clean !== name && progressionManager.purchasedDevelopments.some(d => d.name === name)) customNames[name] = clean
        })
        progressionManager.developmentNames = customNames

        // Unlock any reward of a connected city that isn't built, unlocked or being built —
        // e.g. when a city's reward has changed since the player connected it (bug #86).
        const owned = new Set([
            ...progressionManager.purchasedDevelopments,
            ...progressionManager.purchasedUpgrades,
            ...progressionManager.developmentsUnderConstruction,
        ])
        progressionManager.purchasedCities.forEach(city => {
            city.rewards.forEach(reward => { if (!owned.has(reward)) progressionManager.unlockReward(reward) })
        })

        // The same checks as an import, for a save already in storage (bug #178); a creation date in the future
        // (the clock was ahead) is brought back to now
        const createdAt = Number.isFinite(save.createdAt) && save.createdAt > 0 ? Math.min(save.createdAt, Date.now()) : Date.now()
        return {
            terminalName: typeof save.terminalName === 'string' && save.terminalName.trim() ? save.terminalName : 'Hyperloop Central',
            createdAt,
            farewellsGiven: Number.isFinite(save.farewellsGiven) && save.farewellsGiven >= 0 ? save.farewellsGiven : 0,
            lastSaved: save.timestamp ?? null,
        }

    } catch (e) {
        console.error('Failed to load save:', e)
        // Keep a copy, then stop: carrying on as a new game would let the first autosave replace this one
        try { if (localStorage.getItem(SAVE_BACKUP_KEY) === null) localStorage.setItem(SAVE_BACKUP_KEY, raw) } catch { /* storage full: the save itself is still there */ }
        throw e instanceof SaveLoadError ? e : new SaveLoadError(e?.message || 'The saved game could not be read')
    }
}

export function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null
}

export function deleteSave() {
    localStorage.removeItem(SAVE_KEY)
}

// liveSave (from buildSave) is used instead of the stored save when given, so an export still has everything up to
// this moment even while the browser is refusing to store saves
export function exportSave(liveSave = null) {
    const raw = liveSave ? JSON.stringify(liveSave) : localStorage.getItem(SAVE_KEY)
    if (!raw) return
    // A save that is not valid JSON is handed over exactly as stored, so a damaged one can still be rescued
    let text = raw
    try {
        const save = JSON.parse(raw)
        if (save && typeof save === 'object' && !Array.isArray(save)) text = JSON.stringify({ ...save, _aux: bundleAuxState() })
    } catch { /* keep the raw text */ }
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hyperloop-save-${new Date().toISOString().slice(0, 10)}.json`
    // In the page for the click, and the link kept alive a moment after it: some browsers cancel a download
    // whose link isn't attached or is revoked straight away
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function importSave(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const bundle = JSON.parse(e.target.result)

                // Extract and strip aux state before validation
                const auxState = bundle._aux || null
                const data = { ...bundle }
                delete data._aux

                // Validate structure
                if (!validateSave(data)) throw new Error('Invalid save file')

                // Verify checksum if present
                if (data.checksum) {
                    const storedChecksum = data.checksum
                    const { checksum: _, ...saveWithoutChecksum } = data
                    const computed = computeChecksum(saveWithoutChecksum)
                    if (computed !== storedChecksum) {
                        console.warn('Save checksum mismatch — save may have been modified')
                    }
                }

                localStorage.setItem(SAVE_KEY, JSON.stringify(data))

                // The previous game's departures, event and so on don't carry over (bug #92).
                clearDayState()
                // The file's extras replace the current ones rather than merging with them (bug #67).
                // A file from before extras were exported leaves the current ones alone.
                if (auxState) {
                    removeKeys(AUX_KEYS)
                    restoreAuxState(auxState)
                } else {
                    // The departure timetable always belongs to the game it was made for: the current one's would
                    // leave the imported game's cities off it, earning nothing. Without it, the imported cities are
                    // all put on a fresh timetable when the game starts.
                    removeKeys(['hyperloop_timetable', 'hyperloop_timetable_autofilled', 'hyperloop_first_loop_prompt'])
                }

                resolve()
            } catch {
                reject(new Error('Invalid save file'))
            }
        }
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.readAsText(file)
    })
}

function getSaveRaw() {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
}
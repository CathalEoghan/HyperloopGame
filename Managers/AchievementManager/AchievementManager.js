import { ACHIEVEMENTS, ACHIEVEMENT_IDS, ACHIEVEMENT_BY_ID } from './achievements.js'
import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'
import { PRESTIGE_UPGRADES } from '../PrestigeManager/prestigeUpgrades.js'
import { allCities } from '../../CityManager/CityRegistry.js'
import { allUpgrades } from '../../UpgradeManager/UpgradeRegistry.js'
import { readLivestreamClicks } from '../PrestigeManager/livestream.js'

export const ACHIEVEMENTS_KEY = 'hyperloop_achievements'
export const COUNTERS_KEY = 'hyperloop_achievement_counters'
// Achievements earned but not yet looked at (the red dot on the Achievements page)
export const UNSEEN_KEY = 'hyperloop_achievements_unseen'

const REGULAR_CITIES = allCities.filter(c => c.continent !== 'Antarctica')
const REGULAR_CONTINENTS = new Set(REGULAR_CITIES.map(c => c.continent)).size
// Upgrades handed out as milestone rewards (or Early Retirement) aren't "constructed" by the player
export const NOT_BUILT = new Set(['dailyLoginMultiplier', 'terminalAgeBoost', 'workPerAchievement', 'earlyRetirement'])
// One Advertising Campaign upgrade for each country: Universal Brand wants them all
const AD_CAMPAIGN_TOTAL = allUpgrades.filter(u => u.effectType === 'countryAdvertisingBoost').length

// Unlocked achievements and running totals (Work presses, farewells). Stored apart from the run, so a prestige
// keeps them: an achievement is earned once, for good.
export class AchievementManager {
    constructor() {
        this.unlocked = new Set()
        this.counters = {}
        this.unseen = new Set()
        this.load()
    }

    load() {
        try {
            const list = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY))
            if (Array.isArray(list)) this.unlocked = new Set(list.filter(id => ACHIEVEMENT_IDS.has(id)))
        } catch { /* nothing saved yet */ }
        // Even More Diverse used to be 50 countries, and More Diverse is now the 50-country one: anyone who has the
        // first earned the second. It gets a red dot, so they see it.
        const needsMoreDiverse = this.unlocked.has('evenMoreDiverse') && !this.unlocked.has('moreDiverse')
        if (needsMoreDiverse) this.unlocked.add('moreDiverse')
        try {
            const list = JSON.parse(localStorage.getItem(UNSEEN_KEY))
            if (Array.isArray(list)) this.unseen = new Set(list.filter(id => this.unlocked.has(id)))
        } catch { /* nothing saved yet */ }
        try {
            const c = JSON.parse(localStorage.getItem(COUNTERS_KEY))
            if (c && typeof c === 'object' && !Array.isArray(c)) {
                Object.entries(c).forEach(([k, v]) => { if (Number.isFinite(v) && v >= 0) this.counters[k] = Math.floor(v) })
            }
        } catch { /* nothing saved yet */ }
        if (needsMoreDiverse) { this.unseen.add('moreDiverse'); this.save() }
    }

    save() {
        try {
            localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...this.unlocked]))
            localStorage.setItem(COUNTERS_KEY, JSON.stringify(this.counters))
            localStorage.setItem(UNSEEN_KEY, JSON.stringify([...this.unseen]))
        } catch { /* storage full */ }
    }

    has(id) { return this.unlocked.has(id) }

    get count() { return this.unlocked.size }

    isUnseen(id) { return this.unseen.has(id) }

    get unseenCount() { return this.unseen.size }

    // The player has looked at this achievement: its red dot goes. Returns true if there was one.
    markSeen(id) {
        if (!this.unseen.delete(id)) return false
        this.save()
        return true
    }

    // Unlocks one achievement. Returns true if it is new.
    unlock(id) {
        if (!ACHIEVEMENT_IDS.has(id) || this.unlocked.has(id)) return false
        this.unlocked.add(id)
        this.unseen.add(id)
        this.save()
        return true
    }

    counter(name) { return this.counters[name] || 0 }

    addCounter(name, n = 1) {
        this.counters[name] = this.counter(name) + n
        this.save()
    }

    // Keeps the larger of the stored value and this one (a best, like the highest rank reached)
    raiseCounter(name, value) {
        if (!Number.isFinite(value) || value <= this.counter(name)) return
        this.counters[name] = Math.floor(value)
        this.save()
    }

    // Start a running total from a value the game already knew (the farewell count of a game from before achievements).
    seedCounter(name, value) {
        if (name in this.counters || !Number.isFinite(value) || value <= 0) return
        this.counters[name] = Math.floor(value)
        this.save()
    }

    // A snapshot of the game for the state achievements. `extra.activeLoopKm` lists the length of every loop
    // travelling right now, which only the game screen knows.
    buildContext(progressionManager, rankManager, extra = {}) {
        const prestige = new PrestigeManager()
        const categories = {}
        let builds = 0
        const count = item => { builds++; categories[item.category] = (categories[item.category] || 0) + 1 }
        progressionManager.purchasedDevelopments.forEach(count)
        progressionManager.purchasedUpgrades.forEach(u => { if (!NOT_BUILT.has(u.effectType)) count(u) })
        let likes = 0
        try { likes = (JSON.parse(localStorage.getItem('hyperloop_hyperlink_liked')) || []).length } catch { likes = 0 }
        // Every general theme id the player owns from the Shop (bought individually or as part of a bundle -
        // either way it ends up in this same 'generalTheme:<id>' list, see utils/cosmetics.js), for achievements
        // like I Wanna Be a Rockstar that want a theme purchased rather than currently equipped.
        let ownedThemes = []
        try {
            const owned = JSON.parse(localStorage.getItem('hyperloop_cosmetics'))?.owned
            if (Array.isArray(owned)) ownedThemes = owned.filter(k => typeof k === 'string' && k.startsWith('generalTheme:')).map(k => k.slice('generalTheme:'.length))
        } catch { ownedThemes = [] }
        const cities = progressionManager.purchasedCities
        // Everything built, by name (developments and upgrades alike)
        const builtNames = [
            ...progressionManager.purchasedDevelopments.map(d => d.name),
            ...progressionManager.purchasedUpgrades.filter(u => !NOT_BUILT.has(u.effectType)).map(u => u.name),
        ]
        const loopKm = extra.activeLoopKm || []
        return {
            cities: cities.length,
            regularConnected: cities.filter(c => c.continent !== 'Antarctica').length,
            regularTotal: REGULAR_CITIES.length,
            secretConnected: cities.some(c => c.continent === 'Antarctica'),
            countries: new Set(cities.map(c => c.country)).size,
            continents: new Set(cities.map(c => c.continent).filter(c => c !== 'Antarctica')).size,
            continentsTotal: REGULAR_CONTINENTS,
            cityNames: cities.map(c => c.name),
            // The run's home city: the first city connected (Nom Nom Nomsk, Costa del Nuuk, Czech Mate)
            homeCity: cities[0]?.name ?? null,
            // Any Food development upgraded all the way to its top level (10)
            maxedFood: progressionManager.purchasedDevelopments.some(d => d.category === 'Food' && progressionManager.getDevelopmentUpgradeLevel(d) >= 10),
            positiveEvents: this.counter('positiveEvents'),
            negativeEvents: this.counter('negativeEvents'),
            // Runs ended by retiring (the Past Runs list), for Groundhog Day
            retirements: PrestigeManager.getHistory().length,
            reputation: progressionManager.reputation,
            dailyBonus: this.counter('dailyBonus'),
            // Email requests fulfilled, ever (counted in App.jsx when a request is met in time)
            emailsFulfilled: this.counter('emailsFulfilled'),
            devUpgrades: this.counter('devUpgrades'),
            cityUpgrades: this.counter('cityUpgrades'),
            citiesAndDevUpgrades: this.counter('devUpgrades') + this.counter('cityUpgrades'),
            builds,
            builtNames,
            ownedThemes,
            adCampaignsOwned: progressionManager.purchasedUpgrades.filter(u => u.effectType === 'countryAdvertisingBoost').length,
            adCampaignsTotal: AD_CAMPAIGN_TOTAL,
            passengers: this.counter('passengers'),
            playtime: this.counter('playtime'),
            longestLoopKm: loopKm.length ? Math.max(...loopKm) : 0,
            shortestLoopKm: loopKm.length ? Math.min(...loopKm) : null,
            categories,
            rank: rankManager.rank,
            balance: progressionManager.balance,
            // Cash actually earned this run (not the starting balance, Sign-On Bonus or refunds, and since Government Grants'
            // XP was split out, not that either)
            runCashEarned: progressionManager.totalCashEarned,
            likes,
            farewells: this.counter('farewells'),
            greetings: this.counter('greetings'),
            farewellsAndGreetings: this.counter('farewells') + this.counter('greetings'),
            work: this.counter('work'),
            // Work presses in this run only (cleared by a new game or a prestige). Best P.A. Ever's automatic presses count
            // too, since this is the Livestream click counter, so Couch Potato needs Best P.A. Ever switched off
            runWork: readLivestreamClicks(),
            prestigeEarned: prestige.points > 0 || prestige.owned.length > 0 || PrestigeManager.getHistory().length > 0,
            prestigeOwned: prestige.owned.length,
            prestigeTotal: PRESTIGE_UPGRADES.length,
        }
    }

    // Runs every state achievement against the game. Returns the ids unlocked just now.
    evaluate(progressionManager, rankManager, extra = {}) {
        const ctx = this.buildContext(progressionManager, rankManager, extra)
        const fresh = []
        ACHIEVEMENTS.forEach(a => {
            if (a.check && !this.unlocked.has(a.id) && a.check(ctx)) { this.unlocked.add(a.id); this.unseen.add(a.id); fresh.push(a.id) }
        })
        if (fresh.length) this.save()
        return fresh
    }

    static byId(id) { return ACHIEVEMENT_BY_ID[id] }
}

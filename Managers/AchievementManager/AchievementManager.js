import { ACHIEVEMENTS, ACHIEVEMENT_IDS, ACHIEVEMENT_BY_ID } from './achievements.js'
import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'
import { PRESTIGE_UPGRADES } from '../PrestigeManager/prestigeUpgrades.js'
import { allCities } from '../../CityManager/CityRegistry.js'

export const ACHIEVEMENTS_KEY = 'hyperloop_achievements'
export const COUNTERS_KEY = 'hyperloop_achievement_counters'

const REGULAR_CITIES = allCities.filter(c => c.continent !== 'Antarctica')
// Upgrades handed out as milestone rewards (or Early Retirement) aren't "constructed" by the player
const NOT_BUILT = new Set(['dailyLoginMultiplier', 'terminalAgeBoost', 'workPerAchievement', 'earlyRetirement'])

// Unlocked achievements and running totals (Work presses, farewells). Stored apart from the run, so a prestige
// keeps them: an achievement is earned once, for good.
export class AchievementManager {
    constructor() {
        this.unlocked = new Set()
        this.counters = {}
        this.load()
    }

    load() {
        try {
            const list = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY))
            if (Array.isArray(list)) this.unlocked = new Set(list.filter(id => ACHIEVEMENT_IDS.has(id)))
        } catch { /* nothing saved yet */ }
        try {
            const c = JSON.parse(localStorage.getItem(COUNTERS_KEY))
            if (c && typeof c === 'object' && !Array.isArray(c)) {
                Object.entries(c).forEach(([k, v]) => { if (Number.isFinite(v) && v >= 0) this.counters[k] = Math.floor(v) })
            }
        } catch { /* nothing saved yet */ }
    }

    save() {
        try {
            localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...this.unlocked]))
            localStorage.setItem(COUNTERS_KEY, JSON.stringify(this.counters))
        } catch { /* storage full */ }
    }

    has(id) { return this.unlocked.has(id) }

    get count() { return this.unlocked.size }

    // Unlocks one achievement. Returns true if it is new.
    unlock(id) {
        if (!ACHIEVEMENT_IDS.has(id) || this.unlocked.has(id)) return false
        this.unlocked.add(id)
        this.save()
        return true
    }

    counter(name) { return this.counters[name] || 0 }

    addCounter(name, n = 1) {
        this.counters[name] = this.counter(name) + n
        this.save()
    }

    // Start a running total from a value the game already knew (the farewell count of a game from before achievements).
    seedCounter(name, value) {
        if (name in this.counters || !Number.isFinite(value) || value <= 0) return
        this.counters[name] = Math.floor(value)
        this.save()
    }

    // A snapshot of the game for the state achievements.
    buildContext(progressionManager, rankManager) {
        const prestige = new PrestigeManager()
        const categories = {}
        let builds = 0
        const count = item => { builds++; categories[item.category] = (categories[item.category] || 0) + 1 }
        progressionManager.purchasedDevelopments.forEach(count)
        progressionManager.purchasedUpgrades.forEach(u => { if (!NOT_BUILT.has(u.effectType)) count(u) })
        let likes = 0
        try { likes = (JSON.parse(localStorage.getItem('hyperloop_hyperlink_liked')) || []).length } catch { likes = 0 }
        const cities = progressionManager.purchasedCities
        return {
            cities: cities.length,
            regularConnected: cities.filter(c => c.continent !== 'Antarctica').length,
            regularTotal: REGULAR_CITIES.length,
            secretConnected: cities.some(c => c.continent === 'Antarctica'),
            countries: new Set(cities.map(c => c.country)).size,
            builds,
            categories,
            rank: rankManager.rank,
            balance: progressionManager.balance,
            likes,
            farewells: this.counter('farewells'),
            work: this.counter('work'),
            prestigeEarned: prestige.points > 0 || prestige.owned.length > 0 || PrestigeManager.getHistory().length > 0,
            prestigeOwned: prestige.owned.length,
            prestigeTotal: PRESTIGE_UPGRADES.length,
        }
    }

    // Runs every state achievement against the game. Returns the ids unlocked just now.
    evaluate(progressionManager, rankManager) {
        const ctx = this.buildContext(progressionManager, rankManager)
        const fresh = []
        ACHIEVEMENTS.forEach(a => {
            if (a.check && !this.unlocked.has(a.id) && a.check(ctx)) { this.unlocked.add(a.id); fresh.push(a.id) }
        })
        if (fresh.length) this.save()
        return fresh
    }

    static byId(id) { return ACHIEVEMENT_BY_ID[id] }
}

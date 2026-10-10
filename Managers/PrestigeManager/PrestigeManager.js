import { PRESTIGE_UPGRADES } from './prestigeUpgrades.js'

export const PRESTIGE_KEY = 'hyperloop_prestige'
export const PRESTIGE_HISTORY_KEY = 'hyperloop_prestige_history'
// Prestige Points for ending a run: 1 for every 50 ranks reached (2 at Rank 100)
export const RANKS_PER_PRESTIGE_POINT = 50
export const PRESTIGE_MIN_RANK = 100

let ownedCache = { raw: undefined, set: new Set() }

const byId = Object.fromEntries(PRESTIGE_UPGRADES.map(u => [u.id, u]))

// Prestige Points and the upgrades bought with them. Kept in its own storage key (and bundled
// with the save) so that a future prestige reset can leave it untouched.
export class PrestigeManager {
    constructor() {
        this.points = 0
        this.owned = []
        this.load()
    }

    load() {
        try {
            const raw = JSON.parse(localStorage.getItem(PRESTIGE_KEY))
            if (raw && typeof raw === 'object') {
                this.points = Number.isFinite(raw.points) && raw.points > 0 ? Math.floor(raw.points) : 0
                const ids = Array.isArray(raw.owned) ? raw.owned : []
                this.owned = [...new Set(ids.filter(id => byId[id]))]
            }
        } catch { /* nothing saved yet, or unreadable: start empty */ }
    }

    save() {
        try { localStorage.setItem(PRESTIGE_KEY, JSON.stringify({ points: this.points, owned: this.owned })) } catch { /* storage full */ }
    }

    has(id) { return this.owned.includes(id) }

    // In alphabetical order, which is the order the Prestige page lays them out in
    layerUpgrades(layer) { return PRESTIGE_UPGRADES.filter(u => u.layer === layer).sort((a, b) => a.name.localeCompare(b.name)) }

    ownedInLayer(layer) { return this.layerUpgrades(layer).filter(u => this.has(u.id)).length }

    layerComplete(layer) { return this.ownedInLayer(layer) === this.layerUpgrades(layer).length }

    layerUnlocked(layer) { return layer <= 1 || this.layerComplete(layer - 1) }

    // Why an upgrade can't be bought right now, or null if it can.
    blockedReason(id) {
        const u = byId[id]
        if (!u) return 'Unknown upgrade'
        if (this.has(id)) return 'Owned'
        if (!this.layerUnlocked(u.layer)) return `Own every Layer ${u.layer - 1} upgrade first`
        if (this.points < u.cost) return `Needs ${u.cost - this.points} more Prestige Point${u.cost - this.points === 1 ? '' : 's'}`
        return null
    }

    canBuy(id) { return this.blockedReason(id) === null }

    buy(id) {
        if (!this.canBuy(id)) return false
        this.points -= byId[id].cost
        this.owned.push(id)
        this.save()
        return true
    }

    addPoints(amount) {
        if (!Number.isFinite(amount) || amount <= 0) return
        this.points += Math.floor(amount)
        this.save()
    }

    // Points a run is worth if it ends at this rank. Fast Learner doubles them (Five-Star Researchers does not:
    // it only changes what Experimental Technology pays).
    static pointsForRank(rank) {
        const base = Math.floor(rank / RANKS_PER_PRESTIGE_POINT)
        return PrestigeManager.owns('fastLearner') ? base * 2 : base
    }

    static getHistory() {
        try {
            const list = JSON.parse(localStorage.getItem(PRESTIGE_HISTORY_KEY))
            return Array.isArray(list) ? list.filter(r => r && typeof r === 'object') : []
        } catch { return [] }
    }

    // Ends a run: pays out the points and writes the run into the history. Returns the points paid.
    static completeRun(stats) {
        const points = PrestigeManager.pointsForRank(stats.rank)
        const manager = new PrestigeManager()
        manager.addPoints(points)
        const history = PrestigeManager.getHistory()
        history.push({ ...stats, points, endedAt: Date.now() })
        try { localStorage.setItem(PRESTIGE_HISTORY_KEY, JSON.stringify(history.slice(-100))) } catch { /* storage full */ }
        return points
    }

    // Does the player own this Prestige upgrade? Safe to call from anywhere (economy maths, modals).
    // Reads the stored list, cached against the raw string so hot loops stay cheap.
    static owns(id) {
        let raw = null
        try { raw = localStorage.getItem(PRESTIGE_KEY) } catch { /* storage unavailable */ }
        if (raw !== ownedCache.raw) {
            let ids = []
            try {
                const parsed = JSON.parse(raw)
                if (parsed && Array.isArray(parsed.owned)) ids = parsed.owned.filter(i => byId[i])
            } catch { /* unreadable: treat as none owned */ }
            ownedCache = { raw, set: new Set(ids) }
        }
        return ownedCache.set.has(id)
    }

    // Hands out the Prestige Points an upgrade rewards when it is bought. Five-Star Researchers
    // doubles the reward, then Fast Learner doubles the total (+1 for every 1 gained).
    // Reads the stored state first, so it is safe to call from anywhere.
    static award(basePoints) {
        const manager = new PrestigeManager()
        let points = manager.has('fiveStarResearchers') ? basePoints * 2 : basePoints
        if (manager.has('fastLearner')) points *= 2
        manager.addPoints(points)
        return points
    }
}

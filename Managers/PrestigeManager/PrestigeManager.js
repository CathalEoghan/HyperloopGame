import { PRESTIGE_UPGRADES } from './prestigeUpgrades.js'

export const PRESTIGE_KEY = 'hyperloop_prestige'

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

    layerUpgrades(layer) { return PRESTIGE_UPGRADES.filter(u => u.layer === layer) }

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
}

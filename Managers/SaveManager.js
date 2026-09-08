import { allCities } from '../CityManager/CityRegistry.js'
import { allDevelopments } from '../DevelopmentManager/DevelopmentRegistry.js'
import { allUpgrades } from '../UpgradeManager/UpgradeRegistry.js'

const SAVE_KEY = 'hyperloop_save'
const MAX_BALANCE = 999_000_000_000
const MAX_RANK = 100

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

function validateSave(save) {
    if (!save.version || !save.purchasedCities) return false
    if (save.balance < 0 || save.balance > MAX_BALANCE) return false
    if (save.reputation < 0 || save.reputation > 100000) return false
    if (save.rank < 1 || save.rank > MAX_RANK) return false
    if (save.totalCashEarned < save.balance) return false
    if (save.purchasedCities.length > allCities.length) return false
    if (save.purchasedDevelopments.length > allDevelopments.length) return false
    if (save.purchasedUpgrades.length > allUpgrades.length) return false

    // Rate check — earnings can't be impossibly high relative to terminal age
    const ageSeconds = (Date.now() - save.createdAt) / 1000
    if (ageSeconds > 0) {
        const maxTheoreticalRate = 50_000_000 // £50M/second absolute ceiling
        const impliedRate = save.totalCashEarned / ageSeconds
        if (impliedRate > maxTheoreticalRate) return false
    }

    return true
}

export function saveGame(progressionManager, rankManager, terminalName, farewellsGiven) {
    const existing = getSaveRaw()
    const createdAt = existing?.createdAt ?? Date.now()

    const save = {
        version: 1,
        createdAt,
        timestamp: Date.now(),
        terminalName,
        farewellsGiven: farewellsGiven ?? 0,
        balance: progressionManager.balance,
        reputation: progressionManager.reputation,
        totalCashEarned: progressionManager.totalCashEarned,
        rank: rankManager.rank,
        purchasedCities: progressionManager.purchasedCities.map(c => c.name),
        unlockedCities: progressionManager.unlockedCities.map(c => c.name),
        purchasedDevelopments: progressionManager.purchasedDevelopments.map(d => d.name),
        purchasedUpgrades: progressionManager.purchasedUpgrades.map(u => u.name),
        unlockedDevelopments: progressionManager.unlockedDevelopments.map(d => d.name),
        unlockedUpgrades: progressionManager.unlockedUpgrades.map(u => u.name),
        developmentUpgradeLevels: progressionManager.developmentUpgradeLevels,
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
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
}

export function loadGame(progressionManager, rankManager) {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null

    try {
        const save = JSON.parse(raw)

        progressionManager.balance = save.balance ?? 1000000
        progressionManager.reputation = save.reputation ?? 50
        progressionManager.totalCashEarned = save.totalCashEarned ?? 0
        rankManager.rank = save.rank ?? 1
        rankManager.xp = save.totalCashEarned ?? 0

        save.purchasedCities.forEach(name => {
            const city = allCities.find(c => c.name === name)
            if (city && !progressionManager.purchasedCities.includes(city)) {
                city.connect()
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

        return {
            terminalName: save.terminalName || 'Hyperloop Central',
            createdAt: save.createdAt ?? Date.now(),
            farewellsGiven: save.farewellsGiven ?? 0,
            lastSaved: save.timestamp ?? null,
        }

    } catch (e) {
        console.error('Failed to load save:', e)
        return null
    }
}

export function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null
}

export function deleteSave() {
    localStorage.removeItem(SAVE_KEY)
}

export function exportSave() {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hyperloop-save-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
}

export function importSave(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)

                // Validate structure
                if (!validateSave(data)) throw new Error('Invalid save file')

                // Verify checksum if present
                if (data.checksum) {
                    const storedChecksum = data.checksum
                    const { checksum: _, ...saveWithoutChecksum } = data
                    const computed = computeChecksum(saveWithoutChecksum)
                    if (computed !== storedChecksum) {
                        data.tampered = true
                        console.warn('Save checksum mismatch — save may have been modified')
                    }
                }

                localStorage.setItem(SAVE_KEY, JSON.stringify(data))
                resolve()
            } catch {
                reject(new Error('Invalid save file'))
            }
        }
        reader.readAsText(file)
    })
}

export function isSaveTampered() {
    const save = getSaveRaw()
    if (!save) return false
    if (save.tampered) return true
    if (!save.checksum) return false
    const { checksum: _, ...saveWithoutChecksum } = save
    return computeChecksum(saveWithoutChecksum) !== save.checksum
}

function getSaveRaw() {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
}
import { allCities } from '../CityManager/CityRegistry.js'
import { allDevelopments } from '../DevelopmentManager/DevelopmentRegistry.js'
import { allUpgrades } from '../UpgradeManager/UpgradeRegistry.js'

const SAVE_KEY = 'hyperloop_save'

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
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
}

export function loadGame(progressionManager, rankManager) {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null

    try {
        const save = JSON.parse(raw)

        progressionManager.balance = save.balance ?? 250000
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

        // Restore cities under construction
        ;(save.citiesUnderConstruction || []).forEach(({ name, finishTime }) => {
            const city = allCities.find(c => c.name === name)
            if (city && !progressionManager.purchasedCities.includes(city)) {
                city.finishTime = finishTime
                city.underConstruction = true
                progressionManager.citiesUnderConstruction.push(city)
            }
        })

        // Restore developments under construction
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
                if (!data.version || !data.purchasedCities) throw new Error('Invalid save file')
                localStorage.setItem(SAVE_KEY, JSON.stringify(data))
                resolve()
            } catch {
                reject(new Error('Invalid save file'))
            }
        }
        reader.readAsText(file)
    })
}

function getSaveRaw() {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
}
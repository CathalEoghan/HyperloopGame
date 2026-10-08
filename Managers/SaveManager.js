import { allCities } from '../CityManager/CityRegistry.js'
import { allDevelopments } from '../DevelopmentManager/DevelopmentRegistry.js'
import { allUpgrades } from '../UpgradeManager/UpgradeRegistry.js'
import { MAX_RANK } from './RankManager/RankManager.js'

const SAVE_KEY = 'hyperloop_save'
const MAX_BALANCE = 999_000_000_000

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
    'hyperloop_dev_portrait_bonus',
    'hyperloop_hyperlink_feed',
    'hyperloop_hyperlink_unread',
    'hyperloop_hyperlink_used_posts',
    'hyperloop_hyperlink_used_pfps',
    'hyperloop_hyperlink_user_pfps',
    'hyperloop_hyperlink_fired_devposts',
    'hyperloop_hyperlink_liked',
    'hyperloop_event_tint',
    'hyperloop_hyperlink_used_month_posts',
    'hyperloop_pending_rankups',
    // Kept with the save so a backup can't re-offer today's daily bonus, and an uncollected
    // reward travels with the balance it belongs to (bug #67).
    'hyperloop_last_login',
    'hyperloop_last_farewell_date',
    'hyperloop_pending_daily',
    'hyperloop_pending_offline',
]

// Today's live state for the current game. Never exported: an imported or new game starts
// without it and builds its own (bug #92).
const DAY_STATE_KEYS = [
    'hyperloop_active_departure',
    'hyperloop_active_event',
    'hyperloop_triggered_departures',
    'hyperloop_departures_date',
    'hyperloop_pending_injections',
    'hyperloop_onboarding_pending',
]

function removeKeys(keys) {
    keys.forEach(key => localStorage.removeItem(key))
}

function clearDayState() {
    removeKeys(DAY_STATE_KEYS)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('departures_')) localStorage.removeItem(key)
    })
}

// Everything that belongs to the current game apart from the save itself. Used by Delete Save.
export function clearGameState() {
    removeKeys(AUX_KEYS)
    clearDayState()
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
// Keys not listed here hold a list.
const AUX_SHAPES = {
    hyperloop_hyperlink_user_pfps: v => v !== null && typeof v === 'object' && !Array.isArray(v),
    hyperloop_hyperlink_unread: v => Number.isFinite(v),
    hyperloop_pending_rankups: v => Number.isFinite(v),
    hyperloop_event_tint: v => typeof v === 'boolean',
    hyperloop_dev_portrait_bonus: v => v === 1,
    hyperloop_pending_daily: v => v !== null && typeof v === 'object' && Number.isFinite(v.cashBonus) && Number.isFinite(v.repBonus),
    hyperloop_pending_offline: v => v !== null && typeof v === 'object' && Number.isFinite(v.offlineSeconds) && Number.isFinite(v.offlineIncome),
}
// These two hold a plain date string ("Tue Sep 29 2026"), not JSON.
const AUX_DATE_KEYS = ['hyperloop_last_login', 'hyperloop_last_farewell_date']

function auxValueOk(key, value) {
    if (typeof value !== 'string') return false
    if (AUX_DATE_KEYS.includes(key)) return !Number.isNaN(Date.parse(value))
    let parsed
    try { parsed = JSON.parse(value) } catch { return false }
    return (AUX_SHAPES[key] ?? Array.isArray)(parsed)
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
    if (save.developmentUpgradeLevels !== undefined && (save.developmentUpgradeLevels === null || typeof save.developmentUpgradeLevels !== 'object' || Array.isArray(save.developmentUpgradeLevels))) return false
    if (save.balance < 0 || save.balance > MAX_BALANCE) return false
    if (save.reputation < 0 || save.reputation > 100000) return false
    if (save.rank < 1 || save.rank > MAX_RANK) return false
    // Every game starts with £1,000,000 and £0 earned, so the balance can be up to that much
    // above the total earned (bug #56).
    
    // The two totals round differently, so allow a pound of slack
    if (save.balance > save.totalCashEarned + 1_000_001) return false
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
    // Nothing is saved until the home city exists. A save written during the naming screen
    // or the tutorial build made a reload skip onboarding, or let the player pick a second
    // free starter city (bug #87).
    if (progressionManager.purchasedCities.length === 0) return
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
    const save = JSON.parse(raw)
    const bundle = { ...save, _aux: bundleAuxState() }
    const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' })
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
                        data.tampered = true
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
import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'
import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Development } from "../../DevelopmentManager/Development.js";

// Renaming a development, and removing one (it goes back to Available to build), each cost this much Reputation
export const DEV_RENAME_REP_COST = 20;
export const DEV_REMOVE_REP_COST = 20;
// Automate schedule (the Departure Board's "fill every unscheduled city in for me" button) costs this much
// Reputation per use, so there's a reason to place departures by hand instead of always letting it pick for you.
export const AUTOMATE_SCHEDULE_REP_COST = 10;
// Legal Loopholes: renaming costs half (rounded up)
export const getRenameRepCost = () => PrestigeManager.owns('legalLoopholes') ? Math.ceil(DEV_RENAME_REP_COST / 2) : DEV_RENAME_REP_COST;
// The longest custom name a development can have, so it fits on its card
export const DEV_NAME_MAX_LENGTH = 20;

// A custom name as it is kept: control characters dropped, spaces tidied and trimmed, cut to the limit.
// Returns '' when nothing is left.
export function sanitizeDevelopmentName(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, DEV_NAME_MAX_LENGTH).trim();
}

// The name a development would end up with from what was typed. Its own name always counts as itself, even when it is
// longer than the limit for custom names (some are up to 24 characters), so Reset can always put it back.
export function resolveDevelopmentName(development, raw) {
    const tidy = typeof raw === 'string' ? raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
    if (tidy === development.name) return development.name;
    return sanitizeDevelopmentName(raw);
}

// Levels 1-3 are the original, gentle curve (cash cost as a fraction of the development's own price). Levels
// 4-10 exist so a development is never fully "finished" - each one costs roughly 1.6x the one before (level 4
// costs 3x the development's base price, level 10 costs over 50x it), a flat +50% more revenue every time. The
// revenue keeps growing, but the ever-steeper cost means each level is worth less per pound than the last - it's
// meant to stay a real sink however much income has grown, not something a thriving economy finishes and forgets.
const UPGRADE_CASH_PCTS = [0, 0.15, 0.35, 0.50, 3.00, 4.80, 7.68, 12.29, 19.66, 31.46, 50.33];
const UPGRADE_REP_COSTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const UPGRADE_BOOST_PCTS = [0, 15, 35, 50, 50, 50, 50, 50, 50, 50, 50];
const UPGRADE_TOTAL_PCTS = [0, 15, 50, 100, 150, 200, 250, 300, 350, 400, 450];
const MAX_DEV_LEVEL = UPGRADE_CASH_PCTS.length - 1; // 10

// A connected city's own late-game sink: "upgrading the line" to it, 10 levels, priced off what it cost to
// connect in the first place (so a Tier 3 city's line is a much bigger sink than a Tier 1 city's). Cost grows
// ~1.6x per level (level 1 costs 3x the connection price, level 10 over 200x it) for a flat +40% income each
// time - same diminishing-value shape as the development levels above, so cash still matters deep into the
// late game even once every city is connected and every development is built and maxed.
const LINE_BASE_COST = { 0: 2500000, 1: 50000, 2: 250000, 3: 1000000 };
const LINE_LEVEL_CASH_MULT = 3.00; // level 1's cost, as a multiple of the city's connection price
const LINE_LEVEL_CASH_GROWTH = 1.6; // each further level costs this much more than the one before
const LINE_LEVEL_REP_COST = 10; // per level, flat
const LINE_LEVEL_INCOME_PCT = 40; // +40% income per level, every level
export const MAX_LINE_LEVEL = 10;

export class ProgressionManager {
    constructor(rankManager) {
        this.purchasedCities = [];
        this.unlockedCities = [];
        this.unlockedRewards = [];
        this.unlockedUpgrades = [];
        this.purchasedUpgrades = [];
        this.unlockedDevelopments = [];
        this.purchasedDevelopments = [];
        this.citiesUnderConstruction = [];
        this.balance = 1000000;
        this.reputation = 50;
        this.totalCashEarned = 0;
        this.rankManager = rankManager;
        this.developmentsUnderConstruction = [];
        this.developmentUpgradeLevels = {};
        // Line-upgrade level per connected city, keyed by name exactly like developmentUpgradeLevels - see
        // getCityLineLevel() below for why it can't live as a field on the City object itself.
        this.cityLineLevels = {};
        // Custom names players have given developments: original name -> custom name. Only ever used for display.
        this.developmentNames = {};
        // Arriving loops greeted in this run (a prestige starts it again, like the farewell count)
        this.greetingsGiven = 0;
    }

    unlockReward(reward) {
        if (!this.unlockedRewards.includes(reward)) this.unlockedRewards.push(reward);
        if (reward instanceof Upgrade && !this.unlockedUpgrades.includes(reward)) this.unlockedUpgrades.push(reward);
        if (reward instanceof Development && !this.unlockedDevelopments.includes(reward)) this.unlockedDevelopments.push(reward);
    }

    unlockCity(city) {
        if (!this.unlockedCities.includes(city)) this.unlockedCities.push(city);
    }

    addCash(amount) {
    if (amount > 0) {
        this.totalCashEarned += amount;
        this.balance += amount;
    } else {
        this.balance = Math.max(0, this.balance + amount);
    }
}

    addReputation(amount) {
        this.reputation = Math.max(0, this.reputation + amount);
    }

    spendReputation(amount) {
        if (this.reputation >= amount) { this.reputation -= amount; return true; }
        return false;
    }

    spendCash(amount) {
        if (this.balance >= amount) { this.balance -= amount; return true; }
        return false;
    }

    purchaseCity(city) {
        if (this.purchasedCities.includes(city)) return;
        city.connect();
        city.rewards.forEach(reward => this.unlockReward(reward));
        this.purchasedCities.push(city);
        this.unlockedCities = this.unlockedCities.filter(c => c !== city);
        // Colour Theory: a newly connected city opens at Line Level 1, with no cash or Reputation paid
        if (PrestigeManager.owns('colourTheory') && !this.cityLineLevels[city.name]) this.cityLineLevels[city.name] = 1;
    }

    purchaseDevelopment(development) {
        const isUnlocked = this.unlockedDevelopments.includes(development) || this.unlockedUpgrades.includes(development);
        if (!isUnlocked) return;
        if (this.purchasedDevelopments.includes(development) || this.purchasedUpgrades.includes(development)) return;
        if (development instanceof Upgrade) {
            this.purchasedUpgrades.push(development);
            if (development.effectType === 'prestigePoints') PrestigeManager.award(development.effectValue);
            this.unlockedUpgrades = this.unlockedUpgrades.filter(u => u !== development);
        } else {
            this.purchasedDevelopments.push(development);
            // Colour Theory: a development that earns money opens at Upgrade Level 1, with no cash or Reputation paid
            if (development.revenue && PrestigeManager.owns('colourTheory') && !this.developmentUpgradeLevels[development.name]) this.developmentUpgradeLevels[development.name] = 1;
            this.unlockedDevelopments = this.unlockedDevelopments.filter(d => d !== development);
        }
        this.unlockedRewards = this.unlockedRewards.filter(r => r !== development);
    }

    // Every city a rank-up could hand out: not connected, not already unlocked. The Antarctic Peninsula is the
    // secret finale city, so it is never part of a normal unlock. Lobbying Suavity lets the player pick from these.
    getUnlockableCities(allCities) {
        return allCities.filter(city =>
            city.continent !== 'Antarctica' &&
            !this.purchasedCities.includes(city) && !this.unlockedCities.includes(city)
        );
    }

        // exclude: a city that must not come back, e.g. the one being re-rolled away (bug #106).
        getRandomUnlockedCity(allCities, exclude = null) {
        const eligible = this.getUnlockableCities(allCities).filter(city => city !== exclude);
        if (eligible.length === 0) return null;
        return eligible[Math.floor(Math.random() * eligible.length)];
    }

    // The cities a rank-up offers to choose from: `count` random cities from the unlockable pool, or fewer when
    // fewer are left. `exclude` is the previous offer when re-rolling: those cities only come back to fill the
    // offer if there are not enough others.
    getCityChoices(allCities, count, exclude = []) {
        const pool = this.getUnlockableCities(allCities);
        const shuffle = (list) => {
            const a = [...list];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        const fresh = shuffle(pool.filter(city => !exclude.includes(city)));
        const offer = fresh.slice(0, count);
        if (offer.length < count) offer.push(...shuffle(pool.filter(city => exclude.includes(city))).slice(0, count - offer.length));
        return offer;
    }

    removeUnlockedCity(city) {
        this.unlockedCities = this.unlockedCities.filter(c => c !== city);
    }

    disconnectCity(city) {
        this.purchasedCities = this.purchasedCities.filter(c => c !== city);
        if (!this.unlockedCities.includes(city)) this.unlockedCities.push(city);
        city.rewards.forEach(reward => {
            // A reward that is already built, or being built right now, stays (otherwise its build would be lost)
            const isBuilt = this.purchasedDevelopments.some(d => d.name === reward.name) ||
                            this.purchasedUpgrades.some(u => u.name === reward.name) ||
                            this.developmentsUnderConstruction.some(d => d.name === reward.name);
            if (!isBuilt) {
                this.unlockedDevelopments = this.unlockedDevelopments.filter(d => d.name !== reward.name);
                this.unlockedUpgrades = this.unlockedUpgrades.filter(u => u.name !== reward.name);
                this.unlockedRewards = this.unlockedRewards.filter(r => r.name !== reward.name);
            }
        });
    }

    // Early Retirement is unlocked at Rank 50 and paid for with Reputation, not cash, and it is not built
    // (no construction time). Owning it lets the player prestige.
    hasEarlyRetirement() {
        return this.purchasedUpgrades.some(u => u.effectType === 'earlyRetirement');
    }

    buyEarlyRetirement(upgrade) {
        if (!upgrade || upgrade.effectType !== 'earlyRetirement') return false;
        if (!this.unlockedUpgrades.includes(upgrade) || this.hasEarlyRetirement()) return false;
        const repCost = upgrade.effectValue;
        if (this.reputation < repCost) return false;
        this.addReputation(-repCost);
        this.purchasedUpgrades.push(upgrade);
        this.unlockedUpgrades = this.unlockedUpgrades.filter(u => u !== upgrade);
        return true;
    }

    // What to show for a development: its custom name if it has one, otherwise its own name
    getDevelopmentName(development) {
        return this.developmentNames[development.name] || development.name;
    }

    hasCustomDevelopmentName(development) {
        return !!this.developmentNames[development.name];
    }

    // Only a built development (not an upgrade, and not one still being built) can be renamed
    canRenameDevelopment(development) {
        return this.purchasedDevelopments.includes(development);
    }

    // Gives a built development a new name for getRenameRepCost() Reputation. Typing its original name back removes
    // the custom name; that costs the same. Nothing is charged when the name wouldn't change, or can't be afforded.
    renameDevelopment(development, rawName) {
        if (!this.canRenameDevelopment(development)) return false;
        const name = resolveDevelopmentName(development, rawName);
        if (!name) return false;
        if (name === this.getDevelopmentName(development)) return false;
        if (!this.spendReputation(getRenameRepCost())) return false;
        if (name === development.name) delete this.developmentNames[development.name];
        else this.developmentNames[development.name] = name;
        return true;
    }

    // Takes a built development out: it goes back to Available to build, with its upgrade levels and custom name gone.
    // Costs `repCost` Reputation (so none can be taken that isn't there) and pays back `refund` cash, which is a
    // refund and not earnings.
    removeDevelopment(development, repCost = DEV_REMOVE_REP_COST, refund = 0) {
        if (!this.canRenameDevelopment(development)) return false;
        if (repCost > 0 && !this.spendReputation(repCost)) return false;
        if (refund > 0) this.balance += refund;
        this.purchasedDevelopments = this.purchasedDevelopments.filter(d => d !== development);
        delete this.developmentUpgradeLevels[development.name];
        delete this.developmentNames[development.name];
        // It can be built again only while a connected city still offers it (a city may have been disconnected since)
        if (this.purchasedCities.some(c => c.rewards.some(r => r.name === development.name))) this.unlockReward(development);
        return true;
    }

    getDevelopmentUpgradeLevel(development) {
        return this.developmentUpgradeLevels[development.name] || 0;
    }

    getDevelopmentUpgradeCostInfo(development, upgradeDiscountMultiplier = 1.0) {
        const currentLevel = this.getDevelopmentUpgradeLevel(development);
        const nextLevel = currentLevel + 1;
        if (nextLevel > MAX_DEV_LEVEL) return null;
        return {
            nextLevel,
            // The tiny tolerance stops decimal rounding knocking £1 off a round price (£61,249 for 35% of £175,000)
            cashCost: Math.floor(development.cost * UPGRADE_CASH_PCTS[nextLevel] * upgradeDiscountMultiplier + 1e-6),
            // Good Standing: upgrading developments and cities costs half the Reputation
            repCost: PrestigeManager.owns('goodStanding') ? Math.floor(UPGRADE_REP_COSTS[nextLevel] / 2) : UPGRADE_REP_COSTS[nextLevel],
            boostPct: UPGRADE_BOOST_PCTS[nextLevel],
            totalPct: UPGRADE_TOTAL_PCTS[nextLevel],
        };
    }

    upgradeDevelopment(development, upgradeDiscountMultiplier = 1.0) {
        const info = this.getDevelopmentUpgradeCostInfo(development, upgradeDiscountMultiplier);
        if (!info) return false;
        if (this.balance < info.cashCost || this.reputation < info.repCost) return false;
        this.spendCash(info.cashCost);
        this.addReputation(-info.repCost);
        this.developmentUpgradeLevels[development.name] = info.nextLevel;
        return true;
    }

    // ── City line upgrades ──────────────────────────────────────────────────────────────────────────────────
    // Mirrors the development-level methods above, but keyed by city name and priced off what the city cost to
    // connect (see LINE_BASE_COST). Only a connected city can have its line upgraded.
    getCityLineLevel(city) {
        return this.cityLineLevels[city.name] || 0;
    }

    getCityLineUpgradeCostInfo(city) {
        if (!this.purchasedCities.includes(city)) return null;
        const currentLevel = this.getCityLineLevel(city);
        const nextLevel = currentLevel + 1;
        if (nextLevel > MAX_LINE_LEVEL) return null;
        const baseCost = LINE_BASE_COST[city.tier] || 0;
        return {
            nextLevel,
            cashCost: Math.floor(baseCost * LINE_LEVEL_CASH_MULT * Math.pow(LINE_LEVEL_CASH_GROWTH, nextLevel - 1) + 1e-6),
            repCost: PrestigeManager.owns('goodStanding') ? Math.floor(LINE_LEVEL_REP_COST / 2) : LINE_LEVEL_REP_COST,
            boostPct: LINE_LEVEL_INCOME_PCT,
            totalPct: LINE_LEVEL_INCOME_PCT * nextLevel,
        };
    }

    upgradeCityLine(city) {
        const info = this.getCityLineUpgradeCostInfo(city);
        if (!info) return false;
        if (this.balance < info.cashCost || this.reputation < info.repCost) return false;
        this.spendCash(info.cashCost);
        this.addReputation(-info.repCost);
        this.cityLineLevels[city.name] = info.nextLevel;
        return true;
    }
}
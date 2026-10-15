import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'
import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Development } from "../../DevelopmentManager/Development.js";

// Renaming a development, and removing one (it goes back to Available to build), each cost this much Reputation
export const DEV_RENAME_REP_COST = 20;
export const DEV_REMOVE_REP_COST = 20;
// The longest custom name a development can have, so it fits on its card
export const DEV_NAME_MAX_LENGTH = 20;

// A custom name as it is kept: control characters dropped, spaces tidied and trimmed, cut to the limit.
// Returns '' when nothing is left.
export function sanitizeDevelopmentName(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, DEV_NAME_MAX_LENGTH).trim();
}

const UPGRADE_CASH_PCTS = [0, 0.15, 0.35, 0.50];
const UPGRADE_REP_COSTS = [0, 5, 10, 15];
const UPGRADE_BOOST_PCTS = [0, 15, 35, 50];
const UPGRADE_TOTAL_PCTS = [0, 15, 50, 100];

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
        // Custom names players have given developments: original name -> custom name. Only ever used for display.
        this.developmentNames = {};
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
        getRandomUnlockedCity(allCities, exclude = null, minTier = 1) {
        const eligible = this.getUnlockableCities(allCities).filter(city => city !== exclude);
        if (eligible.length === 0) return null;
        // Skilled Negotiation Teams: prefer cities of at least minTier, fall back to any city if none are left.
        const preferred = minTier > 1 ? eligible.filter(city => city.tier >= minTier) : eligible;
        const pool = preferred.length > 0 ? preferred : eligible;
        return pool[Math.floor(Math.random() * pool.length)];
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

    // Early Retirement is unlocked at Rank 100 and paid for with Reputation, not cash, and it is not built
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

    // Gives a built development a new name for DEV_RENAME_REP_COST Reputation. Typing its original name back removes
    // the custom name; that costs the same. Nothing is charged when the name wouldn't change, or can't be afforded.
    renameDevelopment(development, rawName) {
        if (!this.canRenameDevelopment(development)) return false;
        const name = sanitizeDevelopmentName(rawName);
        if (!name) return false;
        if (name === this.getDevelopmentName(development)) return false;
        if (!this.spendReputation(DEV_RENAME_REP_COST)) return false;
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
        if (nextLevel > 3) return null;
        return {
            nextLevel,
            // The tiny tolerance stops decimal rounding knocking £1 off a round price (£61,249 for 35% of £175,000)
            cashCost: Math.floor(development.cost * UPGRADE_CASH_PCTS[nextLevel] * upgradeDiscountMultiplier + 1e-6),
            // Good Standing: upgrading developments costs no Reputation
            repCost: PrestigeManager.owns('goodStanding') ? 0 : UPGRADE_REP_COSTS[nextLevel],
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
}
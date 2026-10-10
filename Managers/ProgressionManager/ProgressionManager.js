import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'
import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Development } from "../../DevelopmentManager/Development.js";

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

        // exclude: a city that must not come back, e.g. the one being re-rolled away (bug #106).
        getRandomUnlockedCity(allCities, exclude = null, minTier = 1) {
                // Antarctic Peninsula is the secret finale city — never hand it out as a normal unlock.
        const eligible = allCities.filter(city =>
            city.continent !== 'Antarctica' &&
            !this.purchasedCities.includes(city) && !this.unlockedCities.includes(city) &&
            city !== exclude
        );
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

    getDevelopmentUpgradeLevel(development) {
        return this.developmentUpgradeLevels[development.name] || 0;
    }

    getDevelopmentUpgradeCostInfo(development, upgradeDiscountMultiplier = 1.0) {
        const currentLevel = this.getDevelopmentUpgradeLevel(development);
        const nextLevel = currentLevel + 1;
        if (nextLevel > 3) return null;
        return {
            nextLevel,
            cashCost: Math.floor(development.cost * UPGRADE_CASH_PCTS[nextLevel] * upgradeDiscountMultiplier),
            repCost: UPGRADE_REP_COSTS[nextLevel],
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
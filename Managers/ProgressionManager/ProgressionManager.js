import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Development } from "../../DevelopmentManager/Development.js";

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
        this.balance = 250000;
        this.reputation = 50;
        this.totalCashEarned = 0;
        this.rankManager = rankManager;
        this.developmentsUnderConstruction = [];
    }

    unlockReward(reward) {
        if (!this.unlockedRewards.includes(reward)) {
            this.unlockedRewards.push(reward);
        }
        if (reward instanceof Upgrade && !this.unlockedUpgrades.includes(reward)) {
            this.unlockedUpgrades.push(reward);
        }
        if (reward instanceof Development && !this.unlockedDevelopments.includes(reward)) {
            this.unlockedDevelopments.push(reward);
        }
    }

    unlockCity(city) {
        if (!this.unlockedCities.includes(city)) {
            this.unlockedCities.push(city);
        }
    }

    addCash(amount) {
        this.balance += amount;
        this.totalCashEarned += amount;
    }

    addReputation(amount) {
        this.reputation += amount;
    }

    spendReputation(amount) {
        if (this.reputation >= amount) {
            this.reputation -= amount;
            return true;
        }
        return false;
    }

    spendCash(amount) {
        if (this.balance >= amount) {
            this.balance -= amount;
            return true;
        }
        return false;
    }

    // Capacity = rank + 1 so rank 1 allows 2 cities, rank 2 allows 3, etc.
    getCityCapacity() {
        return this.rankManager.rank + 1;
    }

    purchaseCity(city) {
        if (this.purchasedCities.length >= this.getCityCapacity()) return;
        if (this.purchasedCities.includes(city)) return;
        city.connect();
        city.rewards.forEach(reward => {
            this.unlockReward(reward);
        });
        this.purchasedCities.push(city);
    }

    purchaseDevelopment(development) {
        const isUnlocked = this.unlockedDevelopments.includes(development) ||
            this.unlockedUpgrades.includes(development);
        if (!isUnlocked) return;
        if (this.purchasedDevelopments.includes(development) ||
            this.purchasedUpgrades.includes(development)) return;
        if (development instanceof Upgrade) {
            this.purchasedUpgrades.push(development);
        } else {
            this.purchasedDevelopments.push(development);
        }
    }

    getRandomUnlockedCity(allCities) {
        const eligible = allCities.filter(city =>
            !this.purchasedCities.includes(city) &&
            !this.unlockedCities.includes(city)
        );
        if (eligible.length === 0) return null;
        return eligible[Math.floor(Math.random() * eligible.length)];
    }

    removeUnlockedCity(city) {
        this.unlockedCities = this.unlockedCities.filter(c => c !== city);
    }
}
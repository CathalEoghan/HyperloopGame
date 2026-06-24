
import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Development } from "../../DevelopmentManager/Development.js";

export class ProgressionManager {
    constructor(rankManager) {
        this.purchasedCities = [];
        this.unlockedRewards = [];
        this.unlockedUpgrades = [];
        this.purchasedUpgrades = [];
        this.unlockedDevelopments = [];
        this.purchasedDevelopments = [];
        this.citiesUnderConstruction = [];
        this.constructionQueue = [];
        this.balance = 0;
        this.totalCashEarned = 0;
        this.rankManager = rankManager;
    }

    // Unlocks the reward, includes it in a broad list of unlocked upgrades + stores
    unlockReward(reward) {
        if (!this.unlockedRewards.includes(reward)) { // If it's not already included
            this.unlockedRewards.push(reward);
        }

        if (reward instanceof Upgrade && !this.unlockedUpgrades.includes(reward)) { // If it's not already included
            this.unlockedUpgrades.push(reward)
        }

        if (reward instanceof Store && !this.unlockedStores.includes(reward)) { // If it's not already included
            this.unlockedDevelopments.push(reward)
        }
    }

    // Adds cash to the balance
    addCash(amount) {

        this.balance += amount;
        this.totalCashEarned += amount; // Never decreases

    }

    // Spends cash, deducts from balance
    spendCash(amount) {
        if (this.balance >= amount) { // If balance is bigger than the amount, OK to spend
            this.balance -= amount;
            return true;
        }
        return false; // Otherwise reject
    }


    getCityCapacity() {
        // Capacity = rank, not rank + 1
        let cityCapacity = this.rankManager.rank;
        return cityCapacity;
    }

    getConstructionQueueCapacity() {
    let size = 1; // default
    this.purchasedUpgrades.forEach(upgrade => {
        if (upgrade.effectType === "queueCapacity") {
            size++;
        }
    });
    return size;
}

    purchaseCity(city) {
        if (this.purchasedCities.length >= this.getCityCapacity()) {
            return;
        }
        city.connect();

        if (!this.purchasedCities.includes(city)) {
            this.purchasedCities.push(city);
        }

        city.rewards.forEach(reward => {
            this.unlockReward(reward);
        });

    }
}


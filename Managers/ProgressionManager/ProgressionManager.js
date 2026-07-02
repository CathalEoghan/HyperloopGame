
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

        if (reward instanceof Development && !this.unlockedDevelopments.includes(reward)) { // If it's not already included
            this.unlockedDevelopments.push(reward)
        }
    }

    unlockCity(city) {
    if (!this.unlockedCities.includes(city)) {
        this.unlockedCities.push(city);
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
    let size = 2; // default
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

        if (this.purchasedCities.includes(city)) {
            return
        }
            
        city.connect();

        city.rewards.forEach(reward => {
            this.unlockReward(reward);
        });

        this.purchasedCities.push(city); // only reached if everything above succeeded

    }

      purchaseDevelopment(development) {
         if (!this.unlockedDevelopments.includes(development)) {
            return; // Can't buy a store that is not unlocked yet - railguard
        }

         if (this.purchasedDevelopments.includes(development)) { // Checks for duplicates
            return
        }

        this.purchasedDevelopments.push(development); // only reached if everything above succeeded

    }

    getRandomUnlockedCity(allCities) {
    const eligible = allCities.filter(city => !this.purchasedCities.includes(city) && !this.unlockedCities.includes(city));
    // pick one at random from `eligible`
    if (eligible.length === 0) {
    return null; 
    } else {
    const randomIndex = Math.floor(Math.random() * eligible.length);
    return eligible[randomIndex];

}
    }
}


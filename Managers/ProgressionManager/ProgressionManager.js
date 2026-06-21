
import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Store } from "../../StoreManager/Store.js";

export class ProgressionManager {
    constructor(rankManager) {
        this.unlockedCities = [];
        this.unlockedRewards = [];
        this.unlockedUpgrades = [];
        this.unlockedStores = [];
        this.balance = 0;
        this.totalCashEarned = 0;
        this.rankManager = rankManager;
    }

  unlockCity(city) {
    // Check capacity first
    if (this.unlockedCities.length >= this.getCityCapacity()) {
        return; // full, don't unlock
    }

    city.unlock();

    // If not already in the list, add it
    if (!this.unlockedCities.includes(city)) {
        this.unlockedCities.push(city);
    }

    // Unlock rewards
    city.rewards.forEach(reward => {
        this.unlockReward(reward);
    });
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
            this.unlockedStores.push(reward)
        }
    }

    // Adds cash to the balance
    addCash(amount) {

        this.balance += amount;
        this.totalCashEarned += amount; // Never decreases

    }

    // Spends cash, deducts from balance
    spendCash (amount) {
        if (this.balance >= amount) { // If balance is bigger than the amount, OK to spend
            this.balance -= amount;
            return true;
        }
        return false; // Otherwise reject
    }


    getCityCapacity() {
      // capacity = rank, not rank + 1
let cityCapacity = this.rankManager.rank;
return cityCapacity;
}
}


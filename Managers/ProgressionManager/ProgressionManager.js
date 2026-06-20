
import { Upgrade } from "../../UpgradeManager/Upgrade.js";
import { Store } from "../../StoreManager/Store.js";

export class ProgressionManager {
    constructor() {
        this.unlockedCities = [];
        this.unlockedRewards = [];
        this.unlockedUpgrades = [];
        this.unlockedStores = [];
        this.balance = 0;
    }

    // Calls unlockCity(), which initiates the method city.unlock();
    unlockCity(city) {
        city.unlock();

        // If the unlocked cities list doesn't already include the city, add it
        if (!this.unlockedCities.includes(city)) {
            this.unlockedCities.push(city);
        }

        // And then push its reward to the list of rewards by calling the unlockReward() method
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

    }

    // Spends cash, deducts from balance
    spendCash (amount) {
        if (this.balance >= amount) { // If balance is bigger than the amount, OK to spend
            this.balance -= amount;
            return true;
        }
        return false; // Otherwise reject
    }

}


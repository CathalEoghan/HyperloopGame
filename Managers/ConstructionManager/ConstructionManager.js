
import { FOUR_HOURS, EIGHT_HOURS, ONE_DAY } from '../TimeManager/TimeManager.js'

export class ConstructionManager {
    constructor(progressionManager, timeManager) {

        this.progressionManager = progressionManager;
        this.timeManager = timeManager;

    }

    calculateTierTime(city) {

        if (city.tier === 3) {
            return FOUR_HOURS;
        }

        if (city.tier === 2) {
            return EIGHT_HOURS;
        }

        if (city.tier === 1) {
            return ONE_DAY;
        }

        // If the tier is not 1, 2 or 3
        throw new Error(`Unknown city tier: ${city.tier}`)
    }

    update() {
        this.progressionManager.citiesUnderConstruction.forEach(city => {

            if (!city.underConstruction) return;

            if (this.isConstructionComplete(city)) {
                this.completeStationConstruction(city);
            }

        });
    }

    isConstructionQueueFull() {

        if (this.progressionManager.constructionQueue.length >= this.progressionManager.getConstructionQueueCapacity()) {
            console.log("Your terminal's construction queue is full!")
            return true;
        }
        return false;
    }

    // Starts construction of the station
    startStationConstruction(city) {

        if (this.isConstructionQueueFull()) return;

        let connectionCost = this.calculateTierConnectionCost(city);

        const canAfford = this.progressionManager.spendCash(connectionCost);
        if (!canAfford) return;

        const duration = this.calculateTierTime(city);
        city.finishTime = this.timeManager.getFinishTime(duration)
        city.underConstruction = true;
        this.progressionManager.citiesUnderConstruction.push(city);
        this.progressionManager.constructionQueue.push(city);
    }

    // Checks if construction is complete
    isConstructionComplete(city) {
        return this.timeManager.whenIsTimerReady(city.finishTime)
    }

    completeStationConstruction(city) {
        city.underConstruction = false;
        city.finishTime = null;
        this.progressionManager.purchaseCity(city);
        this.progressionManager.citiesUnderConstruction =
            this.progressionManager.citiesUnderConstruction.filter(c => c !== city);
        this.progressionManager.constructionQueue =
            this.progressionManager.constructionQueue.filter(c => c !== city);
    }

    calculateTierConnectionCost(city) {

        let connectionCost = 0;

        switch (city.tier) {
            case 1:
                connectionCost = 50000;
                break;
            case 2:
                connectionCost = 25000;
                break;
            case 3:
                connectionCost = 10000;
                break;
            default:
                throw new Error("Error: tier not recognised.")
        }
        return connectionCost;
    }
}




import { FIVE_SECONDS, FOUR_HOURS, EIGHT_HOURS, ONE_DAY } from '../TimeManager/TimeManager.js'

export class ConstructionManager {
    constructor(progressionManager, timeManager) {

        this.progressionManager = progressionManager;
        this.timeManager = timeManager;

    }

    calculateTierTime(city) {

        if (city.tier === 1) {
            return FIVE_SECONDS;
        }

        if (city.tier === 2) {
            return FIVE_SECONDS;
        }

        if (city.tier === 3) {
            return FIVE_SECONDS;
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

          this.progressionManager.developmentsUnderConstruction.forEach(development => {
        if (!development.underConstruction) return;
        if (this.isConstructionComplete(development)) {
            this.completeDevelopmentConstruction(development);
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
    startTutorialConstruction(city) {

        const duration = FIVE_SECONDS;
        city.finishTime = this.timeManager.getFinishTime(duration)
        city.underConstruction = true;
        this.progressionManager.citiesUnderConstruction.push(city);
        this.progressionManager.constructionQueue.push(city);
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
            case 3:
                connectionCost = 1000000;
                break;
            case 2:
                connectionCost = 250000;
                break;
            case 1:
                connectionCost = 50000;
                break;
            default:
                throw new Error("Error: tier not recognised.")
        }
        return connectionCost;
    }

    startDevelopmentConstruction(development) {
    if (this.isConstructionQueueFull()) return;

    if (!this.progressionManager.spendCash(development.cost)) return;

    const duration = FIVE_SECONDS;
    development.finishTime = this.timeManager.getFinishTime(duration);
    development.underConstruction = true;
    this.progressionManager.developmentsUnderConstruction.push(development);
    this.progressionManager.constructionQueue.push(development);
}

completeDevelopmentConstruction(development) {
    development.underConstruction = false;
    development.finishTime = null;
    this.progressionManager.purchaseDevelopment(development);
    this.progressionManager.developmentsUnderConstruction =
        this.progressionManager.developmentsUnderConstruction.filter(d => d !== development);
    this.progressionManager.constructionQueue =
        this.progressionManager.constructionQueue.filter(d => d !== development);
}
}
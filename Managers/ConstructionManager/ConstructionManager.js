import { FIVE_SECONDS, TWENTY_SECONDS, FORTY_FIVE_SECONDS, TWO_MINUTES } from '../TimeManager/TimeManager.js'

export class ConstructionManager {
    constructor(progressionManager, timeManager) {
        this.progressionManager = progressionManager;
        this.timeManager = timeManager;
    }

    calculateTierTime(city) {
    if (city.tier === 1) return TWENTY_SECONDS;
    if (city.tier === 2) return FORTY_FIVE_SECONDS;
    if (city.tier === 3) return TWO_MINUTES;
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

    startTutorialConstruction(city) {
        const duration = FIVE_SECONDS;
        city.finishTime = this.timeManager.getFinishTime(duration);
        city.underConstruction = true;
        this.progressionManager.citiesUnderConstruction.push(city);
    }

    startStationConstruction(city) {
        // Check city capacity before deducting money
        if (this.progressionManager.purchasedCities.length >= this.progressionManager.getCityCapacity()) return;

        const connectionCost = this.calculateTierConnectionCost(city);
        const canAfford = this.progressionManager.spendCash(connectionCost);
        if (!canAfford) return;

        const duration = this.calculateTierTime(city);
        city.finishTime = this.timeManager.getFinishTime(duration);
        city.underConstruction = true;
        this.progressionManager.citiesUnderConstruction.push(city);
    }

    isConstructionComplete(item) {
        return this.timeManager.whenIsTimerReady(item.finishTime);
    }

    completeStationConstruction(city) {
        city.underConstruction = false;
        city.finishTime = null;
        this.progressionManager.purchaseCity(city);
        this.progressionManager.citiesUnderConstruction =
            this.progressionManager.citiesUnderConstruction.filter(c => c !== city);
    }

    calculateTierConnectionCost(city) {
        switch (city.tier) {
            case 3: return 1000000;
            case 2: return 250000;
            case 1: return 50000;
            default: throw new Error("Error: tier not recognised.")
        }
    }

    startDevelopmentConstruction(development) {
        if (!this.progressionManager.spendCash(development.cost)) return;
        const duration = FIVE_SECONDS;
        development.finishTime = this.timeManager.getFinishTime(duration);
        development.underConstruction = true;
        this.progressionManager.developmentsUnderConstruction.push(development);
    }

    completeDevelopmentConstruction(development) {
        development.underConstruction = false;
        development.finishTime = null;
        this.progressionManager.purchaseDevelopment(development);
        this.progressionManager.developmentsUnderConstruction =
            this.progressionManager.developmentsUnderConstruction.filter(d => d !== development);
    }
}
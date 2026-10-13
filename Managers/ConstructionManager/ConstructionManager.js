import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'
import { FIVE_SECONDS, TEN_SECONDS, TWENTY_SECONDS, FORTY_FIVE_SECONDS, TWO_MINUTES, FIVE_MINUTES } from '../TimeManager/TimeManager.js'

// Finishing a build early costs Reputation by the time left: 1 per 5 seconds, never less than 2
export const SKIP_MS_PER_REP = 5000
export const SKIP_MIN_REP = 2

export class ConstructionManager {
    constructor(progressionManager, timeManager) {
        this.progressionManager = progressionManager;
        this.timeManager = timeManager;
    }

    calculateTierTime(city) {
        if (city.tier === 0) return FIVE_MINUTES;
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
        // Only one starter city can ever be under construction.
        this.progressionManager.citiesUnderConstruction.forEach(c => { c.underConstruction = false; });
        this.progressionManager.citiesUnderConstruction.length = 0;
        const duration = TEN_SECONDS;
        city.finishTime = this.timeManager.getFinishTime(duration);
        city.underConstruction = true;
        this.progressionManager.citiesUnderConstruction.push(city);
    }

        startStationConstruction(city) {
        // Never charge for a city that's already connected or already being built.
        const pm = this.progressionManager;
        if (pm.purchasedCities.includes(city) || pm.citiesUnderConstruction.includes(city)) return false;
        // Only a city you have been offered can be connected (the Antarctic Peninsula finale is the exception).
        if (city.tier !== 0 && !pm.unlockedCities.includes(city)) return false;
        const connectionCost = this.calculateTierConnectionCost(city);
        const canAfford = this.progressionManager.spendCash(connectionCost);
        if (!canAfford) return;

        // Advanced Engineering: built immediately (finishes on the next tick)
        const duration = PrestigeManager.owns('advancedEngineering') ? 0 : this.calculateTierTime(city);
        city.finishTime = this.timeManager.getFinishTime(duration);
        city.underConstruction = true;
        this.progressionManager.citiesUnderConstruction.push(city);
    }

    // Reputation to finish this city or development right now (0 when there is nothing left to wait for)
    calculateSkipCost(item) {
        if (!item || !item.underConstruction || item.finishTime == null) return 0;
        const remaining = this.timeManager.getTimeRemaining(item.finishTime);
        if (remaining <= 0) return 0;
        return Math.max(SKIP_MIN_REP, Math.ceil(remaining / SKIP_MS_PER_REP));
    }

    // Spend Reputation to finish a build now. It is done by the next tick, the same way Advanced Engineering
    // builds are, so everything that happens when a build completes still happens in one place.
    skipConstruction(item) {
        const pm = this.progressionManager;
        const isBuilding = pm.citiesUnderConstruction.includes(item) || pm.developmentsUnderConstruction.includes(item);
        if (!isBuilding) return false;
        const cost = this.calculateSkipCost(item);
        if (cost <= 0) return false; // already finishing: a second click must not charge again
        if (!pm.spendReputation(cost)) return false;
        item.finishTime = this.timeManager.getNow();
        return true;
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
            case 0: return 2500000;
            case 1: return 50000;
            case 2: return 250000;
            case 3: return 1000000;
            default: throw new Error("Error: tier not recognised.")
        }
    }

    startDevelopmentConstruction(development, discountedCost) {
        const cost = discountedCost ?? development.cost;
        if (!this.progressionManager.spendCash(cost)) return;
        const duration = PrestigeManager.owns('advancedEngineering') ? 0 : TWENTY_SECONDS;
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
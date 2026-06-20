
import { FOUR_HOURS, EIGHT_HOURS, ONE_DAY } from '../TimeManager/TimeManager.js'

export class ConstructionManager {
    constructor(progressionManager, timeManager) {

        this.progressionManager = progressionManager;
        this.timeManager = timeManager;

    }

    calculateTierTime(city) {

        if (city.tier === 1) {
            return FOUR_HOURS;
        }

        if (city.tier === 2) {
            return EIGHT_HOURS;
        }

        if (city.tier === 3) {
            return ONE_DAY;
        }

        // If the tier is not 1, 2 or 3
        throw new Error(`Unknown city tier: ${city.tier}`)
    }

    update() {
        this.progressionManager.unlockedCities.forEach(city => {

            if (!city.underConstruction) return;

            if (this.isConstructionComplete(city)) {
                this.completeStationConstruction(city);
            }

        });
    }

    // Starts construction of the station
    startStationConstruction(city) {
        const duration = this.calculateTierTime(city)
        city.finishTime = this.timeManager.getFinishTime(duration)
        city.underConstruction = true;
    }

    // Checks if construction is complete
    isConstructionComplete(city) {
        return this.timeManager.whenIsTimerReady(city.finishTime)
    }

    completeStationConstruction(city) {
        city.underConstruction = false;
        city.finishTime = null;
        this.progressionManager.unlockCity(city);
    }
}




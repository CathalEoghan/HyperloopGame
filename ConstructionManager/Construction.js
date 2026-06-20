
class Construction {
    constructor(playerProgression, timeManager) {

        this.playerProgression = playerProgression;
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

        return EIGHT_HOURS;

    }

    update() {
    this.playerProgression.unlockedCities.forEach(city => {

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
        if (this.isConstructionComplete(city)) {
            city.underConstruction = false;
            city.finishTime = null;
            this.playerProgression.unlockCity(city);
        }
    }
}



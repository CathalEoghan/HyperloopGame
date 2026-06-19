
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

    startStationConstruction(city) {
        const duration = this.calculateTierTime(city)
        city.finishTime = this.timeManager.getFinishTime(duration)
    }

    isConstructionComplete(city) {
        return this.timeManager.isReady(city.finishTime)
    }

    completeStationConstruction(city) {
        if (this.checkConstruction(city)) {
            this.playerProgression.unlockCity(city);
        }
    }
}



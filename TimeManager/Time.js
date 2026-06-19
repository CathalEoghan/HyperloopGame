

    export const FOUR_HOURS = 4 * 60 * 60 * 1000;
    export const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    export const ONE_DAY = 24 * 60 * 60 * 1000;

class TimeManager {

    // Returns current time
    getNow() {
        return Date.now();
    }

    // Determines when a timer is complete
    isReady(finishTime) {
    return this.getNow() >= finishTime;
    }

    // Gets the finish time of an upgrade/construction/unlock
    getFinishTime(duration) {
    return this.getNow() + duration;
    }

    // Gets the amount of time remaining on an upgrade/construction/unlock
    getTimeRemaining(finishTime) {
    return Math.max(0, finishTime - this.getNow());
    }

 }

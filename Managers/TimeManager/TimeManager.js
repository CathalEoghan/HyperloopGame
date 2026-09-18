    export const FOUR_HOURS = 4 * 60 * 60 * 1000;
    export const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    export const ONE_DAY = 24 * 60 * 60 * 1000;
    export const FIVE_SECONDS = 5 * 1000;
    export const TEN_SECONDS = 5 * 1000 * 2;
    export const TWENTY_SECONDS = 20 * 1000;
export const FORTY_FIVE_SECONDS = 45 * 1000;
export const TWO_MINUTES = 2 * 60 * 1000;
export const FIVE_MINUTES = 5 * 60 * 1000;

export class TimeManager {

    getNow() {
        return Date.now();
    }

    whenIsTimerReady(finishTime) {
        return this.getNow() >= finishTime;
    }

    getFinishTime(duration) {
        return this.getNow() + duration;
    }

    getTimeRemaining(finishTime) {
        return Math.max(0, finishTime - this.getNow());
    }

}
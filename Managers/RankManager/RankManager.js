
export class RankManager {
    constructor() {
        this.rank = 1;
        this.xp = 0;
    }

    calculateNextRankXP(rank) {

        let xpNeeded = 5;
        let difference = 3;

        for (let i = 2; i < rank; i++) {
            xpNeeded += difference
            difference++
        }
        return xpNeeded;
    }

    // Decides how much XP you have from your lifetime earnings
    convertCashToXP(totalCashEarned) {
        let xpGained = Math.floor(totalCashEarned);
        this.xp = xpGained;
    }

    verifyRank() {

        const xpNeeded = this.calculateNextRankXP(this.rank + 1)

        if (this.xp >= xpNeeded) {
            this.rank++
    }

    }
}

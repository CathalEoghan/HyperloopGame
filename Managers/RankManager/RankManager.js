
export class RankManager {
    constructor() {
        this.rank = 1;
        this.xp = 0;
    }

    calculateNextRankXP(rank) {
        let xpNeeded = 5;

        for (let i = 1; i < rank; i++) {
            xpNeeded *= 3;
        }

        return Math.round(xpNeeded);
    }

    getCumulativeXP(rank) {
        let total = 0;
        for (let i = 1; i <= rank; i++) {
            total += this.calculateNextRankXP(i);
        }
        return total;
    }

    verifyRank() {
        while (this.xp >= this.getCumulativeXP(this.rank)) {
            this.rank++;
        }
    }

    // Decides how much XP you have from your lifetime earnings
    convertCashToXP(totalCashEarned) {
        let xpGained = Math.floor(totalCashEarned);
        this.xp = xpGained;
    }

}

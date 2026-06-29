

export class RankManager {
    constructor() {
        this.rank = 1;
        this.xp = 0;
    }

    calculateNextRankXP(rank) {
        
        let xpNeeded = 0;

        switch (rank) {
        case 1:
            xpNeeded  = 500;
        break;
        case 2:
            xpNeeded = 1000;
        break;
        case 3:
            xpNeeded = 2500;
        break;
        case 4:
            xpNeeded = 5000;
        break;
        case 5:
            xpNeeded = 10000;
        break;
        case 6:
            xpNeeded = 25000;
        break;
        case 7:
            xpNeeded = 50000;
        break;
        case 8:
            xpNeeded = 100000;
        break;
        case 9:
            xpNeeded = 250000;
        break;
        case 10:
            xpNeeded = 500000;
        break;
        case 11:
            xpNeeded = 750000;
        break;
        case 12:
            xpNeeded = 1000000;
        break;
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

export class RankManager {
    constructor() {
        this.rank = 1;
        this.xp = 0;
    }

    // XP needed to reach the NEXT rank from the given rank
    // Formula: 500 * rank^2.5 — scales from ~2,828 at rank 2 to ~6.1B at rank 335
    calculateNextRankXP(rank) {
        if (rank >= 335) return Infinity;
        return Math.floor(500 * Math.pow(rank, 2.5));
    }

    // Total cumulative XP needed to reach a given rank from rank 1
    getCumulativeXP(rank) {
        let total = 0;
        for (let i = 1; i <= rank; i++) {
            total += this.calculateNextRankXP(i);
        }
        return total;
    }

    // Check if player has earned enough XP to rank up
    verifyRank() {
        if (this.rank >= 335) return;
        while (this.rank < 335 && this.xp >= this.getCumulativeXP(this.rank)) {
            this.rank++;
        }
    }

    // XP equals total cash earned
    convertCashToXP(totalCashEarned) {
        this.xp = Math.floor(totalCashEarned);
    }
}
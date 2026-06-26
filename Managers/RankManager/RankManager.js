
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

    // Decides how much XP you have from your lifetime earnings
    convertCashToXP(totalCashEarned) {
        let xpGained = Math.floor(totalCashEarned);
        this.xp = xpGained;
    }

    verifyRank() {
    while (this.xp >= this.calculateNextRankXP(this.rank + 1)) {
        this.rank++;
    }
}
}

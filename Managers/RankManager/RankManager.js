import { allCities } from '../../CityManager/CityRegistry.js';

// One rank-up unlocks one city, and you start with your home city, so the top rank equals the
// number of regular cities (all except the secret Antarctic Peninsula). At 335 there were five
// more cities than rank-ups, so "Cities collected" could never reach 100% (bug #115).
export const MAX_RANK = allCities.filter(c => c.continent !== 'Antarctica').length;

export class RankManager {
    constructor() {
        this.rank = 1;
        this.xp = 0;
    }

    calculateNextRankXP(rank) {
        if (rank >= MAX_RANK) return Infinity;
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
        if (this.rank >= MAX_RANK) return;
        while (this.rank < MAX_RANK && this.xp >= this.getCumulativeXP(this.rank)) {
            this.rank++;
        }
    }

    // XP equals total cash earned
    convertCashToXP(totalCashEarned) {
        this.xp = Math.floor(totalCashEarned);
    }
}
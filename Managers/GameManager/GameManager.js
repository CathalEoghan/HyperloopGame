export class GameManager {
    constructor(economyManager, progressionManager, constructionManager, rankManager) {
        this.economyManager = economyManager;
        this.progressionManager = progressionManager;
        this.constructionManager = constructionManager;
        this.rankManager = rankManager;
    }

    setStartingCity(city) {

        this.progressionManager.unlockCity(city);

    }

    tick() {

        const cashIncome = this.economyManager.calculateDailyIncome();
        this.progressionManager.addCash(cashIncome);
        
        this.rankManager.convertCashToXP(this.progressionManager.totalCashEarned);
        this.rankManager.verifyRank();
        this.constructionManager.update();
        console.log(`Balance: $${this.progressionManager.balance.toFixed(2)}`);
        console.log(`Rank: ${this.rankManager.rank.toFixed(1)}`);
        console.log(`XP: ${this.rankManager.xp.toFixed(1)}`);
    }

}


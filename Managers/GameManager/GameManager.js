
export class GameManager {
    constructor(economyManager, progressionManager, constructionManager) {
        this.economyManager = economyManager;
        this.progressionManager = progressionManager;
        this.constructionManager = constructionManager;
    }

    tick() {

        const cashIncome = this.economyManager.calculateDailyIncome();
            this.progressionManager.addMoney(cashIncome);

            this.constructionManager.update();
        }

    }


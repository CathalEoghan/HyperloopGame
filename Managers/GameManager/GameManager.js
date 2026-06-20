export class GameManager {
    constructor(economyManager, progressionManager, constructionManager) {
        this.economyManager = economyManager;
        this.progressionManager = progressionManager;
        this.constructionManager = constructionManager;
    }

    setStartingCity(city) {

        this.progressionManager.unlockCity(city);

    }

    tick() {

        const cashIncome = this.economyManager.calculateDailyIncome();
            this.progressionManager.addCash(cashIncome);

            this.constructionManager.update();
        }

    }


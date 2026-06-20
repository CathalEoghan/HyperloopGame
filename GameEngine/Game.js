
export class GameEngine {
    constructor(economyManager, playerProgression, constructionManager) {
        this.economyManager = economyManager;
        this.playerProgression = playerProgression;
        this.constructionManager = constructionManager;
    }

    tick() {

        const cashIncome = this.economyManager.calculateDailyIncome();
            this.playerProgression.addMoney(cashIncome);

            this.constructionManager.update();
        }

    }


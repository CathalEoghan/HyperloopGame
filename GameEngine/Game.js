
class GameEngine {
    constructor(economyManager, playerProgression) {
        this.economyManager = economyManager;
        this.playerProgression = playerProgression;
    }

    tick() {

        const cashIncome = this.economyManager.calculateDailyIncome();
            this.playerProgression.addMoney(cashIncome);

            this.constructionManager.update();
        }

    }


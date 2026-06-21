
const SECONDS_IN_A_DAY = 86400;
export class EconomyManager {
    constructor(progressionManager) {
        this.progressionManager = progressionManager;
    }

    // Population earnings
    calculatePopulationIncome() {

        let populationIncome = 0;
        const POPULATION_INCOME_MODIFIER = 0.0005;

        this.progressionManager.purchasedCities.forEach(city => {

            let incomeFromCity = city.population * POPULATION_INCOME_MODIFIER;
            populationIncome += incomeFromCity;
        });


        let upgradeMultiplier = 1;

        // Adds the upgrade multipliers to the population income
        this.progressionManager.purchasedUpgrades.forEach(upgrade => {

            if (upgrade.effectType === "populationIncome") {

                upgradeMultiplier += upgrade.effectValue;

            }
        });

        return populationIncome * upgradeMultiplier;

    }

    // Store earnings
    calculateStoreIncome() {

        let storeIncome = 0;

        this.progressionManager.purchasedStores.forEach(store => {
            storeIncome += store.revenue;
        });

        return storeIncome;

    }

    // Upgrade boosts

    // Calculates daily income
    calculateDailyIncome() {

        let totalIncome = 0;

        totalIncome =
            this.calculateStoreIncome() +
            this.calculatePopulationIncome();

        return totalIncome / SECONDS_IN_A_DAY;

    }

}

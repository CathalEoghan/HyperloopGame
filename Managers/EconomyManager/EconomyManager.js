
const SECONDS_IN_A_DAY = 86400;
const POPULATION_INCOME_MODIFIER = 0.0005;

export class EconomyManager {
    constructor(progressionManager) {
        this.progressionManager = progressionManager;
    }

    // Population earnings
    calculatePopulationIncome() {

        let populationIncome = 0;
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

    // Development earnings
    calculateDevelopmentIncome() {

        let developmentIncome = 0;

        this.progressionManager.purchasedDevelopments.forEach(development => {
            developmentIncome += development.revenue;
        });

        return developmentIncome;

    }

    // Upgrade boosts

    // Calculates daily income
    calculateDailyIncome() {

        let totalIncome = 0;

        totalIncome =
            this.calculateDevelopmentIncome() +
            this.calculatePopulationIncome();

        return totalIncome / SECONDS_IN_A_DAY;

    }

    calculateCityIncome(city) {

        let incomeFromCity = city.population * POPULATION_INCOME_MODIFIER;
        let upgradeMultiplier = 1;

     // Adds the upgrade multipliers to the population income
        this.progressionManager.purchasedUpgrades.forEach(upgrade => {

            if (upgrade.effectType === "populationIncome") {

                upgradeMultiplier += upgrade.effectValue;

            }
        });

    return incomeFromCity * upgradeMultiplier;

}
}

const SECONDS_IN_A_DAY = 86400;
const POPULATION_INCOME_MODIFIER = 0.0001;
const DEVELOPMENT_INCOME_MODIFIER = 4;

const TIER_INCOME = {
    1: 10000,
    2: 50000,
    3: 100000
};

export class EconomyManager {
    constructor(progressionManager) {
        this.progressionManager = progressionManager;
    }

    // Population earnings — flat tier rate + population bonus
    calculatePopulationIncome() {

        let populationIncome = 0;
        this.progressionManager.purchasedCities.forEach(city => {
            const tierBase = TIER_INCOME[city.tier] || 0;
            const popBonus = city.population * POPULATION_INCOME_MODIFIER;
            populationIncome += tierBase + popBonus;
        });

        let upgradeMultiplier = 1;

        this.progressionManager.purchasedUpgrades.forEach(upgrade => {
            if (upgrade.effectType === "populationIncome") {
                upgradeMultiplier += upgrade.effectValue;
            }
        });

        return populationIncome * upgradeMultiplier;

    }

    // Population earnings for specific city
    calculateSpecificPopulationIncome(city) {

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

        const tierBase = TIER_INCOME[city.tier] || 0;
        const popBonus = city.population * POPULATION_INCOME_MODIFIER;
        let incomeFromCity = tierBase + popBonus;

        let upgradeMultiplier = 1;
        this.progressionManager.purchasedUpgrades.forEach(upgrade => {
            if (upgrade.effectType === "populationIncome") {
                upgradeMultiplier += upgrade.effectValue;
            }
        });

        return incomeFromCity * upgradeMultiplier;

    }
}
const SECONDS_IN_A_DAY = 86400;
const POPULATION_INCOME_MODIFIER = 0.0001;

const TIER_INCOME = {
    1: 10000,
    2: 50000,
    3: 100000
};

const UPGRADE_MULTIPLIERS = [1.0, 1.15, 1.50, 2.00];

export class EconomyManager {
    constructor(progressionManager) {
        this.progressionManager = progressionManager;
    }

    getEffectiveDevRevenue(development) {
        const base = development.revenue || 0;
        const level = this.progressionManager.developmentUpgradeLevels[development.name] || 0;
        return Math.floor(base * UPGRADE_MULTIPLIERS[level]);
    }

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

    calculateDevelopmentIncome() {
        let developmentIncome = 0;
        this.progressionManager.purchasedDevelopments.forEach(development => {
            developmentIncome += this.getEffectiveDevRevenue(development);
        });
        return developmentIncome;
    }

    calculateDailyIncome() {
        return (this.calculateDevelopmentIncome() + this.calculatePopulationIncome()) / SECONDS_IN_A_DAY;
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
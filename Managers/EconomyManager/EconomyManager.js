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

    getUpgradeSum(effectType) {
        return this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === effectType)
            .reduce((sum, u) => sum + u.effectValue, 0);
    }

    hasUpgrade(effectType) {
        return this.progressionManager.purchasedUpgrades.some(u => u.effectType === effectType);
    }

    getCategoryMultiplier(category) {
        const effectTypeMap = {
            'Food':       'foodIncome',
            'Recreation': 'recreationIncome',
            'Shopping':   'shoppingIncome',
            'Service':    'serviceIncome',
        };
        const effectType = effectTypeMap[category];
        if (!effectType) return 1;
        return 1 + this.getUpgradeSum(effectType);
    }

    getEffectiveDevRevenue(development) {
        const base = development.revenue || 0;
        const level = this.progressionManager.developmentUpgradeLevels[development.name] || 0;
        return Math.floor(base * UPGRADE_MULTIPLIERS[level]);
    }

    calculateDevelopmentIncome() {
        const devBoostMultiplier = 1 + this.getUpgradeSum('developmentBoost');
        let developmentIncome = 0;
        this.progressionManager.purchasedDevelopments.forEach(development => {
            const base = this.getEffectiveDevRevenue(development);
            const categoryMultiplier = this.getCategoryMultiplier(development.category);
            developmentIncome += base * categoryMultiplier * devBoostMultiplier;
        });
        return developmentIncome;
    }

    calculateCityIncome(city, coordinates = null) {
        const tierBase = TIER_INCOME[city.tier] || 0;
        const popBonus = city.population * POPULATION_INCOME_MODIFIER;
        let income = tierBase + popBonus;

        // Connection boost
        income *= (1 + this.getUpgradeSum('connectionBoost'));

        // Continent boost
        const continentUpgrade = this.progressionManager.purchasedUpgrades.find(u =>
            u.effectType === 'continentBoost' &&
            u.name.toLowerCase().includes(city.continent?.toLowerCase().split(' ')[0])
        );
        if (continentUpgrade) income *= (1 + continentUpgrade.effectValue);

        // Country advertising boost
        const countryAdBoost = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'countryAdvertisingBoost' && u.country === city.country)
            .reduce((sum, u) => sum + u.effectValue, 0);
        if (countryAdBoost > 0) income *= (1 + countryAdBoost);

        // Local country boost (home city's country)
        const homeCity = this.progressionManager.purchasedCities[0];
        if (homeCity && city.country === homeCity.country && homeCity.localCountryBoostValue > 0) {
            const localBoostCount = this.progressionManager.purchasedUpgrades
                .filter(u => u.effectType === 'localCountryBoost').length;
            income *= (1 + homeCity.localCountryBoostValue * localBoostCount);
        }

        // Southern hemisphere boost
        if (city.isSouthern && this.hasUpgrade('southernHemisphereBoost')) {
            income *= (1 + this.getUpgradeSum('southernHemisphereBoost'));
        }

        // Arctic boost (lat > 60)
        if (coordinates && coordinates[city.name]) {
            const lat = coordinates[city.name].lat;
            if (lat > 60 && this.hasUpgrade('arcticBoost')) {
                income *= (1 + this.getUpgradeSum('arcticBoost'));
            }
        }

        // Continent expansion boost
        const continentExpansionBoost = this.getUpgradeSum('continentExpansionBoost');
        if (continentExpansionBoost > 0) {
            const uniqueContinents = new Set(this.progressionManager.purchasedCities.map(c => c.continent)).size;
            income *= (1 + continentExpansionBoost * uniqueContinents);
        }

        // Country expansion boost
        const countryExpansionBoost = this.getUpgradeSum('countryExpansionBoost');
        if (countryExpansionBoost > 0) {
            const uniqueCountries = new Set(this.progressionManager.purchasedCities.map(c => c.country)).size;
            income *= (1 + countryExpansionBoost * uniqueCountries);
        }

        // Seasonal boost
        if (this.hasUpgrade('seasonBoost')) {
            const month = new Date().getMonth();
            const seasons = { Spring: [2,3,4], Summer: [5,6,7], Autumn: [8,9,10], Winter: [11,0,1] };
            const currentSeason = Object.entries(seasons).find(([, months]) => months.includes(month))?.[0];
            const seasonUpgrade = this.progressionManager.purchasedUpgrades.find(u =>
                u.effectType === 'seasonBoost' && u.name.toLowerCase().includes(currentSeason?.toLowerCase())
            );
            if (seasonUpgrade) income *= (1 + seasonUpgrade.effectValue);
        }

        return income;
    }

    calculatePopulationIncome(coordinates = null) {
        return this.progressionManager.purchasedCities
            .reduce((sum, city) => sum + this.calculateCityIncome(city, coordinates), 0);
    }

    calculateDailyIncome(coordinates = null) {
        return (this.calculateDevelopmentIncome() + this.calculatePopulationIncome(coordinates)) / SECONDS_IN_A_DAY;
    }

    calculateDiscountedBuildCost(baseCost) {
        const discount = this.getUpgradeSum('developmentDiscount');
        return Math.floor(baseCost * (1 - discount));
    }

    calculateWorkClickEarnings(baseEarnings) {
        const bonus = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'workClickBonus').length * 100;
        return baseEarnings + bonus;
    }

    calculateOfflineCap() {
        const extensions = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'offlineCapExtension').length;
        return 172800 + (extensions * 86400);
    }

    calculateDelayCompensation(baseCompensation) {
        const reduction = this.getUpgradeSum('delayCompensationReduction');
        return Math.floor(baseCompensation * (1 - reduction));
    }

    calculateDelayRepCost(baseRepCost) {
        const reduction = this.getUpgradeSum('delayRepCostReduction');
        return Math.max(0, baseRepCost - reduction);
    }

    getWorkRepChance() {
        let chance = 0.001;
        if (this.hasUpgrade('workRepChanceDouble')) chance *= 2;
        if (this.hasUpgrade('workRepChanceTriple')) chance *= 3;
        return chance;
    }

    getRerollRepCost(baseCost) {
        const discount = this.getUpgradeSum('rerollRepDiscount');
        return Math.max(0, baseCost - discount);
    }
}
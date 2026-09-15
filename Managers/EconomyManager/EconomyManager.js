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
        this.activeEvent = null;
    }

    getUpgradeSum(effectType) {
        return this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === effectType)
            .reduce((sum, u) => sum + u.effectValue, 0);
    }

    hasUpgrade(effectType) {
        return this.progressionManager.purchasedUpgrades.some(u => u.effectType === effectType);
    }

    hasUpgradeByName(name) {
        return this.progressionManager.purchasedUpgrades.some(u => u.name === name);
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

    isBusinessWeek() {
        const day = new Date().getDay();
        return day >= 1 && day <= 5;
    }

    isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6;
    }

    getSpecialDayBonus() {
        const now = new Date();
        const month = now.getMonth();
        const date = now.getDate();
        if (month === 9  && date === 31 && this.hasUpgradeByName('Halloween Fair')) return 1.0;
        if (month === 6  && date === 4  && this.hasUpgradeByName('Fourth of July Show')) return 1.0;
        if (month === 0  && date === 1  && this.hasUpgradeByName("New Year's Celebrations Event")) return 1.0;
        if (month === 11 && date === 25 && this.hasUpgradeByName('Christmas Day Festival')) return 1.0;
        if (month === 1  && date === 14 && this.hasUpgradeByName("Valentine's Weekend Sales")) return 1.0;
        return 0;
    }

    getSpecialDayMultiplier() {
        return 1 + this.getSpecialDayBonus();
    }

    getTimeOfDayBonus() {
        const hour = new Date().getHours();
        let bonus = 0;
        if (hour >= 6  && hour < 12 && this.hasUpgrade('morningBoost'))   bonus += this.getUpgradeSum('morningBoost');
        if (hour >= 12 && hour < 18 && this.hasUpgrade('afternoonBoost')) bonus += this.getUpgradeSum('afternoonBoost');
        if (hour >= 18 && hour < 22 && this.hasUpgrade('eveningBoost'))   bonus += this.getUpgradeSum('eveningBoost');
        if ((hour >= 22 || hour < 6) && this.hasUpgrade('nightBoost'))    bonus += this.getUpgradeSum('nightBoost');
        return bonus;
    }

    getTimeOfDayMultiplier() {
        return 1 + this.getTimeOfDayBonus();
    }

    getCurrentSeasonUpgrade() {
        const month = new Date().getMonth();
        const seasons = { Spring: [2,3,4], Summer: [5,6,7], Autumn: [8,9,10], Winter: [11,0,1] };
        const currentSeason = Object.entries(seasons).find(([, months]) => months.includes(month))?.[0];
        if (!currentSeason) return null;
        return this.progressionManager.purchasedUpgrades.find(u =>
            u.effectType === 'seasonBoost' &&
            u.name.toLowerCase().includes(currentSeason.toLowerCase()) &&
            !['january','february','march','april','may','june','july','august','september','october','november','december']
                .some(m => u.name.toLowerCase().includes(m))
        ) || null;
    }

    getCurrentMonthUpgrade() {
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const currentMonth = monthNames[new Date().getMonth()];
        return this.progressionManager.purchasedUpgrades.find(u =>
            u.effectType === 'seasonBoost' && u.name.includes(currentMonth)
        ) || null;
    }

    getCityBoostBreakdown(city, coordinates = null) {
        const lines = [];
        let totalBoost = 0;

        const connBoost = this.getUpgradeSum('connectionBoost');
        if (connBoost > 0) { lines.push(`Connection bonus: +${Math.round(connBoost * 100)}%`); totalBoost += connBoost; }

        const continentUpgrade = this.progressionManager.purchasedUpgrades.find(u =>
            u.effectType === 'continentBoost' &&
            u.name.toLowerCase().includes(city.continent?.toLowerCase().split(' ')[0])
        );
        if (continentUpgrade) { lines.push(`${continentUpgrade.name}: +${Math.round(continentUpgrade.effectValue * 100)}%`); totalBoost += continentUpgrade.effectValue; }

        const countryAdBoost = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'countryAdvertisingBoost' && u.country === city.country)
            .reduce((sum, u) => sum + u.effectValue, 0);
        if (countryAdBoost > 0) { lines.push(`Advertising campaign: +${Math.round(countryAdBoost * 100)}%`); totalBoost += countryAdBoost; }

        const homeCity = this.progressionManager.purchasedCities[0];
        if (homeCity && city.country === homeCity.country) {
            const localBoost = this.getUpgradeSum('localCountryBoost');
            if (localBoost > 0) { lines.push(`Local country bonus: +${Math.round(localBoost * 100)}%`); totalBoost += localBoost; }
        }

        if (city.isSouthern && this.hasUpgrade('southernHemisphereBoost')) {
            const b = this.getUpgradeSum('southernHemisphereBoost');
            lines.push(`Southern hemisphere: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        if (coordinates && coordinates[city.name]) {
            const lat = coordinates[city.name].lat;
            if (lat > 60 && this.hasUpgrade('arcticBoost')) {
                const b = this.getUpgradeSum('arcticBoost');
                lines.push(`Arctic bonus: +${Math.round(b * 100)}%`); totalBoost += b;
            }
            if (Math.abs(lat) <= 23 && this.hasUpgrade('equatorBoost')) {
                const b = this.getUpgradeSum('equatorBoost');
                lines.push(`Equator bonus: +${Math.round(b * 100)}%`); totalBoost += b;
            }
        }

        const continentExpansionBoost = this.getUpgradeSum('continentExpansionBoost');
        if (continentExpansionBoost > 0) {
            const uniqueContinents = new Set(this.progressionManager.purchasedCities.map(c => c.continent)).size;
            const b = continentExpansionBoost * uniqueContinents;
            lines.push(`Continent expansion: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        const countryExpansionBoost = this.getUpgradeSum('countryExpansionBoost');
        if (countryExpansionBoost > 0) {
            const uniqueCountries = new Set(this.progressionManager.purchasedCities.map(c => c.country)).size;
            const b = countryExpansionBoost * uniqueCountries;
            lines.push(`Country expansion: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        const seasonUpgrade = this.getCurrentSeasonUpgrade();
        if (seasonUpgrade) {
            const month = new Date().getMonth();
            const sn = month >= 2 && month <= 4 ? 'Spring' : month >= 5 && month <= 7 ? 'Summer' : month >= 8 && month <= 10 ? 'Autumn' : 'Winter';
            lines.push(`${sn} boost: +${Math.round(seasonUpgrade.effectValue * 100)}%`); totalBoost += seasonUpgrade.effectValue;
        }

        const monthUpgrade = this.getCurrentMonthUpgrade();
        if (monthUpgrade) {
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const mn = monthNames[new Date().getMonth()];
            lines.push(`${mn} boost: +${Math.round(monthUpgrade.effectValue * 100)}%`); totalBoost += monthUpgrade.effectValue;
        }

        if (city.population < 100000 && this.hasUpgrade('smallCityBoost')) {
            const b = this.getUpgradeSum('smallCityBoost');
            lines.push(`Emerging destination: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        if (this.hasUpgrade('businessWeekBoost') && this.isBusinessWeek()) {
            const b = this.getUpgradeSum('businessWeekBoost');
            lines.push(`Business week: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        if (this.hasUpgrade('weekendBoost') && this.isWeekend()) {
            const b = this.getUpgradeSum('weekendBoost');
            lines.push(`Weekend bonus: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        const specialDayBonus = this.getSpecialDayBonus();
        if (specialDayBonus > 0) { lines.push(`Special day: +${Math.round(specialDayBonus * 100)}%`); totalBoost += specialDayBonus; }

        const hour = new Date().getHours();
        const timePeriod = hour >= 6 && hour < 12 ? 'Morning' : hour >= 12 && hour < 18 ? 'Afternoon' : hour >= 18 && hour < 22 ? 'Evening' : 'Night';
        const timeBonus = this.getTimeOfDayBonus();
        if (timeBonus > 0) { lines.push(`${timePeriod} boost: +${Math.round(timeBonus * 100)}%`); totalBoost += timeBonus; }

        return { lines, totalBoost };
    }

    calculateDevelopmentIncome() {
        const devBoost = this.getUpgradeSum('developmentBoost');

        const uniqueContinents = new Set(this.progressionManager.purchasedCities.map(c => c.continent)).size;
        const devContinentBoost = this.getUpgradeSum('devContinentBoost') * uniqueContinents;

        const infraCount = this.progressionManager.purchasedDevelopments.filter(d => d.category === 'Infrastructure').length
            + this.progressionManager.purchasedUpgrades.filter(u => u.category === 'Infrastructure').length;
        const infraBoost = this.getUpgradeSum('infrastructureDevBoost') * infraCount;

        const enterpriseCount = this.progressionManager.purchasedDevelopments.filter(d => d.category === 'Enterprise').length
            + this.progressionManager.purchasedUpgrades.filter(u => u.category === 'Enterprise').length;
        const enterpriseBoost = this.getUpgradeSum('enterpriseDevBoost') * enterpriseCount;

        const serviceCount = this.progressionManager.purchasedDevelopments.filter(d => d.category === 'Service').length
            + this.progressionManager.purchasedUpgrades.filter(u => u.category === 'Service').length;
        const serviceBoost = this.getUpgradeSum('serviceDevBoost') * serviceCount;

        const categoryEffectMap = {
            'Food': 'foodIncome',
            'Recreation': 'recreationIncome',
            'Shopping': 'shoppingIncome',
            'Service': 'serviceIncome'
        };

        const seasonUpgrade = this.getCurrentSeasonUpgrade();
        const seasonBoost = seasonUpgrade ? seasonUpgrade.effectValue : 0;
        const monthUpgrade = this.getCurrentMonthUpgrade();
        const monthBoost = monthUpgrade ? monthUpgrade.effectValue : 0;
        const bizBoost = this.hasUpgrade('businessWeekBoost') && this.isBusinessWeek() ? this.getUpgradeSum('businessWeekBoost') : 0;
        const wkndBoost = this.hasUpgrade('weekendBoost') && this.isWeekend() ? this.getUpgradeSum('weekendBoost') : 0;
        const specialBoost = this.getSpecialDayBonus();
        const timeBoost = this.getTimeOfDayBonus();

        let developmentIncome = 0;
        this.progressionManager.purchasedDevelopments.forEach(development => {
            const base = this.getEffectiveDevRevenue(development);
            const categoryEffectType = categoryEffectMap[development.category];
            const categoryBoost = categoryEffectType ? this.getUpgradeSum(categoryEffectType) : 0;
            const totalBoost = categoryBoost + devBoost + devContinentBoost + infraBoost + enterpriseBoost + serviceBoost + seasonBoost + monthBoost + bizBoost + wkndBoost + specialBoost + timeBoost;
            developmentIncome += base * (1 + totalBoost);
        });
        return developmentIncome;
    }

    calculateCityIncome(city, coordinates = null) {
        const tierBase = TIER_INCOME[city.tier] || 0;
        const popBonus = city.population * POPULATION_INCOME_MODIFIER;
        let income = tierBase + popBonus;

        let totalBoost = 0;

        totalBoost += this.getUpgradeSum('connectionBoost');

        const continentUpgrade = this.progressionManager.purchasedUpgrades.find(u =>
            u.effectType === 'continentBoost' &&
            u.name.toLowerCase().includes(city.continent?.toLowerCase().split(' ')[0])
        );
        if (continentUpgrade) totalBoost += continentUpgrade.effectValue;

        const countryAdBoost = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'countryAdvertisingBoost' && u.country === city.country)
            .reduce((sum, u) => sum + u.effectValue, 0);
        totalBoost += countryAdBoost;

        const homeCity = this.progressionManager.purchasedCities[0];
        if (homeCity && city.country === homeCity.country) {
            totalBoost += this.getUpgradeSum('localCountryBoost');
        }

        if (city.isSouthern && this.hasUpgrade('southernHemisphereBoost')) {
            totalBoost += this.getUpgradeSum('southernHemisphereBoost');
        }

        if (coordinates && coordinates[city.name]) {
            const lat = coordinates[city.name].lat;
            if (lat > 60 && this.hasUpgrade('arcticBoost')) totalBoost += this.getUpgradeSum('arcticBoost');
            if (Math.abs(lat) <= 23 && this.hasUpgrade('equatorBoost')) totalBoost += this.getUpgradeSum('equatorBoost');
        }

        const continentExpansionBoost = this.getUpgradeSum('continentExpansionBoost');
        if (continentExpansionBoost > 0) {
            const uniqueContinents = new Set(this.progressionManager.purchasedCities.map(c => c.continent)).size;
            totalBoost += continentExpansionBoost * uniqueContinents;
        }

        const countryExpansionBoost = this.getUpgradeSum('countryExpansionBoost');
        if (countryExpansionBoost > 0) {
            const uniqueCountries = new Set(this.progressionManager.purchasedCities.map(c => c.country)).size;
            totalBoost += countryExpansionBoost * uniqueCountries;
        }

        const seasonUpgrade = this.getCurrentSeasonUpgrade();
        if (seasonUpgrade) totalBoost += seasonUpgrade.effectValue;

        const monthUpgrade = this.getCurrentMonthUpgrade();
        if (monthUpgrade) totalBoost += monthUpgrade.effectValue;

        if (city.population < 100000 && this.hasUpgrade('smallCityBoost')) {
            totalBoost += this.getUpgradeSum('smallCityBoost');
        }

        if (this.hasUpgrade('businessWeekBoost') && this.isBusinessWeek()) {
            totalBoost += this.getUpgradeSum('businessWeekBoost');
        }

        if (this.hasUpgrade('weekendBoost') && this.isWeekend()) {
            totalBoost += this.getUpgradeSum('weekendBoost');
        }

        totalBoost += this.getSpecialDayBonus();
        totalBoost += this.getTimeOfDayBonus();

        income *= (1 + totalBoost);

        return income;
    }

    calculatePopulationIncome(coordinates = null) {
        return this.progressionManager.purchasedCities
            .reduce((sum, city) => sum + this.calculateCityIncome(city, coordinates), 0);
    }

    calculateDailyIncome(coordinates = null, createdAt = null) {
        const base = (this.calculateDevelopmentIncome() + this.calculatePopulationIncome(coordinates)) / SECONDS_IN_A_DAY;
        const foundersMultiplier = this.getFoundersHallMultiplier(createdAt);
        if (this.activeEvent?.effectType === 'passiveBoost' || this.activeEvent?.effectType === 'passivePenalty') {
            return base * foundersMultiplier * this.activeEvent.effect.multiplier;
        }
        return base * foundersMultiplier;
    }

    calculateDiscountedBuildCost(baseCost) {
        const discount = this.getUpgradeSum('developmentDiscount');
        return Math.floor(baseCost * (1 - discount));
    }

    calculateDiscountedUpgradeCost(baseCost) {
        const discount = this.getUpgradeSum('developmentUpgradeDiscount');
        return Math.floor(baseCost * (1 - discount));
    }

    calculateWorkClickEarnings(baseEarnings) {
        const count = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'workClickBonus').length;
        const total = baseEarnings * Math.pow(3, count);
        if (this.activeEvent?.effectType === 'workBoost' || this.activeEvent?.effectType === 'workPenalty') {
            return Math.floor(total * this.activeEvent.effect.multiplier);
        }
        return Math.floor(total);
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

    getFarewellRepGain(baseRep = 5) {
        let rep = baseRep;
        if (this.hasUpgrade('farewellRepDoubled')) rep *= 2;
        return rep;
    }

    getFarewellCityIncomeBonus(city) {
        if (!this.hasUpgrade('personalImageBranding')) return 0;
        const dailyIncome = this.calculateCityIncome(city);
        return Math.floor(dailyIncome * 0.1);
    }

    getMinCityTierOnRankUp() {
        if (this.hasUpgrade('skilledNegotiationTeams')) return 2;
        return 1;
    }

    getFoundersHallMultiplier(createdAt) {
        if (!this.hasUpgradeByName("Founders' Hall") || !createdAt) return 1.0;
        const daysActive = Math.floor((Date.now() - createdAt) / 86400000);
        const boostPct = Math.floor(daysActive / 10) * 0.01;
        return 1 + boostPct;
    }

    getDailyRepBonus(rank) {
        if (!this.hasUpgrade('dailyRepPerRank')) return 0;
        return Math.floor(rank / 5);
    }
}
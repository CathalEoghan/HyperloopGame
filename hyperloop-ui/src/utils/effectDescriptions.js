import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'

// One list of upgrade effect descriptions, used by the unlock popup and the Developments page.
// Whole percentages stay whole (15), fractions show properly (2.5 rather than 3) and floating point noise is removed
const pct = v => +(v * 100).toFixed(1)

export const EFFECT_DESCRIPTIONS = {
    foodIncome: (v) => `+${pct(v)}% income from Food developments`,
    recreationIncome: (v) => `+${pct(v)}% income from Recreation developments`,
    shoppingIncome: (v) => `+${pct(v)}% income from Shopping developments`,
    serviceIncome: (v) => `+${pct(v)}% income from Service developments`,
    developmentBoost: (v) => `+${pct(v)}% income from all developments`,
    earlyRetirement: (v) => `Ready to pass it on? Purchasing this upgrade with ${v} Reputation will allow you to prestige.`,
    workPerAchievement: (v) => `+${pct(v)}% Work earnings for every unique achievement unlocked`,
    // What it really pays: Five-Star Researchers doubles it, then Fast Learner doubles the total
    prestigePoints: (v) => `Rewards ${v * (PrestigeManager.owns('fiveStarResearchers') ? 2 : 1) * (PrestigeManager.owns('fastLearner') ? 2 : 1)} Prestige Points`,
    connectionBoost: (v) => `+${pct(v)}% income from all city connections`,
    workClickBonus: () => `+45% Work click earnings`,
    offlineCapExtension: () => `+24 hours offline earnings cap`,
    developmentDiscount: (v) => `-${pct(v)}% development construction cost`,
    delayCompensationReduction: (v) => `-${pct(v)}% delay compensation cost`,
    delayRepCostReduction: (v) => `-${v} Reputation when ignoring delays`,
    bonusDurationExtension: (v) => `Bonus events last ${pct(v)}% longer`,
    farewellWindowExtension: (v) => `+${v} minutes farewell window`,
    farewellRepDoubled: () => `Reputation from farewells doubled`,
    negativeEventReduction: (v) => `Negative events ${pct(v)}% less likely`,
    workRepChanceDouble: () => `Double chance of Reputation from Work`,
    workRepChanceTriple: () => `Triple chance of Reputation from Work`,
    continentExpansionBoost: (v) => `+${pct(v)}% city income per unique continent connected`,
    countryExpansionBoost: (v) => `+${pct(v)}% city income per unique country connected`,
    southernHemisphereBoost: (v) => `+${pct(v)}% from southern hemisphere cities`,
    arcticBoost: (v) => `+${pct(v)}% income from Arctic cities`,
    continentBoost: (v) => `+${pct(v)}% income from cities on this continent`,
    countryAdvertisingBoost: (v) => `+${pct(v)}% income from cities in this country`,
    localCountryBoost: () => `Bonus income from cities in your home country`,
    dailyLoginMultiplier: () => 'Doubles your daily login cash bonus',
    progressRewardBoost: () => 'Doubles the cash and Reputation rewards from city and country discoveries on the Progress page',
    terminalAgeBoost: () => 'Multiplies all city and development income by an extra 1% for every 10 days active, on top of your other boosts',
    seasonBoost: (v, upgrade) => { const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const isMonthly = months.some(m => upgrade?.name?.includes(m)); return `+${pct(v)}% income during this ${isMonthly ? 'month' : 'season'}`; },
    rerollRepDiscount: (v) => `-${v} Reputation cost to re-roll cities`,
    freeRerollOnRankUp: () => `One free city re-roll each time you rank up`,
    positiveEventBoost: (v) => `+${pct(v)}% chance of positive events`,
    dailyLoginRep: (v) => `+${v} Reputation every day you log in`,
    freeRepOnRankUp: (v) => `+${v} Reputation each time you rank up`,
    businessWeekBoost: (v) => `+${pct(v)}% income Monday to Friday`,
    equatorBoost: (v) => `+${pct(v)}% income from cities near the equator`,
    infrastructureDevBoost: (v) => `+${pct(v)}% development income per Infrastructure item owned`,
    enterpriseDevBoost: (v) => `+${pct(v)}% development income per Enterprise item owned`,
    serviceDevBoost: (v) => `+${pct(v)}% development income per Service item owned`,
    devContinentBoost: (v) => `+${pct(v)}% development income per unique continent connected`,
    morningBoost: (v) => `+${pct(v)}% income between 6am and 12pm`,
    afternoonBoost: (v) => `+${pct(v)}% income between 12pm and 6pm`,
    eveningBoost: (v) => `+${pct(v)}% income between 6pm and 10pm`,
    nightBoost: (v) => `+${pct(v)}% income between 10pm and 6am`,
    weekendBoost: (v) => `+${pct(v)}% income on weekends`,
    smallCityBoost: (v) => `+${pct(v)}% income from cities under 100,000 population`,
    christmasBoost: () => `+100% city and development income on Christmas Day`,
    valentinesBoost: () => `+100% city and development income on Valentine's Day`,
    halloweenBoost: () => `+100% city and development income on Halloween`,
    fourthOfJulyBoost: () => `+100% city and development income on 4th of July`,
    easterBoost: () => `+100% city and development income on Easter Sunday`,
    newYearsBoost: () => `+100% city and development income on New Year's Day`,
    skilledNegotiationTeams: () => `Guaranteed at least Tier 2 city on each rank up`,
    personalImageBranding: (v) => `Earn ${pct(v)}% of a city's daily income when giving a farewell`,
    firstFarewellOfDayDouble: () => `First farewell of the day earns double Reputation`,
    developmentUpgradeDiscount: (v) => `-${pct(v)}% development upgrade cost`,
}

// Regular upgrades that raise income all go into one pot and are ADDED together (+20% and +30% make +50%). Only the
// Prestige perks and the Founders' Hall multiply, and they show as "x". This note says so on the Developments page,
// so a "+%" upgrade isn't mistaken for a multiplier.
const ADDS_TO_INCOME = new Set([
    'foodIncome', 'recreationIncome', 'shoppingIncome', 'serviceIncome', 'developmentBoost', 'connectionBoost',
    'continentExpansionBoost', 'countryExpansionBoost', 'southernHemisphereBoost', 'arcticBoost', 'continentBoost',
    'countryAdvertisingBoost', 'localCountryBoost', 'seasonBoost', 'businessWeekBoost', 'equatorBoost',
    'infrastructureDevBoost', 'enterpriseDevBoost', 'serviceDevBoost', 'devContinentBoost', 'morningBoost',
    'afternoonBoost', 'eveningBoost', 'nightBoost', 'weekendBoost', 'smallCityBoost', 'christmasBoost',
    'valentinesBoost', 'halloweenBoost', 'fourthOfJulyBoost', 'easterBoost', 'newYearsBoost',
])
const ADDS_TO_WORK = new Set(['workClickBonus', 'workPerAchievement'])

export function stackingNote(effectType) {
    if (ADDS_TO_INCOME.has(effectType)) return 'Adds to your other income upgrades rather than multiplying them.'
    if (ADDS_TO_WORK.has(effectType)) return 'Adds to your other Work upgrades rather than multiplying them.'
    return null
}

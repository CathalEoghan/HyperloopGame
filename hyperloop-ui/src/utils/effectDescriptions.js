import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { formatCompact } from './formatCompact.js'
import { PRESTIGE_VALUES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { EQUATOR_BONUS_MAX_LATITUDE } from 'Managers/EconomyManager/EconomyManager.js'

// One list of upgrade effect descriptions, used by the unlock popup and the Developments page.
// Whole percentages stay whole (15), fractions show properly (2.5 rather than 3) and floating point noise is removed
const pct = v => +(v * 100).toFixed(1)

// Festive Freak doubles every season/month/special-day upgrade's effect - the one multiplier shared by all
// of them, so a description always matches what the day/month/season actually pays (see EconomyManager's
// getFestiveFreakFactor, getSpecialDayBonus and getCurrentSeasonUpgrade/getCurrentMonthUpgrade, which apply
// the same factor to the live, in-game figures).
const festiveFreakFactor = () => PrestigeManager.owns('festiveFreak') ? PRESTIGE_VALUES.festiveFreakFactor : 1

export const EFFECT_DESCRIPTIONS = {
    vipChanceMultiplier: (v) => `x${v} chance of a VIP passenger`,
    foodIncome: (v) => `+${pct(v)}% income from Food developments`,
    recreationIncome: (v) => `+${pct(v)}% income from Recreation developments`,
    shoppingIncome: (v) => `+${pct(v)}% income from Shopping developments`,
    serviceIncome: (v) => `+${pct(v)}% income from Service developments`,
    developmentBoost: (v) => `+${pct(v)}% income from all developments`,
    earlyRetirement: (v) => `Ready to pass it on? Purchasing this upgrade with ${v} Reputation will allow you to prestige`,
    workPerAchievement: (v) => `+${pct(v)}% Work earnings for every unique achievement unlocked`,
    // What it really pays: Five-Star Researchers doubles it, then Quick Learner doubles the total
    // Experimental Technology's tier doubles the moment it is claimed (see ExperimentalTechnology.js), so once it has been
    // built, v is already NEXT time's figure: say what it just paid (half of v) and what the next claim will pay.
    prestigePoints: (v, upgrade, owned) => {
        const m = (PrestigeManager.owns('fiveStarResearchers') ? 2 : 1) * (PrestigeManager.owns('fastLearner') ? 2 : 1)
        // Compact from a million up: it doubles every claim, so it gets into the billions and further
        const fmt = (n) => formatCompact(n, 1e6)
        if (owned && upgrade?.name === 'Experimental Technology') return `Rewarded ${fmt(v / 2 * m)} Prestige Points. The next claim pays double: ${fmt(v * m)} Prestige Points, for double the cost`
        return `Rewards ${fmt(v * m)} Prestige Points`
    },
    connectionBoost: (v) => `+${pct(v)}% income from all city connections`,
    workClickBonus: () => `+45% Work click earnings`,
    offlineCapExtension: () => `+24 hours offline earnings cap`,
    developmentDiscount: (v) => `-${pct(v)}% development construction cost`,
    delayCompensationReduction: (v) => `-${pct(v)}% delay compensation cost`,
    delayRepCostReduction: (v) => `Refusing compensation for loop delays costs ${v} less Reputation`,
    bonusDurationExtension: (v) => `Bonus events last ${pct(v)}% longer`,
    // Also extends the greeting window on arrivals (App.jsx derives both from this same effect), so the
    // wording says so rather than naming only the farewell half.
    farewellWindowExtension: (v) => `+${v} minutes to farewell and greeting windows`,
    farewellRepDoubled: () => `Reputation from farewells doubled`,
    // "stacks multiplicatively" flagged inline - several of these upgrades can be owned at once (Uniform Redesign,
    // Staff Cafeteria Renovations, ...) and they do NOT add up the way a "+%" income upgrade does: each one only
    // cuts whatever chance the others still let through (getNegativeEventReduction in EconomyManager.js), so five
    // 20% upgrades together give nowhere near "100% less likely".
    negativeEventReduction: (v) => `Negative events ${pct(v)}% less likely (stacks multiplicatively)`,
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
    // Every Progress page reward card - cities, countries, developments and Prestige upgrades (ProgressPage's getRewardFactor)
    progressRewardBoost: () => 'Doubles the cash and Reputation rewards you claim on the Progress page',
    // Founders' Hall Expansion doubles the daily rate (EconomyManager.getFoundersHallMultiplier uses 10% instead
    // of 5%), so the description says what the hall really pays rather than always 5%. The clock itself is the
    // terminal's own lifetime (createdAt, passed in as lifetimeCreatedAt), not any one run's - a Prestige retirement
    // doesn't reset it or cost it a day - so "this run" would be wrong; see getFoundersHallMultiplier's own comment.
    terminalAgeBoost: () => `Multiplies all city and development income by an extra ${PrestigeManager.owns('foundersHallExpansion') ? 10 : 5}% for every day your terminal has been open, on top of your other boosts - Prestige doesn't reset this`,
    seasonBoost: (v, upgrade) => { const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const isMonthly = months.some(m => upgrade?.name?.includes(m)); return `+${pct(v * festiveFreakFactor())}% income during this ${isMonthly ? 'month' : 'season'}`; },
    rerollRepDiscount: (v) => `-${v} Reputation cost to re-roll your city choices`,
    freeRerollOnRankUp: () => `One free re-roll of your city choices each time you rank up`,
    positiveEventBoost: (v) => `+${pct(v)}% chance of positive events`,
    dailyLoginRep: (v) => `+${v} Reputation every day you log in`,
    // Same word choice as the offline-earnings popup's Double/Triple/Quadruple bonus (OfflineModal.jsx) - only this
    // one upgrade uses this effectType, and always at v=3, but the wording still scales if that ever changes.
    firstLoopTripleRep: (v) => `The first arrival or departure you greet or farewell each day pays ${v === 2 ? 'double' : v === 3 ? 'triple' : v === 4 ? 'quadruple' : `${v}x`} Reputation`,
    freeRepOnRankUp: (v) => `+${v} Reputation each time you rank up`,
    businessWeekBoost: (v) => `+${pct(v)}% income Monday to Friday`,
    equatorBoost: (v) => `+${pct(v)}% income from cities within ${EQUATOR_BONUS_MAX_LATITUDE}° of the equator`,
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
    christmasBoost: (v) => `+${pct(v * festiveFreakFactor())}% city and development income on Christmas Day`,
    valentinesBoost: (v) => `+${pct(v * festiveFreakFactor())}% city and development income on Valentine's Day`,
    halloweenBoost: (v) => `+${pct(v * festiveFreakFactor())}% city and development income on Halloween`,
    fourthOfJulyBoost: (v) => `+${pct(v * festiveFreakFactor())}% city and development income on 4th of July`,
    easterBoost: (v) => `+${pct(v * festiveFreakFactor())}% city and development income on Easter Sunday`,
    newYearsBoost: (v) => `+${pct(v * festiveFreakFactor())}% city and development income on New Year's Day`,
    skilledNegotiationTeams: (v) => `+${v} city choices each time you rank up`,
    personalImageBranding: (v) => `Earn ${pct(v)}% of a city's daily income when giving a farewell`,
    developmentUpgradeDiscount: (v) => `-${pct(v)}% development upgrade cost`,
    milestoneReputationBonus: (v) => `+${v} Reputation every time you reach a milestone`,
    likePositiveEventChance: (v) => `${pct(v)}% chance that liking a Hyper-Link post triggers a positive event`,
    positiveEventReputationBonus: (v) => `+${v} Reputation on every positive event`,
    lostAndFoundBoost: (v) => `+${pct(v)}% income from Shopping and Recreation developments`,
    soleCityInCountryBoost: (v) => `+${pct(v)}% income from a city that's the only one you've connected in its country`,
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
    'lostAndFoundBoost', 'soleCityInCountryBoost',
])
const ADDS_TO_WORK = new Set(['workClickBonus', 'workPerAchievement'])

export function stackingNote(effectType) {
    if (ADDS_TO_INCOME.has(effectType)) return 'Adds to your other income upgrades rather than multiplying them.'
    if (ADDS_TO_WORK.has(effectType)) return 'Adds to your other Work upgrades rather than multiplying them.'
    return null
}

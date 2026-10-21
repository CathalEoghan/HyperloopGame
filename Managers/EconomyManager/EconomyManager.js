import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js';
import { PRESTIGE_VALUES as PV } from '../PrestigeManager/prestigeUpgrades.js';
import { ACHIEVEMENT_IDS } from '../AchievementManager/achievements.js';
import { INCOME_SCALE } from './incomeScale.js';
import { allCities } from '../../CityManager/CityRegistry.js';
import { DEV_REMOVE_REP_COST } from '../ProgressionManager/ProgressionManager.js';
import { getCapacityMultiplier, getCapacityPercent, getTierCapacity, getDemandBand } from './capacityCurve.js';

// Cached against the raw stored string: income maths asks for this once per city, every second
let achievementCache = { raw: undefined, n: 0 };

const SECONDS_IN_A_DAY = 86400;
const POPULATION_INCOME_MODIFIER = 0.0001 * INCOME_SCALE;
// VIP passengers: the chance a departure has one (x10 with VIP Pods), and how much more their farewell is worth.
const VIP_BASE_CHANCE = 0.02;
const VIP_REP_MULTIPLIER = 5;

const TIER_INCOME = {
    1: 10000 * INCOME_SCALE,
    2: 50000 * INCOME_SCALE,
    3: 100000 * INCOME_SCALE
};
// Terminal footfall: how much of their 10-100% a development earns, floored at 10% with nobody in the building, +5%
// for every loop currently putting people in the terminal - a departure from 3 hours out (early arrivals, security)
// until it leaves, or an arrival for an hour after it lands (bags, deciding where to go). A loop mid-flight, sealed
// in its pod, contributes nothing (see getTerminalFootfallCount in utils/loops.js, and
// EconomyManager.setBoardLoopCount, set by the UI each tick from that count).
const DEV_BUSY_FLOOR_PCT = 10;
const DEV_BUSY_PCT_PER_LOOP = 5;

// A city's own base income (tier plus population), with no boosts: used for the city card, for the Work
// calculation, and for the Schedule loop preview's estimated daily income - all from the one formula.
export function baseCityIncome(city) {
    return (TIER_INCOME[city.tier] || 0) + city.population * POPULATION_INCOME_MODIFIER;
}

// A Work click is worth this many seconds of the player's BASE income: tier and population income of every connected
// city on the departure timetable plus the (levelled) revenue of every development, before any boost, event or
// Prestige perk. Work only grows by connecting, scheduling and building, by the Work upgrades, or by Prestige Work
// perks, so passive boosts (including how busy a connection or the terminal happens to be right now) never inflate
// it. A city off the timetable, or the home city (which never earns), adds nothing. The minimum keeps the very
// first clicks worthwhile.
const WORK_SECONDS_OF_INCOME = 10;
const WORK_MIN_CLICK = 250;
// How much a click can vary: between 1/3 and 5/3 of the average (the same spread as before)
const WORK_ROLL_MIN = 1 / 3;
const WORK_ROLL_SPREAD = 4 / 3;

// Levels 1-3 are the original curve; 4-10 each add a further flat +50% (see UPGRADE_CASH_PCTS in
// ProgressionManager.js for the steadily steeper cost that pays for them).
const UPGRADE_MULTIPLIERS = [1.0, 1.15, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00, 4.50, 5.00, 5.50];
// A city's own "line upgrade" levels (see getCityLineUpgradeCostInfo in ProgressionManager.js): +40% income per
// level, flat, for all 10 levels - the cost side is what makes each level progressively less worth it.
const LINE_LEVEL_INCOME_PCT = 0.40;

// Home-country bonus per local-transport upgrade. The six starter cities set their own value; any other home city
// (Personal Favours) gets one from the same idea, smaller for countries with more cities: 24% / sqrt(cities in the
// country), capped at 20% (bug #153). 1-2 cities: 20%, 7 cities: 9%, 35 cities: 4%.
const citiesPerCountry = {};
allCities.forEach(c => { citiesPerCountry[c.country] = (citiesPerCountry[c.country] || 0) + 1; });
export function getLocalCountryBoostValue(city) {
    if (!city) return 0;
    if (city.localCountryBoostValue > 0) return city.localCountryBoostValue;
    const n = citiesPerCountry[city.country] || 1;
    return Math.round(Math.min(0.20, 0.24 / Math.sqrt(n)) * 100) / 100;
}

export class EconomyManager {
    constructor(progressionManager) {
        this.progressionManager = progressionManager;
                this.activeEvent = null;
        // City name → { lat, lng }. Set once by the UI so every income calculation
        // (not just the ones that pass coordinates) applies the Arctic/Equator upgrades.
        this.coordinates = null;
        // When this save was created, set by the UI. Lets the figures shown on screen include the Founders' Hall bonus.
        this.createdAt = null;
        // How many loops are currently putting people in the home terminal (see getTerminalFootfallBreakdown in
        // utils/loops.js) - not loops literally in the air, whose passengers can't shop. Set once by the UI each
        // tick, since this manager has no access to the schedule storage that lives in the UI layer.
        this.boardLoopCount = 0;
        // The same count, split into departures-about-to-leave vs. arrivals-just-landed, so the busy status can
        // explain itself (e.g. "2 loops nearing departure, 1 just arrived") instead of just showing a bare number.
        this.boardLoopBreakdown = { departures: 0, arrivals: 0 };
    }

    setBoardLoopCount(count, breakdown = null) {
        this.boardLoopCount = Math.max(0, count || 0);
        if (breakdown) this.boardLoopBreakdown = { departures: Math.max(0, breakdown.departures || 0), arrivals: Math.max(0, breakdown.arrivals || 0) };
    }

    getUpgradeSum(effectType) {
        return this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === effectType)
            .reduce((sum, u) => sum + u.effectValue, 0);
    }

    // Social Media Managers (Port Louis): a boost for any city that is the only one purchased in its country -
    // rewards spreading out to minor destinations instead of just stacking up a handful of big ones. Most
    // small countries only ever have one city in the game at all, so for those this is a standing bonus rather
    // than a temporary early-game one; that's intentional, not a bug.
    getSoleCityInCountryBoost(city) {
        if (!this.hasUpgrade('soleCityInCountryBoost')) return 0;
        const countryCityCount = this.progressionManager.purchasedCities.filter(c => c.country === city.country).length;
        if (countryCityCount !== 1) return 0;
        return this.getUpgradeSum('soleCityInCountryBoost');
    }

    // Home-country bonus from the local-transport upgrades. Each one adds the home city's own
    // localCountryBoostValue, which is smaller for countries with more cities (New York 3%,
    // London 12%, Dubai 20%), so no starting city gets a far bigger bonus than another (bug #60).
    getLocalCountryBoost() {
        const homeCity = this.progressionManager.purchasedCities[0];
        if (!homeCity) return 0;
        const count = this.progressionManager.purchasedUpgrades.filter(u => u.effectType === 'localCountryBoost').length;
        return getLocalCountryBoostValue(homeCity) * count;
    }

    // The season the boosts follow right now, for the breakdown labels: shifted six months for a southern home city,
    // the same way getCurrentSeasonUpgrade picks the upgrade (bug #156).
    getCurrentSeasonName() {
        const homeCity = this.progressionManager.purchasedCities[0];
        const homeLat = homeCity ? this.coordinates?.[homeCity.name]?.lat : undefined;
        const month = (new Date().getMonth() + (typeof homeLat === 'number' && homeLat < 0 ? 6 : 0)) % 12;
        return month >= 2 && month <= 4 ? 'Spring' : month >= 5 && month <= 7 ? 'Summer' : month >= 8 && month <= 10 ? 'Autumn' : 'Winter';
    }

    // Prestige upgrades. All percentages are additive with the normal boosts.
    // Unique achievements unlocked. There is no Achievements system yet, so this is 0; when it exists it
    // stores the unlocked ids in 'hyperloop_achievements' and Anniversary Sales and Trophy Cabinet switch on.
    getUniqueAchievementCount() {
        let raw = null;
        try { raw = localStorage.getItem('hyperloop_achievements'); } catch { /* storage unavailable */ }
        if (raw !== achievementCache.raw) {
            let n = 0;
            try {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) n = new Set(list.filter(id => ACHIEVEMENT_IDS.has(id))).size;
            } catch { /* unreadable: none */ }
            achievementCache = { raw, n };
        }
        return achievementCache.n;
    }

    // Prestige percentage perks are multipliers applied after all the ordinary boosts have been added up, so each one
    // keeps its full effect however many other boosts are owned (bug #147). Values live in PRESTIGE_VALUES.

    // Generational Wisdom: x(1 + 5%) for every Prestige Point currently held, so spending points gives some of it back
    getGenerationalWisdomMultiplier() {
        return PrestigeManager.owns('generationalWisdom') ? 1 + PV.generationalWisdomPerPoint * PrestigeManager.pointsHeld() : 1;
    }

    getTrophyCabinetMultiplier() {
        return PrestigeManager.owns('trophyCabinet') ? 1 + PV.trophyCabinetPerAchievement * this.getUniqueAchievementCount() : 1;
    }

    // The perks that apply to one kind of income, as [name, multiplier] pairs (only the ones that do something).
    prestigeMultipliers(kind) {
        const list = [];
        if (PrestigeManager.owns('staffFeedbackForms')) list.push(['Staff Feedback Forms', PV.staffFeedbackForms]);
        const wisdom = this.getGenerationalWisdomMultiplier();
        if (wisdom > 1) list.push(['Generational Wisdom', wisdom]);
        const trophies = this.getTrophyCabinetMultiplier();
        if (trophies > 1) list.push(['Trophy Cabinet', trophies]);
        if (kind === 'dev' && PrestigeManager.owns('irresistibleDiscounts')) list.push(['Irresistible Discounts', PV.irresistibleDiscounts]);
        if (kind === 'city' && PrestigeManager.owns('globalTicketCuts')) list.push(['Global Ticket Cuts', PV.globalTicketCuts]);
        return list;
    }

    getPrestigeDevMultiplier() {
        return this.prestigeMultipliers('dev').reduce((m, [, v]) => m * v, 1);
    }

    getPrestigeCityMultiplier() {
        return this.prestigeMultipliers('city').reduce((m, [, v]) => m * v, 1);
    }

    // The breakdown popups: a "Modifiers:" heading, the + lines (added together), then the x lines (multiplied), then the
    // total, which is the (+X%) shown beside the income. The symbols and the order carry the maths.
    finishBreakdown(lines, additive, kind, extra = null) {
        const mults = this.prestigeBoostLines(kind);
        const founders = this.foundersHallLine();
        if (founders) mults.push(founders);
        if (extra?.label) mults.push(extra.label);
        const prestige = kind === 'dev' ? this.getPrestigeDevMultiplier() : this.getPrestigeCityMultiplier();
        const extraMult = extra?.mult ?? 1;
        const totalBoost = (1 + additive) * prestige * extraMult * this.getFoundersHallMultiplier() - 1;
        const out = [...lines, ...mults];
        if (out.length === 0) return { lines: out, totalBoost };
        return { lines: ['Modifiers:', ...out, ...(out.length > 1 ? [`Total: +${Math.round(totalBoost * 100).toLocaleString('en-GB')}%`] : [])], totalBoost };
    }

    // Lines for the boost breakdown popups.
    prestigeBoostLines(kind) {
        const fmt = v => Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '');
        return this.prestigeMultipliers(kind).map(([name, v]) => `${name}: ×${fmt(v)}`);
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
        let boost = effectType ? this.getUpgradeSum(effectType) : 0;
        // Lost & Found Office (Novosibirsk): one upgrade boosting two categories at once, rather than a
        // separately-named, separately-purchased upgrade for each - so it's added onto both here instead of
        // getting its own entry in effectTypeMap above.
        if (category === 'Shopping' || category === 'Recreation') boost += this.getUpgradeSum('lostAndFoundBoost');
        return 1 + boost;
    }

    // Which connected cities are on the departure timetable. A city only earns while it has a scheduled departure.
    // Read from the saved timetable (see utils/timetable.js) and kept for a moment, since the income is worked out
    // for every city on every tick.
    getScheduledNames() {
        const now = Date.now();
        if (this._scheduledCache && now - this._scheduledCache.at < 100) return this._scheduledCache.names;
        let names = new Set();
        try {
            const list = JSON.parse(localStorage.getItem('hyperloop_timetable'));
            if (Array.isArray(list)) names = new Set(list.filter(e => e && typeof e.name === 'string').map(e => e.name));
        } catch { /* no timetable yet: nothing is scheduled */ }
        this._scheduledCache = { at: now, names };
        return names;
    }

    // The home city is the terminal itself, not a destination: it is never on the timetable (you don't depart to
    // where you already are), so it never earns, whatever the timetable says.
    isHomeCity(city) {
        const home = this.progressionManager.purchasedCities[0];
        return !!home && !!city && city.name === home.name;
    }

    isCityEarning(city) {
        if (!city || this.isHomeCity(city)) return false;
        return this.getScheduledNames().has(city.name);
    }

    // The capacity a connection is running at right now (50-100), and how many passengers that means for its tier.
    // The same curve drives the departure/arrival board, the Schedule loop preview and Active Loops (see
    // utils/loops.js), so every passenger count in the game agrees with this one.
    getConnectionCapacityInfo(city, nowMs = Date.now()) {
        const now = new Date(nowMs);
        const hour = now.getHours();
        const seed = `${city.name}|${now.toDateString()}|${hour}`;
        const percent = getCapacityPercent(hour, seed);
        const capacity = getTierCapacity(city.tier);
        return { percent, capacity, passengers: Math.round(capacity * percent / 100), band: getDemandBand(hour).name, hour, seed };
    }

    getConnectionCapacityMultiplier(city, nowMs = Date.now()) {
        const now = new Date(nowMs);
        const hour = now.getHours();
        const seed = `${city.name}|${now.toDateString()}|${hour}`;
        return getCapacityMultiplier(hour, seed);
    }

    // Terminal footfall: 10% floor, +5% per loop currently putting people in the terminal, capped at 100%. Drives
    // every development's income (see calculateDevelopmentIncome / getEffectiveDevIncomeWithBoosts) - set each
    // tick by the UI via setBoardLoopCount, since this manager has no access to the schedule storage itself.
    getDevelopmentBusyPercent() {
        return Math.min(100, DEV_BUSY_FLOOR_PCT + DEV_BUSY_PCT_PER_LOOP * this.boardLoopCount);
    }

    getDevelopmentBusyMultiplier() {
        return this.getDevelopmentBusyPercent() / 100;
    }

    // The plain-English reason behind the busy%, for a tooltip on the status itself: how many loops in the
    // departures/arrivals breakdown (see boardLoopBreakdown, set by setBoardLoopCount) are actually contributing.
    getDevelopmentBusyExplanation() {
        const { departures: dep, arrivals: arr } = this.boardLoopBreakdown;
        return `${dep} loop${dep === 1 ? '' : 's'} ${dep === 1 ? 'is' : 'are'} nearing departure, `
            + `${arr} loop${arr === 1 ? '' : 's'} ${arr === 1 ? 'has' : 'have'} just arrived.`;
    }

    // The four-band read-out shown on the Development page and in each development's tooltip.
    getDevelopmentBusyStatus() {
        const pct = this.getDevelopmentBusyPercent();
        const explanation = this.getDevelopmentBusyExplanation();
        if (pct >= 100) return { label: 'Very busy', color: '#1e7e34', explanation };
        if (pct >= 75) return { label: 'Busy', color: '#27ae60', explanation };
        if (pct >= 45) return { label: 'Not very busy', color: '#d4ac0d', explanation };
        return { label: 'Not busy', color: '#c0392b', explanation };
    }

    // What a city earns right now: its full income while it is on the timetable, scaled by how busy that connection
    // is at this moment (nothing while it's off the timetable, and the home city never earns at all).
    // (calculateCityIncome is what the city could earn at full capacity, for the cards and the bonuses that go by it.)
    calculateCityEarning(city, coordinates = null) {
        if (!this.isCityEarning(city)) return 0;
        return this.calculateCityIncome(city, coordinates) * this.getConnectionCapacityMultiplier(city);
    }

    // What a city earns per day before any boost (tier plus population): the first line of the city card.
    getCityBaseIncome(city) {
        return baseCityIncome(city);
    }

    // The multiplier a city's own line-upgrade level gives (x1, x1.4, x1.8, ... up to x5 at level 10).
    getCityLineMultiplier(city) {
        const rawLevel = Math.floor(Number(this.progressionManager.cityLineLevels[city.name])) || 0;
        const level = Math.max(0, Math.min(10, rawLevel));
        return 1 + LINE_LEVEL_INCOME_PCT * level;
    }

    // The multiplier a development's upgrade level gives (x1 up to x5.5 at level 10), shown on the development card.
    getDevLevelMultiplier(development) {
        const rawLevel = Math.floor(Number(this.progressionManager.developmentUpgradeLevels[development.name])) || 0;
        return UPGRADE_MULTIPLIERS[Math.max(0, Math.min(UPGRADE_MULTIPLIERS.length - 1, rawLevel))];
    }

    getEffectiveDevRevenue(development) {
        const base = development.revenue || 0;
        // A level outside 0-10 (a hand-edited save) is treated as the nearest real level, never NaN (bug #82)
        const rawLevel = Math.floor(Number(this.progressionManager.developmentUpgradeLevels[development.name])) || 0;
        const level = Math.max(0, Math.min(UPGRADE_MULTIPLIERS.length - 1, rawLevel));
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
        if (month === 9  && date === 31 && this.hasUpgrade('halloweenBoost')) return 1.0;
        if (month === 6  && date === 4  && this.hasUpgrade('fourthOfJulyBoost')) return 1.0;
        if (month === 0  && date === 1  && this.hasUpgrade('newYearsBoost')) return 1.0;
        if (month === 11 && date === 25 && this.hasUpgrade('christmasBoost')) return 1.0;
        if (month === 1  && date === 14 && this.hasUpgrade('valentinesBoost')) return 1.0;
        if (this.hasUpgrade('easterBoost')) {
            const y = now.getFullYear();
            const a = y % 19, b = Math.floor(y/100), c = y % 100;
            const d = Math.floor(b/4), e = b % 4, f = Math.floor((b+8)/25);
            const g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15) % 30;
            const i = Math.floor(c/4), k = c % 4, l = (32+2*e+2*i-h-k) % 7;
            const m = Math.floor((a+11*h+22*l)/451);
            const easterMonth = Math.floor((h+l-7*m+114)/31) - 1;
            const easterDay = ((h+l-7*m+114) % 31) + 1;
            if (month === easterMonth && date === easterDay) return 1.0;
        }
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
        // The seasons follow the home city's hemisphere: when it is summer in London it is
        // winter in Sydney, so a southern home city's calendar is shifted by six months.
        const homeCity = this.progressionManager.purchasedCities[0];
        const homeLat = homeCity ? this.coordinates?.[homeCity.name]?.lat : undefined;
        const southern = typeof homeLat === 'number' && homeLat < 0;
        const month = (new Date().getMonth() + (southern ? 6 : 0)) % 12;
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


    getEffectiveDevIncomeWithBoosts(development) {
        const base = this.getEffectiveDevRevenue(development);
        if (!base) return 0;

        const categoryEffectMap = {
            'Food': 'foodIncome',
            'Recreation': 'recreationIncome',
            'Shopping': 'shoppingIncome',
            'Service': 'serviceIncome'
        };

        const categoryEffectType = categoryEffectMap[development.category];
        const categoryBoost = categoryEffectType ? this.getUpgradeSum(categoryEffectType) : 0;
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

        const seasonUpgrade = this.getCurrentSeasonUpgrade();
        const seasonBoost = seasonUpgrade ? seasonUpgrade.effectValue : 0;
        const monthUpgrade = this.getCurrentMonthUpgrade();
        const monthBoost = monthUpgrade ? monthUpgrade.effectValue : 0;
        const bizBoost = this.hasUpgrade('businessWeekBoost') && this.isBusinessWeek() ? this.getUpgradeSum('businessWeekBoost') : 0;
        const wkndBoost = this.hasUpgrade('weekendBoost') && this.isWeekend() ? this.getUpgradeSum('weekendBoost') : 0;
        const specialBoost = this.getSpecialDayBonus();
        const timeBoost = this.getTimeOfDayBonus();

        const totalBoost = categoryBoost + devBoost + devContinentBoost + infraBoost + enterpriseBoost + serviceBoost + seasonBoost + monthBoost + bizBoost + wkndBoost + specialBoost + timeBoost;
        return Math.floor(base * (1 + totalBoost) * this.getPrestigeDevMultiplier() * this.getDevelopmentBusyMultiplier());
    }


    getDevBoostBreakdown(development) {
        const lines = [];
        let totalBoost = 0;

        const categoryEffectMap = {
            'Food': 'foodIncome',
            'Recreation': 'recreationIncome',
            'Shopping': 'shoppingIncome',
            'Service': 'serviceIncome'
        };
        const categoryEffectType = categoryEffectMap[development.category];
        const categoryBoost = categoryEffectType ? this.getUpgradeSum(categoryEffectType) : 0;
        if (categoryBoost > 0) { lines.push(`${development.category} bonus: +${Math.round(categoryBoost * 100)}%`); totalBoost += categoryBoost; }

        const devBoost = this.getUpgradeSum('developmentBoost');
        if (devBoost > 0) { lines.push(`Development boost: +${Math.round(devBoost * 100)}%`); totalBoost += devBoost; }

        const uniqueContinents = new Set(this.progressionManager.purchasedCities.map(c => c.continent)).size;
        const devContinentBoost = this.getUpgradeSum('devContinentBoost') * uniqueContinents;
        if (devContinentBoost > 0) { lines.push(`Continent connections: +${Math.round(devContinentBoost * 100)}%`); totalBoost += devContinentBoost; }

        const infraCount = this.progressionManager.purchasedDevelopments.filter(d => d.category === 'Infrastructure').length
            + this.progressionManager.purchasedUpgrades.filter(u => u.category === 'Infrastructure').length;
        const infraBoost = this.getUpgradeSum('infrastructureDevBoost') * infraCount;
        if (infraBoost > 0) { lines.push(`Infrastructure count: +${Math.round(infraBoost * 100)}%`); totalBoost += infraBoost; }

        const enterpriseCount = this.progressionManager.purchasedDevelopments.filter(d => d.category === 'Enterprise').length
            + this.progressionManager.purchasedUpgrades.filter(u => u.category === 'Enterprise').length;
        const enterpriseBoost = this.getUpgradeSum('enterpriseDevBoost') * enterpriseCount;
        if (enterpriseBoost > 0) { lines.push(`Enterprise count: +${Math.round(enterpriseBoost * 100)}%`); totalBoost += enterpriseBoost; }

        const serviceCount = this.progressionManager.purchasedDevelopments.filter(d => d.category === 'Service').length
            + this.progressionManager.purchasedUpgrades.filter(u => u.category === 'Service').length;
        const serviceBoost = this.getUpgradeSum('serviceDevBoost') * serviceCount;
        if (serviceBoost > 0) { lines.push(`Service count: +${Math.round(serviceBoost * 100)}%`); totalBoost += serviceBoost; }

        const seasonUpgrade = this.getCurrentSeasonUpgrade();
        if (seasonUpgrade) {
            const sn = this.getCurrentSeasonName();
            lines.push(`${sn} boost: +${Math.round(seasonUpgrade.effectValue * 100)}%`); totalBoost += seasonUpgrade.effectValue;
        }

        const monthUpgrade = this.getCurrentMonthUpgrade();
        if (monthUpgrade) {
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const mn = monthNames[new Date().getMonth()];
            lines.push(`${mn} boost: +${Math.round(monthUpgrade.effectValue * 100)}%`); totalBoost += monthUpgrade.effectValue;
        }

        if (this.hasUpgrade('businessWeekBoost') && this.isBusinessWeek()) {
            const b = this.getUpgradeSum('businessWeekBoost');
            lines.push(`Business week: +${Math.round(b * 100)}%`); totalBoost += b;
        }
        if (this.hasUpgrade('weekendBoost') && this.isWeekend()) {
            const b = this.getUpgradeSum('weekendBoost');
            lines.push(`Weekend bonus: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        const specialBonus = this.getSpecialDayBonus();
        if (specialBonus > 0) { lines.push(`Special day: +${Math.round(specialBonus * 100)}%`); totalBoost += specialBonus; }

        const hour = new Date().getHours();
        const timePeriod = hour >= 6 && hour < 12 ? 'Morning' : hour >= 12 && hour < 18 ? 'Afternoon' : hour >= 18 && hour < 22 ? 'Evening' : 'Night';
        const timeBonus = this.getTimeOfDayBonus();
        if (timeBonus > 0) { lines.push(`${timePeriod} boost: +${Math.round(timeBonus * 100)}%`); totalBoost += timeBonus; }

        // Terminal footfall is shown separately (the coloured Busy/Not busy status, at the top of the Development
        // page and in this development's own tooltip - see getDevelopmentBusyStatus) rather than folded in here:
        // unlike every other line in this breakdown it can pull income below the base, and the "Boosted revenue"
        // row this feeds only ever renders for a net bonus (totalBoost > 0), so a reduction here would silently
        // disappear from the breakdown instead of showing up as a markdown.
        // totalBoost covers everything paid over the base, Founders' Hall included, as shown next to the income
        return this.finishBreakdown(lines, totalBoost, 'dev');
    }

        getCityBoostBreakdown(city, coordinates = null) {
        coordinates = coordinates ?? this.coordinates;
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
            const localBoost = this.getLocalCountryBoost();
            if (localBoost > 0) { lines.push(`Local country bonus: +${Math.round(localBoost * 100)}%`); totalBoost += localBoost; }
        }

        if (city.isSouthern && this.hasUpgrade('southernHemisphereBoost')) {
            const b = this.getUpgradeSum('southernHemisphereBoost');
            lines.push(`Southern hemisphere: +${Math.round(b * 100)}%`); totalBoost += b;
        }

        const soleCityBoost = this.getSoleCityInCountryBoost(city);
        if (soleCityBoost > 0) { lines.push(`Sole city in country: +${Math.round(soleCityBoost * 100)}%`); totalBoost += soleCityBoost; }

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
            const sn = this.getCurrentSeasonName();
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

        // Line upgrade: a straight ×multiplier (not an additive % like the lines above), shown as its own
        // "Modifiers:" line the same way a Prestige city perk would be.
        const lineLevel = this.progressionManager.getCityLineLevel(city);
        const lineExtra = lineLevel > 0
            ? { mult: this.getCityLineMultiplier(city), label: `Line upgrade (Lv.${lineLevel}): ×${this.getCityLineMultiplier(city).toFixed(2).replace(/0$/, '').replace(/\.$/, '')}` }
            : null;

        // totalBoost covers everything paid over the base, Founders' Hall included, as shown next to the income
        return this.finishBreakdown(lines, totalBoost, 'city', lineExtra);
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
        const prestigeMult = this.getPrestigeDevMultiplier();

        let developmentIncome = 0;
        this.progressionManager.purchasedDevelopments.forEach(development => {
            const base = this.getEffectiveDevRevenue(development);
            const categoryEffectType = categoryEffectMap[development.category];
            const categoryBoost = categoryEffectType ? this.getUpgradeSum(categoryEffectType) : 0;
            const totalBoost = categoryBoost + devBoost + devContinentBoost + infraBoost + enterpriseBoost + serviceBoost + seasonBoost + monthBoost + bizBoost + wkndBoost + specialBoost + timeBoost;
            developmentIncome += base * (1 + totalBoost) * prestigeMult * this.getDevelopmentBusyMultiplier();
        });
        return developmentIncome;
    }

        calculateCityIncome(city, coordinates = null) {
        coordinates = coordinates ?? this.coordinates;
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
            totalBoost += this.getLocalCountryBoost();
        }

        if (city.isSouthern && this.hasUpgrade('southernHemisphereBoost')) {
            totalBoost += this.getUpgradeSum('southernHemisphereBoost');
        }

        totalBoost += this.getSoleCityInCountryBoost(city);

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

        income *= (1 + totalBoost) * this.getPrestigeCityMultiplier() * this.getCityLineMultiplier(city);

        return income;
    }

    calculatePopulationIncome(coordinates = null) {
        return this.progressionManager.purchasedCities
            .reduce((sum, city) => sum + this.calculateCityEarning(city, coordinates), 0);
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
        return Math.floor(baseCost * (1 - discount) + 1e-6);   // tolerance: no £1 lost to decimal rounding
    }

    // What removing a built development costs and pays back. Amicable Breakups: no Reputation, and half of what the
    // development costs to build now comes back as a refund (the same deal as disconnecting a city).
    getDevelopmentRemoval(development) {
        const amicable = PrestigeManager.owns('amicableBreakups');
        return {
            amicable,
            repCost: amicable ? 0 : DEV_REMOVE_REP_COST,
            refund: amicable ? Math.floor(this.calculateDiscountedBuildCost(development.cost) / 2) : 0,
        };
    }

    calculateDiscountedUpgradeCost(baseCost) {
        const discount = this.getUpgradeSum('developmentUpgradeDiscount');
        return Math.floor(baseCost * (1 - discount) + 1e-6);   // tolerance: no £1 lost to decimal rounding
    }

    roundWorkValue(value) {
        if (value < 1000) return Math.round(value / 10) * 10;
        return Math.round(value / 100) * 100;
    }

    // 1 + 45% per Work upgrade + Anniversary Sales, then Speedy Conveyor Belts multiplies the lot.
    getWorkMultiplier(upgradeCount) {
        let m = 1 + (upgradeCount * 0.45);
        // Anniversary Sales: +5% per unique achievement (additive)
        if (this.hasUpgrade('workPerAchievement')) m += this.getUpgradeSum('workPerAchievement') * this.getUniqueAchievementCount();
        if (PrestigeManager.owns('speedyConveyorBelts')) m *= PV.speedyConveyorBelts;
        return m;
    }

    // BASE income per second (no boosts, events, Founders' Hall or Prestige perks): what a Work click is measured
    // against. Cached for a quarter of a second, since every click asks for it.
    getBasePassivePerSecond() {
        const now = Date.now();
        if (this._passiveCache && now - this._passiveCache.at < 250) return this._passiveCache.value;
        const cities = this.progressionManager.purchasedCities
            .filter(c => this.isCityEarning(c))
            .reduce((sum, c) => sum + (TIER_INCOME[c.tier] || 0) + c.population * POPULATION_INCOME_MODIFIER, 0);
        const developments = this.progressionManager.purchasedDevelopments
            .reduce((sum, d) => sum + this.getEffectiveDevRevenue(d), 0);
        const value = (cities + developments) / SECONDS_IN_A_DAY;
        this._passiveCache = { at: now, value };
        return value;
    }

    calculateWorkClickEarnings() {
        const count = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'workClickBonus').length;
        const multiplier = this.getWorkMultiplier(count);
        const average = this.getBasePassivePerSecond() * WORK_SECONDS_OF_INCOME;
        const roll = (Math.random() + Math.random()) / 2;
        let total = Math.max(WORK_MIN_CLICK, average * (WORK_ROLL_MIN + roll * WORK_ROLL_SPREAD)) * multiplier;
        if (this.activeEvent?.effectType === 'workBoost' || this.activeEvent?.effectType === 'workPenalty') {
            total *= this.activeEvent.effect.multiplier;
        }
        return this.roundWorkValue(total);
    }

    calculateWorkClickRange() {
        const count = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'workClickBonus').length;
        const multiplier = this.getWorkMultiplier(count);
        const average = this.getBasePassivePerSecond() * WORK_SECONDS_OF_INCOME;
        let low = Math.max(WORK_MIN_CLICK, average * WORK_ROLL_MIN) * multiplier;
        let high = Math.max(WORK_MIN_CLICK, average * (WORK_ROLL_MIN + WORK_ROLL_SPREAD)) * multiplier;
        if (this.activeEvent?.effectType === 'workBoost' || this.activeEvent?.effectType === 'workPenalty') {
            low *= this.activeEvent.effect.multiplier;
            high *= this.activeEvent.effect.multiplier;
        }
        return { low: this.roundWorkValue(low), high: this.roundWorkValue(high) };
    }

    calculateOfflineCap() {
        if (PrestigeManager.owns('automatedScheduling')) return Infinity;
        const extensions = this.progressionManager.purchasedUpgrades
            .filter(u => u.effectType === 'offlineCapExtension').length;
        return 172800 + (extensions * 86400);
    }

        calculateDelayCompensation(baseCompensation) {
        const reduction = this.getUpgradeSum('delayCompensationReduction');
        // Clamp both ends: reduction is capped at 100% so compensation can never go
        // negative (paying the player instead of costing them), and the result can
        // never go below 0 even if baseCompensation itself is somehow 0 or negative.
        return Math.max(0, Math.floor(baseCompensation * (1 - Math.min(reduction, 1))));
    }

    calculateDelayRepCost(baseRepCost) {
        const reduction = this.getUpgradeSum('delayRepCostReduction');
        return Math.max(0, baseRepCost - reduction);
    }

    getWorkRepChance() {
        let chance = 0.005;
        if (this.hasUpgrade('workRepChanceDouble')) chance *= 2;
        if (this.hasUpgrade('workRepChanceTriple')) chance *= 3;
        return chance;
    }

    getRerollRepCost(baseCost) {
        const discount = this.getUpgradeSum('rerollRepDiscount');
        return Math.max(0, baseCost - discount);
    }

    getFarewellRepGain(baseRep = 5, isVip = false) {
        // The doubling upgrade and Oral Hygiene multiply each other.
        let factor = 1;
        if (this.hasUpgrade('farewellRepDoubled')) factor *= 2;
        if (PrestigeManager.owns('oralHygiene')) factor *= PV.oralHygiene;
        // A VIP farewell is worth more, on top of everything else.
        return baseRep * factor * (isVip ? VIP_REP_MULTIPLIER : 1);
    }

    // The chance that a departure's passenger is a VIP, rolled when its farewell window opens.
    getVipChance() {
        return Math.min(1, VIP_BASE_CHANCE * (PrestigeManager.owns('vipPods') ? 10 : 1));
    }

    getFarewellCityIncomeBonus(city) {
        if (!this.hasUpgrade('personalImageBranding')) return 0;
        const dailyIncome = this.calculateCityIncome(city);
        return Math.floor(dailyIncome * 0.1);
    }

    // How many cities a rank-up offers to choose from: 3, and Skilled Negotiation Teams adds its effect value (+2).
    getCityChoiceCount() {
        return 3 + this.getUpgradeSum('skilledNegotiationTeams');
    }

    getFoundersHallMultiplier(createdAt = this.createdAt) {
        if (!this.hasUpgradeByName("Founders' Hall") || !Number.isFinite(createdAt) || createdAt <= 0) return 1.0;
        // Never below 0: a save created while the computer's clock was ahead must not turn the bonus into a penalty (bug #179)
        const daysActive = Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));
        const stepPct = PrestigeManager.owns('foundersHallExpansion') ? 0.02 : 0.01;
        const boostPct = Math.floor(daysActive / 10) * stepPct;
        return 1 + boostPct;
    }

    // For figures shown on screen: the per-city and per-development income, with the Founders' Hall bonus
    // that the total passive income already includes.
    withFoundersHall(amount) {
        return Math.floor(amount * this.getFoundersHallMultiplier());
    }

    foundersHallLine() {
        const m = this.getFoundersHallMultiplier();
        return m > 1 ? `Founders' Hall: ×${+m.toFixed(2)}` : null;
    }

    getDailyRepBonus(rank) {
        if (!this.hasUpgrade('dailyRepPerRank')) return 0;
        return Math.floor(rank / 5);
    }
}
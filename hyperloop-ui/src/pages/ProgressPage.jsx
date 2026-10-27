import React, { useState, useEffect, useRef } from 'react'
import { allCities } from '../../../CityManager/CityRegistry'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry'
import { allUpgrades } from '../../../UpgradeManager/UpgradeRegistry.js'
import cityThumbnails from '../data/cityThumbnails.js'
import cityImages from '../data/cityImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import developmentImages from '../data/developmentImages.js'
import countryFlags from '../data/countryFlags.js'
import cashIcon from '../assets/misc/cash.png'
import { playHoverSound, playClickSound2, playFarewellAcceptSound, playReputationWorkBonusSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { PRESTIGE_VALUES, PRESTIGE_UPGRADES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { INCOME_SCALE } from 'Managers/EconomyManager/incomeScale.js'
import PageIntroModal from '../components/PageIntroModal.jsx'
import giftIcon from '../assets/misc/gift.png'
import growthIcon from '../assets/misc/growth.png'
import starIcon from '../assets/misc/star.png'
import './ProgressPage.css'

// Same thumbnail artwork and name-matching PrestigePage.jsx uses ("Cult of Celebrity" -> CultOfCelebrity.jpg),
// so a Prestige upgrade's card here shows the real thumbnail rather than just its emoji.
const PRESTIGE_IMAGES = import.meta.glob('../assets/prestige-upgrades-thumb/*.jpg', { eager: true, import: 'default' })
const PRESTIGE_IMAGES_BY_NAME = Object.fromEntries(Object.entries(PRESTIGE_IMAGES).map(([path, src]) => [path.split('/').pop().replace('.jpg', '').toLowerCase(), src]))
const prestigeImageFor = u => PRESTIGE_IMAGES_BY_NAME[u.name.replace(/[^A-Za-z0-9]/g, '').toLowerCase()]
import { flagSrc } from '../utils/flagSrc.js'
import { distanceMiles } from '../utils/loops.js'
import { formatDistance } from '../utils/units.js'

const CashValue = ({ amount, suffix = '' }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />
        {amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}{suffix}
    </span>
)

function ProgressPage({ purchasedCities, unlockedCities, economyManager, purchasedDevelopments, purchasedUpgrades, unlockedDevelopments, unlockedUpgrades, farewellsGiven, achievementManager, createdAt, onCollectReward, onRefreshCounts, topOffset = 113 }) {
    // Shown once, the first time a player opens this page - skipped entirely once they've retired, since by
    // then they already know how claiming and the stat sections work.
    const [showIntro, setShowIntro] = useState(() =>
        PrestigeManager.getHistory().length === 0 && localStorage.getItem('hyperloop_progress_intro_seen') !== 'true'
    )
    const closeIntro = () => { localStorage.setItem('hyperloop_progress_intro_seen', 'true'); setShowIntro(false) }
    const [, setTick] = useState(0)
    // The game only tallies finished departures/arrivals/passengers every 10 seconds, so while this page is open
    // it asks for a fresh tally on opening and every second, to keep those totals from lagging behind.
    const refreshCounts = useRef(onRefreshCounts)
    refreshCounts.current = onRefreshCounts
    useEffect(() => {
        refreshCounts.current?.()
        setTick(t => t + 1)
        const interval = setInterval(() => { refreshCounts.current?.(); setTick(t => t + 1) }, 1000)
        return () => clearInterval(interval)
    }, [])

    // The General Stats and Active Bonuses sections can be folded away; the choice is remembered
    const [collapsed, setCollapsed] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('hyperloop_progress_collapsed'))
            return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
        } catch { return {} }
    })
    const toggleSection = (key) => {
        playClickSound2()
        setCollapsed(prev => {
            const next = { ...prev, [key]: !prev[key] }
            try { localStorage.setItem('hyperloop_progress_collapsed', JSON.stringify(next)) } catch { /* storage full */ }
            return next
        })
    }
    // A full-width bar that reads as a button: round chevron badge, title, optional count, and a Show/Hide label
    const sectionHeader = (id, title, style, extra) => (
        <h2
            className={`progress-section-header progress-section-toggle${collapsed[id] ? ' progress-section-closed' : ''}`}
            key={id}
            style={style}
            role="button"
            tabIndex={0}
            aria-expanded={!collapsed[id]}
            title={collapsed[id] ? 'Click to show' : 'Click to hide'}
            onClick={() => toggleSection(id)}
            onMouseEnter={() => playHoverSound()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(id) } }}
        >
            <span className="progress-chevron" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16"><path d="M3.5 6 L8 10.5 L12.5 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="progress-section-title">{title}</span>
            {extra}
            {collapsed[id] && claimable?.[id] > 0 && (
                <span className="progress-claim-badge">{claimable[id]} to claim</span>
            )}
            <span className="progress-toggle-hint">{collapsed[id] ? 'Show' : 'Hide'}</span>
        </h2>
    )

    const terminalAge = () => {
        const totalSeconds = Math.floor((Date.now() - createdAt) / 1000)
        const weeks = Math.floor(totalSeconds / 604800)
        const days = Math.floor((totalSeconds % 604800) / 86400)
        const h = Math.floor((totalSeconds % 86400) / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const parts = []
        if (weeks > 0) parts.push(`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`)
        if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
        if (h > 0 && weeks === 0) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`)
        if (m > 0 && weeks === 0 && days === 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
        return parts.join(' ') || 'Just started'
    }

    const playtimeText = (totalSeconds) => {
        const days = Math.floor(totalSeconds / 86400)
        const h = Math.floor((totalSeconds % 86400) / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const parts = []
        if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
        if (h > 0) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`)
        if (m > 0 && days === 0) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
        return parts.join(' ') || 'Under a minute'
    }

    const formatPopulation = (pop) => {
        if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
        if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
        return pop.toLocaleString('en-GB', { maximumFractionDigits: 0 })
    }

    const [claimed, setClaimed] = useState(() => new Set(
        JSON.parse(localStorage.getItem('hyperloop_progress_rewards') || '[]')
    ))
    const claimedRef = React.useRef(new Set(
        JSON.parse(localStorage.getItem('hyperloop_progress_rewards') || '[]')
    ))
    // Prestige-upgrade claims live in their own key, kept through a prestige rather than reset by one (see
    // SaveManager's PRESTIGE_KEEP_KEYS) - the upgrades themselves never go away, so neither should the claim.
    const [claimedPrestige, setClaimedPrestige] = useState(() => new Set(
        JSON.parse(localStorage.getItem('hyperloop_prestige_upgrade_rewards') || '[]')
    ))
    const claimedPrestigeRef = React.useRef(new Set(
        JSON.parse(localStorage.getItem('hyperloop_prestige_upgrade_rewards') || '[]')
    ))
    const [prestige] = useState(() => new PrestigeManager())
    const [floats, setFloats] = useState([])
    const [fading, setFading] = useState(new Set())

    // Halved again from 1250/2500/5000/12500/25000 (themselves already halved once, see git history) now that
    // Developments and Prestige upgrades have their own claimable cards alongside Cities and Countries: the
    // claimable pool grew by roughly half, so the per-card payout comes back down to keep the total take roughly
    // where it was. Same odds, same shape. Rep tiers rounded to clean numbers rather than left fractional.
    const getRandomReward = () => {
        const roll = Math.random() * 100
        if (roll < 25) return { type: 'cash', amount: 625 * INCOME_SCALE }
        if (roll < 47) return { type: 'cash', amount: 1250 * INCOME_SCALE }
        if (roll < 65) return { type: 'cash', amount: 2500 * INCOME_SCALE }
        if (roll < 75) return { type: 'cash', amount: 6250 * INCOME_SCALE }
        if (roll < 80) return { type: 'cash', amount: 12500 * INCOME_SCALE }
        if (roll < 92) return { type: 'rep', amount: 3 }
        if (roll < 98) return { type: 'rep', amount: 5 }
        return { type: 'rep', amount: 10 }
    }
    // Shared by every claimable grid (Cities, Countries, Developments, Prestige upgrades) - only the Set/ref/
    // setState/localStorage key backing "claimed" differs, so that trio is passed in rather than duplicated.
    const makeClaimHandler = (claimedSetRef, setClaimedState, storageKey) => (e, key) => {
        if (claimedSetRef.current.has(key)) return
        claimedSetRef.current.add(key)
        // Save the claim at the same moment the reward is paid, so leaving the page or reloading
        // during the fade-out can't make the card claimable again (bug #59).
        localStorage.setItem(storageKey, JSON.stringify([...claimedSetRef.current]))
        const hasBoost = (purchasedUpgrades || []).some(u => u.effectType === 'progressRewardBoost')
        const reward = getRandomReward()
        // The boost upgrade (x2) and Viral Superstar multiply each other
        const rewardFactor = (hasBoost ? 2 : 1) * (PrestigeManager.owns('viralSuperstar') ? PRESTIGE_VALUES.viralSuperstar : 1)
        reward.amount *= rewardFactor
        const rect = e.currentTarget.getBoundingClientRect()
        const id = Date.now() + Math.random()
        setFloats(prev => [...prev, { id, reward, x: rect.left + rect.width / 2, y: rect.top }])
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
        setFading(prev => new Set([...prev, key]))
        if (reward.type === 'rep') playReputationWorkBonusSound()
        else playFarewellAcceptSound()
        onCollectReward(reward)
        setTimeout(() => {
            setClaimedState(prev => new Set([...prev, key]))
            setFading(prev => { const s = new Set(prev); s.delete(key); return s; })
        }, 500)
    }
    const handleCardClick = makeClaimHandler(claimedRef, setClaimed, 'hyperloop_progress_rewards')
    const handlePrestigeCardClick = makeClaimHandler(claimedPrestigeRef, setClaimedPrestige, 'hyperloop_prestige_upgrade_rewards')

    const antarcticaUnlocked = purchasedCities.some(p => p.continent === 'Antarctica')
    const visibleCities = allCities.filter(c => c.continent !== 'Antarctica' || antarcticaUnlocked)
    // The collection totals count the Antarctic Peninsula and Antarctica from the start (350 cities, 155 countries
    // reads better than 349/154) even though the city itself stays out of the grid - and out of the normal unlock
    // pool - until it's earned the usual way, as the secret finale after every other city is claimed.
    const totalCitiesCount = allCities.length
    const totalCountriesCount = new Set(allCities.map(c => c.country)).size
    const purchasedNames = new Set(purchasedCities.map(c => c.name))
    const unlockedNames = new Set((unlockedCities || []).map(c => c.name))
    const sortedCities = [...visibleCities].sort((a, b) => a.name.localeCompare(b.name))

    const getCityState = (city) => {
        if (purchasedNames.has(city.name)) return 'connected'
        if (unlockedNames.has(city.name)) return 'unlocked'
        return 'unknown'
    }

    const sortedCountries = [...new Set(visibleCities.map(c => c.country))].sort()
    const purchasedCountries = new Set(purchasedCities.map(c => c.country))
    const unlockedCountriesSet = new Set((unlockedCities || []).map(c => c.country))

    const getCountryState = (country) => {
        if (purchasedCountries.has(country)) return 'connected'
        if (unlockedCountriesSet.has(country)) return 'unlocked'
        return 'unknown'
    }

    // allUpgrades (Bank, Experimental Technology, Advertising Campaigns, seasonal deals, and ~160 more) are bought
    // the same way as any other development - DevelopmentPage.jsx itself treats allDevelopments and allUpgrades as
    // one combined shop ("allItems"), and matches a purchase by name rather than by instance even for Upgrades
    // (`purchasedUpgrades.some(p => p.name === item.name)`) - the Upgrade/Development split is purely an internal
    // code distinction, so every item here is matched by name, same as cities/countries, and every one of them
    // belongs in this collectible pool, not just Experimental Technology on its own.
    const collectibleDevelopments = [...allDevelopments, ...allUpgrades]
    const purchasedDevNames = new Set([...(purchasedDevelopments || []), ...(purchasedUpgrades || [])].map(d => d.name))
    const unlockedDevNames = new Set([...(unlockedDevelopments || []), ...(unlockedUpgrades || [])].map(d => d.name))

    const getDevelopmentState = (dev) => {
        if (purchasedDevNames.has(dev.name)) return 'connected'
        if (unlockedDevNames.has(dev.name)) return 'unlocked'
        return 'unknown'
    }
    const ownedDevelopmentsCount = collectibleDevelopments.filter(d => getDevelopmentState(d) === 'connected').length

    // Prestige upgrades are layer-locked rather than unlock/connect, but the same three-tier look applies: owned,
    // buyable now, still locked. They're still developments - a special kind that, unlike the rest, is never reset
    // by a prestige - so they belong in the same "Developments collected" grid/total/progress-bar rather than a
    // section of their own; only their claim (via claimedPrestige/hyperloop_prestige_upgrade_rewards, see
    // makeClaimHandler above) stays permanently separate from the others', since the upgrade itself never resets.
    // prestige.layerUnlocked(1) is always true by itself (it only checks the PREVIOUS layer is complete), which is
    // right for the Prestige page's own tree - Layer 1 has no previous layer to require. But the Prestige page
    // wraps that whole tree in its own lock until the player has retired at least once (PrestigeManager.getHistory()
    // .length === 0 shows its "PRESTIGE UPGRADES LOCKED" overlay), and this page must respect that same gate -
    // otherwise Layer 1 upgrades show up named here before the player has ever unlocked the Prestige page at all.
    const prestigeTreeUnlocked = PrestigeManager.getHistory().length > 0
    const getPrestigeUpgradeState = (upgrade) => {
        if (PrestigeManager.owns(upgrade.id)) return 'connected'
        if (prestigeTreeUnlocked && prestige.layerUnlocked(upgrade.layer)) return 'unlocked'
        return 'unknown'
    }
    const ownedPrestigeUpgradesCount = PRESTIGE_UPGRADES.filter(u => PrestigeManager.owns(u.id)).length

    const totalDevelopmentsCount = collectibleDevelopments.length + PRESTIGE_UPGRADES.length
    const combinedOwnedDevelopmentsCount = ownedDevelopmentsCount + ownedPrestigeUpgradesCount
    const sortedDevelopments = [
        ...collectibleDevelopments.map(item => ({ isPrestige: false, item })),
        ...PRESTIGE_UPGRADES.map(item => ({ isPrestige: true, item })),
    ].sort((a, b) => a.item.name.localeCompare(b.item.name))

    // Rewards still waiting on each grid, shown on its header while it's folded away so they aren't missed
    const claimable = {
        countries: [...purchasedCountries].filter(c => sortedCountries.includes(c) && !claimed.has('country:' + c)).length,
        cities: purchasedCities.filter(c => visibleCities.some(v => v.name === c.name) && !claimed.has('city:' + c.name)).length,
        developments: collectibleDevelopments.filter(d => getDevelopmentState(d) === 'connected' && !claimed.has('dev:' + d.name)).length
            + PRESTIGE_UPGRADES.filter(u => PrestigeManager.owns(u.id) && !claimedPrestige.has('prestige:' + u.id)).length,
    }

    // Worked out on every render (the page re-renders each second). These lists are added to in place, so a memo
    // keyed on them never noticed a new city or development, and boosts that follow the clock froze too (bug #157).
    const cityIncomes = new Map(purchasedCities.map(c => [c, economyManager.calculateCityIncome(c)]))
    const totalPopulation = purchasedCities.reduce((sum, c) => sum + c.population, 0)
    const totalRevenue = (() => {
        // What the cities earn at the moment: only the ones on the timetable (and the home city) count, so this
        // dips when a loop is taken off and rises when one is added
        const cityIncome = purchasedCities.reduce((sum, c) => sum + economyManager.calculateCityEarning(c), 0)
        const devIncome = (purchasedDevelopments || []).reduce((sum, d) => sum + economyManager.getEffectiveDevIncomeWithBoosts(d), 0)
        return economyManager.withFoundersHall(cityIncome + devIncome)
    })()
    const mostProfitableCity = purchasedCities.length
        ? purchasedCities.reduce((best, c) => cityIncomes.get(c) > cityIncomes.get(best) ? c : best) : null
    const leastProfitableCity = purchasedCities.length
        ? purchasedCities.reduce((worst, c) => cityIncomes.get(c) < cityIncomes.get(worst) ? c : worst) : null

    const revenueDevs = (purchasedDevelopments || []).filter(d => d.revenue > 0)
    const mostProfitableDev = revenueDevs.length ? revenueDevs.reduce((best, d) => economyManager.getEffectiveDevIncomeWithBoosts(d) > economyManager.getEffectiveDevIncomeWithBoosts(best) ? d : best) : null
    const leastProfitableDev = revenueDevs.length ? revenueDevs.reduce((worst, d) => economyManager.getEffectiveDevIncomeWithBoosts(d) < economyManager.getEffectiveDevIncomeWithBoosts(worst) ? d : worst) : null

    // The furthest and nearest connected cities from the home city, by real distance
    const home = purchasedCities[0]
    const routes = home ? purchasedCities.slice(1).map(c => ({ city: c, miles: distanceMiles(home.name, c.name) })).filter(r => r.miles !== null) : []
    const longestRoute = routes.length ? routes.reduce((a, b) => b.miles > a.miles ? b : a) : null
    const shortestRoute = routes.length ? routes.reduce((a, b) => b.miles < a.miles ? b : a) : null
    const routeValue = r => r ? <span><span style={{ display: 'block' }}>{home.name} → {r.city.name}</span>{formatDistance(r.miles)}</span> : '—'
    const highestRank = Math.max(economyManager.progressionManager.rankManager?.rank || 1, achievementManager?.counter('highestRank') ?? 0)

    const likedCount = (() => {
        try { return (JSON.parse(localStorage.getItem('hyperloop_hyperlink_liked')) || []).length } catch { return 0 }
    })()

    const generalStats = [
        { label: 'Terminal age', value: terminalAge() },
        { label: 'Total population served', value: formatPopulation(totalPopulation) },
        { label: 'Income per day (at current rate)', value: <><CashValue amount={totalRevenue} suffix="/day" /></> },
        { label: 'Total cash earned', value: <CashValue amount={economyManager.progressionManager.totalCashEarned || 0} /> },
        { label: 'Farewells given', value: farewellsGiven ?? 0 },
        { label: 'Greets given', value: economyManager.progressionManager.greetingsGiven ?? 0 },
        { label: 'VIPs welcomed', value: (achievementManager?.counter('vips') ?? 0).toLocaleString('en-GB') },
        { label: 'Delays compensated', value: (achievementManager?.counter('delaysCompensated') ?? 0).toLocaleString('en-GB') },
        // Every departure and arrival that has happened, including the ones while you were away. Kept through a prestige.
        { label: 'Total number of departures', value: (achievementManager?.counter('departures') ?? 0).toLocaleString('en-GB') },
        { label: 'Total number of arrivals', value: (achievementManager?.counter('arrivals') ?? 0).toLocaleString('en-GB') },
        { label: 'Total passenger count', value: (achievementManager?.counter('passengers') ?? 0).toLocaleString('en-GB') },
        { label: 'Total distance travelled', value: formatDistance(achievementManager?.counter('miles') ?? 0) },
        // Time the game has been open across every run (Terminal age is this run only)
        { label: 'Total playtime', value: playtimeText(achievementManager?.counter('playtime') ?? 0) },
        // Straight from the connected cities, so a disconnect shows at once
        { label: 'Unique cities connected', value: new Set(purchasedCities.map(c => c.name)).size },
        { label: 'Unique countries connected', value: new Set(purchasedCities.map(c => c.country)).size },
        { label: 'Unique continents connected', value: new Set(purchasedCities.map(c => c.continent)).size },
        { label: 'Hyper-Link posts liked', value: likedCount },
        { label: 'Cities and developments upgraded', value: (achievementManager?.counter('devUpgrades') ?? 0) + (achievementManager?.counter('cityUpgrades') ?? 0) },
        { label: 'Retirement count', value: PrestigeManager.getHistory().length },
        { label: 'Highest rank reached', value: highestRank },
        { label: 'Work button clicks', value: (achievementManager?.counter('work') ?? 0).toLocaleString('en-GB') },
        { label: 'Daily bonuses collected', value: achievementManager?.counter('dailyBonus') ?? 0 },
        { label: 'Most profitable city', value: mostProfitableCity ? <span><span style={{ display: 'block' }}>{mostProfitableCity.name}</span><CashValue amount={economyManager.withFoundersHall(economyManager.calculateCityIncome(mostProfitableCity))} suffix="/day" /></span> : '—' },
        { label: 'Least profitable city', value: leastProfitableCity ? <span><span style={{ display: 'block' }}>{leastProfitableCity.name}</span><CashValue amount={economyManager.withFoundersHall(economyManager.calculateCityIncome(leastProfitableCity))} suffix="/day" /></span> : '—' },
        { label: 'Most profitable development', value: mostProfitableDev ? <span><span style={{ display: 'block' }}>{economyManager.progressionManager.getDevelopmentName(mostProfitableDev)}</span><CashValue amount={economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(mostProfitableDev))} suffix="/day" /></span> : '—' },
        { label: 'Least profitable development', value: leastProfitableDev ? <span><span style={{ display: 'block' }}>{economyManager.progressionManager.getDevelopmentName(leastProfitableDev)}</span><CashValue amount={economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(leastProfitableDev))} suffix="/day" /></span> : '—' },
        { label: 'Longest route', value: routeValue(longestRoute) },
        { label: 'Shortest route', value: routeValue(shortestRoute) },
    ]

    const getUpgradeStats = () => {
        const upgrades = purchasedUpgrades || []
        const sum = (type) => upgrades.filter(u => u.effectType === type).reduce((acc, u) => acc + u.effectValue, 0)
        const count = (type) => upgrades.filter(u => u.effectType === type).length
        const has = (type) => upgrades.some(u => u.effectType === type)

        const seasonUpgrade = economyManager.getCurrentSeasonUpgrade()
        const monthUpgrade = economyManager.getCurrentMonthUpgrade()
        const hour = new Date().getHours()
        const isBusinessWeek = economyManager.isBusinessWeek()
        const isWeekend = economyManager.isWeekend()

        const uniqueContinents = new Set(purchasedCities.map(c => c.continent)).size
        const uniqueCountries = new Set(purchasedCities.map(c => c.country)).size

        const infraCount = (purchasedDevelopments || []).filter(d => d.category === 'Infrastructure').length
            + upgrades.filter(u => u.category === 'Infrastructure').length
        const enterpriseCount = (purchasedDevelopments || []).filter(d => d.category === 'Enterprise').length
            + upgrades.filter(u => u.category === 'Enterprise').length
        const serviceCount = (purchasedDevelopments || []).filter(d => d.category === 'Service').length
            + upgrades.filter(u => u.category === 'Service').length

        const stats = [
            { label: 'Connection Earnings Bonus', value: sum('connectionBoost') > 0 ? `+${Math.round(sum('connectionBoost') * 100)}%` : '—' },
            { label: 'Food Category Bonus', value: sum('foodIncome') > 0 ? `+${Math.round(sum('foodIncome') * 100)}%` : '—' },
            { label: 'Recreation Category Bonus', value: sum('recreationIncome') > 0 ? `+${Math.round(sum('recreationIncome') * 100)}%` : '—' },
            { label: 'Shopping Category Bonus', value: sum('shoppingIncome') > 0 ? `+${Math.round(sum('shoppingIncome') * 100)}%` : '—' },
            { label: 'Service Category Bonus', value: sum('serviceIncome') > 0 ? `+${Math.round(sum('serviceIncome') * 100)}%` : '—' },
            { label: 'All Developments Bonus', value: sum('developmentBoost') > 0 ? `+${Math.round(sum('developmentBoost') * 100)}%` : '—' },
            { label: 'Dev Continent Connections', value: sum('devContinentBoost') > 0 ? `+${Math.round(sum('devContinentBoost') * uniqueContinents * 100)}% (${uniqueContinents} continents)` : '—' },
            { label: 'Infrastructure Count Boost', value: sum('infrastructureDevBoost') > 0 ? `+${Math.round(sum('infrastructureDevBoost') * infraCount * 100)}% (${infraCount} items)` : '—' },
            { label: 'Enterprise Count Boost', value: sum('enterpriseDevBoost') > 0 ? `+${Math.round(sum('enterpriseDevBoost') * enterpriseCount * 100)}% (${enterpriseCount} items)` : '—' },
            { label: 'Service Count Boost', value: sum('serviceDevBoost') > 0 ? `+${Math.round(sum('serviceDevBoost') * serviceCount * 100)}% (${serviceCount} items)` : '—' },
            { label: 'Continent Expansion Bonus', value: sum('continentExpansionBoost') > 0 ? `+${Math.round(sum('continentExpansionBoost') * uniqueContinents * 100)}% (${uniqueContinents} continents)` : '—' },
            { label: 'Country Expansion Bonus', value: sum('countryExpansionBoost') > 0 ? `+${(sum('countryExpansionBoost') * uniqueCountries * 100).toFixed(1)}% (${uniqueCountries} countries)` : '—' },
            { label: 'Local Country Bonus', value: economyManager.getLocalCountryBoost() > 0 ? `+${Math.round(economyManager.getLocalCountryBoost() * 100)}%` : '—' },
            { label: 'Small City Bonus', value: sum('smallCityBoost') > 0 ? `+${Math.round(sum('smallCityBoost') * 100)}%` : '—' },
            { label: 'Arctic City Bonus', value: sum('arcticBoost') > 0 ? `+${Math.round(sum('arcticBoost') * 100)}%` : '—' },
            { label: 'Equator City Bonus', value: sum('equatorBoost') > 0 ? `+${Math.round(sum('equatorBoost') * 100)}%` : '—' },
            { label: 'Southern Hemisphere Bonus', value: sum('southernHemisphereBoost') > 0 ? `+${Math.round(sum('southernHemisphereBoost') * 100)}%` : '—' },
            { label: 'Terminal Age Bonus', value: has('terminalAgeBoost') ? `×${+economyManager.getFoundersHallMultiplier(createdAt).toFixed(2)} on top of all boosts (grows over time)` : '—' },
            { label: 'Current Season Boost', value: seasonUpgrade ? `+${Math.round(seasonUpgrade.effectValue * 100)}% (${seasonUpgrade.name})` : '—' },
            { label: 'Current Month Boost', value: monthUpgrade ? `+${Math.round(monthUpgrade.effectValue * 100)}% (${monthUpgrade.name})` : '—' },
            { label: 'Business Week Bonus', value: sum('businessWeekBoost') > 0 ? `+${Math.round(sum('businessWeekBoost') * 100)}%${isBusinessWeek ? ' ✓ active' : ''}` : '—' },
            { label: 'Weekend Bonus', value: sum('weekendBoost') > 0 ? `+${Math.round(sum('weekendBoost') * 100)}%${isWeekend ? ' ✓ active' : ''}` : '—' },
            ...(has('morningBoost') ? [{ label: 'Morning Bonus', value: `+${Math.round(economyManager.getUpgradeSum('morningBoost') * 100)}%${hour >= 6 && hour < 12 ? ' (Active)' : ' (Inactive)'}` }] : []),
            ...(has('afternoonBoost') ? [{ label: 'Afternoon Bonus', value: `+${Math.round(economyManager.getUpgradeSum('afternoonBoost') * 100)}%${hour >= 12 && hour < 18 ? ' (Active)' : ' (Inactive)'}` }] : []),
            ...(has('eveningBoost') ? [{ label: 'Evening Bonus', value: `+${Math.round(economyManager.getUpgradeSum('eveningBoost') * 100)}%${hour >= 18 && hour < 22 ? ' (Active)' : ' (Inactive)'}` }] : []),
            ...(has('nightBoost') ? [{ label: 'Night Bonus', value: `+${Math.round(economyManager.getUpgradeSum('nightBoost') * 100)}%${(hour >= 22 || hour < 6) ? ' (Active)' : ' (Inactive)'}` }] : []),
            { label: 'Work Click Bonus', value: (count('workClickBonus') > 0 || PrestigeManager.owns('speedyConveyorBelts') || economyManager.hasUpgrade('workPerAchievement')) ? `×${economyManager.getWorkMultiplier(count('workClickBonus')).toFixed(2)} to click earnings` : '—' },
            { label: 'Farewell Window', value: count('farewellWindowExtension') > 0 ? `${5 + count('farewellWindowExtension') * 5} minutes` : '—' },
            { label: 'Farewell Rep Bonus', value: (has('farewellRepDoubled') || PrestigeManager.owns('oralHygiene')) ? `×${economyManager.getFarewellRepGain(1)} per farewell` : '—' },
            {
                label: 'Offline Earnings Cap', value: PrestigeManager.owns('automatedScheduling') ? 'No cap' : count('offlineCapExtension') === 0 ? '—' : (() => {
                    const hours = 48 + count('offlineCapExtension') * 24
                    if (hours >= 168) return '1 week'
                    return `${Math.round(hours / 24)} days`
                })()
            },
            { label: 'Dev Build Discount', value: sum('developmentDiscount') > 0 ? `-${Math.round(sum('developmentDiscount') * 100)}%` : '—' },
            { label: 'Dev Upgrade Discount', value: sum('developmentUpgradeDiscount') > 0 ? `-${Math.round(sum('developmentUpgradeDiscount') * 100)}%` : '—' },
            { label: 'Negative Event Reduction', value: sum('negativeEventReduction') > 0 ? `${Math.round(sum('negativeEventReduction') * 100)}% chance to skip` : '—' },
            { label: 'Event Duration Extension', value: sum('bonusDurationExtension') > 0 ? `+${Math.round(sum('bonusDurationExtension') * 100)}% longer` : '—' },
            { label: 'Delay Compensation Cut', value: sum('delayCompensationReduction') > 0 ? `-${Math.round(sum('delayCompensationReduction') * 100)}%` : '—' },
            { label: 'Delay Rep Cost Reduction', value: sum('delayRepCostReduction') > 0 ? `-${sum('delayRepCostReduction')} rep` : '—' },
            { label: 'City Reroll Discount', value: sum('rerollRepDiscount') > 0 ? `-${sum('rerollRepDiscount')} rep` : '—' },
            { label: 'Daily Login Rep Bonus', value: sum('dailyLoginRep') > 0 ? `+${sum('dailyLoginRep')} rep/day` : '—' },
            { label: 'Free Reroll on Rank Up', value: has('freeRerollOnRankUp') ? 'Active' : '—' },
            { label: 'Free Rep on Rank Up', value: sum('freeRepOnRankUp') > 0 ? `+${sum('freeRepOnRankUp')} rep` : '—' },
            { label: 'Positive Event Preference', value: has('positiveEventBoost') ? 'Active' : '—' },
            { label: 'Extra City Choices on Rank Up', value: sum('skilledNegotiationTeams') > 0 ? `+${sum('skilledNegotiationTeams')} choices` : '—' },
            {
                label: 'Special Day Bonus', value: (() => {
                    const days = { christmasBoost: 'Christmas Day', valentinesBoost: "Valentine's Day", halloweenBoost: 'Halloween', fourthOfJulyBoost: '4th of July', easterBoost: 'Easter Sunday', newYearsBoost: "New Year's Day" }
                    const owned = Object.keys(days).filter(k => has(k)).map(k => days[k])
                    if (owned.length === 0) return '—'
                    return `+100% on ${owned.join(', ')}${economyManager.getSpecialDayBonus() > 0 ? ' ✓ active' : ''}`
                })()
            },
            {
                label: 'Continent Travel Packages', value: (() => {
                    const owned = upgrades.filter(u => u.effectType === 'continentBoost')
                    return owned.length ? owned.map(u => `${u.name.replace(' Travel Packages', '')} +${Math.round(u.effectValue * 100)}%`).join(', ') : '—'
                })()
            },
            {
                label: 'Country Advertising Campaigns', value: (() => {
                    const owned = upgrades.filter(u => u.effectType === 'countryAdvertisingBoost')
                    if (owned.length === 0) return '—'
                    const same = owned.every(u => u.effectValue === owned[0].effectValue)
                    return `${owned.length} ${owned.length === 1 ? 'country' : 'countries'}${same ? `, +${Math.round(owned[0].effectValue * 100)}% each` : ''}`
                })()
            },
            {
                // The daily bonus is a quarter of a day's income, doubled by Commemorative Displays and x10 with Better Interest Rates (bug #161)
                label: 'Daily Login Cash', value: (() => {
                    const doubled = has('dailyLoginMultiplier')
                    const interest = PrestigeManager.owns('betterInterestRates')
                    if (!doubled && !interest) return '—'
                    const pct = (doubled ? 50 : 25) * (interest ? 10 : 1)
                    return `${pct}% of a day's income (${[doubled && 'Commemorative Displays ×2', interest && 'Better Interest Rates ×10'].filter(Boolean).join(', ')})`
                })()
            },
            { label: 'Work Reputation Chance', value: economyManager.getWorkRepChance() > 0.005 ? `${(economyManager.getWorkRepChance() * 100).toFixed(1)}% per click` : '—' },
            { label: 'Farewell Cash Bonus', value: has('personalImageBranding') ? "10% of the city's daily income" : '—' },
        ]

        return stats.filter(s => s.value !== '—')
    }

    const upgradeStats = getUpgradeStats()
    const cityProgress = (purchasedCities.length / totalCitiesCount) * 100
    const countryProgress = (purchasedCountries.size / totalCountriesCount) * 100
    const developmentProgress = (combinedOwnedDevelopmentsCount / totalDevelopmentsCount) * 100

    return (
        <>
            {showIntro && (
                <PageIntroModal title="Welcome to Progress" onClose={closeIntro} points={[
                    { icon: giftIcon, text: <>Every city, country and development you've collected has a <strong>one-off reward</strong> waiting - click its card for a small, random payout of cash or Reputation.</> },
                    { icon: growthIcon, text: <><strong>General Stats</strong> tracks this run's lifetime totals, and <strong>Active Bonuses</strong> lists every passive boost currently stacked on your income.</> },
                    { icon: starIcon, text: <>Sections can be folded away to save space - a badge stays on a collapsed header to remind you what's still <strong>waiting to be claimed</strong>.</> },
                ]} />
            )}
            <div className="progress-page" style={{ height: `calc(100vh - ${topOffset + 141}px)` }}>
                <div className="progress-content">
                    {sectionHeader('general', 'General Stats')}
                    {!collapsed.general && (
                        <div className="progress-stats">
                            {generalStats.map(({ label, value }) => (
                                <div key={label} className="stat-card" onMouseEnter={() => playHoverSound()}>
                                    <span className="stat-label">{label}</span>
                                    <span className="stat-value">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {sectionHeader('bonuses', 'Active Bonuses', { marginTop: '24px' })}
                    {collapsed.bonuses ? null : upgradeStats.length === 0 ? (
                        <p style={{ color: '#888', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', marginTop: '8px' }}>No upgrades purchased yet.</p>
                    ) : (
                        <div className="progress-stats">
                            {upgradeStats.map(({ label, value }) => (
                                <div key={label} className="stat-card" onMouseEnter={() => playHoverSound()}>
                                    <span className="stat-label">{label}</span>
                                    <span className="stat-value">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {sectionHeader('countries', 'Countries collected', { marginTop: '24px' }, <span className="progress-fraction">{purchasedCountries.size} / {totalCountriesCount}</span>)}
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${countryProgress}%` }} />
                        <span className="progress-bar-label">{Math.round(countryProgress)}%</span>
                    </div>
                    {!collapsed.countries && <div className="progress-country-grid">
                        {sortedCountries.map(country => {
                            const state = getCountryState(country)
                            const flagCode = countryFlags[country]
                            return (
                                <div key={country} className={`progress-country-card progress-country-${state}${state === 'connected' && !claimed.has('country:' + country) && !fading.has('country:' + country) ? ' progress-card-unclaimed' : ''}${fading.has('country:' + country) ? ' progress-card-fading' : ''}`} onMouseEnter={() => state !== 'unknown' && playHoverSound()} onClick={(e) => state === 'connected' && !claimed.has('country:' + country) && handleCardClick(e, 'country:' + country)}>
                                    {state === 'unknown' ? (
                                        <>
                                            <div className="progress-flag-unknown">?</div>
                                            <div className="progress-country-name unknown-name">Unknown</div>
                                        </>
                                    ) : (
                                        <>
                                            {flagCode ? (
                                                <img className={`progress-country-flag ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={flagSrc(flagCode, 80)} alt={country} />
                                            ) : (
                                                <div className="progress-flag-unknown">?</div>
                                            )}
                                            <div className={`progress-country-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>{country}</div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>}

                    {sectionHeader('cities', 'Cities collected', { marginTop: '24px' }, <span className="progress-fraction">{purchasedCities.length} / {totalCitiesCount}</span>)}
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${cityProgress}%` }} />
                        <span className="progress-bar-label">{Math.round(cityProgress)}%</span>
                    </div>
                    {!collapsed.cities && <div className="progress-city-grid">
                        {sortedCities.map(city => {
                            const state = getCityState(city)
                            const flagCode = countryFlags[city.country]
                            return (
                                <div key={city.name} className={`progress-city-card progress-city-${state}${state === 'connected' && !claimed.has('city:' + city.name) && !fading.has('city:' + city.name) ? ' progress-card-unclaimed' : ''}${fading.has('city:' + city.name) ? ' progress-card-fading' : ''}`} onMouseEnter={() => state !== 'unknown' && playHoverSound()} onClick={(e) => state === 'connected' && !claimed.has('city:' + city.name) && handleCardClick(e, 'city:' + city.name)}>
                                    {state === 'unknown' ? (
                                        <>
                                            <div className="progress-city-image-unknown">?</div>
                                            <div className="progress-city-name unknown-name">Unknown City</div>
                                            <div className="progress-city-flag-unknown">?</div>
                                        </>
                                    ) : (
                                        <>
                                            <img className={`progress-city-image ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={cityThumbnails[city.name] || cityImages[city.name]} alt={city.name} />
                                            <div className={`progress-city-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>{city.name}</div>
                                            {flagCode ? (
                                                <img className={`progress-city-flag ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={flagSrc(flagCode, 80)} alt={city.country} />
                                            ) : (
                                                <div className="progress-city-flag-unknown">?</div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>}

                    {sectionHeader('developments', 'Developments collected', { marginTop: '24px' }, <span className="progress-fraction">{combinedOwnedDevelopmentsCount} / {totalDevelopmentsCount}</span>)}
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${developmentProgress}%` }} />
                        <span className="progress-bar-label">{Math.round(developmentProgress)}%</span>
                    </div>
                    {!collapsed.developments && <div className="progress-city-grid">
                        {sortedDevelopments.map(({ isPrestige, item }) => {
                            const state = isPrestige ? getPrestigeUpgradeState(item) : getDevelopmentState(item)
                            const key = isPrestige ? 'prestige:' + item.id : 'dev:' + item.name
                            const claimedSet = isPrestige ? claimedPrestige : claimed
                            const onCardClick = isPrestige ? handlePrestigeCardClick : handleCardClick
                            return (
                                <div key={isPrestige ? 'p:' + item.id : 'd:' + item.name} className={`progress-city-card progress-city-${state}${state === 'connected' && !claimedSet.has(key) && !fading.has(key) ? ' progress-card-unclaimed' : ''}${fading.has(key) ? ' progress-card-fading' : ''}`} onMouseEnter={() => state !== 'unknown' && playHoverSound()} onClick={(e) => state === 'connected' && !claimedSet.has(key) && onCardClick(e, key)}>
                                    {state === 'unknown' ? (
                                        <>
                                            <div className="progress-city-image-unknown">?</div>
                                            <div className="progress-city-name unknown-name">{isPrestige ? 'Unknown Upgrade' : 'Unknown Development'}</div>
                                        </>
                                    ) : isPrestige ? (
                                        <>
                                            {prestigeImageFor(item) ? (
                                                <img className={`progress-city-image ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={prestigeImageFor(item)} alt={item.name} />
                                            ) : (
                                                <div className={`progress-city-image progress-dev-icon-box ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>{item.icon}</div>
                                            )}
                                            <div className={`progress-city-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>{item.name}</div>
                                        </>
                                    ) : (
                                        <>
                                            <img className={`progress-city-image ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={developmentThumbnails[item.name] || developmentImages[item.name]} alt={item.name} />
                                            <div className={`progress-city-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>{item.name}</div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>}
                </div>
            </div>
            {floats.map(f => (
                <div key={f.id} style={{
                    position: 'fixed', left: f.x, top: f.y,
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none', zIndex: 999,
                    animation: 'progress-float-up 1.5s ease-out forwards',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Courier New, monospace', fontWeight: 'bold',
                    fontSize: '1rem', color: f.reward.type === 'cash' ? 'var(--ui-accent, #f5a623)' : '#e74c3c',
                    background: 'rgba(0,0,0,0.75)', borderRadius: '20px', padding: '4px 12px',
                    whiteSpace: 'nowrap',
                }}>
                    {f.reward.type === 'cash'
                        ? <><img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', border: 'none', borderRadius: '0' }} />+{f.reward.amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</>
                        : <><img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', border: 'none', borderRadius: '0' }} />+{f.reward.amount}</>
                    }
                </div>
            ))}
        </>
    )
}

export default ProgressPage
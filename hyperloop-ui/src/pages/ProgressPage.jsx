import React, { useState, useEffect, useMemo } from 'react'
import { allCities } from '../../../CityManager/CityRegistry'
import cityThumbnails from '../data/cityThumbnails.js'
import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'
import cashIcon from '../assets/misc/cash.png'
import { playHoverSound, playFarewellAcceptSound, playReputationWorkBonusSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import './ProgressPage.css'

const CashValue = ({ amount, suffix = '' }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />
        {amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}{suffix}
    </span>
)

function ProgressPage({ purchasedCities, unlockedCities, economyManager, purchasedDevelopments, purchasedUpgrades, farewellsGiven, createdAt, onCollectReward }) {
    const [, setTick] = useState(0)
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(interval)
    }, [])

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

    const formatPopulation = (pop) => {
        if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
        if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
        return pop.toLocaleString()
    }

    const [claimed, setClaimed] = useState(() => new Set(
        JSON.parse(localStorage.getItem('hyperloop_progress_rewards') || '[]')
    ))
    const claimedRef = React.useRef(new Set(
        JSON.parse(localStorage.getItem('hyperloop_progress_rewards') || '[]')
    ))
    const [floats, setFloats] = useState([])
    const [fading, setFading] = useState(new Set())

   const getRandomReward = () => {
    const roll = Math.random() * 100
    if (roll < 25) return { type: 'cash', amount: 2500 }
    if (roll < 47) return { type: 'cash', amount: 5000 }
    if (roll < 65) return { type: 'cash', amount: 10000 }
    if (roll < 75) return { type: 'cash', amount: 25000 }
    if (roll < 80) return { type: 'cash', amount: 50000 }
    if (roll < 92) return { type: 'rep', amount: 5 }
    if (roll < 98) return { type: 'rep', amount: 10 }
    return { type: 'rep', amount: 20 }
}
    const handleCardClick = (e, key) => {
        if (claimedRef.current.has(key)) return
        claimedRef.current.add(key)
        const reward = getRandomReward()
        const rect = e.currentTarget.getBoundingClientRect()
        const id = Date.now() + Math.random()
        setFloats(prev => [...prev, { id, reward, x: rect.left + rect.width / 2, y: rect.top }])
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
        setFading(prev => new Set([...prev, key]))
        if (reward.type === 'rep') playReputationWorkBonusSound()
else playFarewellAcceptSound()
onCollectReward(reward)
        onCollectReward(reward)
        setTimeout(() => {
            setClaimed(prev => {
                const newClaimed = new Set([...prev, key])
                localStorage.setItem('hyperloop_progress_rewards', JSON.stringify([...newClaimed]))
                return newClaimed
            })
            setFading(prev => { const s = new Set(prev); s.delete(key); return s; })
        }, 500)
    }

    const antarcticaUnlocked = purchasedCities.some(p => p.continent === 'Antarctica')
    const visibleCities = allCities.filter(c => c.continent !== 'Antarctica' || antarcticaUnlocked)
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

    const totalPopulation = useMemo(() =>
        purchasedCities.reduce((sum, c) => sum + c.population, 0), [purchasedCities])

    const totalRevenue = useMemo(() => {
        const cityIncome = purchasedCities.reduce((sum, c) => sum + economyManager.calculateCityIncome(c), 0)
        const devIncome = (purchasedDevelopments || []).reduce((sum, d) => sum + economyManager.getEffectiveDevIncomeWithBoosts(d), 0)
        return cityIncome + devIncome
    }, [purchasedCities, purchasedDevelopments, purchasedUpgrades])

    const mostProfitableCity = useMemo(() => {
        if (!purchasedCities.length) return null
        return purchasedCities.reduce((best, c) =>
            economyManager.calculateCityIncome(c) > economyManager.calculateCityIncome(best) ? c : best)
    }, [purchasedCities])

    const leastProfitableCity = useMemo(() => {
        if (!purchasedCities.length) return null
        return purchasedCities.reduce((worst, c) =>
            economyManager.calculateCityIncome(c) < economyManager.calculateCityIncome(worst) ? c : worst)
    }, [purchasedCities])

    const revenueDevs = (purchasedDevelopments || []).filter(d => d.revenue > 0)
    const mostProfitableDev = revenueDevs.length ? revenueDevs.reduce((best, d) => economyManager.getEffectiveDevIncomeWithBoosts(d) > economyManager.getEffectiveDevIncomeWithBoosts(best) ? d : best) : null
    const leastProfitableDev = revenueDevs.length ? revenueDevs.reduce((worst, d) => economyManager.getEffectiveDevIncomeWithBoosts(d) < economyManager.getEffectiveDevIncomeWithBoosts(worst) ? d : worst) : null

    const generalStats = [
        { label: 'Terminal age', value: terminalAge() },
        { label: 'Total population served', value: formatPopulation(totalPopulation) },
        { label: 'Total revenue', value: <><CashValue amount={totalRevenue} suffix="/day" /></> },
        { label: 'Personal farewells given', value: farewellsGiven ?? 0 },
        { label: 'Most profitable city', value: mostProfitableCity ? <span><span style={{ display: 'block' }}>{mostProfitableCity.name}</span><CashValue amount={economyManager.calculateCityIncome(mostProfitableCity)} suffix="/day" /></span> : '—' },
        { label: 'Least profitable city', value: leastProfitableCity ? <span><span style={{ display: 'block' }}>{leastProfitableCity.name}</span><CashValue amount={economyManager.calculateCityIncome(leastProfitableCity)} suffix="/day" /></span> : '—' },
        { label: 'Most profitable development', value: mostProfitableDev ? <span><span style={{ display: 'block' }}>{mostProfitableDev.name}</span><CashValue amount={economyManager.getEffectiveDevIncomeWithBoosts(mostProfitableDev)} suffix="/day" /></span> : '—' },
        { label: 'Least profitable development', value: leastProfitableDev ? <span><span style={{ display: 'block' }}>{leastProfitableDev.name}</span><CashValue amount={economyManager.getEffectiveDevIncomeWithBoosts(leastProfitableDev)} suffix="/day" /></span> : '—' },
    ]

    const getUpgradeStats = () => {
        const upgrades = purchasedUpgrades || []
        const sum = (type) => upgrades.filter(u => u.effectType === type).reduce((acc, u) => acc + u.effectValue, 0)
        const count = (type) => upgrades.filter(u => u.effectType === type).length
        const has = (type) => upgrades.some(u => u.effectType === type)

        const seasonUpgrade = economyManager.getCurrentSeasonUpgrade()
        const monthUpgrade = economyManager.getCurrentMonthUpgrade()
        const now = new Date()
        const hour = now.getHours()
        const timePeriod = hour >= 6 && hour < 12 ? 'Morning' : hour >= 12 && hour < 18 ? 'Afternoon' : hour >= 18 && hour < 22 ? 'Evening' : 'Night'
        const timeBonus = economyManager.getTimeOfDayBonus()
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
            { label: 'Connection Earnings Bonus',       value: sum('connectionBoost') > 0 ? `+${Math.round(sum('connectionBoost') * 100)}%` : '—' },
            { label: 'Food Category Bonus',             value: sum('foodIncome') > 0 ? `+${Math.round(sum('foodIncome') * 100)}%` : '—' },
            { label: 'Recreation Category Bonus',       value: sum('recreationIncome') > 0 ? `+${Math.round(sum('recreationIncome') * 100)}%` : '—' },
            { label: 'Shopping Category Bonus',         value: sum('shoppingIncome') > 0 ? `+${Math.round(sum('shoppingIncome') * 100)}%` : '—' },
            { label: 'Service Category Bonus',          value: sum('serviceIncome') > 0 ? `+${Math.round(sum('serviceIncome') * 100)}%` : '—' },
            { label: 'All Developments Bonus',          value: sum('developmentBoost') > 0 ? `+${Math.round(sum('developmentBoost') * 100)}%` : '—' },
            { label: 'Dev Continent Connections',       value: sum('devContinentBoost') > 0 ? `+${Math.round(sum('devContinentBoost') * uniqueContinents * 100)}% (${uniqueContinents} continents)` : '—' },
            { label: 'Infrastructure Count Boost',      value: sum('infrastructureDevBoost') > 0 ? `+${Math.round(sum('infrastructureDevBoost') * infraCount * 100)}% (${infraCount} items)` : '—' },
            { label: 'Enterprise Count Boost',          value: sum('enterpriseDevBoost') > 0 ? `+${Math.round(sum('enterpriseDevBoost') * enterpriseCount * 100)}% (${enterpriseCount} items)` : '—' },
            { label: 'Service Count Boost',             value: sum('serviceDevBoost') > 0 ? `+${Math.round(sum('serviceDevBoost') * serviceCount * 100)}% (${serviceCount} items)` : '—' },
            { label: 'Continent Expansion Bonus',       value: sum('continentExpansionBoost') > 0 ? `+${Math.round(sum('continentExpansionBoost') * uniqueContinents * 100)}% (${uniqueContinents} continents)` : '—' },
            { label: 'Country Expansion Bonus',         value: sum('countryExpansionBoost') > 0 ? `+${(sum('countryExpansionBoost') * uniqueCountries * 100).toFixed(1)}% (${uniqueCountries} countries)` : '—' },
            { label: 'Local Country Bonus',             value: sum('localCountryBoost') > 0 ? `+${Math.round(sum('localCountryBoost') * 100)}%` : '—' },
            { label: 'Small City Bonus',                value: sum('smallCityBoost') > 0 ? `+${Math.round(sum('smallCityBoost') * 100)}%` : '—' },
            { label: 'Arctic City Bonus',               value: sum('arcticBoost') > 0 ? `+${Math.round(sum('arcticBoost') * 100)}%` : '—' },
            { label: 'Equator City Bonus',              value: sum('equatorBoost') > 0 ? `+${Math.round(sum('equatorBoost') * 100)}%` : '—' },
            { label: 'Southern Hemisphere Bonus',       value: sum('southernHemisphereBoost') > 0 ? `+${Math.round(sum('southernHemisphereBoost') * 100)}%` : '—' },
            { label: 'Terminal Age Bonus',              value: has('terminalAgeBoost') ? `${Math.round(economyManager.getFoundersHallMultiplier(createdAt) * 100 - 100)}% (grows over time)` : '—' },
            { label: 'Current Season Boost',            value: seasonUpgrade ? `+${Math.round(seasonUpgrade.effectValue * 100)}% (${seasonUpgrade.name})` : '—' },
            { label: 'Current Month Boost',             value: monthUpgrade ? `+${Math.round(monthUpgrade.effectValue * 100)}% (${monthUpgrade.name})` : '—' },
            { label: 'Business Week Bonus',             value: sum('businessWeekBoost') > 0 ? `+${Math.round(sum('businessWeekBoost') * 100)}%${isBusinessWeek ? ' ✓ active' : ''}` : '—' },
            { label: 'Weekend Bonus',                   value: sum('weekendBoost') > 0 ? `+${Math.round(sum('weekendBoost') * 100)}%${isWeekend ? ' ✓ active' : ''}` : '—' },
            ...(has('morningBoost') ? [{ label: 'Morning Bonus', value: `+${Math.round(economyManager.getUpgradeSum('morningBoost') * 100)}%${hour >= 6 && hour < 12 ? ' (Active)' : ' (Inactive)'}` }] : []),
            ...(has('afternoonBoost') ? [{ label: 'Afternoon Bonus', value: `+${Math.round(economyManager.getUpgradeSum('afternoonBoost') * 100)}%${hour >= 12 && hour < 18 ? ' (Active)' : ' (Inactive)'}` }] : []),
            ...(has('eveningBoost') ? [{ label: 'Evening Bonus', value: `+${Math.round(economyManager.getUpgradeSum('eveningBoost') * 100)}%${hour >= 18 && hour < 22 ? ' (Active)' : ' (Inactive)'}` }] : []),
            ...(has('nightBoost') ? [{ label: 'Night Bonus', value: `+${Math.round(economyManager.getUpgradeSum('nightBoost') * 100)}%${(hour >= 22 || hour < 6) ? ' (Active)' : ' (Inactive)'}` }] : []),
            { label: 'Work Click Bonus',                value: count('workClickBonus') > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>×{Math.pow(3, count('workClickBonus'))} (<CashValue amount={Math.floor(100 * Math.pow(3, count('workClickBonus')))} suffix="/click" />)</span> : '—' },
            { label: 'Farewell Window',                 value: count('farewellWindowExtension') > 0 ? `${5 + count('farewellWindowExtension') * 5} minutes` : '—' },
            { label: 'Farewell Rep Bonus',              value: has('farewellRepDoubled') ? '×2 per farewell' : '—' },
            { label: 'Offline Earnings Cap',            value: (() => {
                const hours = 48 + count('offlineCapExtension') * 24
                if (hours >= 168) return '1 week'
                return `${Math.round(hours / 24)} days`
            })() },
            { label: 'Dev Build Discount',              value: sum('developmentDiscount') > 0 ? `-${Math.round(sum('developmentDiscount') * 100)}%` : '—' },
            { label: 'Dev Upgrade Discount',            value: sum('developmentUpgradeDiscount') > 0 ? `-${Math.round(sum('developmentUpgradeDiscount') * 100)}%` : '—' },
            { label: 'Negative Event Reduction',        value: sum('negativeEventReduction') > 0 ? `${Math.round(sum('negativeEventReduction') * 100)}% chance to skip` : '—' },
            { label: 'Event Duration Extension',        value: sum('bonusDurationExtension') > 0 ? `+${Math.round(sum('bonusDurationExtension') * 100)}% longer` : '—' },
            { label: 'Delay Compensation Cut',          value: sum('delayCompensationReduction') > 0 ? `-${Math.round(sum('delayCompensationReduction') * 100)}%` : '—' },
            { label: 'Delay Rep Cost Reduction',        value: sum('delayRepCostReduction') > 0 ? `-${sum('delayRepCostReduction')} rep` : '—' },
            { label: 'City Reroll Discount',            value: sum('rerollRepDiscount') > 0 ? `-${sum('rerollRepDiscount')} rep` : '—' },
            { label: 'Daily Login Rep Bonus',           value: sum('dailyLoginRep') > 0 ? `+${sum('dailyLoginRep')} rep/day` : '—' },
            { label: 'Free Reroll on Rank Up',          value: has('freeRerollOnRankUp') ? 'Active' : '—' },
            { label: 'Free Rep on Rank Up',             value: sum('freeRepOnRankUp') > 0 ? `+${sum('freeRepOnRankUp')} rep` : '—' },
            { label: 'Positive Event Preference',       value: has('positiveEventBoost') ? 'Active' : '—' },
            { label: 'Skilled Negotiation Teams',       value: has('skilledNegotiationTeams') ? 'Active' : '—' },
        ]

        return stats.filter(s => s.value !== '—')
    }

    const upgradeStats = getUpgradeStats()
    const cityProgress = (purchasedCities.length / visibleCities.length) * 100
    const countryProgress = (purchasedCountries.size / sortedCountries.length) * 100

    return (
        <>
        <div className="progress-page">
            <div className="progress-content">
            <h2 className="progress-section-header">General Stats</h2>
            <div className="progress-stats">
                {generalStats.map(({ label, value }) => (
                    <div key={label} className="stat-card" onMouseEnter={() => playHoverSound()}>
                        <span className="stat-label">{label}</span>
                        <span className="stat-value">{value}</span>
                    </div>
                ))}
            </div>

            <h2 className="progress-section-header" style={{ marginTop: '24px' }}>Active Bonuses</h2>
            {upgradeStats.length === 0 ? (
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

            <h2 className="progress-section-header" style={{ marginTop: '24px' }}>
                Countries collected
                <span className="progress-fraction">{purchasedCountries.size} / {sortedCountries.length}</span>
            </h2>
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${countryProgress}%` }} />
                <span className="progress-bar-label">{Math.round(countryProgress)}%</span>
            </div>
            <div className="progress-country-grid">
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
                                        <img className={`progress-country-flag ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={`https://flagcdn.com/w80/${flagCode}.png`} alt={country} />
                                    ) : (
                                        <div className="progress-flag-unknown">?</div>
                                    )}
                                    <div className={`progress-country-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>{country}</div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>

            <h2 className="progress-section-header" style={{ marginTop: '24px' }}>
                Cities collected
                <span className="progress-fraction">{purchasedCities.length} / {visibleCities.length}</span>
            </h2>
            <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${cityProgress}%` }} />
                <span className="progress-bar-label">{Math.round(cityProgress)}%</span>
            </div>
            <div className="progress-city-grid">
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
                                        <img className={`progress-city-flag ${state === 'unlocked' ? 'progress-greyscale' : ''}`} src={`https://flagcdn.com/w80/${flagCode}.png`} alt={city.country} />
                                    ) : (
                                        <div className="progress-city-flag-unknown">?</div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
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
                fontSize: '1rem', color: f.reward.type === 'cash' ? '#f5a623' : '#e74c3c',
                background: 'rgba(0,0,0,0.75)', borderRadius: '20px', padding: '4px 12px',
                whiteSpace: 'nowrap',
            }}>
                {f.reward.type === 'cash'
                    ? <><img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', border: 'none', borderRadius: '0' }} />+{f.reward.amount.toLocaleString()}</>
                    : <><img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', border: 'none', borderRadius: '0' }} />+{f.reward.amount}</>
                }
            </div>
        ))}
    </>
    )
}

export default ProgressPage
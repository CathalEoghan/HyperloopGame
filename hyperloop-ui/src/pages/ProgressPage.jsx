import { useState, useEffect, useMemo } from 'react'
import { allCities } from '../../../CityManager/CityRegistry'
import cityThumbnails from '../data/cityThumbnails.js'
import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'
import { playHoverSound } from '../utils/sound.js'
import './ProgressPage.css'

function ProgressPage({ purchasedCities, unlockedCities, economyManager, purchasedDevelopments, purchasedUpgrades, farewellsGiven, createdAt }) {
    const [, setTick] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    const terminalAge = () => {
        const totalSeconds = Math.floor((Date.now() - createdAt) / 1000)
        const d = Math.floor(totalSeconds / 86400)
        const h = Math.floor((totalSeconds % 86400) / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        if (d > 0) return `${d}d ${h}h ${m}m`
        if (h > 0) return `${h}h ${m}m ${s}s`
        if (m > 0) return `${m}m ${s}s`
        return `${s}s`
    }

    const formatPopulation = (pop) => {
        if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
        if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
        return pop.toLocaleString()
    }

    const purchasedNames = new Set(purchasedCities.map(c => c.name))
    const unlockedNames = new Set((unlockedCities || []).map(c => c.name))
    const sortedCities = [...allCities].sort((a, b) => a.name.localeCompare(b.name))

    const getCityState = (city) => {
        if (purchasedNames.has(city.name)) return 'connected'
        if (unlockedNames.has(city.name)) return 'unlocked'
        return 'unknown'
    }

    const sortedCountries = [...new Set(allCities.map(c => c.country))].sort()
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
        const devIncome = [...(purchasedDevelopments || []), ...(purchasedUpgrades || [])].reduce((sum, d) => sum + (d.revenue || 0), 0)
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

    const revenueDevs = [...(purchasedDevelopments || []), ...(purchasedUpgrades || [])].filter(d => d.revenue > 0)
    const mostProfitableDev = revenueDevs.length ? revenueDevs.reduce((best, d) => d.revenue > best.revenue ? d : best) : null
    const leastProfitableDev = revenueDevs.length ? revenueDevs.reduce((worst, d) => d.revenue < worst.revenue ? d : worst) : null

    const generalStats = [
        { label: 'Terminal age', value: terminalAge() },
        { label: 'Total population served', value: formatPopulation(totalPopulation) },
        { label: 'Total revenue', value: `£${totalRevenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day` },
        { label: 'Personal farewells given', value: farewellsGiven ?? 0 },
        { label: 'Most profitable city', value: mostProfitableCity ? `${mostProfitableCity.name} — £${economyManager.calculateCityIncome(mostProfitableCity).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day` : '—' },
        { label: 'Least profitable city', value: leastProfitableCity ? `${leastProfitableCity.name} — £${economyManager.calculateCityIncome(leastProfitableCity).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day` : '—' },
        { label: 'Most profitable development', value: mostProfitableDev ? `${mostProfitableDev.name} — £${mostProfitableDev.revenue.toLocaleString()}/day` : '—' },
        { label: 'Least profitable development', value: leastProfitableDev ? `${leastProfitableDev.name} — £${leastProfitableDev.revenue.toLocaleString()}/day` : '—' },
    ]

    const getUpgradeStats = () => {
        const upgrades = purchasedUpgrades || []
        const sum = (type) => upgrades.filter(u => u.effectType === type).reduce((acc, u) => acc + u.effectValue, 0)
        const count = (type) => upgrades.filter(u => u.effectType === type).length
        const has = (type) => upgrades.some(u => u.effectType === type)

        const now = new Date()
        const month = now.getMonth()
        const seasons = {
            'Spring': [2, 3, 4], 'Summer': [5, 6, 7],
            'Autumn': [8, 9, 10], 'Winter': [11, 0, 1]
        }
        const currentSeason = Object.entries(seasons).find(([, months]) => months.includes(month))?.[0]
        const seasonActive = upgrades.some(u => u.effectType === 'seasonBoost' && u.name.toLowerCase().includes(currentSeason?.toLowerCase()))

        return [
            { label: 'Food Category Bonus',         value: sum('foodIncome') > 0 ? `+${Math.round(sum('foodIncome') * 100)}%` : '—' },
            { label: 'Recreation Category Bonus',   value: sum('recreationIncome') > 0 ? `+${Math.round(sum('recreationIncome') * 100)}%` : '—' },
            { label: 'Shopping Category Bonus',     value: sum('shoppingIncome') > 0 ? `+${Math.round(sum('shoppingIncome') * 100)}%` : '—' },
            { label: 'Service Category Bonus',      value: sum('serviceIncome') > 0 ? `+${Math.round(sum('serviceIncome') * 100)}%` : '—' },
            { label: 'All Developments Bonus',      value: sum('developmentBoost') > 0 ? `+${Math.round(sum('developmentBoost') * 100)}%` : '—' },
            { label: 'Connection Earnings Bonus',   value: sum('connectionBoost') > 0 ? `+${Math.round(sum('connectionBoost') * 100)}%` : '—' },
            { label: 'Work Click Bonus',            value: count('workClickBonus') > 0 ? `+£${count('workClickBonus') * 100}/click` : '—' },
            { label: 'Farewell Window Extension',   value: count('farewellWindowExtension') > 0 ? `+${count('farewellWindowExtension') * 5} mins` : '—' },
            { label: 'Farewell Rep Bonus',          value: has('farewellRepDoubled') ? '×2' : '—' },
            { label: 'Offline Earnings Cap',        value: `${48 + count('offlineCapExtension') * 24}h` },
            { label: 'Dev Construction Discount',   value: sum('developmentDiscount') > 0 ? `-${Math.round(sum('developmentDiscount') * 100)}%` : '—' },
            { label: 'Delay Compensation Cut',      value: sum('delayCompensationReduction') > 0 ? `-${Math.round(sum('delayCompensationReduction') * 100)}%` : '—' },
            { label: 'Seasonal Boost',              value: seasonActive ? `+25% (${currentSeason})` : '—' },
            { label: 'Continent Expansion Bonus',   value: sum('continentExpansionBoost') > 0 ? `+${Math.round(sum('continentExpansionBoost') * 100)}% per continent` : '—' },
            { label: 'Country Expansion Bonus',     value: sum('countryExpansionBoost') > 0 ? `+${(sum('countryExpansionBoost') * 100).toFixed(1)}% per country` : '—' },
            { label: 'Terminal Age Bonus',          value: sum('terminalAgeBoost') > 0 ? `+${Math.round(sum('terminalAgeBoost') * 100)}%/day` : '—' },
        ]
    }

    const upgradeStats = getUpgradeStats()
    const cityProgress = (purchasedCities.length / allCities.length) * 100
    const countryProgress = (purchasedCountries.size / sortedCountries.length) * 100

    return (
        <div className="progress-page">

            <h2 className="progress-section-header">General Stats</h2>
            <div className="progress-stats">
                {generalStats.map(({ label, value }) => (
                    <div key={label} className="stat-card" onMouseEnter={() => playHoverSound()}>
                        <span className="stat-label">{label}</span>
                        <span className="stat-value">{value}</span>
                    </div>
                ))}
            </div>

            <h2 className="progress-section-header" style={{ marginTop: '24px' }}>Upgrade Stats</h2>
            <div className="progress-stats">
                {upgradeStats.map(({ label, value }) => (
                    <div key={label} className="stat-card" onMouseEnter={() => playHoverSound()}>
                        <span className="stat-label">{label}</span>
                        <span className="stat-value">{value}</span>
                    </div>
                ))}
            </div>

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
                        <div
                            key={country}
                            className={`progress-country-card progress-country-${state}`}
                            onMouseEnter={() => state !== 'unknown' && playHoverSound()}
                        >
                            {state === 'unknown' ? (
                                <>
                                    <div className="progress-flag-unknown">?</div>
                                    <div className="progress-country-name unknown-name">Unknown</div>
                                </>
                            ) : (
                                <>
                                    {flagCode ? (
                                        <img
                                            className={`progress-country-flag ${state === 'unlocked' ? 'progress-greyscale' : ''}`}
                                            src={`https://flagcdn.com/w80/${flagCode}.png`}
                                            alt={country}
                                        />
                                    ) : (
                                        <div className="progress-flag-unknown">?</div>
                                    )}
                                    <div className={`progress-country-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>
                                        {country}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>

            <h2 className="progress-section-header" style={{ marginTop: '24px' }}>
                Cities collected
                <span className="progress-fraction">{purchasedCities.length} / {allCities.length}</span>
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
                        <div
                            key={city.name}
                            className={`progress-city-card progress-city-${state}`}
                            onMouseEnter={() => state !== 'unknown' && playHoverSound()}
                        >
                            {state === 'unknown' ? (
                                <>
                                    <div className="progress-city-image-unknown">?</div>
                                    <div className="progress-city-name unknown-name">Unknown City</div>
                                    <div className="progress-city-flag-unknown">?</div>
                                </>
                            ) : (
                                <>
                                    <img
                                        className={`progress-city-image ${state === 'unlocked' ? 'progress-greyscale' : ''}`}
                                        src={cityThumbnails[city.name] || cityImages[city.name]}
                                        alt={city.name}
                                    />
                                    <div className={`progress-city-name ${state === 'unlocked' ? 'progress-greyscale-text' : ''}`}>
                                        {city.name}
                                    </div>
                                    {flagCode ? (
                                        <img
                                            className={`progress-city-flag ${state === 'unlocked' ? 'progress-greyscale' : ''}`}
                                            src={`https://flagcdn.com/w80/${flagCode}.png`}
                                            alt={city.country}
                                        />
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
    )
}

export default ProgressPage
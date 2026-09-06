import { useState, useMemo } from 'react';
import './CitiesPage.css'
import { allCities } from '../../../CityManager/CityRegistry'
import cityImages from '../data/cityImages.js'
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from '../data/countryFlags.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playConstructionSound, playHoverSound } from '../utils/sound.js'
import { formatTime } from '../utils/time.js';

const CONTINENTS = ['All', 'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania']
const CONTINENT_COLOURS = {
    'Europe': '#4a90d9',
    'Asia': '#e67e22',
    'Africa': '#27ae60',
    'North America': '#8e44ad',
    'South America': '#c0392b',
    'Oceania': '#16a085',
    'All': '#444'
}

function CitiesPage({ purchasedCities, constructionManager, unlockedCities, balance, reputation, totalCashEarned, economyManager, onDisconnect, homeCity, onSave }) {
    const [selectedCity, setSelectedCity] = useState(null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [search, setSearch] = useState('')
    const [activeContinent, setActiveContinent] = useState('All')
    const [sortBy, setSortBy] = useState('alphabetical')
    const [collapsedCountries, setCollapsedCountries] = useState(new Set())
    const [enlargedImage, setEnlargedImage] = useState(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState(false)
    const [showCityBoostTip, setShowCityBoostTip] = useState(false)

    const underConstruction = allCities.filter(city =>
        constructionManager.progressionManager.citiesUnderConstruction.some(c => c.name === city.name)
    )
    const purchased = allCities.filter(city => purchasedCities.some(p => p.name === city.name))
    const available = allCities.filter(city =>
        (unlockedCities || []).includes(city) &&
        !purchasedCities.some(p => p.name === city.name) &&
        !underConstruction.some(c => c.name === city.name)
    )
    const connectedAndBuilding = [...purchased, ...underConstruction]

    const sortCities = (cities) => {
        const result = [...cities]
        if (sortBy === 'income-high') return result.sort((a, b) => economyManager.calculateCityIncome(b) - economyManager.calculateCityIncome(a))
        if (sortBy === 'income-low') return result.sort((a, b) => economyManager.calculateCityIncome(a) - economyManager.calculateCityIncome(b))
        if (sortBy === 'population-high') return result.sort((a, b) => b.population - a.population)
        if (sortBy === 'tier') return result.sort((a, b) => b.tier - a.tier)
        return result.sort((a, b) => a.name.localeCompare(b.name))
    }

    const applyFilters = (cities) => {
        let result = cities
        if (activeContinent !== 'All') result = result.filter(c => c.continent === activeContinent)
        if (search.trim()) result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        return sortCities(result)
    }

    const filteredPurchased = applyFilters(connectedAndBuilding)
    const filteredAvailable = applyFilters(available)

    const groupByCountry = (cities) => cities.reduce((result, city) => {
        if (!result[city.country]) result[city.country] = []
        result[city.country].push(city)
        return result
    }, {})

    const groupedPurchased = groupByCountry(filteredPurchased)
    const groupedAvailable = groupByCountry(filteredAvailable)
    const sortedPurchasedCountries = Object.keys(groupedPurchased).sort()
    const sortedAvailableCountries = Object.keys(groupedAvailable).sort()

    const totalPopulation = useMemo(() => filteredPurchased.reduce((sum, c) => sum + c.population, 0), [filteredPurchased])
    const totalIncome = useMemo(() => filteredPurchased.reduce((sum, c) => sum + economyManager.calculateCityIncome(c), 0), [filteredPurchased])

    const formatPopulation = (pop) => {
        if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
        if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
        return pop.toLocaleString()
    }

    const getDisconnectCost = (city) => Math.floor(constructionManager.calculateTierConnectionCost(city) / 2)

    const toggleCountry = (country) => {
        setCollapsedCountries(prev => {
            const next = new Set(prev)
            if (next.has(country)) next.delete(country)
            else next.add(country)
            return next
        })
    }

    const collapseAll = (countries) => setCollapsedCountries(new Set(countries))
    const expandAll = () => setCollapsedCountries(new Set())
    const closeModal = () => { setSelectedCity(null); setConfirmDisconnect(false) }

    const renderCountrySection = (country, cities, isAvailable = false) => {
        const continent = cities[0]?.continent
        const borderColour = CONTINENT_COLOURS[continent] || '#888'
        const isCollapsed = collapsedCountries.has(country)
        return (
            <div key={country}>
                <h2 className="country" style={{ borderLeftColor: borderColour }} onClick={() => toggleCountry(country)}>
                    {country}
                    <img src={`https://flagcdn.com/w40/${countryFlags[country]}.png`} width="20" alt={country} />
                    <span className="country-city-count">{cities.length}</span>
                </h2>
                {!isCollapsed && (
                    <div className="city-row">
                        {cities.map(city => {
                            const isUnderConstruction = underConstruction.some(c => c.name === city.name)
                            const dailyIncome = economyManager.calculateCityIncome(city)
                            return (
                                <button
                                    className="city"
                                    key={city.name}
                                    onClick={() => setSelectedCity(city)}
                                    onMouseEnter={() => playHoverSound()}
                                >
                                    <div className="city-image-wrapper">
                                        <img
                                            className={isUnderConstruction ? "unavailable" : "city-image"}
                                            src={cityThumbnails[city.name] || cityImages[city.name]}
                                            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', filter: isAvailable ? 'grayscale(100%)' : 'none' }}
                                        />
                                        {isUnderConstruction && (
                                            <div className="construction-overlay">
                                                <p>UNDER CONSTRUCTION</p>
                                                <p>{formatTime(constructionManager.timeManager.getTimeRemaining(city.finishTime))}</p>
                                            </div>
                                        )}
                                        {!isUnderConstruction && !isAvailable && (
                                            <div className="city-income-strip">
                                                <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle', marginBottom: '1px' }} />{dailyIncome.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day
                                            </div>
                                        )}
                                    </div>
                                    <div>{city.name}</div>
                                    <div className="tierAndPopulation">Tier {city.tier} | {city.population.toLocaleString()}</div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="background">
            <div className="cities-toolbar-strip">
                <div className="city-toolbar">
                    <input
                        className="city-search"
                        type="text"
                        placeholder="Search cities..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select className="city-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="alphabetical">A–Z</option>
                        <option value="income-high">Income: High to Low</option>
                        <option value="income-low">Income: Low to High</option>
                        <option value="population-high">Population: High to Low</option>
                        <option value="tier">Tier</option>
                    </select>
                </div>
                <div className="continent-filter">
                    {CONTINENTS.map(c => (
                        <button
                            key={c}
                            className={`continent-btn ${activeContinent === c ? 'continent-btn-active' : ''}`}
                            style={activeContinent === c ? { background: CONTINENT_COLOURS[c], borderColor: CONTINENT_COLOURS[c] } : {}}
                            onClick={() => setActiveContinent(c)}
                            onMouseEnter={() => playHoverSound()}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="cities-content">
                {enlargedImage && (
                    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setEnlargedImage(null)}>
                        <img src={enlargedImage} alt="enlarged" style={{ width: '500px', height: '500px', objectFit: 'cover', borderRadius: '12px', border: '3px solid black' }} />
                    </div>
                )}

                {selectedCity && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            {underConstruction.some(c => c.name === selectedCity.name) ? (
                                <>
                                    <h3>🚧 {selectedCity.name}</h3>
                                    <p>Under construction!</p>
                                    <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedCity.finishTime))}</strong></p>
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                </>
                            ) : available.includes(selectedCity) ? (
                                <>
                                    <h3>Connect {selectedCity.name}?</h3>
                                    <button className="constructionButton" onMouseEnter={() => playHoverSound()} onClick={() => {
                                        playClickSound2();
                                        const cost = constructionManager.calculateTierConnectionCost(selectedCity);
                                        if (balance < cost) { setShowNoFunds(true); closeModal(); }
                                        else { constructionManager.startStationConstruction(selectedCity); playConstructionSound(); onSave(); closeModal(); }
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                            Connect (<img className="cash-icon" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{constructionManager.calculateTierConnectionCost(selectedCity).toLocaleString()})
                                        </span>
                                    </button>
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                </>
                            ) : (
                                <>
                                    <img src={`https://flagcdn.com/w40/${countryFlags[selectedCity.country]}.png`} />
                                    <h3>{selectedCity.name}</h3>
                                    <hr />
                                    <p><strong>Country</strong>: {selectedCity.country}</p>
                                    <p><strong>Population</strong>: {selectedCity.population.toLocaleString()}</p>
                                    {(() => {
                                        const TIER_INCOME = { 1: 10000, 2: 50000, 3: 100000 }
                                        const baseIncome = (TIER_INCOME[selectedCity.tier] || 0) + selectedCity.population * 0.0001
                                        const effectiveIncome = economyManager.calculateCityIncome(selectedCity)
                                        const boostPct = Math.round(((effectiveIncome / baseIncome) - 1) * 100)
                                        const lines = []
                                        const connBoost = economyManager.getUpgradeSum('connectionBoost')
                                        if (connBoost > 0) lines.push(`Connection bonus: +${Math.round(connBoost * 100)}%`)
                                        const contExp = economyManager.getUpgradeSum('continentExpansionBoost')
                                        if (contExp > 0) {
                                            const uniqueCont = new Set(economyManager.progressionManager.purchasedCities.map(c => c.continent)).size
                                            lines.push(`Continent expansion: +${Math.round(contExp * uniqueCont * 100)}%`)
                                        }
                                        const countryExp = economyManager.getUpgradeSum('countryExpansionBoost')
                                        if (countryExp > 0) {
                                            const uniqueCountries = new Set(economyManager.progressionManager.purchasedCities.map(c => c.country)).size
                                            lines.push(`Country expansion: +${Math.round(countryExp * uniqueCountries * 100)}%`)
                                        }
                                        const seasonBoost = economyManager.getUpgradeSum('seasonBoost')
                                        if (seasonBoost > 0) lines.push(`Seasonal bonus: +${Math.round(seasonBoost * 100)}%`)
                                        const bizBoost = economyManager.getUpgradeSum('businessWeekBoost')
                                        if (bizBoost > 0 && economyManager.isBusinessWeek()) lines.push(`Business week: +${Math.round(bizBoost * 100)}%`)
                                        return (
                                            <p>
                                                Earning{' '}
                                                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                    <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '13px', height: '13px', verticalAlign: 'middle' }} />
                                                    {effectiveIncome.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                                    {boostPct > 0 && (
                                                        <span
                                                            style={{ color: '#f5a623', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'help', position: 'relative' }}
                                                            onMouseEnter={() => setShowCityBoostTip(true)}
                                                            onMouseLeave={() => setShowCityBoostTip(false)}
                                                        >
                                                            (+{boostPct}%)
                                                            {showCityBoostTip && lines.length > 0 && (
                                                                <div style={{
                                                                    position: 'absolute', bottom: '120%', left: '50%',
                                                                    transform: 'translateX(-50%)',
                                                                    background: '#222', color: 'white',
                                                                    borderRadius: '6px', padding: '6px 10px',
                                                                    fontSize: '0.75rem', whiteSpace: 'nowrap',
                                                                    zIndex: 10, fontWeight: 'normal',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                                }}>
                                                                    {lines.map((line, i) => <div key={i}>{line}</div>)}
                                                                </div>
                                                            )}
                                                        </span>
                                                    )}
                                                </strong>
                                                {' '}per day
                                            </p>
                                        )
                                    })()}
                                    <p><em>{selectedCity.fact}</em></p>
                                    <img
                                        className="modal-city-image"
                                        src={cityImages[selectedCity.name]}
                                        alt={selectedCity.name}
                                        onClick={(e) => { e.stopPropagation(); setEnlargedImage(cityImages[selectedCity.name]) }}
                                        style={{ width: '160px', height: '160px', borderRadius: '10px', border: '3px solid black', objectFit: 'cover', cursor: 'zoom-in' }}
                                    />
                                    {homeCity && selectedCity.name !== homeCity.name && (() => {
                                        const disconnectCost = getDisconnectCost(selectedCity)
                                        const canAfford = balance >= disconnectCost && reputation >= 20
                                        return confirmDisconnect ? (
                                            <>
                                                <p style={{ color: '#c0392b', fontWeight: 'bold', fontSize: '0.85rem', margin: '12px 0 4px' }}>
                                                    Are you sure? Unbuilt developments will be lost.
                                                </p>
                                                <button
                                                    className="constructionButton"
                                                    onMouseEnter={() => playHoverSound()}
                                                    style={{ borderColor: '#c0392b', color: '#c0392b', opacity: canAfford ? 1 : 0.5 }}
                                                    onClick={() => {
                                                        if (!canAfford) return;
                                                        playClickSound2();
                                                        onDisconnect(selectedCity);
                                                        closeModal();
                                                    }}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                        Confirm (<img className="cash-icon" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{disconnectCost.toLocaleString()} + 20<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', margin: '0 0 1px 3px', border: 'none' }} />)
                                                    </span>
                                                </button>
                                                {!canAfford && <p style={{ color: '#c0392b', fontSize: '0.75rem', margin: '4px 0' }}>Not enough funds or reputation</p>}
                                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setConfirmDisconnect(false) }}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="closeButton" onMouseEnter={() => playHoverSound()} style={{ borderColor: '#c0392b', color: '#c0392b', marginTop: '8px' }} onClick={() => { playClickSound2(); setConfirmDisconnect(true) }}>
                                                    Disconnect city
                                                </button>
                                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                            </>
                                        )
                                    })()}
                                    {(!homeCity || selectedCity.name === homeCity.name) && (
                                        <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {showNoFunds && (
                    <div className="modal-overlay" onClick={() => setShowNoFunds(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <h3>💸 Not enough funds!</h3>
                            <p>You need more money to connect this city.</p>
                            <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowNoFunds(false) }}>Close</button>
                        </div>
                    </div>
                )}

                {sortedPurchasedCountries.length > 0 && (
                    <div className="cities-connected-section">
                        <div className="section-header-row">
                            <h1 className="purchasedCitiesHeader">
                                Connected {purchasedCities.length === 1 ? 'city' : 'cities'}
                                <span className="city-count-badge">{filteredPurchased.length}</span>
                                <span className="city-count-badge" style={{ background: '#555' }}>{sortedPurchasedCountries.length} countries</span>
                            </h1>
                            <div className="collapse-controls">
                                <button className="collapse-btn" onClick={() => collapseAll(sortedPurchasedCountries)}>Collapse all</button>
                                <button className="collapse-btn" onClick={expandAll}>Expand all</button>
                            </div>
                        </div>
                        <div className="city-stats-row">
                            <div className="city-stat-box">
                                <span className="city-stat-label">Population served</span>
                                <strong>{formatPopulation(totalPopulation)}</strong>
                            </div>
                            <div className="city-stat-box">
                                <span className="city-stat-label">City income</span>
                                <strong><img src={cashIcon} alt="£" className="cash-icon" style={{ width: '13px', height: '13px', verticalAlign: 'middle' }} />{totalIncome.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day</strong>
                            </div>
                        </div>
                        {sortedPurchasedCountries.map(country => renderCountrySection(country, groupedPurchased[country]))}
                    </div>
                )}

                {sortedAvailableCountries.length > 0 && (
                    <div className="cities-available-section">
                        <div className="section-header-row">
                            <h1 className="availableCitiesHeader">
                                Cities available to connect
                                <span className="city-count-badge">{filteredAvailable.length}</span>
                            </h1>
                            <div className="collapse-controls">
                                <button className="collapse-btn" onClick={() => collapseAll(sortedAvailableCountries)}>Collapse all</button>
                                <button className="collapse-btn" onClick={expandAll}>Expand all</button>
                            </div>
                        </div>
                        {sortedAvailableCountries.map(country => renderCountrySection(country, groupedAvailable[country], true))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CitiesPage
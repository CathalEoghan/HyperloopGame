import { useState, useMemo, useEffect } from 'react';
import './CitiesPage.css'
import { allCities } from '../../../CityManager/CityRegistry'
import cityImages from '../data/cityImages.js'
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from '../data/countryFlags.js'
import { matchesSearch } from '../utils/search.js'
import cityCoordinates from '../data/cityCoordinates.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import constructionIcon from '../assets/misc/construction.png'
import poorIcon from '../assets/misc/poor.png'
import { usePersistedChoice } from '../utils/usePersistedChoice.js'
import { playClickSound2, playConstructionSound, playHoverSound, playNotEnoughFundsSound } from '../utils/sound.js'
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

function CitiesPage({ purchasedCities, constructionManager, unlockedCities, balance, reputation, totalCashEarned, economyManager, onDisconnect, homeCity, onSave, preSelectedCity, onPreSelectedCityHandled, topOffset = 113 }) {
    const [selectedCity, setSelectedCity] = useState(() => preSelectedCity || null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [search, setSearch] = useState('')
    const [activeContinent, setActiveContinent] = usePersistedChoice('citiesContinent', CONTINENTS, 'All')
    const [sortBy, setSortBy] = usePersistedChoice('citiesSort', ['alphabetical', 'income-high', 'income-low', 'population-high', 'tier'], 'alphabetical')
    const [collapsedCountries, setCollapsedCountries] = useState(new Set())
    const [enlargedImage, setEnlargedImage] = useState(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState(false)
    const [showCityBoostTip, setShowCityBoostTip] = useState(false)

    useEffect(() => {
        if (preSelectedCity) {
            onPreSelectedCityHandled?.()
        }
    }, [preSelectedCity])

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

    // Each city's income is worked out once per render and reused. Sorting by income used to
    // recalculate it inside every comparison, which froze the page every second in a late
    // game (bug #90).
    const incomeCache = new Map()
    const cityIncome = (city) => {
        if (!incomeCache.has(city)) incomeCache.set(city, economyManager.withFoundersHall(economyManager.calculateCityIncome(city)))
        return incomeCache.get(city)
    }

    const sortCities = (cities) => {
        const result = [...cities]
        if (sortBy === 'income-high') return result.sort((a, b) => cityIncome(b) - cityIncome(a))
        if (sortBy === 'income-low') return result.sort((a, b) => cityIncome(a) - cityIncome(b))
        if (sortBy === 'population-high') return result.sort((a, b) => b.population - a.population)
        if (sortBy === 'tier') return result.sort((a, b) => b.tier - a.tier)
        return result.sort((a, b) => a.name.localeCompare(b.name))
    }

    const applyFilters = (cities) => {
        let result = cities
        if (activeContinent !== 'All') result = result.filter(c => c.continent === activeContinent)
        if (search.trim()) result = result.filter(c =>
            matchesSearch(c.name, search) || matchesSearch(c.country, search)
        )
        return sortCities(result)
    }

    const filteredPurchased = applyFilters(connectedAndBuilding)
    // Cards show cities still being built, but the totals count only finished ones.
    const builtNames = new Set(purchased.map(c => c.name))
    const filteredBuilt = filteredPurchased.filter(c => builtNames.has(c.name))
    const builtCountryCount = new Set(filteredBuilt.map(c => c.country)).size
    const filteredAvailable = applyFilters(available)

    const groupByCountry = (cities) => cities.reduce((result, city) => {
        if (!result[city.country]) result[city.country] = []
        result[city.country].push(city)
        return result
    }, {})

    // A–Z groups cities by country. Every other sort shows one flat list, so "Income: High to
    // Low" really does put the best earner first instead of only sorting within each country (bug #91).
    const flatList = sortBy !== 'alphabetical'

    const groupedPurchased = groupByCountry(filteredPurchased)
    const groupedAvailable = groupByCountry(filteredAvailable)
    const sortedPurchasedCountries = Object.keys(groupedPurchased).sort()
    const sortedAvailableCountries = Object.keys(groupedAvailable).sort()

    const totalPopulation = useMemo(() => filteredBuilt.reduce((sum, c) => sum + c.population, 0), [filteredBuilt])
    const totalIncome = useMemo(() => filteredBuilt.reduce((sum, c) => sum + cityIncome(c), 0), [filteredBuilt])

    const formatPopulation = (pop) => {
        if (pop >= 1000000000) return (pop / 1000000000).toFixed(1) + ' billion'
        if (pop >= 1000000) return Math.round(pop / 1000000) + ' million'
        return pop.toLocaleString('en-GB', { maximumFractionDigits: 0 })
    }

    const getDisconnectCost = (city) => Math.floor(constructionManager.calculateTierConnectionCost(city) / 2)

        // Connected/Available are two independent sections, so collapse state is keyed
    // by "section:country" — otherwise collapsing a country in one section collapses
    // it in the other too, and each section's own Collapse/Expand all would stomp on
    // the other section's state instead of only touching its own countries.
    const toggleCountry = (section, country) => {
        const key = `${section}:${country}`
        setCollapsedCountries(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const collapseAll = (section, countries) => {
        setCollapsedCountries(prev => {
            const next = new Set(prev)
            countries.forEach(country => next.add(`${section}:${country}`))
            return next
        })
    }
    const expandAll = (section, countries) => {
        setCollapsedCountries(prev => {
            const next = new Set(prev)
            countries.forEach(country => next.delete(`${section}:${country}`))
            return next
        })
    }
    const closeModal = () => { setSelectedCity(null); setConfirmDisconnect(false) }

    // One city card. In the flat list (any sort except A–Z) there's no country heading above
    // it, so the card shows the country's flag itself.
    const renderCityCard = (city, isAvailable = false, showFlag = false) => {
        const isUnderConstruction = underConstruction.some(c => c.name === city.name)
        const dailyIncome = cityIncome(city)
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
                <div>
                    {showFlag && (
                        <img src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} alt={city.country} title={city.country}
                            style={{ width: '18px', height: 'auto', verticalAlign: 'middle', marginRight: '6px', border: 'none', borderRadius: '2px' }} />
                    )}
                    {city.name}
                </div>
                <div className="tierAndPopulation">Tier {city.tier} | {city.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</div>
            </button>
        )
    }

    const renderCountrySection = (country, cities, isAvailable = false) => {
        const continent = cities[0]?.continent
        const borderColour = CONTINENT_COLOURS[continent] || '#888'
        const section = isAvailable ? 'available' : 'purchased'
        const isCollapsed = collapsedCountries.has(`${section}:${country}`)
        return (
            <div key={country}>
                <h2 className="country" style={{ borderLeftColor: borderColour }} onClick={() => toggleCountry(section, country)}>
                    {country}
                    <img src={`https://flagcdn.com/w40/${countryFlags[country]}.png`} width="20" alt={country} />
                    <span className="country-city-count">{cities.length}</span>
                </h2>
                {!isCollapsed && (
                    <div className="city-row">
                        {cities.map(city => renderCityCard(city, isAvailable))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="background" style={{ height: `calc(100vh - ${topOffset + 177}px)` }}>
            <div className="cities-toolbar-strip">
                <div className="city-toolbar">
                    <input
                        className="city-search"
                        type="text"
                        placeholder="Search cities or countries..."
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
                                    <h3><img src={constructionIcon} alt="construction" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px', border: 'none', borderRadius: '0' }} />{selectedCity.name}</h3>
                                    <p>Under construction!</p>
                                    <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedCity.finishTime))}</strong></p>
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                </>
                            ) : available.includes(selectedCity) ? (
                                <>
                                    <h3>Connect {selectedCity.name}?</h3>
                                    {(() => {
                                        const reward = selectedCity.rewards[0]
                                        if (!reward) return null
                                        const article = /^[AEIOU]/i.test(reward.category) ? 'an' : 'a'
                                        return (
                                            <p style={{ fontSize: '0.88rem', color: '#555', margin: '8px 0' }}>
                                                <em>Unlocks {article} <strong>{reward.category}</strong> {reward.revenue ? 'development' : 'upgrade'} once connected</em>
                                            </p>
                                        )
                                    })()}
                                    <button className="constructionButton" onMouseEnter={() => playHoverSound()} onClick={() => {
                                        playClickSound2();
                                        const cost = constructionManager.calculateTierConnectionCost(selectedCity);
                                        // The balance shown on screen refreshes once a second, so check the real one (bug #122)
                                        if (constructionManager.progressionManager.balance < cost) { setShowNoFunds(true); playNotEnoughFundsSound(); closeModal(); }
                                        else {
                                            constructionManager.startStationConstruction(selectedCity);
                                            if (constructionManager.progressionManager.citiesUnderConstruction.includes(selectedCity)) { playConstructionSound(); onSave(); }
                                            closeModal();
                                        }
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                            Connect (<img className="cash-icon" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{constructionManager.calculateTierConnectionCost(selectedCity).toLocaleString('en-GB', { maximumFractionDigits: 0 })})
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
                                    <p><strong>Population</strong>: {selectedCity.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</p>
                                    {(() => {
                                        const coords = cityCoordinates[selectedCity.name]
                                        const coordsMap = coords ? { [selectedCity.name]: coords } : null
                                        const effectiveIncome = economyManager.withFoundersHall(economyManager.calculateCityIncome(selectedCity, coordsMap))
                                        const { lines, totalBoost } = economyManager.getCityBoostBreakdown(selectedCity, coordsMap)
                                        const boostPct = Math.round(totalBoost * 100)
                                        return (
                                            <p>
                                                Earning{' '}
                                                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', overflow: 'visible' }}>
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
                                                                    zIndex: 999, fontWeight: 'normal',
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
                                                        if (!canAfford) { playNotEnoughFundsSound(); return; }
                                                        playClickSound2();
                                                        onDisconnect(selectedCity);
                                                        closeModal();
                                                    }}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                        Confirm (<img className="cash-icon" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{disconnectCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })} + 20<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', margin: '0 0 1px 3px', border: 'none' }} />)
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
                            <h3><img src={poorIcon} alt="not enough funds" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px', border: 'none', borderRadius: '0' }} />Not enough funds!</h3>
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
                                <span className="city-count-badge">{filteredBuilt.length}</span>
                                <span className="city-count-badge" style={{ background: '#555' }}>{builtCountryCount} {builtCountryCount === 1 ? 'country' : 'countries'}</span>
                            </h1>
                            {!flatList && (
                                <div className="collapse-controls">
                                    <button className="collapse-btn" onClick={() => collapseAll('purchased', sortedPurchasedCountries)}>Collapse all</button>
                                    <button className="collapse-btn" onClick={() => expandAll('purchased', sortedPurchasedCountries)}>Expand all</button>
                                </div>
                            )}
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
                        {flatList
                            ? <div className="city-row">{filteredPurchased.map(city => renderCityCard(city, false, true))}</div>
                            : sortedPurchasedCountries.map(country => renderCountrySection(country, groupedPurchased[country]))}
                    </div>
                )}

                {sortedAvailableCountries.length > 0 && (
                    <div className="cities-available-section">
                        <div className="section-header-row">
                            <h1 className="availableCitiesHeader">
                                Cities available to connect
                                <span className="city-count-badge">{filteredAvailable.length}</span>
                            </h1>
                            {!flatList && (
                                <div className="collapse-controls">
                                    <button className="collapse-btn" onClick={() => collapseAll('available', sortedAvailableCountries)}>Collapse all</button>
                                    <button className="collapse-btn" onClick={() => expandAll('available', sortedAvailableCountries)}>Expand all</button>
                                </div>
                            )}
                        </div>
                        {flatList
                            ? <div className="city-row">{filteredAvailable.map(city => renderCityCard(city, true, true))}</div>
                            : sortedAvailableCountries.map(country => renderCountrySection(country, groupedAvailable[country], true))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CitiesPage;
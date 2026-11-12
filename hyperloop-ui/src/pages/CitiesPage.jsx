import { formatCompact } from '../utils/formatCompact.js'
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom'
import BoostTooltip from '../components/BoostTooltip.jsx'
import ScheduleModal from '../components/ScheduleModal.jsx'
import { readTimetable } from '../utils/timetable.js'
import IncomeRow from '../components/IncomeRow.jsx'
import PageIntroModal from '../components/PageIntroModal.jsx'
import AbbreviatedNumber from '../components/AbbreviatedNumber.jsx'
import './CitiesPage.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { allCities } from '../../../CityManager/CityRegistry'
import cityImages from '../data/cityImages.js'
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from '../data/countryFlags.js'
import { matchesPlace } from '../utils/search.js'
import cityCoordinates from '../data/cityCoordinates.js'
import cashIcon from '../assets/misc/cash.png'
import { perHour } from '../utils/income.js'
import reputationIcon from '../assets/misc/reputation.png'
import constructionIcon from '../assets/misc/construction.png'
import poorIcon from '../assets/misc/poor.png'
import boardIcon from '../assets/misc/board.png'
import clockIcon from '../assets/misc/clock.png'
import growthIcon from '../assets/misc/growth.png'
import fireworksIcon from '../assets/misc/fireworks.png'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { planBulkBuy } from '../utils/bulkBuy.js'
import { usePersistedChoice } from '../utils/usePersistedChoice.js'
import { isGrantedCity } from '../utils/grantedCities.js'
import { playClickSound2, playConstructionSound, playFarewellAcceptSound, playHoverSound, playNotEnoughFundsSound, playBigMomentSound } from '../utils/sound.js'
import { formatTime, formatDate } from '../utils/time.js';
import { flagSrc } from '../utils/flagSrc.js'

const CONTINENTS = ['All', 'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania']
// Antarctica only joins the filter once the secret Antarctic Peninsula has been unlocked, so it doesn't give the finale away
const ALL_CONTINENTS = [...CONTINENTS, 'Antarctica']
const CONTINENT_COLOURS = {
    'Europe': '#4a90d9',
    'Asia': '#e67e22',
    'Africa': '#27ae60',
    'North America': '#8e44ad',
    'South America': '#c0392b',
    'Oceania': '#16a085',
    'Antarctica': '#5dade2',
    'All': '#444'
}

function CitiesPage({ purchasedCities, constructionManager, unlockedCities, balance, reputation, economyManager, onDisconnect, onUpgradeCityLine, homeCity, onSave, preSelectedCity, onPreSelectedCityHandled, terminalName, topOffset = 113 }) {
    const [selectedCity, setSelectedCity] = useState(() => preSelectedCity || null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [showLineUpgradeModal, setShowLineUpgradeModal] = useState(false)
    const [search, setSearch] = useState('')
    const [storedContinent, setActiveContinent] = usePersistedChoice('citiesContinent', ALL_CONTINENTS, 'All')
    const [sortBy, setSortBy] = usePersistedChoice('citiesSort', ['alphabetical', 'income-high', 'income-low', 'population-high', 'tier'], 'alphabetical')
    const [collapsedCountries, setCollapsedCountries] = useState(new Set())
    const [enlargedImage, setEnlargedImage] = useState(null)
    // The city whose departure is being scheduled from its card (the Schedule modal opens straight onto it), if any
    const [scheduleCity, setScheduleCity] = useState(null)
    const [, setTimetableTick] = useState(0)   // re-draws the card once a departure has been added or moved
    const [confirmDisconnect, setConfirmDisconnect] = useState(false)
    const [showCityBoostTip, setShowCityBoostTip] = useState(null) // the badge being hovered
    const [showBulkBuyTip, setShowBulkBuyTip] = useState(null) // the Connect all affordable button, while hovered
    const [showRepBonusTip, setShowRepBonusTip] = useState(null) // the Reputation bonus stat box, while hovered
    const [showWisdomBonusTip, setShowWisdomBonusTip] = useState(null) // the Generational Wisdom Bonus stat box, while hovered
    const [showFoundersTip, setShowFoundersTip] = useState(null) // the Founders' Hall Bonus stat box, while hovered
    // Shown once, the first time a player opens this page - skipped entirely once they've retired, since by
    // then they already know how connecting and scheduling works.
    const [showIntro, setShowIntro] = useState(() =>
        PrestigeManager.getHistory().length === 0 && localStorage.getItem('hyperloop_cities_intro_seen') !== 'true'
    )
    const closeIntro = () => { localStorage.setItem('hyperloop_cities_intro_seen', 'true'); setShowIntro(false) }

    // Keep selectedCity in sync with preSelectedCity: the useState initializer above only captures it once at
    // mount, so a later preSelectedCity change (e.g. a second "jump to city" trigger while this page stays
    // mounted) would otherwise be silently ignored.
    useEffect(() => {
        if (preSelectedCity) {
            setSelectedCity(preSelectedCity)
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
    const antarcticaKnown = [...purchased, ...underConstruction, ...available].some(c => c.continent === 'Antarctica')
    const continentTabs = antarcticaKnown ? ALL_CONTINENTS : CONTINENTS
    // A saved Antarctica choice means nothing before the Peninsula is unlocked (a new run, say): show All instead
    const activeContinent = continentTabs.includes(storedContinent) ? storedContinent : 'All'

    // Same grouping the continent filter pills use, reused for the "connected / total" progress badge so a
    // continent's number always means the same thing there as it does in the filter itself.
    const cityInContinent = (city, cont) => cont === 'All' ? true : city.continent === cont
    const continentCityTotal = (cont) => allCities.filter(c => cityInContinent(c, cont)).length
    const continentCityConnected = (cont) => purchased.filter(c => cityInContinent(c, cont)).length

    // What "Connect all affordable" would spend, right now, on the whole available list - regardless of the
    // search box or the continent filter, since those only narrow what's shown, not what the button means.
    // Connecting never costs Reputation, and a city's cost doesn't change as others are connected, so this is
    // just "cheapest first, while the money lasts" - see utils/bulkBuy.js.
    const connectAllPlan = planBulkBuy(
        available,
        city => ({ cash: constructionManager.calculateTierConnectionCost(city) }),
        { cash: balance },
    )
    // What the "Connect all affordable" hover preview lists: which cities it would actually buy, cheapest
    // first (planBulkBuy's own order), so a player can check it isn't about to spend on three Tier 1s instead
    // of holding out for a Tier 3 - the button itself only ever shows the total.
    // The plan itself ignores the search box and continent filter (see the comment above it), so whenever either
    // is actually narrowing the visible list, the preview says so up front rather than looking scoped to what's shown.
    const connectAllLines = connectAllPlan.toBuy.length > 0
        ? [
            `${connectAllPlan.toBuy.length} ${connectAllPlan.toBuy.length === 1 ? 'city' : 'cities'}`,
            ...(activeContinent !== 'All' || search.trim() !== '' ? ['(every continent, ignoring the current filter)'] : []),
            ...connectAllPlan.toBuy.map(city =>
                `${city.name} — ${constructionManager.calculateTierConnectionCost(city).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`),
            `Total: ${connectAllPlan.totalCash.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`,
        ]
        : []
    const connectAllAffordable = () => {
        playClickSound2()
        const pm = constructionManager.progressionManager
        // Re-plan against the real balance at the moment of the click (bug #122: the displayed balance can be
        // up to a second stale), then connect each one - startStationConstruction re-checks affordability itself,
        // so nothing is lost even if something elsewhere spent cash in between.
        const plan = planBulkBuy(available, city => ({ cash: constructionManager.calculateTierConnectionCost(city) }), { cash: pm.balance })
        let connectedAny = false
        plan.toBuy.forEach(city => { if (constructionManager.startStationConstruction(city)) connectedAny = true })
        if (connectedAny) { playConstructionSound(); onSave() } else playNotEnoughFundsSound()
    }

    // Each city's income is worked out once per render and reused. Sorting by income used to
    // recalculate it inside every comparison, which froze the page every second in a late
    // game (bug #90). A connected city counts what it earns now (nothing while it is off the timetable); a city that
    // isn't connected yet, or is still being built, counts what it would earn, so the income sorts still mean something.
    const connectedNames = new Set(purchasedCities.map(c => c.name))
    const incomeCache = new Map()
    const cityIncome = (city) => {
        if (!incomeCache.has(city)) {
            const amount = connectedNames.has(city.name) ? economyManager.calculateCityEarning(city) : economyManager.calculateCityIncome(city)
            incomeCache.set(city, economyManager.withFoundersHall(amount))
        }
        return incomeCache.get(city)
    }

    const sortCities = (cities) => {
        const result = [...cities]
        if (sortBy === 'income-high') return result.sort((a, b) => cityIncome(b) - cityIncome(a))
        if (sortBy === 'income-low') return result.sort((a, b) => cityIncome(a) - cityIncome(b))
        // Ties (every Tier 1 city, say) are A–Z rather than in whatever order the city list happens to hold them
        if (sortBy === 'population-high') return result.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name))
        if (sortBy === 'tier') return result.sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name))
        return result.sort((a, b) => a.name.localeCompare(b.name))
    }

    const applyFilters = (cities) => {
        let result = cities
        if (activeContinent !== 'All') result = result.filter(c => c.continent === activeContinent)
        if (search.trim()) result = result.filter(c =>
            matchesPlace(c.name, c.country, search)
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
    const closeModal = () => { setSelectedCity(null); setConfirmDisconnect(false); setShowLineUpgradeModal(false) }

    // Escape peels back whatever is open on this page one layer at a time - the full-size picture, then a dialog opened from
    // the card, then the card itself - and the page-level Escape (back to Home) only gets a turn once none is left. The
    // hooks are registered lowest layer first on purpose: the later one is registered, the higher it ranks.
    useEscapeToClose(() => { playClickSound2(); closeModal() }, !!selectedCity)
    useEscapeToClose(() => setConfirmDisconnect(false), confirmDisconnect)
    useEscapeToClose(() => { playClickSound2(); setShowLineUpgradeModal(false) }, showLineUpgradeModal)
    useEscapeToClose(() => { playClickSound2(); setShowNoFunds(false) }, showNoFunds)
    useEscapeToClose(() => { playClickSound2(); setEnlargedImage(null) }, !!enlargedImage)

    // One city card. In the flat list (any sort except A–Z) there's no country heading above
    // it, so the card shows the country's flag itself.
    const renderCityCard = (city, isAvailable = false, showFlag = false) => {
        const isUnderConstruction = underConstruction.some(c => c.name === city.name)
        const dailyIncome = cityIncome(city)
        const isHome = !isUnderConstruction && !isAvailable && economyManager.isHomeCity(city)
        const offTimetable = !isUnderConstruction && !isAvailable && !isHome && !economyManager.isCityEarning(city)
        const lineLevel = constructionManager.progressionManager.getCityLineLevel(city)
        // A gold frame marks a city's line fully upgraded (level 10, the cap - see MAX_LINE_LEVEL in
        // ProgressionManager.js), matching the same treatment a maxed-out development gets.
        const isMaxed = !isUnderConstruction && !isAvailable && lineLevel === 10
        return (
            <button
                className="city"
                key={city.name}
                onClick={() => { playClickSound2(); setSelectedCity(city) }}
                onMouseEnter={() => playHoverSound()}
            >
                <div className={`city-image-wrapper${isMaxed ? ' city-image-wrapper-maxed' : ''}`}>
                    <img
                        className={isUnderConstruction ? "unavailable" : "city-image"}
                        src={cityThumbnails[city.name] || cityImages[city.name]}
                        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', filter: isAvailable ? 'grayscale(100%)' : 'none' }}
                        loading="lazy"
                    />
                    {!isUnderConstruction && !isAvailable && lineLevel > 0 && (
                        <div className={`dev-level-strip${isMaxed ? ' dev-level-strip-maxed' : ''}`}>LVL {lineLevel}</div>
                    )}
                    {isUnderConstruction && (
                        <div className="construction-overlay">
                            <p>UNDER CONSTRUCTION</p>
                            <p>{formatTime(constructionManager.timeManager.getTimeRemaining(city.finishTime))}</p>
                        </div>
                    )}
                    {!isUnderConstruction && isAvailable && (
                        <div className="city-income-strip" style={{ color: '#aaa' }}>
                            Cost <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{constructionManager.calculateTierConnectionCost(city).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                        </div>
                    )}
                    {!isUnderConstruction && !isAvailable && (
                        <div className={`city-income-strip${(offTimetable || isHome) ? ' city-income-strip-off' : ''}${offTimetable ? ' city-income-strip-warning' : ''}`}
                            title={isHome ? 'Your home terminal: it earns no income of its own' : offTimetable ? 'Not on the timetable: it earns nothing until it has a scheduled departure' : undefined}>
                            {isHome
                                ? 'HOME TERMINAL'
                                : <><AbbreviatedNumber value={perHour(dailyIncome)} icon={cashIcon} iconAlt="£" iconSize={11} iconStyle={{ marginBottom: '1px' }} suffix="/hr" />{offTimetable ? ' · off timetable' : ''}</>}
                        </div>
                    )}
                </div>
                <div>
                    {showFlag && (
                        <img src={flagSrc(countryFlags[city.country])} alt={city.country} title={city.country}
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
                <h2 className="country" style={{ borderLeftColor: borderColour }} onClick={() => { playClickSound2(); toggleCountry(section, country) }}>
                    {country}
                    <img src={flagSrc(countryFlags[country])} width="20" alt={country} />
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
            {showIntro && (
                <PageIntroModal title="Welcome to Cities" onClose={closeIntro} points={[
                    { icon: boardIcon, text: <>Connect a city, then schedule a departure for it from the Terminal Board - <strong>a city earns nothing until it has a scheduled departure</strong>.</> },
                    { icon: clockIcon, text: <><strong>Afternoon departures are the most lucrative.</strong> Late nights and early mornings typically earn less.</> },
                    { icon: growthIcon, text: <>Upgrade a connected city's line to <strong>increase its ticket revenue</strong>.</> },
                ]} />
            )}
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
                    {continentTabs.map(c => (
                        <button
                            key={c}
                            className={`continent-btn ${activeContinent === c ? 'continent-btn-active' : ''}`}
                            style={activeContinent === c ? { background: CONTINENT_COLOURS[c], borderColor: CONTINENT_COLOURS[c] } : {}}
                            onClick={() => { playClickSound2(); setActiveContinent(c) }}
                            onMouseEnter={() => playHoverSound()}
                        >
                            {c} <span className="category-count">{continentCityConnected(c)} / {continentCityTotal(c)}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="cities-content">
                {scheduleCity && createPortal(
                <ScheduleModal
                    purchasedCities={purchasedCities}
                    terminalName={terminalName}
                    initialCity={scheduleCity}
                    onChange={() => { setTimetableTick(t => t + 1); onSave?.() }}
                    onClose={() => setScheduleCity(null)}
                />,
                document.body
            )}
            {enlargedImage && (
                    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setEnlargedImage(null)}>
                        <img src={enlargedImage} alt="enlarged" style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '12px', border: '3px solid black' }} />
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
                                    {(() => {
                                        const skipCost = constructionManager.calculateSkipCost(selectedCity)
                                        if (skipCost <= 0) return null
                                        const canSkip = constructionManager.progressionManager.reputation >= skipCost
                                        return (
                                            <button className="constructionButton" onMouseEnter={() => playHoverSound()} style={{ opacity: canSkip ? 1 : 0.5 }} onClick={() => {
                                                // The real Reputation, not the figure on screen, which can be a second old (bug #170)
                                                if (!constructionManager.skipConstruction(selectedCity)) { playNotEnoughFundsSound(); return }
                                                playClickSound2(); playFarewellAcceptSound(); onSave(); closeModal()
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                    Build instantly (<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />{skipCost})
                                                </span>
                                            </button>
                                        )
                                    })()}
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
                                    <img src={flagSrc(countryFlags[selectedCity.country])} />
                                    <h3>{selectedCity.name}</h3>
                                    <hr />
                                    <p><strong>Country</strong>: {selectedCity.country}</p>
                                    <p><strong>Population</strong>: {selectedCity.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</p>
                                    {(() => {
                                        const date = formatDate(constructionManager.progressionManager.cityConnectedDates[selectedCity.name])
                                        return date ? <p><strong>Connected</strong>: {date}</p> : null
                                    })()}
                                    {(() => {
                                        const coords = cityCoordinates[selectedCity.name]
                                        const coordsMap = coords ? { [selectedCity.name]: coords } : null
                                        const effectiveIncome = economyManager.withFoundersHall(economyManager.calculateCityIncome(selectedCity, coordsMap))
                                        const { lines, totalBoost } = economyManager.getCityBoostBreakdown(selectedCity, coordsMap)
                                        const boostPct = Math.round(totalBoost * 100)
                                        const baseIncome = economyManager.getCityBaseIncome(selectedCity)
                                        const isHome = economyManager.isHomeCity(selectedCity)
                                        const earning = economyManager.isCityEarning(selectedCity)
                                        const capacity = !isHome && earning ? economyManager.getConnectionCapacityInfo(selectedCity) : null
                                        return (
                                            <div style={{ width: '100%', margin: '8px 0' }}>
                                                {isHome ? (
                                                    <p style={{ margin: '0 0 6px', color: '#555', fontSize: '0.82rem', fontWeight: 'bold' }}>
                                                        This is your home terminal. It earns no departure income.
                                                    </p>
                                                ) : !earning ? (
                                                    <p style={{ margin: '0 0 6px', color: '#c0392b', fontSize: '0.82rem', fontWeight: 'bold' }}>
                                                        Not on the timetable: earning nothing until it has a scheduled departure. The income below is what it earns once it does.
                                                    </p>
                                                ) : capacity && (
                                                    <p style={{ margin: '0 0 6px', color: '#555', fontSize: '0.82rem' }}>
                                                        Running at <strong>{Math.round(capacity.percent)}% capacity</strong> ({capacity.band}) · about <strong>{capacity.passengers} / {capacity.capacity}</strong> passengers
                                                    </p>
                                                )}
                                                {/* Schedule (or change) this city's departure without leaving its card for the Terminal Board */}
                                                {!isHome && purchasedCities.some(c => c.name === selectedCity.name) && (
                                                    <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 8px' }}>
                                                        <button className="lineUpgradeButton"
                                                            onMouseEnter={() => playHoverSound()}
                                                            onClick={(e) => { e.stopPropagation(); playClickSound2(); setScheduleCity(selectedCity.name) }}>
                                                            {readTimetable().some(e => e.name === selectedCity.name) ? 'Edit departure' : 'Schedule departure'}
                                                        </button>
                                                    </div>
                                                )}
                                                {!isHome && (
                                                    <>
                                                        <IncomeRow label="Base income" amount={baseIncome} last={boostPct <= 0 && !capacity} />
                                                        {boostPct > 0 && (
                                                            <IncomeRow label="Boosted income" amount={effectiveIncome} last={!capacity}>
                                                                <span
                                                                    style={{ color: 'var(--ui-accent, #f5a623)', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'var(--cursor-help, help)', position: 'relative' }}
                                                                    onMouseEnter={(e) => setShowCityBoostTip(e.currentTarget)}
                                                                    onMouseLeave={() => setShowCityBoostTip(null)}
                                                                >
                                                                    (+{boostPct.toLocaleString('en-GB')}%)
                                                                    <BoostTooltip anchor={showCityBoostTip} lines={lines} />
                                                                </span>
                                                            </IncomeRow>
                                                        )}
                                                        {/* What it's actually earning right now: Boosted income is the full-capacity rate, but a loop
                                                            is rarely at 100% capacity - this scales it by the same running-at-X% figure shown above,
                                                            so it's clear why "live" lands below the boosted figure rather than looking like a bug. */}
                                                        {capacity && (
                                                            <IncomeRow label="Live income right now" amount={economyManager.withFoundersHall(economyManager.calculateCityEarning(selectedCity, coordsMap))} last>
                                                                <span style={{ color: '#27ae60', fontSize: '0.78rem', fontWeight: 'bold' }}>
                                                                    ({Math.round(capacity.percent)}% capacity)
                                                                </span>
                                                            </IncomeRow>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })()}
                                    {!economyManager.isHomeCity(selectedCity) && constructionManager.progressionManager.canUpgradeCityLine(selectedCity) && (() => {
                                        const pm = constructionManager.progressionManager
                                        const lineLevel = pm.getCityLineLevel(selectedCity)
                                        const lineInfo = pm.getCityLineUpgradeCostInfo(selectedCity)
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 0' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>Line upgrade</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{lineLevel} / 10</span>
                                                    {lineInfo && (
                                                        <button className="lineUpgradeButton"
                                                            onMouseEnter={() => playHoverSound()}
                                                            onClick={(e) => { e.stopPropagation(); playClickSound2(); setShowLineUpgradeModal(true) }}>
                                                            Upgrade
                                                        </button>
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    })()}
                                    <p><em>{selectedCity.fact}</em></p>
                                    <img
                                        className="modal-city-image"
                                        // Falls back to the (lower-res, but locally bundled) thumbnail for a city that hasn't
                                        // made it to the Cloudinary host yet, instead of a broken image (bug #91 follow-up).
                                        src={cityImages[selectedCity.name] || cityThumbnails[selectedCity.name]}
                                        alt={selectedCity.name}
                                        onClick={(e) => { e.stopPropagation(); setEnlargedImage(cityImages[selectedCity.name] || cityThumbnails[selectedCity.name]) }}
                                        style={{ width: '160px', height: '160px', borderRadius: '10px', border: '3px solid black', objectFit: 'cover', cursor: 'zoom-in' }}
                                    />
                                    {homeCity && selectedCity.name !== homeCity.name && (() => {
                                        // Amicable Breakups: disconnecting costs nothing and refunds half the connection cost
                                        const amicable = PrestigeManager.owns('amicableBreakups')
                                        const disconnectCost = amicable ? 0 : getDisconnectCost(selectedCity)
                                        // A city Government Grants connected for free has nothing to refund
                                        const refund = amicable && !isGrantedCity(selectedCity.name) ? getDisconnectCost(selectedCity) : 0
                                        const canAfford = amicable || (balance >= disconnectCost && reputation >= 20)
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
                                                        // Checked again against the real balance and Reputation: the figures on screen can be a second old (bug #170)
                                                        const pm = constructionManager.progressionManager
                                                        if (!canAfford || (!amicable && (pm.balance < disconnectCost || pm.reputation < 20))) { playNotEnoughFundsSound(); return; }
                                                        playClickSound2();
                                                        onDisconnect(selectedCity);
                                                        closeModal();
                                                    }}
                                                >
                                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                        {amicable ? (refund === 0 ? <>Confirm (free)</> : <>Confirm (refund <img className="cash-icon cash-icon-refund-gap" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{refund.toLocaleString('en-GB', { maximumFractionDigits: 0 })})</>) : <>Confirm (<img className="cash-icon" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{disconnectCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })} + <img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', margin: '0 3px 1px 0', border: 'none' }} />20)</>}
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

                {/* Line upgrade modal - a per-city, 10-level investment (see ProgressionManager.getCityLineUpgradeCostInfo),
                    steeper every level, with no cap on how far the game can keep going once everything else is bought. */}
                {showLineUpgradeModal && selectedCity && (() => {
                    const pm = constructionManager.progressionManager
                    const info = pm.getCityLineUpgradeCostInfo(selectedCity)
                    if (!info) return null
                    // The real balance, not the on-screen one, which can be up to a second old (bug #170)
                    const canAfford = pm.balance >= info.cashCost && pm.reputation >= info.repCost
                    return (
                        <div className="modal-overlay" onClick={() => setShowLineUpgradeModal(false)}>
                            <div className="modal" onClick={e => e.stopPropagation()}>
                                <h3>Upgrade the line to {selectedCity.name}</h3>
                                <p>to <strong>Level {info.nextLevel}</strong> for a <strong>+{info.boostPct}% income boost</strong>!</p>
                                <p style={{ fontSize: '0.82rem', color: '#888', margin: '4px 0 12px' }}>
                                    Cumulative total after this upgrade: <strong style={{ color: '#333' }}>+{info.totalPct}%</strong>
                                    {info.nextLevel === 10 && <> <img src={fireworksIcon} alt="" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} /> Maximum reached!</>}
                                </p>
                                <p>Cost: <strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><span className="cost-cash-icon-wrap"><img src={cashIcon} alt="£" className="cash-icon" style={{ border: 'none' }} /></span>{info.cashCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span></strong>{info.repCost > 0 && <> + <strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><img src={reputationIcon} alt="rep" className="rep-icon" style={{ border: 'none' }} />{info.repCost}
                                    {/* Good Standing's half-price Reputation - already baked into info.repCost above, but
                                        flagged the same way the cash discount is, so it isn't invisible here either. Kept
                                        inside the same inline-flex row and bolded like the rest of the cost. */}
                                    {PrestigeManager.owns('goodStanding') && <span style={{ color: 'var(--ui-accent, #f5a623)', fontSize: '0.78rem', fontWeight: 'bold', marginLeft: '2px' }}>(-50%)</span>}</span></strong></>}</p>
                                {!canAfford && <p style={{ color: '#c0392b', fontSize: '0.8rem' }}>Not enough funds or reputation.</p>}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                                    <button className="closeButton" style={{ opacity: canAfford ? 1 : 0.5 }} onMouseEnter={() => playHoverSound()} onClick={() => {
                                        if (!canAfford || !onUpgradeCityLine(selectedCity)) { playNotEnoughFundsSound(); return; }
                                        info.nextLevel === 10 ? playBigMomentSound() : playFarewellAcceptSound();
                                        setShowLineUpgradeModal(false);
                                    }}>
                                        Upgrade
                                    </button>
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowLineUpgradeModal(false) }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {sortedPurchasedCountries.length > 0 && (
                    <div className="cities-connected-section">
                        <div className="section-header-row">
                            <h1 className="purchasedCitiesHeader">
                                <span className="section-label-pill">Connected {filteredBuilt.length === 1 ? 'city' : 'cities'}</span>
                                <span className="city-count-badge">{continentCityConnected(activeContinent)} / {continentCityTotal(activeContinent)}</span>
                                <span className="city-count-badge" style={{ background: '#555' }}>{builtCountryCount} {builtCountryCount === 1 ? 'country' : 'countries'}</span>
                            </h1>
                            {!flatList && (
                                <div className="collapse-controls">
                                    <button className="collapse-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); collapseAll('purchased', sortedPurchasedCountries) }}>Collapse all</button>
                                    <button className="collapse-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); expandAll('purchased', sortedPurchasedCountries) }}>Expand all</button>
                                </div>
                            )}
                        </div>
                        <div className="city-stats-row">
                            <div className="city-stat-box">
                                <span className="city-stat-label" style={{ color: 'white' }}>Population served:</span>
                                <strong>{formatPopulation(totalPopulation)}</strong>
                            </div>
                            <div className="city-stat-box">
                                <span className="city-stat-label" style={{ color: 'white' }}>City income:</span>
                                <strong><AbbreviatedNumber value={perHour(totalIncome)} icon={cashIcon} iconAlt="£" iconSize={13} iconStyle={{ transform: 'translateY(1.5px)' }} suffix="/hr" /></strong>
                            </div>
                            <div
                                className="city-stat-box"
                                style={{ cursor: 'var(--cursor-help, help)' }}
                                onMouseEnter={(e) => setShowRepBonusTip(e.currentTarget)}
                                onMouseLeave={() => setShowRepBonusTip(null)}
                            >
                                <span className="city-stat-label" style={{ color: 'white' }}>Reputation bonus:</span>
                                <strong>+{Math.round(economyManager.getReputationIncomeBonus() * 100)}%</strong>
                                <BoostTooltip anchor={showRepBonusTip} lines={['Every 2 Reputation you currently hold is worth +1% to city and development income.']} text />
                            </div>
                            {PrestigeManager.owns('generationalWisdom') && (
                                <div
                                    className="city-stat-box"
                                    style={{ cursor: 'var(--cursor-help, help)' }}
                                    onMouseEnter={(e) => setShowWisdomBonusTip(e.currentTarget)}
                                    onMouseLeave={() => setShowWisdomBonusTip(null)}
                                >
                                    <span className="city-stat-label" style={{ color: 'white' }}>Generational Wisdom Bonus:</span>
                                    <strong>+{formatCompact(Math.round((economyManager.getGenerationalWisdomMultiplier() - 1) * 100), 1e9)}%</strong>
                                    <BoostTooltip anchor={showWisdomBonusTip} lines={['Every unspent Prestige Point you currently hold is worth +5% to city and development income - as its own multiplier on top of every other boost (including Reputation bonus), not added together with them.']} text />
                                </div>
                            )}
                            {economyManager.hasUpgradeByName("Founders' Hall") && (
                                <div
                                    className="city-stat-box"
                                    style={{ cursor: 'var(--cursor-help, help)' }}
                                    onMouseEnter={(e) => setShowFoundersTip(e.currentTarget)}
                                    onMouseLeave={() => setShowFoundersTip(null)}
                                >
                                    <span className="city-stat-label" style={{ color: 'white' }}>Founders' Hall Bonus:</span>
                                    <strong>+{+((economyManager.getFoundersHallMultiplier() - 1) * 100).toFixed(1)}%</strong>
                                    <BoostTooltip anchor={showFoundersTip} lines={[`Founders' Hall adds +${PrestigeManager.owns('foundersHallExpansion') ? 10 : 5}% to all city and development income for every day your terminal has existed - as its own multiplier on top of every other boost.`]} text />
                                </div>
                            )}
                        </div>
                        {flatList
                            ? <div className="city-row">{filteredPurchased.map(city => renderCityCard(city, false, true))}</div>
                            : sortedPurchasedCountries.map(country => renderCountrySection(country, groupedPurchased[country]))}
                    </div>
                )}

                {/* A search or continent that matches nothing used to leave the page blank under the toolbar */}
                {sortedPurchasedCountries.length === 0 && sortedAvailableCountries.length === 0 && (
                    <p className="cities-no-results" style={{ textAlign: 'center', color: '#888', margin: '32px 16px' }}>
                        No cities match{search.trim() ? <> "{search.trim()}"</> : null}{activeContinent !== 'All' ? <> in {activeContinent}</> : null}.
                    </p>
                )}

                {sortedAvailableCountries.length > 0 && (
                    <div className="cities-available-section">
                        <div className="section-header-row">
                            <h1 className="availableCitiesHeader">
                                <span className="section-label-pill">Cities available to connect</span>
                                <span className="city-count-badge">{filteredAvailable.length}</span>
                                <button className="bulk-buy-btn" style={{ opacity: connectAllPlan.toBuy.length > 0 ? 1 : 0.5, position: 'relative' }}
                                    onMouseEnter={(e) => { playHoverSound(); setShowBulkBuyTip(e.currentTarget) }}
                                    onMouseLeave={() => setShowBulkBuyTip(null)}
                                    onClick={connectAllAffordable}>
                                    Connect all affordable
                                    {connectAllPlan.toBuy.length > 0 && <span className="bulk-buy-cost">(<img src={cashIcon} alt="£" className="cash-icon" style={{ width: '12px', height: '12px', verticalAlign: 'middle', border: 'none' }} />{connectAllPlan.totalCash.toLocaleString('en-GB', { maximumFractionDigits: 0 })})</span>}
                                    <BoostTooltip anchor={showBulkBuyTip} lines={connectAllLines} />
                                </button>
                            </h1>
                            {!flatList && (
                                <div className="collapse-controls">
                                    <button className="collapse-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); collapseAll('available', sortedAvailableCountries) }}>Collapse all</button>
                                    <button className="collapse-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); expandAll('available', sortedAvailableCountries) }}>Expand all</button>
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
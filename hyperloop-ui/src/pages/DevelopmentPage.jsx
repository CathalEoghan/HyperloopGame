import { useState, useMemo } from 'react'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry.js'
import './DevelopmentPage.css'
import developmentImages from '../data/developmentImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { allUpgrades } from '../../../UpgradeManager/UpgradeRegistry.js'
import { formatTime } from '../utils/time.js'
import { playClickSound2, playHoverSound, playConstructionSound } from '../utils/sound.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'

const CATEGORIES = ['All', 'Upgrades', 'Food', 'Shopping', 'Recreation', 'Service', 'Infrastructure']

function DevelopmentPage({ purchasedDevelopments, unlockedDevelopments, unlockedUpgrades, developmentsUnderConstruction, constructionManager, balance, reputation, purchasedCities, purchasedUpgrades, economyManager, onUpgrade, onSave, onUpgradeBuilt }) {
    const [selectedDevelopment, setSelectedDevelopment] = useState(null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [activeCategory, setActiveCategory] = useState('All')
    const [sortBy, setSortBy] = useState('alphabetical')
    const [search, setSearch] = useState('')
    const [enlargedImage, setEnlargedImage] = useState(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [showBoostTooltip, setShowBoostTooltip] = useState(false)

    const progressionManager = constructionManager.progressionManager

    const allItems = [...allDevelopments, ...allUpgrades]
    const underConstruction = allItems.filter(item =>
        developmentsUnderConstruction.some(d => d.name === item.name)
    )
    const purchased = allItems.filter(item =>
        purchasedDevelopments.some(p => p.name === item.name) ||
        purchasedUpgrades.some(p => p.name === item.name)
    )
    const available = allItems.filter(item =>
        (unlockedDevelopments.includes(item) || unlockedUpgrades.includes(item)) &&
        !purchasedDevelopments.some(p => p.name === item.name) &&
        !purchasedUpgrades.some(p => p.name === item.name) &&
        !developmentsUnderConstruction.some(d => d.name === item.name)
    )

    const filterAndSort = (items) => {
        let result = [...items]
        if (activeCategory === 'Upgrades') result = result.filter(d => !d.revenue)
        else if (activeCategory !== 'All') result = result.filter(d => d.category === activeCategory)
        if (search.trim()) result = result.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
        if (sortBy === 'revenue-high') result.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        else if (sortBy === 'revenue-low') result.sort((a, b) => (a.revenue || 0) - (b.revenue || 0))
        else if (sortBy === 'category') result.sort((a, b) => a.category.localeCompare(b.category))
        else if (sortBy === 'upgrades-first') result.sort((a, b) => (a.revenue ? 1 : 0) - (b.revenue ? 1 : 0))
        else result.sort((a, b) => a.name.localeCompare(b.name))
        return result
    }

    const sortedPurchased = filterAndSort([...purchased, ...underConstruction])
    const sortedAvailable = filterAndSort([...available])

    const totalRevenue = useMemo(() =>
        purchased.filter(d => d.revenue).reduce((sum, d) => sum + economyManager.getEffectiveDevRevenue(d), 0),
        [purchased]
    )

    const getUpgradeInfo = (dev) => progressionManager.getDevelopmentUpgradeCostInfo(dev)
    const getLevel = (dev) => progressionManager.getDevelopmentUpgradeLevel(dev)

    const closeModal = () => { setSelectedDevelopment(null); setShowUpgradeModal(false) }

    return (
        <div className="background">
            <div className="dev-toolbar-strip">
                <div className="dev-toolbar">
                    <input className="dev-search" type="text" placeholder="Search developments..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="alphabetical">A–Z</option>
                        <option value="revenue-high">Revenue: High to Low</option>
                        <option value="revenue-low">Revenue: Low to High</option>
                        <option value="category">Category</option>
                        <option value="upgrades-first">Upgrades First</option>
                    </select>
                </div>
                <div className="category-filter">
                    {CATEGORIES.map(cat => (
                        <button key={cat} className={`category-btn ${activeCategory === cat ? 'category-btn-active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                            onMouseEnter={() => playHoverSound()}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="dev-content">
            {purchased.length > 0 && (
                <div className="dev-sticky-header">
                    <div className="total-revenue-banner">
                        <span>Total development income:</span>
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                            {totalRevenue.toLocaleString()}/day
                        </strong>
                    </div>
                </div>
            )}

            {enlargedImage && (
                <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setEnlargedImage(null)}>
                    <img src={enlargedImage} alt="enlarged" style={{ width: '500px', height: '500px', objectFit: 'cover', borderRadius: '12px', border: '3px solid black' }} />
                </div>
            )}

            {/* Upgrade modal */}
            {showUpgradeModal && selectedDevelopment && (() => {
                const info = getUpgradeInfo(selectedDevelopment)
                const canAfford = info && balance >= info.cashCost && reputation >= info.repCost
                return (
                    <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h3>Upgrade {selectedDevelopment.name}</h3>
                            <p>to <strong>Level {info.nextLevel}</strong> for a <strong>+{info.boostPct}% income boost</strong>!</p>
                            <p style={{ fontSize: '0.82rem', color: '#888', margin: '4px 0 12px' }}>
                                Cumulative total after this upgrade: <strong style={{ color: '#333' }}>+{info.totalPct}%</strong>
                                {info.totalPct === 100 && ' 🎉 Maximum reached!'}
                            </p>
                            <p>Cost: <strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />{info.cashCost.toLocaleString()}</span></strong> + <strong>{info.repCost} <img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} /></strong></p>
                            {!canAfford && <p style={{ color: '#c0392b', fontSize: '0.8rem' }}>Not enough funds or reputation.</p>}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                                <button className="closeButton" style={{ opacity: canAfford ? 1 : 0.5 }} onMouseEnter={() => playHoverSound()} onClick={() => {
                                    if (!canAfford) return;
                                    playClickSound2();
                                    onUpgrade(selectedDevelopment);
                                    setShowUpgradeModal(false);
                                }}>
                                    Upgrade
                                </button>
                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowUpgradeModal(false) }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Main development modal */}
            {selectedDevelopment && !showUpgradeModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        {underConstruction.some(d => d.name === selectedDevelopment.name) ? (
                            <>
                                <h3>🚧 {selectedDevelopment.name}</h3>
                                <p>Under construction!</p>
                                <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedDevelopment.finishTime))}</strong></p>
                                <button className="closeButton" onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                            </>
                        ) : available.some(d => d.name === selectedDevelopment.name) ? (
                            <>
                                <h3>Build {selectedDevelopment.name}?</h3>
                                <img className="modal-city-image" src={developmentImages[selectedDevelopment.name]} alt={selectedDevelopment.name}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name]) }}
                                    style={{ cursor: 'zoom-in' }} />
                                {(() => {
                                    const sourceCity = purchasedCities.find(city => city.rewards.some(r => r.name === selectedDevelopment.name))
                                    return sourceCity ? <p><em>Unlocked with: <strong>{sourceCity.name}</strong></em></p> : null
                                })()}
                                <button className="constructionButton" onClick={() => {
                                    const cost = economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost)
                                    if (balance < cost) { playClickSound2(); setShowNoFunds(true); setSelectedDevelopment(null) }
                                    else {
                                        playClickSound2();
                                        playConstructionSound();
                                        constructionManager.startDevelopmentConstruction(selectedDevelopment);
                                        if (selectedDevelopment.effectType) onUpgradeBuilt?.(selectedDevelopment);
                                        onSave();
                                        closeModal();
                                    }
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                        Build (<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0', display: 'inline', marginBottom: '0' }} />{economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost).toLocaleString()})
                                    </span>
                                </button>
                                <button className="closeButton" onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                            </>
                        ) : (
                            <>
                                <img className="modal-city-image" src={developmentImages[selectedDevelopment.name]} alt={selectedDevelopment.name}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name]) }}
                                    style={{ cursor: 'zoom-in' }} />
                                <h3>{selectedDevelopment.name}</h3>
                                <hr />
                                {(() => {
                                    const sourceCity = purchasedCities.find(city => city.rewards.some(r => r.name === selectedDevelopment.name))
                                    return sourceCity ? <p><em>Unlocked with: <strong>{sourceCity.name}</strong></em></p> : null
                                })()}
                                <p><strong>Category</strong>: {selectedDevelopment.category}</p>
                                {selectedDevelopment.revenue ? (
                                    <div style={{ width: '100%', margin: '8px 0' }}>
                                        {(() => {
                                            const catBoost = economyManager.getCategoryMultiplier(selectedDevelopment.category) - 1
                                            const devBoost = economyManager.getUpgradeSum('developmentBoost')
                                            const totalBoostPct = Math.round(((1 + catBoost) * (1 + devBoost) - 1) * 100)
                                            const tooltipLines = []
                                            if (catBoost > 0) tooltipLines.push(`${selectedDevelopment.category} bonus: +${Math.round(catBoost * 100)}%`)
                                            if (devBoost > 0) tooltipLines.push(`Development boost: +${Math.round(devBoost * 100)}%`)
                                            return (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee', position: 'relative' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#888' }}>Base Revenue</span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                                        <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                                                        {selectedDevelopment.revenue.toLocaleString()}/day
                                                        {totalBoostPct > 0 && (
                                                            <span
                                                                style={{ color: '#f5a623', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'help', position: 'relative' }}
                                                                onMouseEnter={() => setShowBoostTooltip(true)}
                                                                onMouseLeave={() => setShowBoostTooltip(false)}
                                                            >
                                                                +{totalBoostPct}%
                                                                {showBoostTooltip && (
                                                                    <div style={{
                                                                        position: 'absolute', bottom: '120%', right: 0,
                                                                        background: '#222', color: 'white',
                                                                        borderRadius: '6px', padding: '6px 10px',
                                                                        fontSize: '0.75rem', whiteSpace: 'nowrap',
                                                                        zIndex: 10, fontWeight: 'normal',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                                    }}>
                                                                        {tooltipLines.map((line, i) => <div key={i}>{line}</div>)}
                                                                    </div>
                                                                )}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        })()}
                                        {getLevel(selectedDevelopment) > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>Upgraded Revenue</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 'bold' }}>
                                                    <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0', display: 'block' }} />
                                                    <span>{economyManager.getEffectiveDevRevenue(selectedDevelopment).toLocaleString()}/day</span>
                                                    <span style={{ color: '#27ae60', fontSize: '0.8rem' }}>(+{[0,15,50,100][getLevel(selectedDevelopment)]}%)</span>
                                                </span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#888' }}>Upgrade Level</span>
                                            <span style={{ fontWeight: 'bold' }}>{getLevel(selectedDevelopment)} / 3</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.88rem', color: '#555', margin: '8px 0' }}>
                                        <strong>Effect:</strong> {(() => {
                                            const effects = {
                                                foodIncome: (v) => `+${Math.round(v * 100)}% income from Food developments`,
                                                recreationIncome: (v) => `+${Math.round(v * 100)}% income from Recreation developments`,
                                                shoppingIncome: (v) => `+${Math.round(v * 100)}% income from Shopping developments`,
                                                serviceIncome: (v) => `+${Math.round(v * 100)}% income from Service developments`,
                                                developmentBoost: (v) => `+${Math.round(v * 100)}% income from all developments`,
                                                connectionBoost: (v) => `+${Math.round(v * 100)}% income from all city connections`,
                                                workClickBonus: () => `Work click earnings tripled`,
                                                offlineCapExtension: () => `+24 hours offline earnings cap`,
                                                developmentDiscount: (v) => `-${Math.round(v * 100)}% development construction cost`,
                                                delayCompensationReduction: (v) => `-${Math.round(v * 100)}% delay compensation cost`,
                                                delayRepCostReduction: (v) => `-${v} Reputation when ignoring delays`,
                                                bonusDurationExtension: (v) => `Bonus events last ${Math.round(v * 100)}% longer`,
                                                farewellWindowExtension: (v) => `+${v} minutes farewell window`,
                                                farewellRepDoubled: () => `Reputation from farewells doubled`,
                                                negativeEventReduction: (v) => `Negative events ${Math.round(v * 100)}% less likely`,
                                                workRepChanceDouble: () => `Double chance of Reputation from Work`,
                                                workRepChanceTriple: () => `Triple chance of Reputation from Work`,
                                                continentExpansionBoost: (v) => `+${Math.round(v * 100)}% earnings per unique continent`,
                                                countryExpansionBoost: (v) => `+${v * 100}% earnings per unique country`,
                                                southernHemisphereBoost: (v) => `+${Math.round(v * 100)}% from southern hemisphere cities`,
                                                arcticBoost: (v) => `+${Math.round(v * 100)}% income from Arctic cities`,
                                                continentBoost: (v) => `+${Math.round(v * 100)}% income from cities on this continent`,
                                                countryAdvertisingBoost: (v) => `+${Math.round(v * 100)}% income from cities in this country`,
                                                localCountryBoost: () => `Bonus income from cities in your home country`,
                                                seasonBoost: (v) => `+${Math.round(v * 100)}% income during this season`,
                                                rerollRepDiscount: (v) => `-${v} Reputation cost to re-roll cities`,
                                                freeRerollOnRankUp: () => `One free city re-roll each time you rank up`,
                                                positiveEventBoost: (v) => `+${Math.round(v * 100)}% chance of positive events`,
                                                dailyLoginRep: (v) => `+${v} Reputation every day you log in`,
                                                freeRepOnRankUp: (v) => `+${v} Reputation each time you rank up`,
                                                businessWeekBoost: (v) => `+${Math.round(v * 100)}% earnings Monday to Friday`,
                                                dailyRepDoubled: () => `Daily Reputation doubled`,
                                                equatorBoost: (v) => `+${Math.round(v * 100)}% income from cities near the equator`,
                                            }
                                            const fn = effects[selectedDevelopment.effectType]
                                            return fn ? fn(selectedDevelopment.effectValue) : 'Special effect'
                                        })()}
                                    </p>
                                )}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                                    {selectedDevelopment.revenue && getLevel(selectedDevelopment) < 3 && (
                                        <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowUpgradeModal(true) }}>
                                            Upgrade
                                        </button>
                                    )}
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showNoFunds && (
                <div className="modal-overlay" onClick={() => setShowNoFunds(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>💸 Not enough funds!</h3>
                        <p>You need more money to build this development.</p>
                        <button className="closeButton" onClick={() => { playClickSound2(); setShowNoFunds(false) }}>Close</button>
                    </div>
                </div>
            )}

            {sortedPurchased.length > 0 && (
                <>
                    <h2 className="section-header">
                        Completed developments <span className="section-count">{sortedPurchased.length}</span>
                    </h2>
                    <div className="development-row">
                        {sortedPurchased.map(development => {
                            const isUnderConstruction = underConstruction.some(d => d.name === development.name)
                            const level = getLevel(development)
                            return (
                                <button className="development" key={development.name}
                                    onClick={() => setSelectedDevelopment(development)}
                                    onMouseEnter={() => playHoverSound()}>
                                    <div className="city-image-wrapper">
                                        <img
                                            className={isUnderConstruction ? "unavailable" : "development-image"}
                                            src={developmentThumbnails[development.name] || developmentImages[development.name]}
                                            style={{ width: '100%', height: '160px' }}
                                        />
                                        {!isUnderConstruction && level > 0 && (
                                            <div className="dev-level-strip">LVL {level}</div>
                                        )}
                                        {isUnderConstruction && (
                                            <div className="construction-overlay">
                                                <p>UNDER CONSTRUCTION</p>
                                                <p>{formatTime(constructionManager.timeManager.getTimeRemaining(development.finishTime))}</p>
                                            </div>
                                        )}
                                        {!isUnderConstruction && (
                                            <div className="dev-revenue-strip">
                                                {development.revenue
                                                    ? <><img src={cashIcon} alt="£" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{economyManager.getEffectiveDevRevenue(development).toLocaleString()}/day</>
                                                    : 'UPGRADE'}
                                            </div>
                                        )}
                                    </div>
                                    <div>{development.name}</div>
                                    <div className="category">{development.category}</div>
                                </button>
                            )
                        })}
                    </div>
                </>
            )}

            <h2 className="section-header section-header-available">
                Available to build <span className="section-count">{sortedAvailable.length}</span>
            </h2>
            <div className="development-row">
                {sortedAvailable.map(development => (
                    <button className="development" key={development.name}
                        onClick={() => setSelectedDevelopment(development)}
                        onMouseEnter={() => playHoverSound()}>
                        <div className="city-image-wrapper">
                            <img className="unavailable"
                                src={developmentThumbnails[development.name] || developmentImages[development.name]}
                                style={{ width: '100%', height: '160px' }}
                            />
                            <div className="dev-revenue-strip" style={{ color: '#aaa' }}>
                                {development.revenue ? <><img src={cashIcon} alt="£" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{development.revenue.toLocaleString()}/day</> : 'UPGRADE'}
                            </div>
                        </div>
                        <div>{development.name}</div>
                        <div className="category">{development.category}</div>
                    </button>
                ))}
            </div>
            </div>
        </div>
    )
}

export default DevelopmentPage
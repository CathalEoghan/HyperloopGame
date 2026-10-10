import { useState, useMemo } from 'react'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry.js'
import { matchesSearch } from '../utils/search.js'
import './DevelopmentPage.css'
import developmentImages from '../data/developmentImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { allUpgrades } from '../../../UpgradeManager/UpgradeRegistry.js'
import { formatTime } from '../utils/time.js'
import { EFFECT_DESCRIPTIONS } from '../utils/effectDescriptions.js'
import { playClickSound2, playHoverSound, playConstructionSound, playNotEnoughFundsSound, playFarewellAcceptSound } from '../utils/sound.js'
import cashIcon from '../assets/misc/cash.png'
import { usePersistedChoice } from '../utils/usePersistedChoice.js'
import poorIcon from '../assets/misc/poor.png'
import reputationIcon from '../assets/misc/reputation.png'
import constructionIcon from '../assets/misc/construction.png'

const CATEGORIES = ['All', 'Upgrades', 'Food', 'Shopping', 'Recreation', 'Service', 'Infrastructure', 'Enterprise']

function DevelopmentPage({ purchasedDevelopments, unlockedDevelopments, unlockedUpgrades, developmentsUnderConstruction, constructionManager, balance, reputation, purchasedCities, purchasedUpgrades, economyManager, onUpgrade, onSave, onUpgradeBuilt, topOffset = 113 }) {
    const [selectedDevelopment, setSelectedDevelopment] = useState(null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [activeCategory, setActiveCategory] = usePersistedChoice('developmentsCategory', CATEGORIES, 'All')
    const [sortBy, setSortBy] = usePersistedChoice('developmentsSort', ['alphabetical', 'revenue-high', 'revenue-low', 'category', 'upgrades-first'], 'alphabetical')
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
        (unlockedDevelopments.includes(item) || (unlockedUpgrades || []).includes(item)) &&
        !purchasedDevelopments.some(p => p.name === item.name) &&
        !purchasedUpgrades.some(p => p.name === item.name) &&
        !developmentsUnderConstruction.some(d => d.name === item.name)
    )

        // incomeOf: the number each card shows, so the Revenue sort matches what is on screen
    const filterAndSort = (items, incomeOf = d => d.revenue || 0) => {
        let result = [...items]
        if (activeCategory === 'Upgrades') result = result.filter(d => !d.revenue)
        else if (activeCategory !== 'All') result = result.filter(d => d.category === activeCategory)
        if (search.trim()) result = result.filter(d => matchesSearch(d.name, search))
        if (sortBy === 'revenue-high') result.sort((a, b) => incomeOf(b) - incomeOf(a))
        else if (sortBy === 'revenue-low') result.sort((a, b) => incomeOf(a) - incomeOf(b))
        else if (sortBy === 'category') result.sort((a, b) => a.category.localeCompare(b.category))
        else if (sortBy === 'upgrades-first') result.sort((a, b) => (a.revenue ? 1 : 0) - (b.revenue ? 1 : 0))
        else result.sort((a, b) => a.name.localeCompare(b.name))
        return result
    }

    const sortedPurchased = filterAndSort([...purchased, ...underConstruction], d => economyManager.getEffectiveDevIncomeWithBoosts(d))
    const sortedAvailable = filterAndSort([...available])

    const totalRevenue = useMemo(() =>
        economyManager.withFoundersHall(purchased.filter(d => d.revenue).reduce((sum, d) => sum + economyManager.getEffectiveDevIncomeWithBoosts(d), 0)),
        [purchased]
    )

    const getUpgradeInfo = (dev) => progressionManager.getDevelopmentUpgradeCostInfo(dev, 1.0 - economyManager.getUpgradeSum('developmentUpgradeDiscount'))
    const getLevel = (dev) => progressionManager.getDevelopmentUpgradeLevel(dev)
    const closeModal = () => { setSelectedDevelopment(null); setShowUpgradeModal(false) }

    return (
        <div className="background" style={{ height: `calc(100vh - ${topOffset + 177}px)` }}>
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
                                {totalRevenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day
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
                                <p>Cost: <strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />{info.cashCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span></strong>{info.repCost > 0 && <> + <strong>{info.repCost} <img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} /></strong></>}</p>
                                {!canAfford && <p style={{ color: '#c0392b', fontSize: '0.8rem' }}>Not enough funds or reputation.</p>}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                                    <button className="closeButton" style={{ opacity: canAfford ? 1 : 0.5 }} onMouseEnter={() => playHoverSound()} onClick={() => {
                                        if (!canAfford) { playNotEnoughFundsSound(); return; }
                                        playFarewellAcceptSound();
                                        onUpgrade(selectedDevelopment, 1.0 - economyManager.getUpgradeSum('developmentUpgradeDiscount'));
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
                                    <h3><img src={constructionIcon} alt="construction" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px', border: 'none', borderRadius: '0' }} />{selectedDevelopment.name}</h3>
                                    <p>Under construction!</p>
                                    <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedDevelopment.finishTime))}</strong></p>
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                </>
                            ) : available.some(d => d.name === selectedDevelopment.name) ? (
                                <>
                                    <h3>{selectedDevelopment.effectType === 'earlyRetirement' ? `Purchase ${selectedDevelopment.name}?` : `Build ${selectedDevelopment.name}?`}</h3>
                                    <img className="modal-city-image" src={developmentImages[selectedDevelopment.name]} alt={selectedDevelopment.name}
                                        onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name]) }}
                                        style={{ cursor: 'zoom-in' }} />
                                    {(() => {
                                        const sourceCity = purchasedCities.find(city => city.rewards.some(r => r.name === selectedDevelopment.name))
                                        return sourceCity ? <p><em>Unlocked with: <strong>{sourceCity.name}</strong></em></p> : null
                                    })()}
                                                                       {!selectedDevelopment.revenue && EFFECT_DESCRIPTIONS[selectedDevelopment.effectType] && (
                                        <p style={{ fontSize: '0.88rem', color: '#555', margin: '8px 0' }}>
                                            <strong>Effect:</strong> {EFFECT_DESCRIPTIONS[selectedDevelopment.effectType](selectedDevelopment.effectValue, selectedDevelopment)}
                                        </p>
                                    )}
                                    {selectedDevelopment.effectType === 'earlyRetirement' ? (
                                        // Bought with Reputation, not cash, and not built: it is owned straight away
                                        <button className="constructionButton" onMouseEnter={() => playHoverSound()} style={{ opacity: reputation >= selectedDevelopment.effectValue ? 1 : 0.5 }} onClick={() => {
                                            if (!progressionManager.buyEarlyRetirement(selectedDevelopment)) { playNotEnoughFundsSound(); return }
                                            playClickSound2(); playFarewellAcceptSound();
                                            onSave();
                                            closeModal();
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                Purchase ({selectedDevelopment.effectValue} <img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />)
                                            </span>
                                        </button>
                                    ) : (
                                    <button className="constructionButton" onMouseEnter={() => playHoverSound()} onClick={() => {
                                            const cost = economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost)
                                            if (balance < cost) { playClickSound2(); playNotEnoughFundsSound(); setShowNoFunds(true); setSelectedDevelopment(null) }
                                            else {
                                                playClickSound2();
                                                playConstructionSound();
                                                constructionManager.startDevelopmentConstruction(selectedDevelopment, economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost));
                                                onSave();
                                                closeModal();
                                            }
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                Build (<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0', display: 'inline', marginBottom: '0' }} />{economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                                {(() => {
                                                    const discount = economyManager.getUpgradeSum('developmentDiscount')
                                                    return discount > 0 ? <span style={{ color: '#f5a623', fontSize: '0.78rem', marginLeft: '2px' }}>(-{Math.round(discount * 100)}%)</span> : null
                                                })()})
                                            </span>
                                        </button>

                                    )}
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
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
                                                const { lines: tooltipLines, totalBoost } = economyManager.getDevBoostBreakdown(selectedDevelopment)
                                                const totalBoostPct = Math.round(totalBoost * 100)
                                                return (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee', position: 'relative' }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#888' }}>Base Revenue</span>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                                            <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                                                            {selectedDevelopment.revenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day
                                                            {totalBoostPct > 0 && (
                                                                <span
                                                                    style={{ color: '#f5a623', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'help', position: 'relative' }}
                                                                    onMouseEnter={() => setShowBoostTooltip(true)}
                                                                    onMouseLeave={() => setShowBoostTooltip(false)}
                                                                >
                                                                    (+{totalBoostPct}%)
                                                                    {showBoostTooltip && (
                                                                        <div style={{
                                                                            position: 'absolute', bottom: '120%', right: 0,
                                                                            background: '#222', color: 'white',
                                                                            borderRadius: '6px', padding: '6px 10px',
                                                                            fontSize: '0.75rem', whiteSpace: 'nowrap',
                                                                            zIndex: 999, fontWeight: 'normal',
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
                                                        <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                                                        <span>{economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(selectedDevelopment)).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day</span>
                                                        <span style={{ color: '#27ae60', fontSize: '0.8rem' }}>(+{[0, 15, 50, 100][getLevel(selectedDevelopment)]}%)</span>
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
                                                const effects = EFFECT_DESCRIPTIONS
                                                const fn = effects[selectedDevelopment.effectType]
                                                return fn ? fn(selectedDevelopment.effectValue, selectedDevelopment) : 'Special effect'
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
                            <h3><img src={poorIcon} alt="not enough funds" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px', border: 'none', borderRadius: '0' }} />Not enough funds!</h3>
                            <p>You need more money to build this development.</p>
                            <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowNoFunds(false) }}>Close</button>
                        </div>
                    </div>
                )}

                {sortedPurchased.length > 0 && (
                    <>
                        <h2 className="section-header" style={{ top: purchased.length === 0 ? '0' : '44px' }}>
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
                                                style={{ width: '100%', height: '180px' }}
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
                                                        ? <><img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(development)).toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day</>
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

                <h2 className="section-header section-header-available" style={{ marginTop: sortedPurchased.length === 0 ? '8px' : '24px', borderTop: sortedPurchased.length === 0 ? 'none' : '2px solid #ddd', top: sortedPurchased.length === 0 ? '0' : '44px' }}>
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
                                    style={{ width: '100%', height: '180px' }}
                                />
                                <div className="dev-revenue-strip" style={{ color: '#aaa' }}>
                                    {development.revenue ? <><img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{development.revenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}/day</> : 'UPGRADE'}
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
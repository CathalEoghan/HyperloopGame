import { useState, useMemo } from 'react'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry.js'
import './DevelopmentPage.css'
import developmentImages from '../data/developmentImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { allUpgrades } from '../../../UpgradeManager/UpgradeRegistry.js'
import { formatTime } from '../utils/time.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

const CATEGORIES = ['All', 'Upgrades', 'Food', 'Shopping', 'Recreation', 'Service', 'Infrastructure']

function DevelopmentPage({ purchasedDevelopments, unlockedDevelopments, unlockedUpgrades, developmentsUnderConstruction, constructionManager, balance, purchasedCities, purchasedUpgrades }) {
    const [selectedDevelopment, setSelectedDevelopment] = useState(null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [activeCategory, setActiveCategory] = useState('All')
    const [sortBy, setSortBy] = useState('alphabetical')
    const [search, setSearch] = useState('')
    const [enlargedImage, setEnlargedImage] = useState(null)

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
        purchased.reduce((sum, d) => sum + (d.revenue || 0), 0),
        [purchased]
    )

    return (
        <div className="background">
            <div className="dev-toolbar">
                <input
                    className="dev-search"
                    type="text"
                    placeholder="Search developments..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
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
                    <button
                        key={cat}
                        className={`category-btn ${activeCategory === cat ? 'category-btn-active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {purchased.length > 0 && (
                <div className="total-revenue-banner">
                    <span>Total development income:</span>
                    <strong>£{totalRevenue.toLocaleString()}/day</strong>
                </div>
            )}

            {enlargedImage && (
                <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setEnlargedImage(null)}>
                    <img src={enlargedImage} alt="enlarged" style={{ width: '500px', height: '500px', objectFit: 'cover', borderRadius: '12px', border: '3px solid black' }} />
                </div>
            )}

            {selectedDevelopment && (
                <div className="modal-overlay" onClick={() => setSelectedDevelopment(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        {underConstruction.some(d => d.name === selectedDevelopment.name) ? (
                            <>
                                <h3>🚧 {selectedDevelopment.name}</h3>
                                <p>Under construction!</p>
                                <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedDevelopment.finishTime))}</strong></p>
                                <button className="closeButton" onClick={() => setSelectedDevelopment(null)}>Close</button>
                            </>
                        ) : available.some(d => d.name === selectedDevelopment.name) ? (
                            <>
                                <h3>Build {selectedDevelopment.name}?</h3>
                                <img
                                    className="modal-city-image"
                                    src={developmentImages[selectedDevelopment.name]}
                                    alt={selectedDevelopment.name}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name]) }}
                                    style={{ cursor: 'zoom-in' }}
                                />
                                {(() => {
                                    const sourceCity = purchasedCities.find(city => city.rewards.some(r => r.name === selectedDevelopment.name))
                                    return sourceCity ? <p><em>Unlocked with: <strong>{sourceCity.name}</strong></em></p> : null
                                })()}
                                <button className="constructionButton" onClick={() => {
                                    const cost = selectedDevelopment.cost
                                    if (balance < cost) { playClickSound2(); setShowNoFunds(true); setSelectedDevelopment(null) }
                                    else { playClickSound2(); constructionManager.startDevelopmentConstruction(selectedDevelopment); setSelectedDevelopment(null) }
                                }}>
                                    Build (£{selectedDevelopment.cost.toLocaleString()})
                                </button>
                                <button className="closeButton" onClick={() => { playClickSound2(); setSelectedDevelopment(null) }}>Close</button>
                            </>
                        ) : (
                            <>
                                <img
                                    className="modal-city-image"
                                    src={developmentImages[selectedDevelopment.name]}
                                    alt={selectedDevelopment.name}
                                    onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name]) }}
                                    style={{ cursor: 'zoom-in' }}
                                />
                                <h3>{selectedDevelopment.name}</h3>
                                <hr />
                                {(() => {
                                    const sourceCity = purchasedCities.find(city => city.rewards.some(r => r.name === selectedDevelopment.name))
                                    return sourceCity ? <p><em>Unlocked with: <strong>{sourceCity.name}</strong></em></p> : null
                                })()}
                                <p><strong>Category</strong>: {selectedDevelopment.category}</p>
                                <p><strong>Revenue</strong>: £{selectedDevelopment.revenue?.toLocaleString() ?? 'N/A'} per day</p>
                                <button className="closeButton" onClick={() => { playClickSound2(); setSelectedDevelopment(null) }}>Close</button>
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
                            return (
                                <button
                                    className="development"
                                    key={development.name}
                                    onClick={() => setSelectedDevelopment(development)}
                                    onMouseEnter={() => playHoverSound()}
                                >
                                    <div className="city-image-wrapper">
                                        <img
                                            className={isUnderConstruction ? "unavailable" : "development-image"}
                                            src={developmentThumbnails[development.name] || developmentImages[development.name]}
                                            style={{ width: '100%', height: '160px' }}
                                        />
                                        {isUnderConstruction && (
                                            <div className="construction-overlay">
                                                <p>UNDER CONSTRUCTION</p>
                                                <p>{formatTime(constructionManager.timeManager.getTimeRemaining(development.finishTime))}</p>
                                            </div>
                                        )}
                                        {!isUnderConstruction && (
                                            <div className="dev-revenue-strip">
                                                {development.revenue ? `£${development.revenue.toLocaleString()}/day` : 'UPGRADE'}
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
                    <button
                        className="development"
                        key={development.name}
                        onClick={() => setSelectedDevelopment(development)}
                        onMouseEnter={() => playHoverSound()}
                    >
                        <div className="city-image-wrapper">
                            <img
                                className="unavailable"
                                src={developmentThumbnails[development.name] || developmentImages[development.name]}
                                style={{ width: '100%', height: '160px' }}
                            />
                            <div className="dev-revenue-strip" style={{ color: '#aaa' }}>
                                {development.revenue ? `£${development.revenue.toLocaleString()}/day` : 'UPGRADE'}
                            </div>
                        </div>
                        <div>{development.name}</div>
                        <div className="category">{development.category}</div>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default DevelopmentPage
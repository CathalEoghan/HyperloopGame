import { useState, useMemo, Fragment } from 'react'
import BoostTooltip from '../components/BoostTooltip.jsx'
import IncomeRow from '../components/IncomeRow.jsx'
import PageIntroModal from '../components/PageIntroModal.jsx'
import monitorIcon from '../assets/misc/monitor.png'
import growthIcon from '../assets/misc/growth.png'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry.js'
import { matchesSearch } from '../utils/search.js'
import './DevelopmentPage.css'
import developmentImages from '../data/developmentImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { allUpgrades } from '../../../UpgradeManager/UpgradeRegistry.js'
import { formatTime } from '../utils/time.js'
import { formatPerHour } from '../utils/income.js'
import { EFFECT_DESCRIPTIONS, stackingNote } from '../utils/effectDescriptions.js'
import { playClickSound2, playHoverSound, playConstructionSound, playNotEnoughFundsSound, playFarewellAcceptSound } from '../utils/sound.js'
import cashIcon from '../assets/misc/cash.png'
import { usePersistedChoice } from '../utils/usePersistedChoice.js'
import { DEV_NAME_MAX_LENGTH, getRenameRepCost, resolveDevelopmentName } from 'Managers/ProgressionManager/ProgressionManager.js'
import poorIcon from '../assets/misc/poor.png'
import reputationIcon from '../assets/misc/reputation.png'
import constructionIcon from '../assets/misc/construction.png'

const CATEGORIES = ['All', 'Upgrades', 'Food', 'Shopping', 'Recreation', 'Service', 'Infrastructure', 'Enterprise']

function DevelopmentPage({ purchasedDevelopments, unlockedDevelopments, unlockedUpgrades, developmentsUnderConstruction, constructionManager, reputation, purchasedCities, purchasedUpgrades, economyManager, onUpgrade, onSave, onRename, onRemove, onUpgradeBuilt, topOffset = 113 }) {
    const [selectedDevelopment, setSelectedDevelopment] = useState(null)
    const [showNoFunds, setShowNoFunds] = useState(false)
    const [activeCategory, setActiveCategory] = usePersistedChoice('developmentsCategory', CATEGORIES, 'All')
    const [sortBy, setSortBy] = usePersistedChoice('developmentsSort', ['alphabetical', 'revenue-high', 'revenue-low', 'category', 'upgrades-first'], 'alphabetical')
    const [search, setSearch] = useState('')
    const [enlargedImage, setEnlargedImage] = useState(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [showBoostTooltip, setShowBoostTooltip] = useState(null) // the badge being hovered
    const [showBusyTooltip, setShowBusyTooltip] = useState(null) // the busy-status badge being hovered (banner or modal)
    // The upgrade card being hovered and what it does, so the player does not have to open it to find out
    const [upgradeTip, setUpgradeTip] = useState(null)
    const showUpgradeTip = (e, development) => {
        const describe = !development.revenue && EFFECT_DESCRIPTIONS[development.effectType]
        setUpgradeTip(describe ? { anchor: e.currentTarget, text: describe(development.effectValue, development) } : null)
    }
    const [showRenameModal, setShowRenameModal] = useState(false)
    const [renameText, setRenameText] = useState('')
    const [confirmRemove, setConfirmRemove] = useState(false)
    // Shown once, the first time a player opens this page - skipped entirely once they've retired, since by
    // then they already know how developments and the busy meter work.
    const [showIntro, setShowIntro] = useState(() =>
        PrestigeManager.getHistory().length === 0 && localStorage.getItem('hyperloop_development_intro_seen') !== 'true'
    )
    const closeIntro = () => { localStorage.setItem('hyperloop_development_intro_seen', 'true'); setShowIntro(false) }

    const progressionManager = constructionManager.progressionManager
    const allItems = [...allDevelopments, ...allUpgrades]
    // What a development is called on screen: the player's name for it, or its own
    const nameOf = (d) => progressionManager.getDevelopmentName(d)
    const isRenamed = (d) => progressionManager.hasCustomDevelopmentName(d)

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
        // A renamed development is found by either of its names
        if (search.trim()) result = result.filter(d => matchesSearch(nameOf(d), search) || matchesSearch(d.name, search))
        if (sortBy === 'revenue-high') result.sort((a, b) => incomeOf(b) - incomeOf(a))
        else if (sortBy === 'revenue-low') result.sort((a, b) => incomeOf(a) - incomeOf(b))
        else if (sortBy === 'category') result.sort((a, b) => a.category.localeCompare(b.category))
        else if (sortBy === 'upgrades-first') result.sort((a, b) => (a.revenue ? 1 : 0) - (b.revenue ? 1 : 0))
        else result.sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
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
    const closeModal = () => { setSelectedDevelopment(null); setShowUpgradeModal(false); setShowRenameModal(false); setConfirmRemove(false) }
    const openRename = (dev) => { setRenameText(nameOf(dev)); setShowRenameModal(true) }

    return (
        <div className="background" style={{ height: `calc(100vh - ${topOffset + 177}px)` }}>
            {showIntro && (
                <PageIntroModal title="Welcome to Developments" onClose={closeIntro} points={[
                    { icon: constructionIcon, text: <>Developments can add <strong>flat income</strong> of their own, or <strong>powerful modifiers</strong> that influence other areas of gameplay instead.</> },
                    { icon: monitorIcon, text: <>Every development's income scales with how busy the terminal is right now - the busy meter rises as loops near departure or have just arrived, and falls when things are quiet, between a <strong>10% floor and 100%</strong>.</> },
                    { icon: growthIcon, text: <>Flat-income developments can also be upgraded to <strong>improve their base revenue</strong>.</> },
                ]} />
            )}
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
                            onClick={() => { playClickSound2(); setActiveCategory(cat) }}
                            onMouseEnter={() => playHoverSound()}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="dev-content">
                {purchased.length > 0 && (() => {
                    const busy = economyManager.getDevelopmentBusyStatus()
                    const busyPct = economyManager.getDevelopmentBusyPercent()
                    return (
                        <div className="dev-sticky-header">
                            <div className="dev-banner-row">
                                <div className="total-revenue-banner">
                                    <span>Total development income:</span>
                                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                        <img src={cashIcon} alt="£" style={{ width: '13px', height: '13px', border: 'none', borderRadius: '0' }} />
                                        {formatPerHour(totalRevenue)}/hr
                                    </strong>
                                </div>
                                <div
                                    className="total-revenue-banner"
                                    style={{ cursor: 'help' }}
                                    onMouseEnter={(e) => setShowBusyTooltip({ anchor: e.currentTarget, text: `How busy the terminal is right now: every development's income scales with this. ${busy.explanation}` })}
                                    onMouseLeave={() => setShowBusyTooltip(null)}
                                >
                                    <span>Live traffic:</span>
                                    <strong style={{ color: busy.color }}>{busy.label} ({busyPct}%)</strong>
                                </div>
                            </div>
                        </div>
                    )
                })()}
                {showBusyTooltip && <BoostTooltip anchor={showBusyTooltip.anchor} lines={[showBusyTooltip.text]} text />}

                {enlargedImage && (
                    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setEnlargedImage(null)}>
                        <img src={enlargedImage} alt="enlarged" style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '12px', border: '3px solid black' }} />
                    </div>
                )}

                {/* Upgrade modal */}
                {showUpgradeModal && selectedDevelopment && (() => {
                    const info = getUpgradeInfo(selectedDevelopment)
                    // The real balance, not the on-screen one, which can be up to a second old (bug #170)
                    const canAfford = info && progressionManager.balance >= info.cashCost && progressionManager.reputation >= info.repCost
                    return (
                        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                            <div className="modal" onClick={e => e.stopPropagation()}>
                                <h3>Upgrade {nameOf(selectedDevelopment)}</h3>
                                <p>to <strong>Level {info.nextLevel}</strong> for a <strong>+{info.boostPct}% income boost</strong>!</p>
                                <p style={{ fontSize: '0.82rem', color: '#888', margin: '4px 0 12px' }}>
                                    Cumulative total after this upgrade: <strong style={{ color: '#333' }}>+{info.totalPct}%</strong>
                                    {info.nextLevel === 10 && ' 🎉 Maximum reached!'}
                                </p>
                                <p>Cost: <strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><span className="cost-cash-icon-wrap"><img src={cashIcon} alt="£" className="cash-icon" style={{ border: 'none' }} /></span>{info.cashCost.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span></strong>{info.repCost > 0 && <> + <strong><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><img src={reputationIcon} alt="rep" className="rep-icon" style={{ border: 'none' }} />{info.repCost}</span></strong></>}</p>
                                {!canAfford && <p style={{ color: '#c0392b', fontSize: '0.8rem' }}>Not enough funds or reputation.</p>}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                                    <button className="closeButton" style={{ opacity: canAfford ? 1 : 0.5 }} onMouseEnter={() => playHoverSound()} onClick={() => {
                                        if (!canAfford || !onUpgrade(selectedDevelopment, 1.0 - economyManager.getUpgradeSum('developmentUpgradeDiscount'))) { playNotEnoughFundsSound(); return; }
                                        playFarewellAcceptSound();
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

                {/* Rename modal: Reset only puts the original name back in the box; Confirm is what costs Reputation */}
                {showRenameModal && selectedDevelopment && (() => {
                    const dev = selectedDevelopment
                    const clean = resolveDevelopmentName(dev, renameText)
                    const isOriginal = clean === dev.name
                    const unchanged = clean === nameOf(dev)
                    // The real Reputation, not the on-screen figure, which can be a second old (bug #170)
                    const tooPoor = progressionManager.reputation < getRenameRepCost()
                    const canConfirm = clean !== '' && !unchanged && !tooPoor
                    const confirm = () => {
                        if (!canConfirm || !progressionManager.renameDevelopment(dev, clean)) { playNotEnoughFundsSound(); return }
                        playFarewellAcceptSound()
                        onSave()
                        onRename?.(dev)
                        closeModal()
                    }
                    return (
                        <div className="modal-overlay" onClick={() => { setShowRenameModal(false) }}>
                            <div className="modal" onClick={e => e.stopPropagation()}>
                                <h3>Rename {dev.name}</h3>
                                <p className="rename-note">
                                    {isOriginal
                                        ? <>Confirm to give it back its original name.</>
                                        : <>Give it a name of your own. It will show as <em>{clean || '…'}</em>, with <em>{dev.name}</em> beneath it.</>}
                                </p>
                                <input
                                    className="rename-input"
                                    type="text"
                                    value={renameText}
                                    maxLength={DEV_NAME_MAX_LENGTH}
                                    autoFocus
                                    spellCheck={false}
                                    aria-label="New name"
                                    onChange={e => setRenameText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') confirm(); else if (e.key === 'Escape') setShowRenameModal(false) }}
                                />
                                <div className="rename-counter">{isOriginal ? 'Original name' : `${renameText.length}/${DEV_NAME_MAX_LENGTH}`}</div>
                                {tooPoor && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: '4px 0' }}>Not enough Reputation.</p>}
                                <div className="modal-button-row">
                                    <button className="closeButton" style={{ opacity: renameText === dev.name ? 0.5 : 1 }} onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setRenameText(dev.name) }}>Reset</button>
                                    <button className="closeButton" style={{ opacity: canConfirm ? 1 : 0.5 }} onMouseEnter={() => playHoverSound()} onClick={confirm}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                            Confirm (<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />{getRenameRepCost()})
                                        </span>
                                    </button>
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowRenameModal(false) }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* Main development modal */}
                {selectedDevelopment && !showUpgradeModal && !showRenameModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            {underConstruction.some(d => d.name === selectedDevelopment.name) ? (
                                <>
                                    <h3><img src={constructionIcon} alt="construction" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '6px', border: 'none', borderRadius: '0' }} />{selectedDevelopment.name}</h3>
                                    <p>Under construction!</p>
                                    <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedDevelopment.finishTime))}</strong></p>
                                    {(() => {
                                        const skipCost = constructionManager.calculateSkipCost(selectedDevelopment)
                                        if (skipCost <= 0) return null
                                        const canSkip = progressionManager.reputation >= skipCost
                                        return (
                                            <button className="constructionButton" onMouseEnter={() => playHoverSound()} style={{ opacity: canSkip ? 1 : 0.5 }} onClick={() => {
                                                // The real Reputation, not the figure on screen, which can be a second old (bug #170)
                                                if (!constructionManager.skipConstruction(selectedDevelopment)) { playNotEnoughFundsSound(); return }
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
                            ) : available.some(d => d.name === selectedDevelopment.name) ? (
                                <>
                                    <h3>{selectedDevelopment.effectType === 'earlyRetirement' ? `Purchase ${selectedDevelopment.name}?` : `Build ${selectedDevelopment.name}?`}</h3>
                                    {/* Falls back to the (lower-res, but locally bundled) thumbnail for a development that
                                        hasn't made it to the Cloudinary host yet, instead of a broken image. */}
                                    <img className="modal-city-image" src={developmentImages[selectedDevelopment.name] || developmentThumbnails[selectedDevelopment.name]} alt={selectedDevelopment.name}
                                        onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name] || developmentThumbnails[selectedDevelopment.name]) }}
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
                                    {!selectedDevelopment.revenue && stackingNote(selectedDevelopment.effectType) && (
                                        <p className="effect-stacking-note">{stackingNote(selectedDevelopment.effectType)}</p>
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
                                                Purchase (<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />{selectedDevelopment.effectValue})
                                            </span>
                                        </button>
                                    ) : (
                                    <button className="constructionButton" onMouseEnter={() => playHoverSound()} onClick={() => {
                                            const cost = economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost)
                                            // The real balance, and only report a build that really started (bug #170)
                                            if (progressionManager.balance >= cost) constructionManager.startDevelopmentConstruction(selectedDevelopment, cost)
                                            if (!progressionManager.developmentsUnderConstruction.includes(selectedDevelopment)) { playClickSound2(); playNotEnoughFundsSound(); setShowNoFunds(true); setSelectedDevelopment(null) }
                                            else {
                                                playClickSound2();
                                                playConstructionSound();
                                                onSave();
                                                closeModal();
                                            }
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                Build (<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0', display: 'inline', marginBottom: '0' }} />{economyManager.calculateDiscountedBuildCost(selectedDevelopment.cost).toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                                                {(() => {
                                                    const discount = economyManager.getUpgradeSum('developmentDiscount')
                                                    return discount > 0 ? <span style={{ color: 'var(--ui-accent, #f5a623)', fontSize: '0.78rem', marginLeft: '2px' }}>(-{Math.round(discount * 100)}%)</span> : null
                                                })()})
                                            </span>
                                        </button>

                                    )}
                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                </>
                            ) : (
                                <>
                                    {/* Falls back to the (lower-res, but locally bundled) thumbnail for a development that
                                        hasn't made it to the Cloudinary host yet, instead of a broken image. */}
                                    <img className="modal-city-image" src={developmentImages[selectedDevelopment.name] || developmentThumbnails[selectedDevelopment.name]} alt={selectedDevelopment.name}
                                        onClick={(e) => { e.stopPropagation(); setEnlargedImage(developmentImages[selectedDevelopment.name] || developmentThumbnails[selectedDevelopment.name]) }}
                                        style={{ cursor: 'zoom-in' }} />
                                    <h3>{nameOf(selectedDevelopment)}</h3>
                                    {isRenamed(selectedDevelopment) && <p className="dev-original-name">{selectedDevelopment.name}</p>}
                                    <hr />
                                    {(() => {
                                        const sourceCity = purchasedCities.find(city => city.rewards.some(r => r.name === selectedDevelopment.name))
                                        return sourceCity ? <p><em>Unlocked with: <strong>{sourceCity.name}</strong></em></p> : null
                                    })()}
                                    <p><strong>Category</strong>: {selectedDevelopment.category}</p>
                                    {selectedDevelopment.revenue ? (
                                        <div style={{ width: '100%', margin: '8px 0' }}>
                                            {(() => {
                                                const busy = economyManager.getDevelopmentBusyStatus()
                                                const busyPct = economyManager.getDevelopmentBusyPercent()
                                                return (
                                                    <p
                                                        style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 'bold', color: busy.color, cursor: 'help' }}
                                                        onMouseEnter={(e) => setShowBusyTooltip({ anchor: e.currentTarget, text: `How busy the terminal is right now (10% floor, +5% per loop nearing departure or just arrived, capped at 100%) - this scales every development's income, including this one's. ${busy.explanation}` })}
                                                        onMouseLeave={() => setShowBusyTooltip(null)}
                                                    >
                                                        {busy.label}: {busyPct}% footfall
                                                    </p>
                                                )
                                            })()}
                                            {(() => {
                                                // Base revenue, then boosted (all the + and x modifiers), then upgraded (the level's multiplier)
                                                const { lines: tooltipLines, totalBoost } = economyManager.getDevBoostBreakdown(selectedDevelopment)
                                                const totalBoostPct = Math.round(totalBoost * 100)
                                                const level = getLevel(selectedDevelopment)
                                                const levelMult = economyManager.getDevLevelMultiplier(selectedDevelopment)
                                                return (
                                                    <>
                                                        <IncomeRow label="Base revenue" amount={selectedDevelopment.revenue} />
                                                        {totalBoostPct > 0 && (
                                                            <IncomeRow label="Boosted revenue" amount={selectedDevelopment.revenue * (1 + totalBoost)}>
                                                                <span
                                                                    style={{ color: 'var(--ui-accent, #f5a623)', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'help', position: 'relative' }}
                                                                    onMouseEnter={(e) => setShowBoostTooltip(e.currentTarget)}
                                                                    onMouseLeave={() => setShowBoostTooltip(null)}
                                                                >
                                                                    (+{totalBoostPct.toLocaleString('en-GB')}%)
                                                                    <BoostTooltip anchor={showBoostTooltip} lines={tooltipLines} />
                                                                </span>
                                                            </IncomeRow>
                                                        )}
                                                        {level > 0 && (
                                                            <IncomeRow label={`Upgraded (Level ${level})`} amount={economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(selectedDevelopment))}>
                                                                <span style={{ color: '#27ae60', fontSize: '0.8rem' }}>(×{+levelMult.toFixed(2)})</span>
                                                            </IncomeRow>
                                                        )}
                                                    </>
                                                )
                                            })()}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#888' }}>Upgrade Level</span>
                                                <span style={{ fontWeight: 'bold' }}>{getLevel(selectedDevelopment)} / 10</span>
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
                                    {!selectedDevelopment.revenue && stackingNote(selectedDevelopment.effectType) && (
                                        <p className="effect-stacking-note">{stackingNote(selectedDevelopment.effectType)}</p>
                                    )}
                                    {(() => {
                                        const canEdit = progressionManager.canRenameDevelopment(selectedDevelopment)
                                        if (canEdit && confirmRemove) {
                                            // The same two steps as disconnecting a city: ask, then a red Confirm
                                            const removal = economyManager.getDevelopmentRemoval(selectedDevelopment)
                                            const income = selectedDevelopment.revenue ? economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(selectedDevelopment)) : 0
                                            const level = getLevel(selectedDevelopment)
                                            const canAfford = removal.amicable || progressionManager.reputation >= removal.repCost
                                            // What removing it costs you, listed in plain terms rather than lumping a future rebuild cost in as if it were also "lost"
                                            const losses = []
                                            if (income > 0) losses.push(<><strong>£{formatPerHour(income)}/hr</strong> income</>)
                                            if (level > 0) losses.push(<>its upgrade level (<strong>LVL {level}</strong>)</>)
                                            if (isRenamed(selectedDevelopment)) losses.push(<>its name</>)
                                            return (
                                                <>
                                                    <p style={{ color: '#c0392b', fontWeight: 'bold', fontSize: '0.85rem', margin: '12px 0 4px' }}>
                                                        Remove {nameOf(selectedDevelopment)}?
                                                    </p>
                                                    <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 8px' }}>
                                                        It goes back to Available to build{losses.length > 0 && <>, losing {losses.map((piece, i) => (
                                                            <Fragment key={i}>
                                                                {i > 0 && (i === losses.length - 1 ? ' and ' : ', ')}
                                                                {piece}
                                                            </Fragment>
                                                        ))}</>}. You'll have to pay full price to build it again.
                                                    </p>
                                                    <button
                                                        className="closeButton danger"
                                                        onMouseEnter={() => playHoverSound()}
                                                        style={{ opacity: canAfford ? 1 : 0.5 }}
                                                        onClick={() => {
                                                            // Worked out again from the real Reputation: the figure on screen can be a second old (bug #170)
                                                            const now = economyManager.getDevelopmentRemoval(selectedDevelopment)
                                                            if (!progressionManager.removeDevelopment(selectedDevelopment, now.repCost, now.refund)) { playNotEnoughFundsSound(); return }
                                                            playClickSound2()
                                                            onSave()
                                                            onRemove?.(selectedDevelopment)
                                                            closeModal()
                                                        }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                            {removal.amicable
                                                                ? (removal.refund === 0 ? <>Confirm (free)</> : <>Confirm (refund <img className="cash-icon cash-icon-refund-gap" src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{removal.refund.toLocaleString('en-GB', { maximumFractionDigits: 0 })})</>)
                                                                : <>Confirm (<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />{removal.repCost})</>}
                                                        </span>
                                                    </button>
                                                    {!canAfford && <p style={{ color: '#c0392b', fontSize: '0.75rem', margin: '4px 0' }}>Not enough Reputation</p>}
                                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setConfirmRemove(false) }}>Cancel</button>
                                                </>
                                            )
                                        }
                                        return (
                                            <div className="modal-button-row" style={{ marginTop: '12px' }}>
                                                {selectedDevelopment.revenue && getLevel(selectedDevelopment) < 10 && (
                                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowUpgradeModal(true) }}>
                                                        Upgrade
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); openRename(selectedDevelopment) }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                            Rename (<img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none' }} />{getRenameRepCost()})
                                                        </span>
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="closeButton danger" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setConfirmRemove(true) }}>
                                                        Remove development
                                                    </button>
                                                )}
                                                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeModal() }}>Close</button>
                                            </div>
                                        )
                                    })()}
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
                                        onClick={() => { playClickSound2(); setUpgradeTip(null); setSelectedDevelopment(development) }}
                                        onMouseEnter={(e) => { playHoverSound(); showUpgradeTip(e, development) }}
                                        onMouseLeave={() => setUpgradeTip(null)}>
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
                                                        ? <><img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{formatPerHour(economyManager.withFoundersHall(economyManager.getEffectiveDevIncomeWithBoosts(development)))}/hr</>
                                                        : 'UPGRADE'}
                                                </div>
                                            )}
                                        </div>
                                        <div title={isRenamed(development) ? `${nameOf(development)} (${development.name})` : undefined}>{nameOf(development)}</div>
                                        <div className={`category${isRenamed(development) ? ' category-original' : ''}`}>{isRenamed(development) ? `${development.name} • ${development.category}` : development.category}</div>
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
                            onClick={() => { playClickSound2(); setUpgradeTip(null); setSelectedDevelopment(development) }}
                            onMouseEnter={(e) => { playHoverSound(); showUpgradeTip(e, development) }}
                            onMouseLeave={() => setUpgradeTip(null)}>
                            <div className="city-image-wrapper">
                                <img className="unavailable"
                                    src={developmentThumbnails[development.name] || developmentImages[development.name]}
                                    style={{ width: '100%', height: '180px' }}
                                />
                                <div className="dev-revenue-strip" style={{ color: '#aaa' }}>
                                    {development.revenue ? <><img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0', verticalAlign: 'middle' }} />{formatPerHour(development.revenue)}/hr</> : 'UPGRADE'}
                                </div>
                            </div>
                            <div>{development.name}</div>
                            <div className="category">{development.category}</div>
                        </button>
                    ))}
                </div>
                {upgradeTip && <BoostTooltip anchor={upgradeTip.anchor} lines={[upgradeTip.text]} text liftTo={4} />}
            </div>
        </div>
    )
}

export default DevelopmentPage
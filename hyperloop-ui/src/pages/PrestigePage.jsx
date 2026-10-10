import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { PrestigeManager, PRESTIGE_MIN_RANK, RANKS_PER_PRESTIGE_POINT } from 'Managers/PrestigeManager/PrestigeManager.js'
import { PRESTIGE_LAYERS, PRESTIGE_UPGRADES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { playClickSound2, playHoverSound, playFarewellAcceptSound, playNotEnoughFundsSound } from '../utils/sound.js'
import './PrestigePage.css'

// Artwork: 600px copies of the originals in assets/prestige-upgrades, named after the upgrade
const IMAGES = import.meta.glob('../assets/prestige-upgrades-thumb/*.jpg', { eager: true, import: 'default' })
// Matched ignoring case: "Cult of Celebrity" must find CultOfCelebrity.jpg
const IMAGES_BY_NAME = Object.fromEntries(Object.entries(IMAGES).map(([path, src]) => [path.split('/').pop().replace('.jpg', '').toLowerCase(), src]))
const imageFor = u => IMAGES_BY_NAME[u.name.replace(/[^A-Za-z0-9]/g, '').toLowerCase()]

const CARDS_PER_ROW = 5
const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size))

const fmtCash = n => {
    if (!Number.isFinite(n)) return '—'
    if (n >= 1e12) return `£${(n / 1e12).toFixed(2)} trillion`
    if (n >= 1e9) return `£${(n / 1e9).toFixed(2)} billion`
    if (n >= 1e6) return `£${(n / 1e6).toFixed(2)} million`
    return `£${Math.floor(n).toLocaleString('en-GB')}`
}
const fmtSpan = ms => {
    if (!Number.isFinite(ms) || ms < 0) return '—'
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000)
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}

function UpgradeArt({ upgrade, className }) {
    const src = imageFor(upgrade)
    return src
        ? <img className={className} src={src} alt="" draggable={false} />
        : <span className={`${className} prestige-art-fallback`}>{upgrade.icon}</span>
}

// Ticker bar plus bottom navigation, fixed at the bottom of the screen
const BOTTOM_BARS = 102

function PrestigePage({ rank = 1, hasEarlyRetirement = false, runStats = null, onPrestige = () => {} }) {
    const pageRef = useRef(null)
    const [pageHeight, setPageHeight] = useState(null)
    // Fill exactly the space between the top banner and the ticker, however tall the banner is
    useLayoutEffect(() => {
        const fit = () => {
            if (pageRef.current) setPageHeight(Math.max(240, window.innerHeight - pageRef.current.getBoundingClientRect().top - BOTTOM_BARS))
        }
        fit()
        window.addEventListener('resize', fit)
        return () => window.removeEventListener('resize', fit)
    }, [])
    const [prestige] = useState(() => new PrestigeManager())
    const [, setTick] = useState(0)
    const [selectedId, setSelectedId] = useState(null)
    const refresh = () => setTick(t => t + 1)

    const popRef = useRef(null)
    // Bring the buy popover into view when an upgrade is picked near the bottom of the list
    useEffect(() => { popRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [selectedId])
    const totalOwned = prestige.owned.length

    // Early Retirement: the way to prestige
    const [confirming, setConfirming] = useState(false)
    const [showRuns, setShowRuns] = useState(false)
    const canRetire = hasEarlyRetirement && rank >= PRESTIGE_MIN_RANK
    const retirePoints = PrestigeManager.pointsForRank(rank)
    const history = PrestigeManager.getHistory()

    return (
        <div className="prestige-page" ref={pageRef} onClick={() => setSelectedId(null)} style={pageHeight ? { height: pageHeight } : undefined}>
            <div className="prestige-header">
                <div className="prestige-header-text">
                    <h1 className="prestige-title">Prestige Upgrades</h1>
                    <span className="prestige-subtitle">{totalOwned} of {PRESTIGE_UPGRADES.length} upgrades owned</span>
                </div>
                <div className="prestige-points">
                    <span className="prestige-points-label">Prestige Points</span>
                    <span className="prestige-points-value">{prestige.points}</span>
                </div>
            </div>

            <div className="prestige-retire" onClick={e => e.stopPropagation()}>
                <div className="prestige-retire-text">
                    <b>Early Retirement</b>
                    {canRetire
                        ? <span>Retire now for <b className="prestige-gold">{retirePoints} Prestige Point{retirePoints === 1 ? '' : 's'}</b> (1 per {RANKS_PER_PRESTIGE_POINT} ranks, you are Rank {rank}). Your run resets.</span>
                        : rank >= PRESTIGE_MIN_RANK
                            ? <span>Early Retirement is waiting under Development, Upgrades. Purchase it for 250 Reputation to prestige.</span>
                            : <span>Reach Rank {PRESTIGE_MIN_RANK} and purchase Early Retirement (250 Reputation) to prestige. You are Rank {rank}.</span>}
                </div>
                <div className="prestige-retire-actions">
                    {history.length > 0 && <button className="prestige-retire-btn prestige-retire-btn-quiet" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowRuns(true) }}>Past runs ({history.length})</button>}
                    <button className={`prestige-retire-btn ${canRetire ? '' : 'prestige-buy-btn-disabled'}`} onMouseEnter={() => playHoverSound()}
                        onClick={() => { if (!canRetire) { playNotEnoughFundsSound(); return } playClickSound2(); setConfirming(true) }}>
                        Retire…
                    </button>
                </div>
            </div>

            {confirming && runStats && (
                <div className="prestige-modal-overlay" onClick={e => { e.stopPropagation(); setConfirming(false) }}>
                    <div className="prestige-modal" onClick={e => e.stopPropagation()}>
                        <h2>Retire this terminal?</h2>
                        <div className="prestige-modal-stats">
                            <span>Rank reached</span><b>{runStats.rank}</b>
                            <span>Total cash earned</span><b>{fmtCash(runStats.cash)}</b>
                            <span>Cities connected</span><b>{runStats.cities}</b>
                            <span>Developments built</span><b>{runStats.developments}</b>
                            <span>Farewells given</span><b>{runStats.farewells}</b>
                            <span>Time on this run</span><b>{fmtSpan(Date.now() - runStats.startedAt)}</b>
                        </div>
                        <div className="prestige-modal-gain">+{retirePoints} Prestige Point{retirePoints === 1 ? '' : 's'}</div>
                        <p className="prestige-modal-note"><b>Resets:</b> cash, rank, reputation, cities, developments, upgrades and milestones.</p>
                        <p className="prestige-modal-note"><b>Kept:</b> Prestige Points and upgrades, terminal name, Hyper-Link likes and your run history.</p>
                        <div className="prestige-modal-actions">
                            <button className="prestige-retire-btn prestige-retire-btn-quiet" onClick={() => { playClickSound2(); setConfirming(false) }}>Keep playing</button>
                            <button className="prestige-retire-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playFarewellAcceptSound(); onPrestige() }}>Retire</button>
                        </div>
                    </div>
                </div>
            )}

            {showRuns && (
                <div className="prestige-modal-overlay" onClick={e => { e.stopPropagation(); setShowRuns(false) }}>
                    <div className="prestige-modal prestige-modal-wide" onClick={e => e.stopPropagation()}>
                        <h2>Past runs</h2>
                        <div className="prestige-runs">
                            <div className="prestige-runs-row prestige-runs-head"><span>Run</span><span>Rank</span><span>Points</span><span>Cash earned</span><span>Time</span></div>
                            {history.map((r, i) => (
                                <div className="prestige-runs-row" key={i}>
                                    <span>{i + 1}</span><span>{r.rank}</span><span>+{r.points}</span><span>{fmtCash(r.cash)}</span><span>{fmtSpan(r.endedAt - r.startedAt)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="prestige-modal-actions">
                            <button className="prestige-retire-btn" onClick={() => { playClickSound2(); setShowRuns(false) }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="prestige-tree">
                {PRESTIGE_LAYERS.map(({ layer, cost }) => {
                    const unlocked = prestige.layerUnlocked(layer)
                    const upgrades = prestige.layerUpgrades(layer)
                    const owned = prestige.ownedInLayer(layer)
                    const prevTotal = layer > 1 ? prestige.layerUpgrades(layer - 1).length : 0
                    const prevOwned = layer > 1 ? prestige.ownedInLayer(layer - 1) : 0
                    return (
                        <div key={layer} className="prestige-layer-wrap">
                            {layer > 1 && (
                                <div className={`prestige-conduit ${unlocked ? 'prestige-conduit-open' : ''}`}>
                                    <div className="prestige-gate">
                                        <span className="prestige-gate-icon">{unlocked ? '🔓' : '🔒'}</span>
                                        <span>{unlocked ? `Layer ${layer} open` : `Own all ${prevTotal} Layer ${layer - 1} upgrade${prevTotal === 1 ? '' : 's'} to open Layer ${layer}`}</span>
                                        {!unlocked && <span className="prestige-gate-count">{prevOwned}/{prevTotal}</span>}
                                    </div>
                                </div>
                            )}
                            <div className={`prestige-layer ${unlocked ? 'prestige-layer-open' : 'prestige-layer-locked'}`}>
                                <div className="prestige-layer-header">
                                    <span className="prestige-layer-badge">{layer}</span>
                                    <span className="prestige-layer-name">Layer {layer}</span>
                                    <span className="prestige-layer-cost">{cost} point{cost === 1 ? '' : 's'} each</span>
                                    <span className="prestige-layer-count">{owned}/{upgrades.length}</span>
                                </div>
                                <div className={`prestige-rows ${upgrades.length <= CARDS_PER_ROW ? 'prestige-rows-single' : ''}`}>
                                    {chunk(upgrades, upgrades.length === 7 ? 4 : CARDS_PER_ROW).map((row, rowIndex) => (
                                        <div key={rowIndex} className="prestige-row" style={{ '--n': row.length }}>
                                            {row.map((u, colIndex) => {
                                                const isOwned = prestige.has(u.id)
                                                const canBuy = prestige.canBuy(u.id)
                                                const state = isOwned ? 'owned' : canBuy ? 'available' : unlocked ? 'unaffordable' : 'locked'
                                                const isSelected = selectedId === u.id
                                                const popReason = isSelected ? prestige.blockedReason(u.id) : null
                                                return (
                                                    <div key={u.id} className={`prestige-slot prestige-slot-${state}`}>
                                                        <button
                                                            className={`prestige-node prestige-node-${state} ${isSelected ? 'prestige-node-selected' : ''}`}
                                                            onMouseEnter={() => playHoverSound()}
                                                            onClick={e => { e.stopPropagation(); playClickSound2(); setSelectedId(isSelected ? null : u.id) }}>
                                                            <span className="prestige-node-art">
                                                                <UpgradeArt upgrade={u} className="prestige-node-img" />
                                                                <span className="prestige-node-tag">{isOwned ? '✔ Owned' : unlocked ? `${u.cost} pt${u.cost === 1 ? '' : 's'}` : '🔒'}</span>
                                                                {!u.implemented && <span className="prestige-node-soon">Coming soon</span>}
                                                            </span>
                                                            <span className="prestige-node-name">{u.name}</span>
                                                            <span className="prestige-node-desc">{u.description}</span>
                                                        </button>
                                                        {isSelected && (
                                                            <div ref={popRef} className={`prestige-pop ${colIndex >= CARDS_PER_ROW - 2 && row.length === CARDS_PER_ROW ? 'prestige-pop-left' : ''}`} onClick={e => e.stopPropagation()}>
                                                                <div className="prestige-pop-title">{u.name}</div>
                                                                <div className="prestige-pop-meta">Layer {u.layer} · {u.cost} point{u.cost === 1 ? '' : 's'}</div>
                                                                {!u.implemented && <div className="prestige-pop-soon">Not active yet. {u.pendingNote} You can still buy it; it switches on when the feature arrives.</div>}
                                                                {popReason === 'Owned'
                                                                    ? <div className="prestige-pop-owned">✔ Owned</div>
                                                                    : <>
                                                                        {!popReason && <div className="prestige-pop-after">Points after buying: <b>{prestige.points - u.cost}</b></div>}
                                                                        <button className={`prestige-buy-btn ${popReason ? 'prestige-buy-btn-disabled' : ''}`}
                                                                            onMouseEnter={() => playHoverSound()}
                                                                            onClick={() => {
                                                                                if (popReason) { playNotEnoughFundsSound(); return }
                                                                                if (prestige.buy(u.id)) { playFarewellAcceptSound(); setSelectedId(null); refresh() }
                                                                            }}>
                                                                            {popReason ?? `Buy for ${u.cost} point${u.cost === 1 ? '' : 's'}`}
                                                                        </button>
                                                                    </>}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}

export default PrestigePage

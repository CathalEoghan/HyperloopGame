import { formatCompact } from '../utils/formatCompact.js'
import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { PrestigeManager, PRESTIGE_MIN_RANK, RANKS_PER_PRESTIGE_POINT, CASH_PER_PRESTIGE_POINT } from 'Managers/PrestigeManager/PrestigeManager.js'
import { MAX_RANK } from 'Managers/RankManager/RankManager.js'
import { PRESTIGE_LAYERS, PRESTIGE_UPGRADES, PRESTIGE_VALUES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { STARTING_BALANCE } from 'Managers/ProgressionManager/economyConstants.js'
import { GRANT_RANK, GRANT_CITIES } from 'Managers/PrestigeManager/governmentGrants.js'
import { playClickSound2, playHoverSound, playFarewellAcceptSound, playSpecialChime, playNotEnoughFundsSound } from '../utils/sound.js'
import { formatBalance } from '../utils/formatBalance.js'
import padlockIcon from '../assets/misc/padlock.png'
import checkIcon from '../assets/misc/check.png'
import cashIcon from '../assets/misc/cash.png'
import PageIntroModal from '../components/PageIntroModal.jsx'
import starIcon from '../assets/misc/star.png'
import trophyIcon from '../assets/misc/trophy.svg'
import './PrestigePage.css'
import { withCashIcon } from '../utils/cashText.js'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'

// Artwork: 600px copies of the originals in assets/prestige-upgrades, named after the upgrade
const IMAGES = import.meta.glob('../assets/prestige-upgrades-thumb/*.jpg', { eager: true, import: 'default' })
// Matched ignoring case: "Cult of Celebrity" must find CultOfCelebrity.jpg
const IMAGES_BY_NAME = Object.fromEntries(Object.entries(IMAGES).map(([path, src]) => [path.split('/').pop().replace('.jpg', '').toLowerCase(), src]))
const imageFor = u => IMAGES_BY_NAME[u.name.replace(/[^A-Za-z0-9]/g, '').toLowerCase()]

const CARDS_PER_ROW = 5
const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size))

const fmtSpan = ms => {
    if (!Number.isFinite(ms) || ms < 0) return '—'
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000)
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}
// Home cities don't all use £, so cash figures (the retire confirmation, the past-runs table) show the generic cash
// icon next to the figure instead of a £ sign (same treatment as EventModal/TopBanner, bug #211 pattern). From a
// billion up, the same names as the top bar (billion, trillion … decillion), not "999000000.00 trillion" (bug #177).
const cashIconEl = <img src={cashIcon} alt="cash" className="cash-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />
// Shown next to "Owned" wherever an upgrade's owned status is flagged, in place of a plain tick
const ownedIconEl = <img src={checkIcon} alt="" style={{ width: '13px', height: '13px', verticalAlign: 'middle', marginRight: '3px', border: 'none' }} />
// Shown on a card's tag in place of a plain lock emoji, for an upgrade that's neither owned nor unlocked yet
const lockedTagIconEl = <img src={padlockIcon} alt="" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none' }} />
const fmtCashIcon = n => {
    if (!Number.isFinite(n)) return '—'
    if (n >= 999_995_000) return <>{cashIconEl}{n < 1e9 ? '1.00 billion' : formatBalance(n)}</>
    if (n >= 1e6) return <>{cashIconEl}{(n / 1e6).toFixed(2)} million</>
    return <>{cashIconEl}{Math.floor(n).toLocaleString('en-GB')}</>
}

function UpgradeArt({ upgrade, className }) {
    const src = imageFor(upgrade)
    return src
        ? <img className={className} src={src} alt="" draggable={false} />
        : <span className={`${className} prestige-art-fallback`}>{upgrade.icon}</span>
}

// Ticker bar plus bottom navigation, fixed at the bottom of the screen
// The page tucks 2px behind the ticker (which sits on top of it), so rounding or a late banner resize can never leave a gap
const BOTTOM_BARS = 100

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
        // The banner can change height after mount (fonts loading, a long name wrapping), so re-fit whenever the layout moves
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
        if (ro && pageRef.current?.parentElement) ro.observe(pageRef.current.parentElement)
        if (ro) ro.observe(document.body)
        document.fonts?.ready?.then(fit)
        return () => { window.removeEventListener('resize', fit); ro?.disconnect() }
    }, [])
    const [prestige] = useState(() => new PrestigeManager())
    const [, setTick] = useState(0)
    const [selectedId, setSelectedId] = useState(null)
    // Shown once, the first time a player opens this page - skipped entirely once they've retired, since by
    // then they already know how Prestige Points and the upgrade layers work.
    const [showIntro, setShowIntro] = useState(() =>
        PrestigeManager.getHistory().length === 0 && localStorage.getItem('hyperloop_prestige_intro_seen') !== 'true'
    )
    const closeIntro = () => { localStorage.setItem('hyperloop_prestige_intro_seen', 'true'); setShowIntro(false) }
    // Buying Best P.A. Ever tells the player it can be switched off in Settings
    const [showPAInfo, setShowPAInfo] = useState(false)
    const refresh = () => setTick(t => t + 1)
    // Points can be paid out while this page is open (Experimental Technology finishing a build), so re-read them
    useEffect(() => {
        const t = setInterval(() => { prestige.load(); refresh() }, 1000)
        return () => clearInterval(t)
    }, [])

    const popRef = useRef(null)
    // Bring the buy popover into view when an upgrade is picked near the bottom of the list
    useEffect(() => { popRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [selectedId])
    const totalOwned = prestige.owned.length

    // Early Retirement: the way to prestige
    const [confirming, setConfirming] = useState(false)
    const [showRuns, setShowRuns] = useState(false)
    const canRetire = hasEarlyRetirement && rank >= PRESTIGE_MIN_RANK
    const rankPoints = PrestigeManager.pointsForRank(rank)
    const cashPoints = PrestigeManager.pointsForCash(runStats?.cash ?? 0)
    const retirePoints = rankPoints + cashPoints
    // How the payout adds up, and how far away the next step is (worth knowing before retiring)
    const pointsPerStep = PrestigeManager.pointsForRank(RANKS_PER_PRESTIGE_POINT)
    // The same for cash: 1 per £500M, or 2 with Quick Learner (pointsForCash doubles it just as pointsForRank does) -
    // the text below used to say "1" whatever was owned
    const cashPointsPerStep = PrestigeManager.pointsForCash(CASH_PER_PRESTIGE_POINT)
    const payoutSteps = Math.floor(rank / RANKS_PER_PRESTIGE_POINT)
    const nextStepRank = (payoutSteps + 1) * RANKS_PER_PRESTIGE_POINT
    // The next £500M milestone, the cash equivalent of nextStepRank above
    const cashSteps = Math.floor((runStats?.cash ?? 0) / CASH_PER_PRESTIGE_POINT)
    const nextCashStep = (cashSteps + 1) * CASH_PER_PRESTIGE_POINT
    // How far into the current rank block and £500M block the run is, for the two progress bars in the retire dialog
    const rankProgress = Math.min(1, (rank % RANKS_PER_PRESTIGE_POINT) / RANKS_PER_PRESTIGE_POINT)
    const cashProgress = Math.min(1, ((runStats?.cash ?? 0) % CASH_PER_PRESTIGE_POINT) / CASH_PER_PRESTIGE_POINT)
    // What this payout buys: the next layer that isn't complete yet, how many of its upgrades the new total covers
    const pointsAfter = prestige.points + retirePoints
    const nextLayer = PRESTIGE_LAYERS.find(l => !prestige.layerComplete(l.layer))
    const nextLayerLeft = nextLayer ? prestige.layerUpgrades(nextLayer.layer).length - prestige.ownedInLayer(nextLayer.layer) : 0
    const affordableInLayer = nextLayer ? Math.min(nextLayerLeft, Math.floor(pointsAfter / nextLayer.cost)) : 0
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
    // What the next run starts with: the standard starting cash, plus the Sign-On Bonus if it is owned
    const signOn = PrestigeManager.owns('signOnBonus')
    const nextRunCash = STARTING_BALANCE + (signOn ? PRESTIGE_VALUES.signOnBonus : 0)
    // Retiring wipes the run, so it takes a second click; closing the dialog disarms it
    const [armed, setArmed] = useState(false)
    const closeConfirm = () => { setArmed(false); setConfirming(false) }

    // Escape closes what is open on this page before the page-level Escape (back to Home) gets a turn: an open upgrade
    // popover, then the past-runs list or the retire confirmation (the confirmation just closes - nothing is retired)
    useEscapeToClose(() => { playClickSound2(); setSelectedId(null) }, selectedId !== null)
    useEscapeToClose(() => { playClickSound2(); setShowRuns(false) }, showRuns)
    useEscapeToClose(() => { playClickSound2(); closeConfirm() }, confirming)
    const history = PrestigeManager.getHistory()

    return (
        <div className="prestige-page" ref={pageRef} onClick={() => setSelectedId(null)} style={pageHeight ? { height: pageHeight } : undefined}>
            {showIntro && (
                <PageIntroModal title="Welcome to Prestige" onClose={closeIntro} points={[
                    { icon: starIcon, text: <>Once you've unlocked <strong>Early Retirement</strong>, retiring ends this run early in exchange for Prestige Points - earned from both your rank and the cash you've made this run.</> },
                    { icon: padlockIcon, text: <>Spend Prestige Points on <strong>permanent upgrades</strong> across several layers - each layer unlocks once every upgrade in the one before it is owned.</> },
                    { icon: trophyIcon, text: <>Prestige Points and upgrades are <strong>kept forever</strong>, even after retiring - only the current run's cash, rank, Reputation, cities, developments and milestones reset.</> },
                ]} />
            )}
            {showPAInfo && (
                <PageIntroModal title="Best P.A. Ever" onClose={() => setShowPAInfo(false)} points={[
                    { icon: starIcon, text: <>Your assistant now <strong>presses Work for you</strong>, all day long, even while you're busy elsewhere.</> },
                    { icon: padlockIcon, text: <>Prefer to press it yourself? You can <strong>switch Best P.A. Ever off</strong> any time in <strong>Settings</strong>, under <strong>Terminal</strong>.</> },
                ]} />
            )}
            <div className="prestige-header">
                <div className="prestige-header-text">
                    <h1 className="prestige-title">Prestige Upgrades</h1>
                    <span className="prestige-subtitle">{totalOwned} of {PRESTIGE_UPGRADES.length} upgrades owned • All bonuses are multiplicative</span>
                </div>
                <div className="prestige-points">
                    <span className="prestige-points-label">Prestige Points</span>
                    <span className="prestige-points-value">{formatCompact(prestige.points, 1e9)}</span>
                </div>
            </div>

            <div className="prestige-retire" onClick={e => e.stopPropagation()}>
                <div className="prestige-retire-text">
                    <b>Early Retirement</b>
                    {canRetire
                        ? <span>Retire now for <b className="prestige-gold">{retirePoints} Prestige Point{retirePoints === 1 ? '' : 's'}</b> ({pointsPerStep} per {RANKS_PER_PRESTIGE_POINT} ranks, {cashPointsPerStep} per {cashIconEl}{(CASH_PER_PRESTIGE_POINT / 1e6)}M earned - you are Rank {rank}). Your run resets.</span>
                        : rank >= PRESTIGE_MIN_RANK
                            ? <span>Early Retirement is waiting under Development, Upgrades. Purchase it for 50 Reputation to prestige.</span>
                            : <span>Reach Rank {PRESTIGE_MIN_RANK} and purchase Early Retirement (50 Reputation) to prestige. You are Rank {rank}.</span>}
                </div>
                <div className="prestige-retire-actions">
                    {history.length > 0 && <button className="prestige-retire-btn prestige-retire-btn-quiet" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setShowRuns(true) }}>Past Runs ({history.length})</button>}
                    <button className={`prestige-retire-btn ${canRetire ? '' : 'prestige-buy-btn-disabled'}`} onMouseEnter={() => playHoverSound()}
                        onClick={() => { if (!canRetire) { playNotEnoughFundsSound(); return } playClickSound2(); setConfirming(true) }}>
                        Retire…
                    </button>
                </div>
            </div>

            {confirming && runStats && (
                <div className="prestige-modal-overlay" onClick={e => { e.stopPropagation(); closeConfirm() }}>
                    {/* The content scrolls and the buttons stay pinned underneath it, so on a shorter window Keep playing and
                        Retire… are never pushed out of sight at the bottom */}
                    <div className="prestige-modal prestige-modal-retire" onClick={e => e.stopPropagation()}>
                        <div className="prestige-modal-scroll">
                            <h2 style={{ textAlign: 'center' }}>Retire this terminal?</h2>
                            <p className="prestige-modal-sub" style={{ textAlign: 'center' }}>This ends your run and pays out Prestige Points.</p>

                            <div className="prestige-reward">
                                <span className="prestige-reward-label">You will earn</span>
                                <span className="prestige-reward-value">+{retirePoints}</span>
                                <div className="prestige-progress">
                                    <div className="prestige-progress-row">
                                        <div className="prestige-progress-line">
                                            <span>Rank {rank} · <b>+{rankPoints}</b></span>
                                            {nextStepRank <= MAX_RANK && <span>{nextStepRank - rank} more ranks for +{pointsPerStep}</span>}
                                        </div>
                                        <div className="prestige-bar" role="progressbar" aria-label="Progress to the next rank point" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rankProgress * 100)}>
                                            <div className="prestige-bar-fill" style={{ width: `${rankProgress * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="prestige-progress-row">
                                        <div className="prestige-progress-line">
                                            <span>{fmtCashIcon(runStats?.cash ?? 0)} earned · <b>+{cashPoints}</b></span>
                                            <span>{fmtCashIcon(nextCashStep - (runStats?.cash ?? 0))} more for +{cashPointsPerStep}</span>
                                        </div>
                                        <div className="prestige-bar" role="progressbar" aria-label="Progress to the next cash point" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cashProgress * 100)}>
                                            <div className="prestige-bar-fill" style={{ width: `${cashProgress * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <span className="prestige-reward-balance">Prestige Points: {formatCompact(prestige.points, 1e9)} → <b>{formatCompact(pointsAfter, 1e9)}</b></span>
                                {nextLayer && (affordableInLayer > 0
                                    ? <span className="prestige-reward-buys">Enough for {plural(affordableInLayer, 'Layer ' + nextLayer.layer + ' upgrade')} ({plural(nextLayer.cost, 'point')} each)</span>
                                    : <span className="prestige-reward-buys">A Layer {nextLayer.layer} upgrade costs {plural(nextLayer.cost, 'point')}: you'd need {nextLayer.cost - pointsAfter} more</span>)}
                            </div>

                            <div className="prestige-modal-stats">
                                <span>Total cash earned</span><b>{fmtCashIcon(runStats.cash)}</b>
                                <span>Cities connected</span><b>{runStats.cities}</b>
                                <span>Time on this run</span><b>{fmtSpan(Date.now() - runStats.startedAt)}</b>
                            </div>
                            <p className="prestige-modal-also">Also: {plural(runStats.developments, 'development')} built · {plural(runStats.farewells, 'farewell')} · {plural(runStats.greets, 'greet')}</p>

                            <div className="prestige-reset-keep">
                                <div className="prestige-reset">
                                    <h4>Resets</h4>
                                    <ul>
                                        <li>Cash and rank (Rank {rank})</li>
                                        <li>Reputation ({runStats.reputation})</li>
                                        <li>Cities ({runStats.cities})</li>
                                        <li>Developments and upgrades ({runStats.developments})</li>
                                        <li>Milestones ({runStats.milestones})</li>
                                        {runStats.underConstruction > 0 && <li>Work in progress ({runStats.underConstruction})</li>}
                                    </ul>
                                </div>
                                <div className="prestige-keep">
                                    <h4>Kept</h4>
                                    <ul>
                                        <li>Prestige Points and upgrades</li>
                                        <li>Shop purchases</li>
                                        <li>Achievements</li>
                                        <li>Terminal name</li>
                                        <li>Hyper-Link likes</li>
                                        <li>Run history</li>
                                    </ul>
                                </div>
                            </div>

                            <p className="prestige-next-run">
                                <b>Your next run:</b> {PrestigeManager.owns('governmentGrants')
                                    ? <>back to Rank {GRANT_RANK} with {GRANT_CITIES} extra cities already unlocked (Government Grants), and </>
                                    : <>back to Rank 1 with </>}{fmtCashIcon(nextRunCash)}{signOn ? ' (Sign-On Bonus included)' : ''}
                                {runStats.home ? <>, starting from {runStats.home}. You can pick a different home terminal first.</> : '.'}
                            </p>
                        </div>

                        <div className="prestige-modal-actions">
                            <button className="prestige-retire-btn prestige-keep-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); closeConfirm() }}>Keep playing</button>
                            {armed
                                ? <button className="prestige-retire-btn prestige-retire-danger" onMouseEnter={() => playHoverSound()} onClick={() => { playFarewellAcceptSound(); onPrestige() }}>Yes, retire and reset</button>
                                : <button className="prestige-retire-btn prestige-retire-btn-quiet" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setArmed(true) }}>Retire…</button>}
                        </div>
                    </div>
                </div>
            )}

            {showRuns && (
                <div className="prestige-modal-overlay" onClick={e => { e.stopPropagation(); setShowRuns(false) }}>
                    <div className="prestige-modal prestige-modal-wide" onClick={e => e.stopPropagation()}>
                        <h2 style={{ textAlign: 'center' }}>Past Runs</h2>
                        <div className="prestige-runs">
                            <div className="prestige-runs-row prestige-runs-head"><span>Run</span><span>Rank</span><span>Points</span><span>Cash earned</span><span>Time</span></div>
                            {history.map((r, i) => (
                                <div className="prestige-runs-row" key={i}>
                                    <span>{i + 1}</span><span>{r.rank}</span><span>+{r.points}</span><span>{fmtCashIcon(r.cash)}</span><span>{fmtSpan(r.endedAt - r.startedAt)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="prestige-modal-actions">
                            <button className="prestige-retire-btn" onClick={() => { playClickSound2(); setShowRuns(false) }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`prestige-tree-wrap ${history.length === 0 ? 'prestige-tree-wrap-locked' : ''}`}>
            {history.length === 0 && (
                <div className="prestige-tree-lock-overlay">
                    <img className="prestige-tree-lock-icon" src={padlockIcon} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain', border: 'none' }} />
                    <span className="prestige-tree-lock-text">PRESTIGE UPGRADES LOCKED.<br />RETIRE AT RANK {PRESTIGE_MIN_RANK} TO UNLOCK PRESTIGE UPGRADES.</span>
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
                                        <span className="prestige-gate-icon">
                                            {unlocked
                                                ? <img src={checkIcon} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain', border: 'none', verticalAlign: 'middle' }} />
                                                : <img src={padlockIcon} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain', border: 'none', verticalAlign: 'middle' }} />}
                                        </span>
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
                                                                <span className="prestige-node-tag">{isOwned ? <>{ownedIconEl}Owned</> : unlocked ? `${u.cost} pt${u.cost === 1 ? '' : 's'}` : lockedTagIconEl}</span>
                                                                {!u.implemented && <span className="prestige-node-soon">Coming soon</span>}
                                                            </span>
                                                            <span className="prestige-node-name">{u.name}</span>
                                                            <span className="prestige-node-desc">{withCashIcon(u.description)}</span>
                                                        </button>
                                                        {isSelected && (
                                                            <div ref={popRef} className={`prestige-pop ${colIndex >= CARDS_PER_ROW - 2 && row.length === CARDS_PER_ROW ? 'prestige-pop-left' : ''}`} onClick={e => e.stopPropagation()}>
                                                                <div className="prestige-pop-title">{u.name}</div>
                                                                <div className="prestige-pop-meta">Layer {u.layer} · {u.cost} point{u.cost === 1 ? '' : 's'}</div>
                                                                {!u.implemented && <div className="prestige-pop-soon">Not active yet. {u.pendingNote} You can still buy it; it switches on when the feature arrives.</div>}
                                                                {popReason === 'Owned'
                                                                    ? <div className="prestige-pop-owned">{ownedIconEl}Owned</div>
                                                                    : <>
                                                                        {!popReason && <div className="prestige-pop-after">Points after buying: <b>{prestige.points - u.cost}</b></div>}
                                                                        <button className={`prestige-buy-btn ${popReason ? 'prestige-buy-btn-disabled' : ''}`}
                                                                            onMouseEnter={() => playHoverSound()}
                                                                            onClick={() => {
                                                                                if (popReason) { playNotEnoughFundsSound(); return }
                                                                                if (prestige.buy(u.id)) { playSpecialChime(); setSelectedId(null); refresh(); if (u.id === 'bestPAEver') setShowPAInfo(true) }
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

        </div>
    )
}

export default PrestigePage

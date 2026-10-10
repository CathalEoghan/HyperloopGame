import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { PRESTIGE_LAYERS, PRESTIGE_UPGRADES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { playClickSound2, playHoverSound, playFarewellAcceptSound, playNotEnoughFundsSound } from '../utils/sound.js'
import './PrestigePage.css'

// Artwork: 600px copies of the originals in assets/prestige-upgrades, named after the upgrade
const IMAGES = import.meta.glob('../assets/prestige-upgrades-thumb/*.jpg', { eager: true, import: 'default' })
const imageFor = u => IMAGES[`../assets/prestige-upgrades-thumb/${u.name.replace(/[^A-Za-z0-9]/g, '')}.jpg`]

const CARDS_PER_ROW = 5
const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size))

function UpgradeArt({ upgrade, className }) {
    const src = imageFor(upgrade)
    return src
        ? <img className={className} src={src} alt="" draggable={false} />
        : <span className={`${className} prestige-art-fallback`}>{upgrade.icon}</span>
}

// Ticker bar plus bottom navigation, fixed at the bottom of the screen
const BOTTOM_BARS = 102

function PrestigePage() {
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
                                    <div className="prestige-conduit-track">
                                        <div className="prestige-conduit-fill" style={{ height: `${(prevOwned / prevTotal) * 100}%` }} />
                                    </div>
                                    <div className="prestige-gate">
                                        <span className="prestige-gate-icon">{unlocked ? '🔓' : '🔒'}</span>
                                        <span>{unlocked ? `Layer ${layer} open` : `Own all ${prevTotal} Layer ${layer - 1} upgrade${prevTotal === 1 ? '' : 's'} to open Layer ${layer}`}</span>
                                        {!unlocked && <span className="prestige-gate-count">{prevOwned}/{prevTotal}</span>}
                                    </div>
                                    <div className="prestige-conduit-track prestige-conduit-track-short">
                                        <div className="prestige-conduit-fill" style={{ height: unlocked ? '100%' : '0%' }} />
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
                                                            </span>
                                                            <span className="prestige-node-name">{u.name}</span>
                                                            <span className="prestige-node-desc">{u.description}</span>
                                                        </button>
                                                        {isSelected && (
                                                            <div ref={popRef} className={`prestige-pop ${colIndex >= CARDS_PER_ROW - 2 && row.length === CARDS_PER_ROW ? 'prestige-pop-left' : ''}`} onClick={e => e.stopPropagation()}>
                                                                <div className="prestige-pop-title">{u.name}</div>
                                                                <div className="prestige-pop-meta">Layer {u.layer} · {u.cost} point{u.cost === 1 ? '' : 's'}</div>
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

import { useState, useRef, useLayoutEffect } from 'react'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { PRESTIGE_LAYERS, PRESTIGE_UPGRADES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { playClickSound2, playHoverSound, playFarewellAcceptSound, playNotEnoughFundsSound } from '../utils/sound.js'
import './PrestigePage.css'

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

    const selected = PRESTIGE_UPGRADES.find(u => u.id === selectedId) ?? null
    const reason = selected ? prestige.blockedReason(selected.id) : null

    return (
        <div className="prestige-page" ref={pageRef} style={pageHeight ? { height: pageHeight } : undefined}>
            <div className="prestige-header">
                <h1 className="prestige-title">Prestige Upgrades</h1>
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
                    return (
                        <div key={layer} className="prestige-layer-wrap">
                            {layer > 1 && (
                                <div className={`prestige-spine ${unlocked ? 'prestige-spine-open' : ''}`}>
                                    <span className="prestige-spine-label">
                                        {unlocked ? '🔓' : '🔒'} {unlocked ? `Layer ${layer} open` : `Own all ${prestige.layerUpgrades(layer - 1).length} Layer ${layer - 1} upgrade${prestige.layerUpgrades(layer - 1).length === 1 ? '' : 's'} to open Layer ${layer}`}
                                    </span>
                                </div>
                            )}
                            <div className={`prestige-layer ${unlocked ? '' : 'prestige-layer-locked'}`}>
                                <div className="prestige-layer-header">
                                    <span className="prestige-layer-name">Layer {layer}</span>
                                    <span className="prestige-layer-cost">{cost} point{cost === 1 ? '' : 's'} each</span>
                                    <span className="prestige-layer-count">{owned}/{upgrades.length}</span>
                                </div>
                                <div className="prestige-nodes">
                                    {upgrades.map(u => {
                                        const isOwned = prestige.has(u.id)
                                        const canBuy = prestige.canBuy(u.id)
                                        const cls = ['prestige-node',
                                            isOwned ? 'prestige-node-owned' : canBuy ? 'prestige-node-available' : unlocked ? 'prestige-node-unaffordable' : 'prestige-node-locked',
                                            selectedId === u.id ? 'prestige-node-selected' : ''].join(' ')
                                        return (
                                            <button key={u.id} className={cls}
                                                onMouseEnter={() => playHoverSound()}
                                                onClick={() => { playClickSound2(); setSelectedId(u.id) }}>
                                                <span className="prestige-node-name">{u.name}</span>
                                                <span className="prestige-node-tag">{isOwned ? '✔ Owned' : unlocked ? `${u.cost} pt${u.cost === 1 ? '' : 's'}` : '🔒'}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="prestige-detail">
                {selected ? (
                    <>
                        <div className="prestige-detail-text">
                            <span className="prestige-detail-name">{selected.name} <span className="prestige-detail-cost">· Layer {selected.layer} · {selected.cost} point{selected.cost === 1 ? '' : 's'}</span></span>
                            <span className="prestige-detail-desc">{selected.description}</span>
                        </div>
                        {reason === 'Owned'
                            ? <span className="prestige-detail-owned">✔ Owned</span>
                            : <button className={`prestige-buy-btn ${reason ? 'prestige-buy-btn-disabled' : ''}`}
                                onMouseEnter={() => playHoverSound()}
                                onClick={() => {
                                    if (reason) { playNotEnoughFundsSound(); return }
                                    if (prestige.buy(selected.id)) { playFarewellAcceptSound(); refresh() }
                                }}>
                                {reason ?? `Buy for ${selected.cost} point${selected.cost === 1 ? '' : 's'}`}
                            </button>}
                    </>
                ) : (
                    <span className="prestige-detail-hint">Tap an upgrade to see what it does.</span>
                )}
            </div>
        </div>
    )
}

export default PrestigePage

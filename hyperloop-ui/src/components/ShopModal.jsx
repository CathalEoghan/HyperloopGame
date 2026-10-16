import { useState } from 'react'
import { SHOP_CATEGORIES, SHOP_ITEMS } from '../data/shopCatalog.js'
import { isOwned } from '../utils/cosmetics.js'
import { fullVarsFor } from '../data/shopCatalog.js'
import { playClickSound2, playHoverSound, playNotEnoughFundsSound, playPreviewSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import './ShopModal.css'

// A small mock of whatever the theme changes, drawn with the theme's own colours. The colours are set as CSS variables on
// the preview itself (every property filled in, see fullVarsFor), and the mock's CSS in ShopModal.css reads the same
// variables as the real game, so a new theme gets a correct preview with nothing extra to make.
function ThemePreview({ categoryId, item }) {
    return (
        <div className={`shop-preview shop-preview-${categoryId}`} style={fullVarsFor(categoryId, item)} aria-hidden="true">
            {categoryId === 'boardTheme' && (
                <div className="pv-board">
                    <div className="pv-board-head"><span>DESTINATION</span><span>DEPARTS</span><span>STATUS</span></div>
                    <div className="pv-board-row"><span>LONDON</span><span>14:20</span><span>BOARDING</span></div>
                    <div className="pv-board-row"><span>TOKYO</span><span>14:35</span><span>ON TIME</span></div>
                    <div className="pv-board-row"><span>PARIS</span><span>14:50</span><span>DELAYED</span></div>
                </div>
            )}
            {categoryId === 'hyperLinkTheme' && (
                <div className="pv-hl">
                    <div className="pv-hl-head">Hyper-Link</div>
                    <div className="pv-hl-post"><b>Rin Brady</b><span>I didn't even recognise the cat café!</span></div>
                    <div className="pv-hl-post pv-hl-official"><b>Official</b><span>Passengers have been compensated.</span></div>
                </div>
            )}
            {categoryId === 'generalTheme' && (
                <div className="pv-gen">
                    <div className="pv-gen-top"><span className="pv-gen-name">Your Terminal</span><span className="pv-gen-work">Work</span></div>
                    <svg className="pv-gen-globe" viewBox="0 0 120 46">
                        <circle cx="60" cy="52" r="40" className="pv-gen-planet" />
                        <path d="M22 40 Q 48 -4 78 30" className="pv-gen-arc-dep" />
                        <path d="M46 44 Q 84 2 106 32" className="pv-gen-arc-arr" />
                    </svg>
                    <div className="pv-gen-ticker">Welcome to the terminal. Thank you for travelling…</div>
                    <div className="pv-gen-tabs"><span>Cities</span><span className="pv-gen-tab-on">Development</span><span>Progress</span></div>
                </div>
            )}
        </div>
    )
}

// The Shop. It only shows things and reports clicks: App does the buying (it owns Reputation) and the equipping.
//   cosmetics: { owned, equipped } as read by utils/cosmetics.js
//   onBuy(category, item) -> true when it was bought (and equipped)
//   onEquip(category, item)
function ShopModal({ reputation, cosmetics, onBuy, onEquip, onClose }) {
    const [categoryId, setCategoryId] = useState(SHOP_CATEGORIES[0].id)
    const [shaking, setShaking] = useState(null)
    const category = SHOP_CATEGORIES.find(c => c.id === categoryId)
    const items = SHOP_ITEMS[categoryId] || []
    const equippedId = cosmetics.equipped[categoryId] && isOwned(cosmetics, categoryId, cosmetics.equipped[categoryId]) ? cosmetics.equipped[categoryId] : 'default'

    const handleBuy = (item) => {
        if (onBuy(categoryId, item)) { playClickSound2(); return }
        playNotEnoughFundsSound()
        setShaking(item.id)
        setTimeout(() => setShaking(null), 400)
    }

    return (
        <div className="shop-overlay" onClick={onClose}>
            <div className="shop-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Shop">
                <div className="shop-header">
                    <h2 className="shop-title">Shop</h2>
                    <div className="shop-balance" title="Your Reputation"><img src={reputationIcon} alt="Reputation" /> {Math.floor(reputation)}</div>
                    <button className="shop-close" onClick={() => { playClickSound2(); onClose() }} onMouseEnter={() => playHoverSound()}>✕ Close</button>
                </div>

                <div className="shop-tabs">
                    {SHOP_CATEGORIES.map(c => (
                        <button key={c.id} className={`shop-tab${c.id === categoryId ? ' shop-tab-active' : ''}`}
                            onClick={() => { if (c.id !== categoryId) { playClickSound2(); setCategoryId(c.id) } }}
                            onMouseEnter={() => playHoverSound()}>{c.name}</button>
                    ))}
                </div>
                <p className="shop-blurb">{category.blurb}</p>

                <div className="shop-grid">
                    {items.map(item => {
                        const owned = isOwned(cosmetics, categoryId, item.id)
                        const equipped = owned && equippedId === item.id
                        return (
                            <div key={item.id} className={`shop-item${equipped ? ' shop-item-equipped' : ''}${shaking === item.id ? ' shop-item-shake' : ''}`}>
                                <div className="shop-item-name">{item.name}</div>
                                {item.vars && <ThemePreview categoryId={categoryId} item={item} />}
                                {item.description && <div className="shop-item-desc">{item.description}</div>}
                                <div className="shop-item-actions">
                                    {item.src && (
                                        <button className="shop-btn shop-btn-ghost" onClick={() => playPreviewSound(item.src)} onMouseEnter={() => playHoverSound()}>▶ Preview</button>
                                    )}
                                    {equipped ? (
                                        <span className="shop-equipped">Equipped</span>
                                    ) : owned ? (
                                        <button className="shop-btn" onClick={() => { playClickSound2(); onEquip(categoryId, item) }} onMouseEnter={() => playHoverSound()}>Equip</button>
                                    ) : (
                                        <button className={`shop-btn shop-btn-buy${reputation < item.cost ? ' shop-btn-poor' : ''}`} onClick={() => handleBuy(item)} onMouseEnter={() => playHoverSound()}>
                                            <img src={reputationIcon} alt="" /> {item.cost}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ShopModal

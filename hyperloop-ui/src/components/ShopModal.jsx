import { useState, useEffect } from 'react'
import { SHOP_CATEGORIES, SHOP_ITEMS, SHOP_BUNDLES, TIERS, fullVarsFor, THEME_PICS } from '../data/shopCatalog.js'
import { isOwned, isBundleOwned, bundlePieces, bundlePrice } from '../utils/cosmetics.js'
import { playClickSound2, playHoverSound, playNotEnoughFundsSound, playPreviewSound, playWorkSoundPreview, stopPreviewSound } from '../utils/sound.js'
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
            {categoryId === 'cursorTheme' && (
                <div className="pv-cursor" style={{ cursor: 'var(--cursor-pointer)' }}>Hover to try it</div>
            )}
        </div>
    )
}

// Every piece of a themed bundle shares one id (the Fairy work sound, Fairy board, Fairy general theme... are
// all id 'fairy'), so a card's own item.id is also the key into THEME_PICS. When that theme has a photo, the
// card gets it dimmed into its background, with a border in that theme's own General-theme accent colour (e.g.
// Poltergeist's spooky green) - a plain accent recolour (no THEME_PICS entry) is left exactly as it looks today.
function themedCardStyle(id) {
    const pic = THEME_PICS[id]
    if (!pic) return {}
    const accent = SHOP_ITEMS.generalTheme.find(i => i.id === id)?.vars?.['--ui-accent']
    return {
        backgroundImage: `linear-gradient(rgba(255, 250, 244, 0.86), rgba(255, 250, 244, 0.86)), url(${pic})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...(accent ? { borderColor: accent } : {}),
    }
}

// Short chip labels for a bundle's pieces - SHOP_CATEGORIES' own names ("General themes") read fine as a tab but
// are too long next to four others on one card, so a bundle piece gets a shorter one instead.
const PIECE_LABELS = { generalTheme: 'General', boardTheme: 'Board', hyperLinkTheme: 'Hyper-Link', workSound: 'Work sound', cursorTheme: 'Cursor' }
const BUNDLES_TAB = { id: 'bundles', name: 'Bundles', blurb: 'One item from every category, under a single theme - buy the pieces you don’t have yet for 20% off their combined price.' }

// The Shop. It only shows things and reports clicks: App does the buying (it owns Reputation) and the equipping.
//   cosmetics: { owned, equipped } as read by utils/cosmetics.js
//   onBuy(category, item) -> true when it was bought (and equipped)
//   onEquip(category, item)
//   onBuyBundle(bundle) -> true when every not-yet-owned piece was bought (and all equipped)
//   onEquipBundle(bundle)
function ShopModal({ reputation, cosmetics, onBuy, onEquip, onBuyBundle, onEquipBundle, onClose }) {
    const [categoryId, setCategoryId] = useState(SHOP_CATEGORIES[0].id)
    const [shaking, setShaking] = useState(null)
    // Whatever Preview sound is playing shouldn't keep going once the Shop is gone, however it closed
    // (the Close button, clicking outside, or switching tabs away from Home).
    useEffect(() => () => stopPreviewSound(), [])
    const isBundlesTab = categoryId === 'bundles'
    const category = isBundlesTab ? BUNDLES_TAB : SHOP_CATEGORIES.find(c => c.id === categoryId)
    const items = SHOP_ITEMS[categoryId] || []
    const equippedId = cosmetics.equipped[categoryId] && isOwned(cosmetics, categoryId, cosmetics.equipped[categoryId]) ? cosmetics.equipped[categoryId] : 'default'

    const handleBuy = (item) => {
        if (onBuy(categoryId, item)) { playClickSound2(); return }
        playNotEnoughFundsSound()
        setShaking(item.id)
        setTimeout(() => setShaking(null), 400)
    }
    const handleBundleBuy = (bundle) => {
        if (onBuyBundle(bundle)) { playClickSound2(); return }
        playNotEnoughFundsSound()
        setShaking(bundle.id)
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
                    {[...SHOP_CATEGORIES, BUNDLES_TAB].map(c => (
                        <button key={c.id} className={`shop-tab${c.id === categoryId ? ' shop-tab-active' : ''}`}
                            onClick={() => { if (c.id !== categoryId) { playClickSound2(); setCategoryId(c.id) } }}
                            onMouseEnter={() => playHoverSound()}>{c.name}</button>
                    ))}
                </div>
                <p className="shop-blurb">{category.blurb}</p>

                {isBundlesTab ? (
                    <div className="shop-groups">
                        <div className="shop-grid shop-bundle-grid">
                            {SHOP_BUNDLES.map(bundle => {
                                const owned = isBundleOwned(cosmetics, bundle)
                                const locked = bundle.tier === 'premium' && !owned
                                const price = bundlePrice(cosmetics, bundle)
                                return (
                                    <div key={bundle.id} className={`shop-item shop-bundle-card${locked ? ' shop-item-locked' : ''}${shaking === bundle.id ? ' shop-item-shake' : ''}`} style={themedCardStyle(bundle.id)}>
                                        <div className="shop-item-name">
                                            {bundle.name}
                                            <span className={`shop-bundle-badge shop-bundle-badge-${bundle.tier}`}>{bundle.tier === 'premium' ? 'Premium' : 'Special'}</span>
                                            {locked && <span className="shop-item-lock" aria-hidden="true">🔒</span>}
                                        </div>
                                        <div className="shop-item-desc">{bundle.blurb}</div>
                                        <div className="shop-bundle-pieces">
                                            {bundlePieces(bundle).map(({ category: pc, id, item }) => (
                                                <span key={pc} className={`shop-bundle-piece${isOwned(cosmetics, pc, id) ? ' shop-bundle-piece-owned' : ''}`}>
                                                    {PIECE_LABELS[pc]}: {item.name}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="shop-item-actions">
                                            {locked ? (
                                                <span className="shop-locked-note">Coming with the Supporter's Set</span>
                                            ) : owned ? (
                                                <button className="shop-btn" onClick={() => { playClickSound2(); onEquipBundle(bundle) }} onMouseEnter={() => playHoverSound()}>Equip all</button>
                                            ) : (
                                                <button className={`shop-btn shop-btn-buy${reputation < price ? ' shop-btn-poor' : ''}`} onClick={() => handleBundleBuy(bundle)} onMouseEnter={() => playHoverSound()}>
                                                    <img src={reputationIcon} alt="" /> {price}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                <div className="shop-groups">
                    {TIERS.map(tier => {
                        const tierItems = items.filter(item => (item.tier || 'standard') === tier.id)
                        if (tierItems.length === 0) return null
                        return (
                            <div key={tier.id} className="shop-tier-group">
                                <div className={`shop-tier-heading shop-tier-heading-${tier.id}`}>{tier.name}</div>
                                <div className="shop-grid">
                                    {tierItems.map(item => {
                                        const locked = tier.id === 'supporter' && !isOwned(cosmetics, categoryId, item.id)
                                        const owned = isOwned(cosmetics, categoryId, item.id)
                                        const equipped = owned && equippedId === item.id
                                        return (
                                            <div key={item.id} className={`shop-item${equipped ? ' shop-item-equipped' : ''}${locked ? ' shop-item-locked' : ''}${shaking === item.id ? ' shop-item-shake' : ''}`} style={themedCardStyle(item.id)}>
                                                <div className="shop-item-name">{item.name}{locked && <span className="shop-item-lock" aria-hidden="true">🔒</span>}</div>
                                                {item.vars && <ThemePreview categoryId={categoryId} item={item} />}
                                                {item.description && <div className="shop-item-desc">{item.description}</div>}
                                                <div className="shop-item-actions">
                                                    {locked ? (
                                                        <span className="shop-locked-note">Coming with the Supporter's Set</span>
                                                    ) : (
                                                        <>
                                                            {(item.src || item.srcs) && (
                                                                <button className="shop-btn shop-btn-ghost" onClick={() => (categoryId === 'workSound' ? playWorkSoundPreview : playPreviewSound)(item.srcs || item.src)} onMouseEnter={() => playHoverSound()}>▶ Preview</button>
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
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
                )}
            </div>
        </div>
    )
}

export default ShopModal

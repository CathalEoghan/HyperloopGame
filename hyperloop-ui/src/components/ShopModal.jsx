import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SHOP_CATEGORIES, SHOP_ITEMS, SHOP_BUNDLES, TIERS, fullVarsFor, THEME_PICS, FEATURED_THEME_ID, FEATURED_TAGLINE } from '../data/shopCatalog.js'
import { isOwned, isBundleOwned, bundlePieces, bundlePrice, getEquippedItem } from '../utils/cosmetics.js'
import { playClickSound2, playHoverSound, playNotEnoughFundsSound, playPreviewSound, playWorkSoundPreview, stopPreviewSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import paletteIcon from '../assets/misc/palette.png'
import boardIcon from '../assets/misc/board.png'
import portfolioIcon from '../assets/misc/portfolio.png'
import chatIcon from '../assets/misc/chat.png'
import musicIcon from '../assets/misc/music.png'
import clickIcon from '../assets/misc/click.png'
import giftIcon from '../assets/misc/gift.png'
import './ShopModal.css'

// One icon per sidebar entry, shown in its own square to the left of the category name.
const NAV_ICONS = {
    generalTheme: paletteIcon,
    boardTheme: boardIcon,
    workSound: portfolioIcon,
    hyperLinkTheme: chatIcon,
    openingAudio: musicIcon,
    cursorTheme: clickIcon,
    bundles: giftIcon,
}

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

// Full names for a bundle's pieces (shown as a hover tooltip on its chip) and a short initial for the chip
// itself - five lines of plain text per bundle card didn't scale, so a compact row of badges takes their place.
const PIECE_LABELS = { generalTheme: 'General theme', boardTheme: 'Board theme', hyperLinkTheme: 'Hyper-Link theme', workSound: 'Work sound', cursorTheme: 'Cursor' }
const PIECE_CHIPS = { generalTheme: 'Gen', boardTheme: 'Brd', hyperLinkTheme: 'HL', workSound: 'Wrk', cursorTheme: 'Cur' }
const BUNDLES_TAB = { id: 'bundles', name: 'Bundles', blurb: 'One item from every category, under a single theme - buy the pieces you don’t have yet for 20% off their combined price.' }

// How many more Reputation points are needed to afford something, for the "Need N more" note next to a Buy
// button that's currently out of reach - null when it's already affordable, so callers can skip the note.
function shortfall(reputation, cost) {
    const need = Math.ceil(cost - reputation)
    return need > 0 ? need : null
}

// The Shop. It only shows things and reports clicks: App does the buying (it owns Reputation) and the equipping.
//   cosmetics: { owned, equipped } as read by utils/cosmetics.js
//   onBuy(category, item) -> true when it was bought (and equipped)
//   onEquip(category, item)
//   onBuyBundle(bundle) -> true when every not-yet-owned piece was bought (and all equipped)
//   onEquipBundle(bundle)
function ShopModal({ reputation, cosmetics, onBuy, onEquip, onBuyBundle, onEquipBundle, onClose }) {
    const [categoryId, setCategoryId] = useState(SHOP_CATEGORIES[0].id)
    const [shaking, setShaking] = useState(null)
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState('shop') // 'shop' (everything) or 'owned' (collection only)
    const [lightbox, setLightbox] = useState(null) // { categoryId, item } for the enlarged preview, or null
    // Hover tooltip for a bundle piece chip - { text, left, top } in viewport coordinates, or null. Rendered
    // through a portal to document.body so it can't be clipped by the scrollable shop-content column it sits in
    // (that column's overflow-y:auto forces overflow-x to clip too, which cut off the tooltip for edge-column chips).
    const [chipTooltip, setChipTooltip] = useState(null)
    const showChipTooltip = (e, text) => {
        const r = e.currentTarget.getBoundingClientRect()
        setChipTooltip({ text, left: Math.min(Math.max(r.left + r.width / 2, 70), window.innerWidth - 70), top: r.top })
    }
    // Which card's non-Work-sound Preview is currently audible (its shakeKey) - toggles that one button to a
    // Stop state, and is cleared automatically when the clip ends on its own, not just when Stop is clicked.
    const [previewingKey, setPreviewingKey] = useState(null)
    // Whatever Preview sound is playing shouldn't keep going once the Shop is gone, however it closed
    // (the Close button, clicking outside, or switching tabs away from Home).
    useEffect(() => () => stopPreviewSound(), [])
    // Switching tabs mid-preview would otherwise leave a stale "Stop" button showing on whichever card in the
    // new tab happens to share that id, so a tab change always stops the clip and resets the toggle too.
    useEffect(() => { stopPreviewSound(); setPreviewingKey(null) }, [categoryId])
    const isBundlesTab = categoryId === 'bundles'
    const category = isBundlesTab ? BUNDLES_TAB : SHOP_CATEGORIES.find(c => c.id === categoryId)
    const items = SHOP_ITEMS[categoryId] || []
    const equippedId = cosmetics.equipped[categoryId] && isOwned(cosmetics, categoryId, cosmetics.equipped[categoryId]) ? cosmetics.equipped[categoryId] : 'default'
    // The Featured group at the top of each category tab (see FEATURED_THEME_ID in shopCatalog.js) - still shown
    // in its own normal tier group too below, the same item just spotlighted a second time.
    const featuredItem = !isBundlesTab ? items.find(item => item.id === FEATURED_THEME_ID) : null

    // Search box + Shop/Owned toggle, shared by every tab. A name match is enough for search (the catalogue is
    // small - no need for anything fancier), and the Owned view just hides anything not already owned so this
    // doubles as a quick "what have I actually collected" view.
    const query = search.trim().toLowerCase()
    const matchesSearch = (name) => !query || name.toLowerCase().includes(query)
    const visibleItems = items.filter(item => matchesSearch(item.name) && (viewMode !== 'owned' || isOwned(cosmetics, categoryId, item.id)))
    const featuredVisible = featuredItem && matchesSearch(featuredItem.name) && (viewMode !== 'owned' || isOwned(cosmetics, categoryId, featuredItem.id)) ? featuredItem : null
    const visibleBundles = SHOP_BUNDLES.filter(b => matchesSearch(b.name) && (viewMode !== 'owned' || isBundleOwned(cosmetics, b)))

    // The small second line under each sidebar entry: what's currently equipped in that category, or how many
    // bundle sets are fully owned - so you can see your whole loadout at a glance without clicking through
    // every tab first.
    const navSubtitle = (id) => {
        if (id === 'bundles') {
            const ownedCount = SHOP_BUNDLES.filter(b => isBundleOwned(cosmetics, b)).length
            return `${ownedCount}/${SHOP_BUNDLES.length} sets owned`
        }
        return getEquippedItem(id, cosmetics)?.name || null
    }

    const handleBuy = (item, shakeKey = item.id) => {
        if (onBuy(categoryId, item)) { playClickSound2(); return }
        playNotEnoughFundsSound()
        setShaking(shakeKey)
        setTimeout(() => setShaking(null), 400)
    }
    const handleBundleBuy = (bundle) => {
        if (onBuyBundle(bundle)) { playClickSound2(); return }
        playNotEnoughFundsSound()
        setShaking(bundle.id)
        setTimeout(() => setShaking(null), 400)
    }

    // The Preview button. A Work sound keeps its old always-plays-another-sample behaviour with no toggle (see
    // playWorkSoundPreview's own comment in sound.js - it's deliberately built to never cut itself off, since
    // that's exactly what mashing the Work button actually sounds like, so a Stop state would misrepresent it).
    // Everything else toggles: clicking Preview again, or clicking it on another card, stops the clip; letting
    // it finish on its own does too, via the Audio's 'ended' event.
    const handlePreviewClick = (item, key) => {
        if (categoryId === 'workSound') { playWorkSoundPreview(item.srcs || item.src); return }
        if (previewingKey === key) { stopPreviewSound(); setPreviewingKey(null); return }
        const audio = playPreviewSound(item.srcs || item.src)
        if (!audio) return
        setPreviewingKey(key)
        audio.addEventListener('ended', () => setPreviewingKey(prev => (prev === key ? null : prev)), { once: true })
    }

    // One item card, shared by the Featured group and the ordinary Standard/Special/Supporter tier groups below
    // it - a Featured card is the exact same card (buy/equip state and all), just with a key prefix so React
    // doesn't reuse the one DOM node for what are, visually, two separate cards.
    const renderItemCard = (item, { featured = false } = {}) => {
        const tier = item.tier || 'standard'
        const locked = tier === 'supporter' && !isOwned(cosmetics, categoryId, item.id)
        const owned = isOwned(cosmetics, categoryId, item.id)
        const equipped = owned && equippedId === item.id
        const shakeKey = featured ? `featured-${item.id}` : item.id
        return (
            <div key={shakeKey} className={`shop-item${equipped ? ' shop-item-equipped' : ''}${locked ? ' shop-item-locked' : ''}${featured ? ' shop-item-featured' : ''}${shaking === shakeKey ? ' shop-item-shake' : ''}`} style={themedCardStyle(item.id)}>
                <div className="shop-item-name">{item.name}{locked && <span className="shop-item-lock" aria-hidden="true">🔒</span>}</div>
                {item.vars && (
                    <button type="button" className="shop-preview-trigger" onClick={() => setLightbox({ categoryId, item })} aria-label={`Enlarge ${item.name} preview`}>
                        <ThemePreview categoryId={categoryId} item={item} />
                    </button>
                )}
                {item.description && <div className="shop-item-desc">{item.description}</div>}
                <div className="shop-item-actions">
                    {locked ? (
                        <span className="shop-locked-note">Coming with the Supporter's Set</span>
                    ) : (
                        <>
                            {(item.src || item.srcs) && (
                                <button className="shop-btn shop-btn-ghost" onClick={() => handlePreviewClick(item, shakeKey)} onMouseEnter={() => playHoverSound()}>
                                    {categoryId !== 'workSound' && previewingKey === shakeKey ? '■ Stop' : '▶ Preview'}
                                </button>
                            )}
                            {equipped ? (
                                <span className="shop-equipped">Equipped</span>
                            ) : owned ? (
                                <button className="shop-btn" onClick={() => { playClickSound2(); onEquip(categoryId, item) }} onMouseEnter={() => playHoverSound()}>Equip</button>
                            ) : (
                                <>
                                    {shortfall(reputation, item.cost) != null && <span className="shop-need-more">Need {shortfall(reputation, item.cost)} more</span>}
                                    <button className={`shop-btn shop-btn-buy${reputation < item.cost ? ' shop-btn-poor' : ''}`} onClick={() => handleBuy(item, shakeKey)} onMouseEnter={() => playHoverSound()}>
                                        <img src={reputationIcon} alt="" /> {item.cost}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="shop-overlay" onClick={onClose}>
            <div className="shop-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Shop">
                <div className="shop-header">
                    <h2 className="shop-title">Shop</h2>
                    <div className="shop-balance" title="Your Reputation"><img src={reputationIcon} alt="Reputation" /> {Math.floor(reputation)}</div>
                    <button className="shop-close" onClick={() => { playClickSound2(); onClose() }} onMouseEnter={() => playHoverSound()}>✕ Close</button>
                </div>

                <div className="shop-body">
                    <nav className="shop-sidebar" aria-label="Shop categories">
                        {[...SHOP_CATEGORIES, BUNDLES_TAB].map(c => {
                            const subtitle = navSubtitle(c.id)
                            return (
                                <button key={c.id} className={`shop-nav-item${c.id === categoryId ? ' shop-nav-item-active' : ''}`}
                                    onClick={() => { if (c.id !== categoryId) { playClickSound2(); setCategoryId(c.id) } }}
                                    onMouseEnter={() => playHoverSound()}>
                                    <span className="shop-nav-item-icon-box"><img src={NAV_ICONS[c.id]} alt="" /></span>
                                    <span className="shop-nav-item-text">
                                        <span className="shop-nav-item-name">{c.name}</span>
                                        {subtitle && <span className="shop-nav-item-sub">{subtitle}</span>}
                                    </span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="shop-content">
                        <p className="shop-blurb">{category.blurb}</p>

                        <div className="shop-filter-bar">
                            <input type="text" className="shop-search" placeholder="Search…" value={search}
                                onChange={e => setSearch(e.target.value)} aria-label="Search this tab" />
                            <div className="shop-view-toggle" role="group" aria-label="Filter by ownership">
                                <button type="button" className={`shop-view-btn${viewMode === 'shop' ? ' shop-view-btn-active' : ''}`}
                                    onClick={() => { if (viewMode !== 'shop') { playClickSound2(); setViewMode('shop') } }} onMouseEnter={() => playHoverSound()}>Shop</button>
                                <button type="button" className={`shop-view-btn${viewMode === 'owned' ? ' shop-view-btn-active' : ''}`}
                                    onClick={() => { if (viewMode !== 'owned') { playClickSound2(); setViewMode('owned') } }} onMouseEnter={() => playHoverSound()}>Owned</button>
                            </div>
                        </div>

                        {isBundlesTab ? (
                            <div className="shop-groups">
                                {visibleBundles.length === 0 && <p className="shop-empty">No bundles match.</p>}
                                <div className="shop-grid shop-bundle-grid">
                                    {visibleBundles.map(bundle => {
                                        const owned = isBundleOwned(cosmetics, bundle)
                                        const locked = bundle.tier === 'premium' && !owned
                                        const price = bundlePrice(cosmetics, bundle)
                                        const need = shortfall(reputation, price)
                                        return (
                                            <div key={bundle.id} className={`shop-item shop-bundle-card${locked ? ' shop-item-locked' : ''}${shaking === bundle.id ? ' shop-item-shake' : ''}`} style={themedCardStyle(bundle.id)}>
                                                <div className="shop-item-name">
                                                    {bundle.name}
                                                    <span className={`shop-bundle-badge shop-bundle-badge-${bundle.tier}`}>{bundle.tier === 'premium' ? 'Premium' : 'Special'}</span>
                                                    {locked && <span className="shop-item-lock" aria-hidden="true">🔒</span>}
                                                </div>
                                                <div className="shop-item-desc">{bundle.blurb}</div>
                                                <div className="shop-bundle-pieces">
                                                    {bundlePieces(bundle).map(({ category: pc, id, item }) => {
                                                        const pieceOwned = isOwned(cosmetics, pc, id)
                                                        const tooltipText = `${PIECE_LABELS[pc]}${pieceOwned ? ' (owned)' : ' (not owned)'}`
                                                        return (
                                                            <span
                                                                key={pc}
                                                                className={`shop-bundle-chip${pieceOwned ? ' shop-bundle-chip-owned' : ''}`}
                                                                onMouseEnter={(e) => showChipTooltip(e, tooltipText)}
                                                                onMouseLeave={() => setChipTooltip(null)}
                                                            >
                                                                {pieceOwned && <span className="shop-bundle-chip-check" aria-hidden="true">✓</span>}
                                                                {PIECE_CHIPS[pc]}
                                                            </span>
                                                        )
                                                    })}
                                                </div>
                                                <div className="shop-item-actions">
                                                    {locked ? (
                                                        <span className="shop-locked-note">Coming with the Supporter's Set</span>
                                                    ) : owned ? (
                                                        <button className="shop-btn" onClick={() => { playClickSound2(); onEquipBundle(bundle) }} onMouseEnter={() => playHoverSound()}>Equip all</button>
                                                    ) : (
                                                        <>
                                                            {need != null && <span className="shop-need-more">Need {need} more</span>}
                                                            <button className={`shop-btn shop-btn-buy${reputation < price ? ' shop-btn-poor' : ''}`} onClick={() => handleBundleBuy(bundle)} onMouseEnter={() => playHoverSound()}>
                                                                <img src={reputationIcon} alt="" /> {price}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                        <div className="shop-groups">
                            {!featuredVisible && visibleItems.length === 0 && <p className="shop-empty">No items match.</p>}
                            {featuredVisible && (
                                <div className="shop-tier-group shop-featured-group">
                                    <div className="shop-tier-heading shop-tier-heading-featured">Featured</div>
                                    {FEATURED_TAGLINE && <p className="shop-featured-tagline">{FEATURED_TAGLINE}</p>}
                                    <div className="shop-grid">
                                        {renderItemCard(featuredVisible, { featured: true })}
                                    </div>
                                </div>
                            )}
                            {TIERS.map(tier => {
                                const tierItems = visibleItems.filter(item => (item.tier || 'standard') === tier.id)
                                if (tierItems.length === 0) return null
                                return (
                                    <div key={tier.id} className="shop-tier-group">
                                        <div className={`shop-tier-heading shop-tier-heading-${tier.id}`}>{tier.name}</div>
                                        <div className="shop-grid">
                                            {tierItems.map(item => renderItemCard(item))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {lightbox && (
            <div className="shop-lightbox-overlay" onClick={() => setLightbox(null)}>
                <div className="shop-lightbox" onClick={e => e.stopPropagation()} role="dialog" aria-label={`${lightbox.item.name} preview`}>
                    <button className="shop-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close preview">✕</button>
                    <div className="shop-lightbox-name">{lightbox.item.name}</div>
                    <ThemePreview categoryId={lightbox.categoryId} item={lightbox.item} />
                </div>
            </div>
        )}
        {chipTooltip && createPortal(
            <div className="shop-chip-tooltip" style={{ left: chipTooltip.left, top: chipTooltip.top }}>
                {chipTooltip.text}
            </div>,
            document.body
        )}
        </>
    )
}

export default ShopModal

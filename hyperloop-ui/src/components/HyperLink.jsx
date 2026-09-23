import { useState, useEffect, useRef } from 'react'
import './HyperLink.css'
import defaultPfp from '../assets/misc/defaultAccountIcon.png'
import officialPfp from '../assets/misc/officialAccountIcon.png'
import phoneIcon from '../assets/misc/phone.png'
import { playHoverSound } from '../utils/sound.js'
import wifiIcon from '../assets/misc/wifi.png'
import batteryIcon from '../assets/misc/battery.png'
import signalIcon from '../assets/misc/signal.png'

const malePfpModules = import.meta.glob('../assets/male-profile-pics/*.jpg', { eager: true })
const femalePfpModules = import.meta.glob('../assets/female-profile-pics/*.jpg', { eager: true })

export const MALE_PFPS = Object.entries(malePfpModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m.default)

export const FEMALE_PFPS = Object.entries(femalePfpModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m.default)

export { defaultPfp, officialPfp }

function hashNum(str, mod, offset = 0) {
    let h = 0
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
    return (Math.abs(h) % mod) + offset
}

function getGrowthFactor(ageMs) {
    const ageMinutes = ageMs / 60000
    if (ageMinutes < 0.5) return 0.05
    return Math.min(1 - Math.exp(-ageMinutes / 20), 1)
}

function formatTimestamp(ts) {
    const diff = Date.now() - ts
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
}

function HyperLinkModal({ feed, onClose, terminalName }) {
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const [likedPosts, setLikedPosts] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem('hyperloop_hyperlink_liked') || '[]')) }
        catch { return new Set() }
    })
    const [likeAnimating, setLikeAnimating] = useState(null)
    const [, setTick] = useState(0)
    const lastTapRef = useRef({})

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000)
        return () => clearInterval(interval)
    }, [])

    const toggleLike = (postId, e) => {
        if (e) e.stopPropagation()
        const newLiked = new Set(likedPosts)
        if (newLiked.has(postId)) {
            newLiked.delete(postId)
        } else {
            newLiked.add(postId)
            setLikeAnimating(postId)
            setTimeout(() => setLikeAnimating(null), 800)
        }
        setLikedPosts(newLiked)
        localStorage.setItem('hyperloop_hyperlink_liked', JSON.stringify([...newLiked]))
    }

    const handlePostTap = (postId) => {
        const now = Date.now()
        const lastTap = lastTapRef.current[postId] || 0
        if (now - lastTap < 350) {
            toggleLike(postId)
        }
        lastTapRef.current[postId] = now
    }

    return (
        <div className="hyperlink-overlay" onClick={onClose}>
            <div className="hyperlink-phone-shell" onClick={e => e.stopPropagation()}>
                <div className="hyperlink-modal">
                    <div className="hyperlink-notch">
                        <div className="hyperlink-notch-pill" />
                    </div>
                    <div className="hyperlink-status-bar">
    <span style={{ fontWeight: 700 }}>{timeStr}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <img src={signalIcon} alt="signal" style={{ width: '14px', height: '14px', border: 'none', borderRadius: 0 }} />
        <img src={wifiIcon} alt="wifi" style={{ width: '14px', height: '14px', border: 'none', borderRadius: 0 }} />
        <img src={batteryIcon} alt="battery" style={{ width: '20px', height: '14px', border: 'none', borderRadius: 0 }} />
    </div>
</div>
                    <div className="hyperlink-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={phoneIcon} alt="" style={{ width: '18px', height: '18px', border: 'none', borderRadius: '0', opacity: 0.9 }} />
                            <div className="hyperlink-logo">Hyper<span>-</span>Link</div>
                        </div>
                        <button className="hyperlink-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="hyperlink-feed">
                        {feed.length === 0 ? (
                            <div className="hyperlink-empty">No posts yet. Check back soon!</div>
                        ) : (
                            [...feed].reverse().map(post => {
                                const ageMs = Date.now() - post.timestamp
                                const growth = getGrowthFactor(ageMs)
                                const maxLikes = hashNum(post.id, 847, 3)
                                const maxReplies = hashNum(post.id + 'r', 47)
                                const isLiked = likedPosts.has(post.id)
                                const displayLikes = Math.floor(maxLikes * growth) + (isLiked ? 1 : 0)
                                const displayReplies = Math.floor(maxReplies * growth)
                                return (
                                    <div
                                        key={post.id}
                                        className={`hyperlink-post${post.isOfficial ? ' hyperlink-post-official' : ''}`}
                                        onClick={() => handlePostTap(post.id)}
                                        style={{ position: 'relative', cursor: 'pointer' }}
                                    >
                                        {likeAnimating === post.id && (
                                            <div className="hyperlink-like-animation">❤</div>
                                        )}
                                        <img
                                            src={post.pfp || defaultPfp}
                                            alt="pfp"
                                            className={post.pfp ? 'hyperlink-pfp' : 'hyperlink-pfp-default'}
                                            onError={e => { e.target.src = defaultPfp }}
                                        />
                                        <div className="hyperlink-post-body">
                                            <div className="hyperlink-post-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className="hyperlink-display-name">
                                                        {post.isOfficial && terminalName ? terminalName : post.displayName}
                                                    </span>
                                                    {post.isOfficial && <span className="hyperlink-official-badge">OFFICIAL</span>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span className="hyperlink-handle">
                                                        {post.isOfficial && terminalName
                                                            ? `@${terminalName.toLowerCase().replace(/\s+/g, '')}official`
                                                            : post.handle}
                                                    </span>
                                                    <span className="hyperlink-timestamp">{formatTimestamp(post.timestamp)}</span>
                                                </div>
                                            </div>
                                            <div className="hyperlink-post-text">{post.isItalic ? <em>{post.text}</em> : post.text}</div>
                                            <div className="hyperlink-engagement">
                                                <span
                                                    className={`hyperlink-likes${isLiked ? ' hyperlink-likes-active' : ''}`}
                                                    onClick={(e) => toggleLike(post.id, e)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    ❤ {displayLikes}
                                                </span>
                                                <span className="hyperlink-replies">💬 {displayReplies}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    <div className="hyperlink-home-bar">
                        <div className="hyperlink-home-bar-pill" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function HyperLinkButton({ unread, onClick, showBubble }) {
    return (
        <div style={{ position: 'fixed', bottom: 112.5, left: 12, zIndex: 150 }}>
            {showBubble && (
                <div className="hyperlink-notification-bubble">New notification!</div>
            )}
            <button
                className={`hyperlink-phone-btn${unread > 0 ? ' hyperlink-phone-btn-pulse' : ''}`}
                onClick={onClick}
                onMouseEnter={() => playHoverSound()}
            >
                <img src={phoneIcon} alt="Hyper-Link" />
                {unread > 0 && <span className="hyperlink-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>
        </div>
    )
}

export default HyperLinkModal
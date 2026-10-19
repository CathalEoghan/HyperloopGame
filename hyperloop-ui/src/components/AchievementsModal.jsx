import { useEffect, useRef } from 'react'
import './AchievementsModal.css'
import './HyperLink.css'
import trophyIcon from '../assets/misc/trophy.svg'
import { playHoverSound, playClickSound2 } from '../utils/sound.js'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { PRESTIGE_VALUES } from 'Managers/PrestigeManager/prestigeUpgrades.js'
import { ACHIEVEMENTS } from 'Managers/AchievementManager/achievements.js'
import { achievementLogo } from '../utils/achievementLogos.js'

// The bottom-right counterpart of the Hyper-Link button. It reuses that button's styling and notification
// indications (pulse, red count, bubble above it) so the two match.
// Listed alphabetically
const SORTED_ACHIEVEMENTS = [...ACHIEVEMENTS].sort((a, b) => a.name.localeCompare(b.name))

export function AchievementsButton({ unseen = 0, showBubble = false, bubbleKey = 0, onClick }) {
    return (
        <div style={{ position: 'fixed', bottom: 112.5, right: 12, zIndex: 150 }}>
            {showBubble && (
                <div key={bubbleKey} className="hyperlink-notification-bubble hyperlink-notification-bubble-right">New achievement!</div>
            )}
            <button
                className={`hyperlink-phone-btn${unseen > 0 ? ' hyperlink-phone-btn-pulse' : ''}`}
                onClick={() => { playClickSound2(); onClick() }}
                onMouseEnter={() => playHoverSound()}
                aria-label="Achievements"
            >
                <img src={trophyIcon} alt="Achievements" />
                {unseen > 0 && <span className="hyperlink-badge">{unseen > 9 ? '9+' : unseen}</span>}
            </button>
        </div>
    )
}

// onSeen(id) is called when the player hovers over (or taps) an achievement they had not looked at yet.
export default function AchievementsModal({ achievementManager, purchasedUpgrades, onSeen = () => {}, onClose }) {
    const count = achievementManager.count
    const firstUnseenRef = useRef(null)
    // Opening the page with something new on it: bring the first new achievement into view
    useEffect(() => { firstUnseenRef.current?.scrollIntoView({ block: 'center' }) }, [])
    const firstUnseenId = SORTED_ACHIEVEMENTS.find(a => achievementManager.has(a.id) && achievementManager.isUnseen(a.id))?.id
    // What the achievements are worth, once the Anniversary Sales / Trophy Cabinet upgrades that use them are owned
    const bonuses = []
    if (count > 0 && (purchasedUpgrades || []).some(u => u.effectType === 'workPerAchievement')) {
        bonuses.push({ name: 'Anniversary Sales', value: `+${count * 5}%`, what: 'Work earnings' })
    }
    if (count > 0 && PrestigeManager.owns('trophyCabinet')) {
        bonuses.push({ name: 'Trophy Cabinet', value: `×${(1 + count * PRESTIGE_VALUES.trophyCabinetPerAchievement).toFixed(2)}`, what: 'city and development income' })
    }

    return (
        <div className="achievements-overlay" onClick={onClose}>
            <div className="achievements-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label="Achievements">
                <div className="achievements-header">
                    <div className="achievements-title">
                        <img src={trophyIcon} alt="" />
                        <span>Achievements</span>
                        <span className="achievements-count">{count} / {ACHIEVEMENTS.length}</span>
                    </div>
                    <button className="achievements-close" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }} aria-label="Close">✕</button>
                </div>
                <div className="achievements-body">
                    {bonuses.length > 0 && (
                        <div className="achievement-bonuses">
                            {bonuses.map(b => (
                                <div key={b.name} className="achievement-bonus">
                                    <img src={trophyIcon} alt="" className="achievement-bonus-icon" />
                                    <div className="achievement-bonus-text">
                                        <span className="achievement-bonus-name">{b.name}</span>
                                        <span className="achievement-bonus-what">{b.what}</span>
                                    </div>
                                    <span className="achievement-bonus-value">{b.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="achievement-grid">
                        {SORTED_ACHIEVEMENTS.map(a => {
                            const done = achievementManager.has(a.id)
                            const isNew = done && achievementManager.isUnseen(a.id)
                            const logo = achievementLogo(a.id)
                            return (
                                <div
                                    key={a.id}
                                    ref={a.id === firstUnseenId ? firstUnseenRef : undefined}
                                    className={`achievement-card${done ? ' achievement-done' : ''}`}
                                    onMouseEnter={() => { playHoverSound(); if (isNew) onSeen(a.id) }}
                                    onClick={() => { if (isNew) onSeen(a.id) }}
                                >
                                    {isNew && <span className="achievement-new-dot" aria-label="New" />}
                                    {/* The same box whether or not the achievement has a logo yet, so every card lines up */}
                                    <span className={`achievement-card-logo${done ? '' : ' achievement-card-logo-locked'}`}>
                                        {logo
                                            ? <img src={logo} alt="" loading="lazy" />
                                            : <span className="achievement-card-emoji" aria-hidden="true">{done ? '🏆' : '🔒'}</span>}
                                        {logo && !done && <span className="achievement-card-lock" aria-hidden="true">🔒</span>}
                                    </span>
                                    <div className="achievement-card-text">
                                        <span className="achievement-card-name">{a.name}</span>
                                        <span className="achievement-card-desc">{a.description}</span>
                                        {a.pending && !done && <span className="achievement-card-soon">Coming soon</span>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

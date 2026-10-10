import { useEffect, useRef } from 'react'
import './AchievementsModal.css'
import './HyperLink.css'
import trophyIcon from '../assets/misc/trophy.svg'
import { playHoverSound } from '../utils/sound.js'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { ACHIEVEMENTS } from 'Managers/AchievementManager/achievements.js'

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
                onClick={onClick}
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
    const bonusLines = []
    if (count > 0 && (purchasedUpgrades || []).some(u => u.effectType === 'workPerAchievement')) {
        bonusLines.push(`Anniversary Sales: +${count * 5}% Work earnings`)
    }
    if (count > 0 && PrestigeManager.owns('trophyCabinet')) {
        bonusLines.push(`Trophy Cabinet: +${count * 25}% city and development income`)
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
                    <button className="achievements-close" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="achievements-body">
                    {bonusLines.length > 0 && <p className="achievement-bonus-note">{bonusLines.join(' · ')}</p>}
                    <div className="achievement-grid">
                        {SORTED_ACHIEVEMENTS.map(a => {
                            const done = achievementManager.has(a.id)
                            const isNew = done && achievementManager.isUnseen(a.id)
                            return (
                                <div
                                    key={a.id}
                                    ref={a.id === firstUnseenId ? firstUnseenRef : undefined}
                                    className={`achievement-card${done ? ' achievement-done' : ''}`}
                                    onMouseEnter={() => { playHoverSound(); if (isNew) onSeen(a.id) }}
                                    onClick={() => { if (isNew) onSeen(a.id) }}
                                >
                                    {isNew && <span className="achievement-new-dot" aria-label="New" />}
                                    <span className="achievement-card-icon">{done ? '🏆' : '🔒'}</span>
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

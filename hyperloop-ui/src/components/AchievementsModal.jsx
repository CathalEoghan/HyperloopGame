import './AchievementsModal.css'
import './HyperLink.css'
import trophyIcon from '../assets/misc/trophy.svg'
import { playHoverSound } from '../utils/sound.js'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { ACHIEVEMENTS } from 'Managers/AchievementManager/achievements.js'

// The bottom-right counterpart of the Hyper-Link button. It reuses that button's styling so the two match.
export function AchievementsButton({ onClick }) {
    return (
        <div style={{ position: 'fixed', bottom: 112.5, right: 12, zIndex: 150 }}>
            <button
                className="hyperlink-phone-btn"
                onClick={onClick}
                onMouseEnter={() => playHoverSound()}
                aria-label="Achievements"
                title="Achievements"
            >
                <img src={trophyIcon} alt="Achievements" />
            </button>
        </div>
    )
}

export default function AchievementsModal({ achievementManager, purchasedUpgrades, onClose }) {
    const count = achievementManager.count
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
                        {ACHIEVEMENTS.map(a => {
                            const done = achievementManager.has(a.id)
                            return (
                                <div key={a.id} className={`achievement-card${done ? ' achievement-done' : ''}`} onMouseEnter={() => playHoverSound()}>
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

import React, { useEffect } from 'react'
import { playReputationWorkBonusSound } from '../utils/sound.js'
import './AchievementToast.css'

const SHOW_MS = 4500

// Shows the first announcement in the queue for a few seconds, then asks for the next. Never blocks a click.
function AchievementToast({ queue, onShift }) {
    const current = queue[0]
    useEffect(() => {
        if (!current) return
        playReputationWorkBonusSound()
        const timer = setTimeout(onShift, SHOW_MS)
        return () => clearTimeout(timer)
    }, [current?.key])
    if (!current) return null
    return (
        <div className="achievement-toast" key={current.key} role="status" aria-live="polite">
            <span className="achievement-toast-icon">🏆</span>
            <div className="achievement-toast-text">
                <span className="achievement-toast-label">Achievement unlocked</span>
                <span className="achievement-toast-title">{current.title}</span>
                {current.subtitle && <span className="achievement-toast-sub">{current.subtitle}</span>}
            </div>
        </div>
    )
}

export default AchievementToast

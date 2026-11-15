import { useEffect } from 'react'
import { playSpecialChime } from '../utils/sound.js'
import { achievementLogo } from '../utils/achievementLogos.js'
import trophyIcon from '../assets/misc/trophy.svg'
import './AchievementToast.css'

const SHOW_MS = 4500

// Shows the first announcement in the queue for a few seconds, then asks for the next. Never blocks a click.
function AchievementToast({ queue, onShift }) {
    const current = queue[0]
    useEffect(() => {
        if (!current) return
        // Once per toast; the unlock itself makes no sound, so the two never play together. Another announcement may bring its own (`sound`)
        if (typeof current.sound === 'function') current.sound()
        else playSpecialChime()
        const timer = setTimeout(onShift, SHOW_MS)
        return () => clearTimeout(timer)
    }, [current?.key])
    if (!current) return null
    // An announcement may bring its own picture (`icon`); an achievement shows its logo
    const logo = current.icon || (current.id ? achievementLogo(current.id) : null)
    return (
        <div className="achievement-toast" key={current.key} role="status" aria-live="polite">
            {logo
                ? <img className="achievement-toast-logo" src={logo} alt="" />
                : <img className="achievement-toast-icon" src={trophyIcon} alt="" />}
            <div className="achievement-toast-text">
                {/* Other announcements use the same toast: `label: null` leaves the small heading off (an email request fulfilled) */}
                {current.label !== null && <span className="achievement-toast-label">{current.label ?? 'Achievement unlocked'}</span>}
                <span className="achievement-toast-title">{current.title}</span>
                {current.subtitle && <span className="achievement-toast-sub">{current.subtitle}</span>}
            </div>
        </div>
    )
}

export default AchievementToast

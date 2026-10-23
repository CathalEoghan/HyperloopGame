import './PageIntroModal.css'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound } from '../utils/sound.js'

// A one-time explainer shown the first time a player opens a page (Cities, Development, ...), so
// new players get a plain-English run-through of what the page does before they start clicking
// around. `onClose` is expected to persist a "seen" flag so it doesn't show again.
// `points` is a list of { icon, text } - one icon'd row per point, matching the onboarding modal's style.
export default function PageIntroModal({ title, points, onClose }) {
    return (
        <div className="pageintro-overlay" onClick={onClose}>
            <div className="pageintro-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
                <h2 className="pageintro-title">{title}</h2>
                <div className="pageintro-points">
                    {points.map((point, i) => (
                        <div className="pageintro-point" key={i}>
                            {/* Inline-styled like the onboarding modal's icons: a generic ".modal img" rule elsewhere
                                in the app (CitiesPage.css/DevelopmentPage.css) would otherwise stretch and border them. */}
                            <img className="pageintro-point-icon" src={point.icon} alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', border: 'none' }} />
                            <p>{point.text}</p>
                        </div>
                    ))}
                </div>
                <div className="pageintro-actions">
                    <button className="pageintro-btn pageintro-btn-primary" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Got it</button>
                </div>
            </div>
        </div>
    )
}

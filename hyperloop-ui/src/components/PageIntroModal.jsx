import './PageIntroModal.css'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound } from '../utils/sound.js'

// A one-time explainer shown the first time a player opens a page (Cities, Development, ...), so
// new players get a plain-English run-through of what the page does before they start clicking
// around. `onClose` is expected to persist a "seen" flag so it doesn't show again.
export default function PageIntroModal({ title, children, onClose }) {
    return (
        <div className="pageintro-overlay" onClick={onClose}>
            <div className="pageintro-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
                <h2 className="pageintro-title">{title}</h2>
                <div className="pageintro-text">{children}</div>
                <div className="pageintro-actions">
                    <button className="pageintro-btn pageintro-btn-primary" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Got it</button>
                </div>
            </div>
        </div>
    )
}

import { useEffect } from 'react'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound, playEventSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import './RepBonusModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'

// The popup that shows an upgrade's Reputation bonus landing, after the reveal it belongs to (Passenger Appreciation
// Initiatives after a city reveal, Expanded Family Rooms after a milestone's reveal). The Reputation is already in the
// save; this popup is what shows it landing (the counter and sound fire when the button is clicked).
function RepBonusModal({ title, message, amount, buttonLabel = 'Cool!', onClose }) {
    // A notice, so Escape does what its button does
    useEscapeToClose(() => { playClickSound2(); onClose() })
    useEffect(() => { playEventSound() }, [])
    return (
        <div className="rb-overlay">
            <div className="rb-modal" role="dialog" aria-label={title}>
                <p className="rb-header">{title}</p>
                <div className="rb-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <p className="rb-message">{message}</p>
                <p className="rb-earned">
                    You've earned <img src={reputationIcon} alt="" className="rb-rep-icon" /><strong>{amount}</strong> Reputation!
                </p>
                <button className="rb-btn"
                    onMouseEnter={() => playHoverSound()}
                    autoFocus
                    onClick={() => { playClickSound2(); onClose() }}>
                    {buttonLabel}
                </button>
            </div>
        </div>
    )
}

export default RepBonusModal

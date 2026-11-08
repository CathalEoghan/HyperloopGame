import { useEffect } from 'react'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound, playEventSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import './PassengerAppreciationModal.css'

// Shown right after the "You've unlocked ..." reveal when the Passenger Appreciation Initiatives upgrade is owned.
// The Reputation is already in the save; this popup is what shows it landing (the counter and sound fire on "Cool!").
function PassengerAppreciationModal({ amount, cityNames, onClose }) {
    useEffect(() => { playEventSound() }, [])
    const where = cityNames.length === 1 ? cityNames[0] : `${cityNames.length} new cities`
    return (
        <div className="pai-overlay">
            <div className="pai-modal" role="dialog" aria-label="Passenger Appreciation Initiative">
                <p className="pai-header">PASSENGER APPRECIATION INITIATIVE</p>
                <div className="pai-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <p className="pai-message">
                    You're offering your most loyal passengers a chance to win tickets to <strong>{where}</strong>!
                </p>
                <p className="pai-earned">
                    You've earned <img src={reputationIcon} alt="" className="pai-rep-icon" /><strong>{amount}</strong> Reputation!
                </p>
                <button className="pai-btn"
                    onMouseEnter={() => playHoverSound()}
                    autoFocus
                    onClick={() => { playClickSound2(); onClose() }}>
                    Cool!
                </button>
            </div>
        </div>
    )
}

export default PassengerAppreciationModal

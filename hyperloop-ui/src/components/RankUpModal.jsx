import { useState, useRef } from 'react'
import './RankUpModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

// choose: Lobbying Suavity lets the player pick the city, so the button says so.
// waiting: how many rank-ups are waiting. From 3 up, "Claim all" takes a random city for every one of them at once.
export const CLAIM_ALL_FROM = 3
// How long "Confirm Auto-Claim?" waits before a click on it counts
const CONFIRM_DELAY_MS = 400

// Escape does what the main button does - moves on to choosing the city - rather than closing the popup: this is the only
// way to claim the rank-up, so it can't simply be dismissed. A stray Escape is harmless: it only opens the city choice,
// which shows the cities and ignores Escape itself, so nothing is picked or paid for by it. (Never "Claim all".)
function RankUpModal({ rank = 0, onClaim, choose = false, waiting = 0, onClaimAll, onEnableAuto }) {
  useEscapeToClose(() => { playClickSound2(); onClaim() })
  // Automatic claiming is a lasting setting, so the button asks once more: the first click turns it into "Confirm Auto-Claim?"
  // and only a second click turns it on. Moving focus anywhere else (another button, the empty modal) puts it back.
  const [confirmingAuto, setConfirmingAuto] = useState(false)
  // A quick double-click is one action, not a confirmation: a second click within CONFIRM_DELAY_MS of the first is ignored
  const askedAt = useRef(0)
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading rankup-heading">You've ranked up!</h2>
        {rank > 0 && (
          <div className="rankup-stage" role="img" aria-label={`Rank ${rank}`}>
            <span className="rankup-rank-label">RANK</span>
            <span className="rankup-number">{rank}</span>
          </div>
        )}
        <div className="rankup-actions">
          <button
            onMouseEnter={() => playHoverSound()}
            onClick={() => { playClickSound2(); onClaim(); }}
          >
            {choose ? 'Choose a City' : 'Claim City'}
          </button>
          {waiting >= CLAIM_ALL_FROM && onClaimAll && (
            <button
              onMouseEnter={() => playHoverSound()}
              onClick={() => { playClickSound2(); onClaimAll(); }}
            >
              Claim all cities, randomised ({waiting} waiting)
            </button>
          )}
        </div>
        {/* The way out for a player ranking up faster than they can click through: turns the Settings option on and
            claims everything waiting now. Never what Escape does. */}
        {onEnableAuto && (
          <>
            <button
              className={`rankup-auto-btn${confirmingAuto ? ' rankup-auto-btn-confirm' : ''}`}
              onMouseEnter={() => playHoverSound()}
              onBlur={() => setConfirmingAuto(false)}
              onClick={() => {
                if (confirmingAuto && Date.now() - askedAt.current < CONFIRM_DELAY_MS) return
                playClickSound2()
                if (!confirmingAuto) { askedAt.current = Date.now(); setConfirmingAuto(true); return }
                setConfirmingAuto(false)
                onEnableAuto()
              }}
            >
              {confirmingAuto ? 'Confirm Auto-Claim?' : 'Enable automatic random selection'}
            </button>
            <p className="rankup-auto-note">Claims every rank-up with a random city. Turn it off any time in Settings.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default RankUpModal;

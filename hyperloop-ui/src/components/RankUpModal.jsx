import './RankUpModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

// choose: Lobbying Suavity lets the player pick the city, so the button says so.
// waiting: how many rank-ups are waiting. From 3 up, "Claim all" takes a random city for every one of them at once.
export const CLAIM_ALL_FROM = 3

// Escape does what the main button does - moves on to choosing the city - rather than closing the popup: this is the only
// way to claim the rank-up, so it can't simply be dismissed. A stray Escape is harmless: it only opens the city choice,
// which shows the cities and ignores Escape itself, so nothing is picked or paid for by it. (Never "Claim all".)
function RankUpModal({ onClaim, choose = false, waiting = 0, onClaimAll }) {
  useEscapeToClose(() => { playClickSound2(); onClaim() })
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading rankup-heading">You've ranked up!</h2>
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
      </div>
    </div>
  );
}

export default RankUpModal;

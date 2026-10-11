import './RankUpModal.css'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

// choose: Lobbying Suavity lets the player pick the city, so the button says so.
// waiting: how many rank-ups are waiting. From 3 up, "Claim all" takes a random city for every one of them at once.
export const CLAIM_ALL_FROM = 3

function RankUpModal({ onClaim, choose = false, waiting = 0, onClaimAll }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading">You've ranked up!</h2>
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

import './RankUpModal.css'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

// choose: Lobbying Suavity lets the player pick the city, so the button says so
function RankUpModal({ onClaim, choose = false }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading">You've ranked up!</h2>
        <button
          onMouseEnter={() => playHoverSound()}
          onClick={() => { playClickSound2(); onClaim(); }}
        >
          {choose ? 'Choose a City' : 'Claim City'}
        </button>
      </div>
    </div>
  );
}

export default RankUpModal;
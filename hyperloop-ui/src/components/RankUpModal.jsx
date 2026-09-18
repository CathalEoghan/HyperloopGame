import './RankUpModal.css'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

function RankUpModal({ onClaim }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading">You've ranked up!</h2>
        <button
          onMouseEnter={() => playHoverSound()}
          onClick={() => { playClickSound2(); onClaim(); }}
        >
          Claim City
        </button>
      </div>
    </div>
  );
}

export default RankUpModal;
import './RankUpModal.css'
import { playClickSound2, playHoverSound } from '../utils/sound.js'

function RankUpModal({ rank, onClaim }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="reveal-heading">You've reached <strong>Level {rank}</strong>!</h2>
        <button
          onMouseEnter={() => playHoverSound()}
          onClick={() => { playClickSound2(); onClaim(); }}
        >
          Claim Random City
        </button>
      </div>
    </div>
  );
}

export default RankUpModal;
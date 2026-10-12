import developmentThumbnails from '../data/developmentThumbnails.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './RankUpModal.css'
import './ClaimedCitiesModal.css'

// Shown after "Claim all developments": everything that was unlocked, in one list instead of a reveal for each.
// Shares its layout with the cities summary; the thumbnail takes the place of the flag and the category the place of country and tier.
function ClaimedDevelopmentsModal({ developments, onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal claimed-modal" role="dialog" aria-label="Developments unlocked">
                <h2 className="reveal-heading">You've unlocked the following developments:</h2>
                <div className="claimed-list">
                    {developments.map(dev => (
                        <div className="claimed-box" key={dev.name}>
                            <div className="claimed-top">
                                <img className="claimed-flag claimed-thumb" src={developmentThumbnails[dev.name]} alt="" />
                                <strong className="claimed-name">{dev.name}</strong>
                            </div>
                            <div className="claimed-sub">{dev.category}</div>
                        </div>
                    ))}
                </div>
                <button onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Accept</button>
            </div>
        </div>
    )
}

export default ClaimedDevelopmentsModal

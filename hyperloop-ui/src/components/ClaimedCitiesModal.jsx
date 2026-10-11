import countryFlags from '../data/countryFlags.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './RankUpModal.css'
import './ClaimedCitiesModal.css'

// Shown after "Claim all cities": every city that was unlocked, in one list instead of a reveal for each.
function ClaimedCitiesModal({ cities, onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal claimed-modal" role="dialog" aria-label="Cities unlocked">
                <h2 className="reveal-heading">You've unlocked the following cities:</h2>
                <div className="claimed-list">
                    {cities.map(city => (
                        <div className="claimed-box" key={city.name}>
                            <div className="claimed-top">
                                <img className="claimed-flag" src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} alt="" />
                                <strong className="claimed-name">{city.name}</strong>
                            </div>
                            <div className="claimed-sub">{city.country} • Tier {city.tier}</div>
                        </div>
                    ))}
                </div>
                <button onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Accept</button>
            </div>
        </div>
    )
}

export default ClaimedCitiesModal

import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from '../data/countryFlags.js'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playHoverSound, playDiceRollSound, playNotEnoughFundsSound } from '../utils/sound.js'
import './CityRevealModal.css'

// rerollCost is what the game will actually charge: 0 with a free re-roll, less with the
// re-roll discount (bug #64).
function CityRevealModal({ city, onClose, onReroll, reputation, rerollCost = 15 }) {
    const canReroll = reputation >= rerollCost
    const isSecret = city.name === 'Antarctic Peninsula'

    return (
        <div className="modal-overlay">
            <div className="modal">
                <img src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} />
                <h2 className="reveal-heading">You've unlocked <strong>{city.name}</strong>!</h2>
                <img className="modal-city-image" src={cityThumbnails[city.name]} alt={city.name} />
                <p style={{ fontSize: '0.8rem', color: '#888', margin: '4px 0 12px' }}>
                    {city.country} · Tier {city.tier}
                </p>
                {onReroll && !isSecret && (
                    <button
                        className="rerollButton"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => {
                            if (canReroll) {
                                playClickSound2()
                                playDiceRollSound()
                                onReroll()
                            } else {
                                playNotEnoughFundsSound()
                            }
                        }}
                        style={{ opacity: canReroll ? 1 : 0.5, cursor: canReroll ? 'pointer' : 'not-allowed' }}
                    >
                                                {rerollCost === 0
                            ? <span>Free re-roll</span>
                            : canReroll
                            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>Re-roll ({rerollCost}<img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', margin: '0 0 1px 3px' }} />)</span>
                            : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>Need {rerollCost}<img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', margin: '0 0 1px 3px' }} /> to re-roll (you have {reputation})</span>
                        }
                    </button>
                )}
                <button
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onClose(); }}
                >
                    Accept
                </button>
            </div>
        </div>
    )
}

export default CityRevealModal
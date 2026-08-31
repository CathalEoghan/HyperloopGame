import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2 } from '../utils/sound.js'
import './CityRevealModal.css'

function CityRevealModal({ city, onClose, onReroll, reputation }) {
    const canReroll = reputation >= 15

    return (
        <div className="modal-overlay">
            <div className="modal">
                <img src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} />
                <h2 className="reveal-heading">You've unlocked <strong>{city.name}</strong>!</h2>
                <img className="modal-city-image" src={cityImages[city.name]} alt={city.name} />
                <p style={{ fontSize: '0.8rem', color: '#888', margin: '4px 0 12px' }}>
                    {city.country} · Tier {city.tier}
                </p>
                {onReroll && (
                    <button
    className="rerollButton"
    onClick={() => { playClickSound2(); canReroll && onReroll() }}
    style={{ opacity: canReroll ? 1 : 0.5, cursor: canReroll ? 'pointer' : 'not-allowed' }}
>
    {canReroll 
        ? <>Re-roll (15 <img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />)</>
        : <>Need 15 <img src={reputationIcon} alt="rep" className="rep-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} /> to re-roll (you have {reputation})</>
    }
</button>
                )}
                <button onClick={() => { playClickSound2(); onClose(); }}>
                    Accept
                </button>
            </div>
        </div>
    )
}

export default CityRevealModal
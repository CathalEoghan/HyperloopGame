
import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'
import { playClickSound2 } from '../utils/sound.js'
import './CityRevealModal.css'

function CityRevealModal({ city, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <img src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} />
        <h2 className="reveal-heading">You've unlocked <strong>{city.name}</strong>!</h2>
        <img className="modal-city-image" src={cityImages[city.name]} alt={city.name} />
        <button onClick={() => {
          playClickSound2();
          onClose();
        }}>
            Close
            </button>
      </div>
    </div>
  );
}

export default CityRevealModal;
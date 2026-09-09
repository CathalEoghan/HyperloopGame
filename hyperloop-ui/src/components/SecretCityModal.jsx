import { useState } from 'react'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import globeIcon from '/public/globeIcon.png'
import './SecretCityModal.css'

function SecretCityModal({ onContinue }) {
    const [hovered, setHovered] = useState(false)

    return (
        <div className="modal-overlay">
            <div className="secret-city-modal">
                <img src={globeIcon} alt="globe" style={{ width: '48px', height: '48px', border: 'none', borderRadius: '0', marginBottom: '12px' }} />
                <h2 className="secret-city-title">You've connected every city!</h2>
                <p className="secret-city-subtitle">Or have you...</p>
                <button
                    className="closeButton"
                    style={{
                        marginTop: '24px',
                        background: hovered ? '#f5a623' : 'white',
                        color: hovered ? 'white' : 'black',
                        transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={() => { setHovered(true); playHoverSound() }}
                    onMouseLeave={() => setHovered(false)}
                    onClick={() => { playClickSound2(); onContinue() }}
                >
                    Interesting...
                </button>
            </div>
        </div>
    )
}

export default SecretCityModal
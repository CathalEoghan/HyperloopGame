import { useState, useEffect } from 'react'
import { playClickSound2, playHoverSound, playBigMomentSound } from '../utils/sound.js'
import './SecretCityModal.css'

function SecretCityModal({ onContinue }) {
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        playBigMomentSound()
    }, [])

    return (
        <div className="modal-overlay">
            <div className="secret-city-modal">
                <p className="secret-city-eyebrow">ALL CITIES CONNECTED</p>
                <h2 className="secret-city-title">You've connected every city!</h2>
                <p className="secret-city-subtitle">Or have you...</p>
                <button
                    className="closeButton"
                    style={{
                        marginTop: '24px',
                        background: hovered ? 'var(--ui-accent, #f5a623)' : 'white',
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
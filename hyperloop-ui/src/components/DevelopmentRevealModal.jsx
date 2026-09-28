import { useEffect } from 'react'
import developmentImages from '../data/developmentImages.js'
import { playClickSound2, playDevelopmentUnlockedSound, playHoverSound } from '../utils/sound.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import developmentRevealThumbnails from '../data/developmentRevealThumbnails.js'
import { cloudinaryResize } from '../utils/cloudinaryImage.js'
import './DevelopmentRevealModal.css'

function DevelopmentRevealModal({ development, onContinue }) {
    useEffect(() => {
        playDevelopmentUnlockedSound()
    }, [])

    return (
        <div className="modal-overlay">
            <div className="dev-reveal-modal">
                <p className="dev-reveal-heading">New development unlocked!</p>
                <img
                    className="dev-reveal-image"
                    src={developmentRevealThumbnails[development.name] || cloudinaryResize(developmentImages[development.name], 600) || developmentThumbnails[development.name]}
                    alt={development.name}
                />
                <p className="dev-reveal-category">{development.category}</p>
                <h3 className="dev-reveal-name">{development.name}</h3>
                <button
                    className="closeButton"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onContinue() }}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}

export default DevelopmentRevealModal
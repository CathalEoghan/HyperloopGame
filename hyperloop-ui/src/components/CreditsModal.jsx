import { playClickSound2 } from '../utils/sound.js'
import globeIcon from '../assets/misc/globeIcon.png'
import './CreditsModal.css'

const CREDITS_TEXT = `CITY IMAGES
All city photographs sourced via Pexels and Wikimedia Commons.
Full attribution available at github.com/CathalEoghan/HyperloopGame

DEVELOPMENT IMAGES
All development photographs sourced via Pexels and Wikimedia Commons.
Full attribution available at github.com/CathalEoghan/HyperloopGame

SOUNDS
cityConnectComplete.mp3 — Robinhood76 via Freesound
leavingSound.mp3 — GraceSoundProductions via Pixabay
farewellAccept.mp3 — Universfield via Pixabay
constructionSound.mp3 — freesound community via Pixabay
workClickSound.mp3 — linhmitto via Pixabay
openingAudio.mp3 — via Pixabay
hoverSound.mp3 — tunetank via Pixabay
developmentUnlocked.mp3 — freesound via Pixabay

REPUTATION ICON
Clean icons created by Smashicons — Flaticon

GLOBE TEXTURES
NASA Visible Earth

GAME DESIGN & DEVELOPMENT
Cathal Eoghan
Built with React, Three.js and a lot of Monster energy drinks.`

function CreditsModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="credits-modal" onClick={e => e.stopPropagation()}>
                <p className="credits-heading"><img src={globeIcon} alt="globe" className="brand-icon" /> CREDITS</p>
                <div className="credits-body">
                    {CREDITS_TEXT.split('\n').map((line, i) => (
                        <p key={i} className={line === line.toUpperCase() && line.trim() ? 'credits-section' : 'credits-line'}>
                            {line || '\u00A0'}
                        </p>
                    ))}
                </div>
                <button className="closeButton" onClick={() => { playClickSound2(); onClose() }}>Close</button>
            </div>
        </div>
    )
}

export default CreditsModal
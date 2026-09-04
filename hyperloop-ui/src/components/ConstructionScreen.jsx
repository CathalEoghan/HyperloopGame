import { useState, useEffect } from 'react'
import cityThumbnails from '../data/cityThumbnails.js'
import cityImages from '../data/cityImages.js'
import globeIcon from '/public/globeIcon.png'
import './ConstructionScreen.css'

const TIPS = [
    "Connect more cities to increase your daily income.",
    "Rank up to unlock new cities to connect.",
    "Build developments to boost your revenue beyond city income.",
    "Re-roll an unlocked city for 15 reputation if it doesn't suit you.",
    "Give personal farewells at the departure board to earn reputation.",
    "Upgrade your developments up to 3 times for a 100% income boost.",
    "Disconnecting a city costs half the connection fee and 20 reputation.",
    "Your terminal earns a small income while you're away.",
    "Tier 2 and 3 cities earn significantly more than Tier 1 cities.",
    "Work your terminal manually to earn extra cash.",
]

function ConstructionScreen({ city, isComplete, onEnter }) {
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
    const [tipVisible, setTipVisible] = useState(true)
    const [fading, setFading] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setTipVisible(false)
            setTimeout(() => {
                setTipIndex(i => (i + 1) % TIPS.length)
                setTipVisible(true)
            }, 600)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    const handleEnter = () => {
        if (!isComplete) return
        setFading(true)
        setTimeout(onEnter, 500)
    }

    return (
        <div
            className={`construction-screen ${fading ? 'construction-fading' : ''} ${isComplete ? 'construction-clickable' : ''}`}
            onClick={handleEnter}
        >
            <div className="construction-logo"><img src={globeIcon} alt="globe" className="brand-icon" /> HYPERLOOP EMPIRE</div>
            <img
                className={`construction-city-img ${isComplete ? 'construction-img-ready' : ''}`}
                src={cityThumbnails[city.name] || cityImages[city.name]}
                alt={city.name}
            />
            <div className="construction-text">
                {isComplete ? (
                    <>
                        <h2 className="construction-title">{city.name} is ready!</h2>
                        <p className="construction-subtitle">Your terminal is open for business.</p>
                        <p className="construction-enter">Click anywhere to enter</p>
                    </>
                ) : (
                    <>
                        <h2 className="construction-title">
                            Building your terminal in {city.name}
                            <span className="construction-dots"><span>.</span><span>.</span><span>.</span></span>
                        </h2>
                        <p className="construction-subtitle">Connecting {city.name} to the hyperloop network</p>
                    </>
                )}
            </div>
            <div className={`construction-tip ${tipVisible ? 'tip-visible' : 'tip-hidden'}`}>
                <span className="construction-tip-label">TIP</span>
                <span className="construction-tip-text">{TIPS[tipIndex]}</span>
            </div>
        </div>
    )
}

export default ConstructionScreen
import { useState, useEffect, useRef } from 'react'
import cityThumbnails from '../data/cityThumbnails.js'
import cityImages from '../data/cityImages.js'
import officialLogo from '../assets/misc/officialLogo.png'
import './ConstructionScreen.css'

const TIPS = [
    "Connect more cities to increase your daily income.",
    "Rank up to unlock new cities to connect.",
    "Only passive earnings or income from work clicks count towards ranking up.",
    "Build developments to boost your revenue beyond city income.",
    "Re-roll your city choices for 15 reputation if none of them suit you.",
    "Give personal farewells and greet arrivals at the Terminal Board to earn reputation.",
    "Upgrade your developments up to 10 times for up to a 450% income boost.",
    "Disconnecting a city costs half the connection fee and 20 reputation.",
    "Your terminal keeps earning while you're away.",
    "Tier 2 and 3 cities earn significantly more than Tier 1 cities.",
    "Work your terminal manually to earn extra cash.",
]

function ConstructionScreen({ city, isComplete, onEnter }) {
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
    const [tipVisible, setTipVisible] = useState(true)
    const [fading, setFading] = useState(false)

    useEffect(() => {
        let fadeTimer = null
        const interval = setInterval(() => {
            setTipVisible(false)
            fadeTimer = setTimeout(() => {
                setTipIndex(i => (i + 1) % TIPS.length)
                setTipVisible(true)
            }, 600)
        }, 4000)
        return () => { clearInterval(interval); clearTimeout(fadeTimer) }
    }, [])

    // A double-click must not enter twice, which played the opening sound twice (bug #173)
    const enteredRef = useRef(false)
    const handleEnter = () => {
        if (!isComplete || enteredRef.current) return
        enteredRef.current = true
        setFading(true)
        setTimeout(onEnter, 500)
    }

    // Space or Enter enters too, once the prompt is showing (a held key repeating, or a browser shortcut, doesn't count)
    const enterRef = useRef(null)
    useEffect(() => { enterRef.current = handleEnter })
    useEffect(() => {
        const onKey = (e) => {
            if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
            e.preventDefault()
            enterRef.current?.()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <div
            className={`construction-screen ${fading ? 'construction-fading' : ''} ${isComplete ? 'construction-clickable' : ''}`}
            onClick={handleEnter}
        >
            <div className="construction-main">
                <div className="construction-logo"><img src={officialLogo} alt="Hyperloop Empire" /></div>
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
            </div>
            {/* In normal document flow (not absolutely positioned over the text above), so the ready state's
                extra "Click anywhere to enter" line can never land underneath it (bug #185). */}
            <div className={`construction-tip ${tipVisible ? 'tip-visible' : 'tip-hidden'}`}>
                <span className="construction-tip-label">TIP</span>
                <span className="construction-tip-text">{TIPS[tipIndex]}</span>
            </div>
        </div>
    )
}

export default ConstructionScreen
import { useState, useEffect, useRef } from 'react'
import cityThumbnails from '../data/cityThumbnails.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import cityImages from '../data/cityImages.js'
import developmentImages from '../data/developmentImages.js'
import countryFlags from '../data/countryFlags.js'
import earthDay2k from '../assets/misc/2k_earth_daymap.jpg'
import earthNight2k from '../assets/misc/2k_earth_nightmap.jpg'
import earthDay8k from '../assets/misc/8k_earth_daymap.jpg'
import earthNight8k from '../assets/misc/8k_earth_nightmap.jpg'
import cashIcon from '../assets/misc/cash.png'
import clockIcon from '../assets/misc/clock.png'
import reputationIcon from '../assets/misc/reputation.png'
import starIcon from '../assets/misc/star.png'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import click_sound_2 from '../assets/sounds/click_sound_2.mp3'
import click_sound_3 from '../assets/sounds/click_sound_3.mp3'
import rankUpSound from '../assets/sounds/rankUpSound.mp3'
import leavingSound from '../assets/sounds/leavingSound.mp3'
import farewellAcceptSound from '../assets/sounds/farewellAccept.mp3'
import badNewsSound from '../assets/sounds/badNews.mp3'
import constructionSound from '../assets/sounds/constructionSound.mp3'
import workClickSound from '../assets/sounds/workClickSound.mp3'
import hoverSound from '../assets/sounds/hoverSound.mp3'
import reputationWorkBonus from '../assets/sounds/reputationBonusWork.mp3'
import bottomNavbarHover from '../assets/sounds/bottomNavbarHover.mp3'
import openingAudio from '../assets/sounds/openingAudio.mp3'
import { preloadImages } from '../utils/imageCache.js'
import './LoadingScreen.css'

const DURATION = 5000

const SOUNDS = [
    click_sound_2, click_sound_3, rankUpSound, leavingSound,
    farewellAcceptSound, badNewsSound, constructionSound,
    workClickSound, hoverSound, reputationWorkBonus, bottomNavbarHover,
    openingAudio,
]

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
    "Accepting a flight delay costs money but keeps your reputation intact.",
    "Developments unlocked by a city stay built even if you disconnect it.",
    "Export your save in Settings to back up your progress.",
    "Your reputation can never go below zero.",
]

function LoadingScreen({ onComplete }) {
    const [progress, setProgress] = useState(0)
    const [fading, setFading] = useState(false)
    const [statusText, setStatusText] = useState('Loading terminal systems...')
    const [ready, setReady] = useState(false)
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
    const [tipVisible, setTipVisible] = useState(true)
    const done = useRef(false)

    useEffect(() => {
        const quality = localStorage.getItem('globeQuality') || '2k'
        const globeTextures = quality === '8k'
            ? [earthDay8k, earthNight8k]
            : [earthDay2k, earthNight2k]

        const imageSrcs = [
            ...Object.values(cityThumbnails),
            ...Object.values(developmentThumbnails),
            ...Object.values(cityImages),
            ...Object.values(developmentImages),
            ...globeTextures,
            cashIcon, clockIcon, reputationIcon, starIcon, departureBoardImg,
        ]

        const flagSrcs = Object.values(countryFlags)
            .map(code => `https://flagcdn.com/w40/${code}.png`)

        preloadImages([...imageSrcs, ...flagSrcs])

        SOUNDS.forEach(src => {
            const audio = new Audio(src)
            audio.preload = 'auto'
        })

        const interval = 50
        const steps = DURATION / interval
        let current = 0

        const timer = setInterval(() => {
            current++
            const pct = current / steps
            setProgress(Math.min(pct * 100, 100))

            if (pct < 0.20)      setStatusText('Loading city thumbnails...')
            else if (pct < 0.40) setStatusText('Loading developments...')
            else if (pct < 0.60) setStatusText('Preloading flags...')
            else if (pct < 0.80) setStatusText('Loading globe textures...')
            else                 setStatusText('Ready.')

            if (current >= steps && !done.current) {
                done.current = true
                clearInterval(timer)
                setReady(true)
            }
        }, interval)

        return () => clearInterval(timer)
    }, [])

    // Rotate tips
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
        if (!ready) return
        new Audio(openingAudio).play().catch(() => {})
        setFading(true)
        setTimeout(onComplete, 600)
    }

    return (
        <div
            className={`loading-screen ${fading ? 'loading-fading' : ''} ${ready ? 'loading-clickable' : ''}`}
            onClick={handleEnter}
        >
            <div className="loading-content">
                <div className="loading-logo">⚡</div>
                <h1 className="loading-title">HYPERLOOP CENTRAL</h1>
                <p className="loading-tagline">The world's first hyperloop network</p>
                <div className="loading-bar-track">
                    <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="loading-status">{statusText}</p>
                {ready && (
                    <p className="loading-enter">Click anywhere to enter</p>
                )}
            </div>
            <div className={`loading-tip ${tipVisible ? 'tip-visible' : 'tip-hidden'}`}>
                <span className="loading-tip-label">TIP</span>
                <span className="loading-tip-text">{TIPS[tipIndex]}</span>
            </div>
        </div>
    )
}

export default LoadingScreen
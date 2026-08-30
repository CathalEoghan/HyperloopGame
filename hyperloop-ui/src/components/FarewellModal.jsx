import { useState, useEffect } from 'react'
import { playLeavingSound, playFarewellAcceptSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import countryFlags from '../data/countryFlags.js'
import './FarewellModal.css'

function FarewellModal({ departure, onFarewell, onMiss }) {
    const [secondsLeft, setSecondsLeft] = useState(300)

    useEffect(() => {
        playLeavingSound()
        const timer = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    onMiss()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    const timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`
    const isUrgent = secondsLeft <= 60
    const flagCode = countryFlags[departure.country]

    return (
        <div className="farewell-overlay">
            <div className="farewell-modal">
                <p className="farewell-attention">ATTENTION</p>
                <div className="farewell-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <div className="farewell-destination">
                    {flagCode && (
                        <img
                            src={`https://flagcdn.com/w40/${flagCode}.png`}
                            alt={departure.country}
                            className="farewell-flag"
                        />
                    )}
                    <span className="farewell-city-name">{departure.name}</span>
                </div>
                <p className="farewell-message">
                    Final call for passengers travelling to <strong>{departure.name}</strong>. Please proceed to Gate <strong>{departure.gate}</strong>.
                </p>
                <p
                    className={`farewell-timer ${isUrgent ? 'farewell-timer-urgent' : ''}`}
                >
                    {timeDisplay}
                </p>
                <button className="farewell-button" onClick={() => {
    playFarewellAcceptSound()
    onFarewell()
}}>
    Give a personal farewell (+5 <img src={reputationIcon} alt="reputation" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />)
</button>
            </div>
        </div>
    )
}

export default FarewellModal
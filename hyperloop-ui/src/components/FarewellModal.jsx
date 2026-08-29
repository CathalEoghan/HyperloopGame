import { useState, useEffect } from 'react'
import './FarewellModal.css'
import countryFlags from '../data/countryFlags.js'
import { playLeavingSound } from '../utils/sound.js'

function FarewellModal({ departure, onFarewell, onMiss }) {
    const [secondsLeft, setSecondsLeft] = useState(300) // 5 minutes

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

    return (
        <div className="modal-overlay">
            <div className="modal farewell-modal">
                <h2>✈️ Departure Alert!</h2>
                <p>Passengers are departing for <strong>{departure.name}</strong></p>
                <p>Platform {departure.platform} — {departure.time}</p>
                <p className="farewell-countdown">{timeDisplay}</p>
                <button onClick={onFarewell}>
                    Wave them off! 👋 (+5 🏆)
                </button>
            </div>
        </div>
    )
}

export default FarewellModal
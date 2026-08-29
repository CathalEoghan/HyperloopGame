import { useState, useEffect } from 'react'
import { playLeavingSound } from '../utils/sound.js'
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

    return (
        <div className="farewell-overlay">
            <div className="farewell-modal">
                <p className="farewell-attention">Departure Announcement</p>
                <p className="farewell-message">
                    Final call for passengers travelling to <strong>{departure.name}</strong>. Please proceed to <strong>Platform {departure.platform}</strong>.
                </p>
                <p className="farewell-timer" style={{ color: isUrgent ? 'red' : '#f5a623' }}>
                    {timeDisplay}
                </p>
                <button className="farewell-button" onClick={onFarewell}>
                    <strong>Give a personal farewell (+5 🏆)</strong>
                </button>
            </div>
        </div>
    )
}

export default FarewellModal
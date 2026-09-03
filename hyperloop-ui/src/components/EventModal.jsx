import { useState, useEffect } from 'react'
import { playClickSound2 } from '../utils/sound.js'
import './EventModal.css'

function EventModal({ event, onContinue }) {
    const [secondsLeft, setSecondsLeft] = useState(event.durationSeconds)

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) { clearInterval(timer); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const isPositive = event.type === 'positive'
    const multiplierText = event.effect.multiplier >= 1
        ? `×${event.effect.multiplier}`
        : `×${event.effect.multiplier.toFixed(2)}`
    const targetText = event.effect.target === 'passive' ? 'passive income' : 'work earnings'

    return (
        <div className="modal-overlay">
            <div className={`event-modal ${isPositive ? 'event-positive' : 'event-negative'}`}>
                <p className="event-type-label">{isPositive ? '▲ POSITIVE EVENT' : '▼ NEGATIVE EVENT'}</p>
                <h2 className="event-title">{event.title}</h2>
                <p className="event-description">{event.description}</p>
                <div className="event-effect-box">
                    <span className="event-multiplier">{multiplierText}</span>
                    <span className="event-effect-text">{targetText} for {secondsLeft}s</span>
                </div>
                <button
                    className="closeButton"
                    onClick={() => { playClickSound2(); onContinue() }}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}

export default EventModal
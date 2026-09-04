import { useState, useEffect } from 'react'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './EventModal.css'

function EventModal({ event, onContinue, terminalName }) {
    const [secondsLeft, setSecondsLeft] = useState(event.durationSeconds || 0)

    useEffect(() => {
        if (!event.durationSeconds) return
        const timer = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) { clearInterval(timer); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const isPositive = event.type === 'positive'
    const isInstant = event.effectType === 'instantCash' || event.effectType === 'instantCashLoss'

    const getEffectText = () => {
        if (event.effectType === 'instantCash') return `+£${event.instantCashAmount?.toLocaleString()} added to your balance`
        if (event.effectType === 'instantCashLoss') return `-£${Math.abs(event.instantCashAmount)?.toLocaleString()} deducted from your balance`
        if (event.effectType === 'passiveBoost') return `+50% passive income for ${secondsLeft}s`
        if (event.effectType === 'passivePenalty') return `-50% passive income for ${secondsLeft}s`
        if (event.effectType === 'workBoost') return `+50% work earnings for ${secondsLeft}s`
        if (event.effectType === 'workPenalty') return `-50% work earnings for ${secondsLeft}s`
        return ''
    }

    const description = typeof event.description === 'function'
        ? event.description(terminalName || 'your terminal')
        : event.description

    return (
        <div className="modal-overlay">
            <div className={`event-modal ${isPositive ? 'event-positive' : 'event-negative'}`}>
                <p className="event-type-label">{isPositive ? '▲ POSITIVE EVENT' : '▼ NEGATIVE EVENT'}</p>
                <h2 className="event-title">{event.title}</h2>
                <p className="event-description">{description}</p>
                <div className="event-effect-box">
                    <span className={`event-effect-indicator ${isPositive ? 'event-positive-text' : 'event-negative-text'}`}>
                        {isPositive ? '▲' : '▼'}
                    </span>
                    <span className="event-effect-text">{getEffectText()}</span>
                </div>
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

export default EventModal
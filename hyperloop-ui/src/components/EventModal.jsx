import { useState, useEffect } from 'react'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './EventModal.css'

function EventModal({ event, onContinue, terminalName }) {
    // Count down to the event's real end time, not from the full length when the popup happens to appear (bug #122)
    const remaining = () => event.expiresAt ? Math.max(0, Math.ceil((event.expiresAt - Date.now()) / 1000)) : (event.durationSeconds || 0)
    const [secondsLeft, setSecondsLeft] = useState(remaining)

    useEffect(() => {
        if (!event.durationSeconds) return
        const timer = setInterval(() => {
            const next = event.expiresAt ? remaining() : null
            setSecondsLeft(prev => {
                const value = next !== null ? next : prev - 1
                if (value <= 0) { clearInterval(timer); return 0 }
                return value
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const isPositive = event.type === 'positive'

    // Follows "for Ns" when a duration upgrade changed how long the event runs: "(+x% longer)" for a positive
    // event's bonusDurationExtension upgrades, "(x% shorter)" when Resilience cut a negative event short.
    const durationSuffix = event.durationModifier
        ? ` (${event.durationModifier.direction === 'longer' ? '+' : ''}${event.durationModifier.percent}% ${event.durationModifier.direction})`
        : ''

    const getEffectText = () => {
        if (event.effectType === 'instantCash') return `£${event.instantCashAmount?.toLocaleString('en-GB', { maximumFractionDigits: 0 })} has been added to your balance`
        if (event.effectType === 'instantCashLoss') return `£${Math.abs(event.instantCashAmount)?.toLocaleString('en-GB', { maximumFractionDigits: 0 })} has been deducted from your balance`
        if (event.effectType === 'passiveBoost') return `+${Math.round((event.effect.multiplier - 1) * 100)}% passive income for ${secondsLeft}s${durationSuffix}`
        if (event.effectType === 'passivePenalty') return `-${Math.round((1 - event.effect.multiplier) * 100)}% passive income for ${secondsLeft}s${durationSuffix}`
        if (event.effectType === 'workBoost') return `+${Math.round((event.effect.multiplier - 1) * 100)}% work earnings for ${secondsLeft}s${durationSuffix}`
        if (event.effectType === 'workPenalty') return `-${Math.round((1 - event.effect.multiplier) * 100)}% work earnings for ${secondsLeft}s${durationSuffix}`
        return ''
    }

    const description = typeof event.description === 'function'
        ? event.description(terminalName || 'your terminal', event)
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
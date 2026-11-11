import { useState, useEffect } from 'react'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import increaseIcon from '../assets/misc/increase.png'
import decreaseIcon from '../assets/misc/decrease.png'
import './EventModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'

function EventModal({ event, onContinue, terminalName }) {
    // Escape = Continue: an event popup is only a notice, the event carries on either way
    useEscapeToClose(() => { playClickSound2(); onContinue() })
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

    // Shown as their own small tags under the main effect line, rather than folded into that sentence - with
    // both a duration change and Pizza Parties active, the sentence ran long enough to wrap mid-phrase inside
    // the fixed-width effect box, which read as cramped rather than just long.
    const durationTag = event.durationModifier
        ? `${event.durationModifier.direction === 'longer' ? '+' : ''}${event.durationModifier.percent}% ${event.durationModifier.direction}`
        : null
    const pizzaTag = event.pizzaBoosted ? '×2 - Pizza Parties' : null
    const modifierTags = [durationTag, pizzaTag].filter(Boolean)

    // Home cities don't all use £, so the amount is shown next to the generic cash icon rather than a £ sign (bug #211)
    const cashIconEl = <img src={cashIcon} alt="cash" className="cash-icon" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }} />

    // In place of the plain green ▲ / red ▼ triangle, used both in the small type label and the effect box below it
    const trendIconEl = <img src={isPositive ? increaseIcon : decreaseIcon} alt="" className="event-trend-icon" />

    const getEffectText = () => {
        if (event.effectType === 'instantCash') return <>{cashIconEl}{event.instantCashAmount?.toLocaleString('en-GB', { maximumFractionDigits: 0 })} has been added to your balance</>
        if (event.effectType === 'instantCashLoss') return <>{cashIconEl}{Math.abs(event.instantCashAmount)?.toLocaleString('en-GB', { maximumFractionDigits: 0 })} has been deducted from your balance</>
        if (event.effectType === 'passiveBoost') return `+${Math.round((event.effect.multiplier - 1) * 100)}% passive income for ${secondsLeft}s`
        if (event.effectType === 'passivePenalty') return `-${Math.round((1 - event.effect.multiplier) * 100)}% passive income for ${secondsLeft}s`
        if (event.effectType === 'workBoost') return `+${Math.round((event.effect.multiplier - 1) * 100)}% work earnings for ${secondsLeft}s`
        if (event.effectType === 'workPenalty') return `-${Math.round((1 - event.effect.multiplier) * 100)}% work earnings for ${secondsLeft}s`
        return ''
    }

    const description = typeof event.description === 'function'
        ? event.description(terminalName || 'your terminal', event)
        : event.description

    return (
        <div className="modal-overlay">
            <div className={`event-modal ${isPositive ? 'event-positive' : 'event-negative'}`}>
                <p className="event-type-label">{trendIconEl} {isPositive ? 'POSITIVE EVENT' : 'NEGATIVE EVENT'}</p>
                <h2 className="event-title">{event.title}</h2>
                <p className="event-description">{description}</p>
                {event.celebrityHint && <p className="event-hint">Keep an eye on the departure board...</p>}
                <div className="event-effect-box">
                    <div className="event-effect-main">
                        <span className={`event-effect-indicator ${isPositive ? 'event-positive-text' : 'event-negative-text'}`}>
                            {trendIconEl}
                        </span>
                        <span className="event-effect-text">{getEffectText()}</span>
                    </div>
                    {modifierTags.length > 0 && (
                        <div className="event-modifier-tags">
                            {modifierTags.map(tag => <span key={tag} className="event-modifier-tag">{tag}</span>)}
                        </div>
                    )}
                </div>
                {/* Improved Accessibility Services and News Column both pay a flat Reputation bonus on every positive
                    event, on top of whatever the event itself does - shown here so it isn't only a sound (bug: it used
                    to be paid in total silence). */}
                {event.eventRepBonus > 0 && (
                    <div className="event-effect-box event-rep-box">
                        <img src={reputationIcon} alt="reputation" className="event-rep-icon" />
                        <span className="event-effect-text">+{event.eventRepBonus} Reputation</span>
                    </div>
                )}
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
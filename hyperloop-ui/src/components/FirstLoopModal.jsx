import { useState } from 'react'
import './FirstLoopModal.css'
import { playClickSound2, playHoverSound, playNotEnoughFundsSound } from '../utils/sound.js'
import { timeString } from '../utils/loops.js'
import { automateTimetable } from '../utils/timetable.js'
import { AUTOMATE_SCHEDULE_REP_COST } from 'Managers/ProgressionManager/ProgressionManager.js'
import reputationIcon from '../assets/misc/reputation.png'

// Shown after the first city is connected: nothing runs until a departure is scheduled, so this points the player at
// both ways of doing it. `onSchedule` opens the board on the Schedule loop screen; `onViewBoard` opens it as it is.
// Automate here costs the same Reputation as the Departure Board's own button (see AUTOMATE_SCHEDULE_REP_COST) -
// kept in step so a first-time player isn't taught a different price to the one they'll see from then on.
export default function FirstLoopModal({ purchasedCities, reputation = 0, progressionManager = null, onSchedule, onViewBoard, onAutomated = () => {}, onSave = () => {}, onClose }) {
    const [result, setResult] = useState(null)

    // The real Reputation, not the prop, which can be a second old (bug #170) - same convention as the board.
    const canAffordAutomate = () => !progressionManager || progressionManager.reputation >= AUTOMATE_SCHEDULE_REP_COST

    const automate = () => {
        if (!canAffordAutomate()) { playNotEnoughFundsSound(); return }
        playClickSound2()
        const outcome = automateTimetable(purchasedCities)
        if (outcome.added.length > 0) {
            // Only actually scheduling something costs Reputation - a click that does nothing isn't charged for.
            progressionManager?.addReputation(-AUTOMATE_SCHEDULE_REP_COST)
            onSave()
            onAutomated()
        }
        setResult(outcome)
    }

    const tooPoor = reputation < AUTOMATE_SCHEDULE_REP_COST

    return (
        <div className="firstloop-overlay">
            <div className="firstloop-panel" role="dialog" aria-label="Schedule your first loop">
                <h2 className="firstloop-title">{result ? 'Loop scheduled!' : 'Your first city is connected!'}</h2>
                {result ? (
                    <>
                        <ul className="firstloop-result">
                            {result.added.map(s => (
                                <li key={s.name}><b>{s.name}</b> leaves at {timeString(s.minuteOfDay)} from Gate {s.gate}</li>
                            ))}
                        </ul>
                        <p className="firstloop-text">You can change the time and gate any time from the Terminal Board.</p>
                        <div className="firstloop-actions">
                            <button className="firstloop-btn firstloop-btn-primary" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onViewBoard() }}>View the board</button>
                            <button className="firstloop-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Close</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="firstloop-text">
                            No loops run <strong>until you schedule them</strong>, and a city <strong>earns nothing until it has a departure</strong>.
                             Pick a time and gate for it yourself, or automate it and the game picks for you, so
                            passengers can start travelling!
                        </p>
                        <p className="firstloop-tip"><b>Tip:</b> Be at the terminal when a loop departs to say farewell and earn Reputation.</p>
                        <div className="firstloop-actions">
                            <button className="firstloop-btn firstloop-btn-primary" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onSchedule() }}>Schedule a loop</button>
                            <button
                                className="firstloop-btn"
                                style={{ opacity: tooPoor ? 0.5 : 1 }}
                                aria-disabled={tooPoor}
                                title={tooPoor ? `Costs ${AUTOMATE_SCHEDULE_REP_COST} Reputation - not enough` : `Costs ${AUTOMATE_SCHEDULE_REP_COST} Reputation`}
                                onMouseEnter={() => { if (!tooPoor) playHoverSound() }}
                                onClick={automate}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Automate it
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.78rem', opacity: 0.85 }}>
                                        (<img src={reputationIcon} alt="rep" style={{ width: '11px', height: '11px', border: 'none', verticalAlign: 'middle' }} />{AUTOMATE_SCHEDULE_REP_COST})
                                    </span>
                                </span>
                            </button>
                            <button className="firstloop-btn firstloop-btn-quiet" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Later</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

import { useState } from 'react'
import './FirstLoopModal.css'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import { timeString } from '../utils/loops.js'
import { automateTimetable } from '../utils/timetable.js'

// Shown after the first city is connected: nothing runs until a departure is scheduled, so this points the player at
// both ways of doing it. `onSchedule` opens the board on the Schedule loop screen; `onViewBoard` opens it as it is.
export default function FirstLoopModal({ purchasedCities, onSchedule, onViewBoard, onAutomated = () => {}, onClose }) {
    const [result, setResult] = useState(null)

    const automate = () => {
        playClickSound2()
        const outcome = automateTimetable(purchasedCities)
        if (outcome.added.length > 0) onAutomated()
        setResult(outcome)
    }

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
                            No loops run until you schedule them. Pick a time and gate for its departure yourself,
                            or automate it and the game picks for you, so passengers can start travelling.
                        </p>
                        <p className="firstloop-tip"><b>Tip:</b> be at the terminal when a loop departs to say farewell and earn Reputation.</p>
                        <div className="firstloop-actions">
                            <button className="firstloop-btn firstloop-btn-primary" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onSchedule() }}>Schedule a loop</button>
                            <button className="firstloop-btn" onMouseEnter={() => playHoverSound()} onClick={automate}>Automate it</button>
                            <button className="firstloop-btn firstloop-btn-quiet" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Later</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

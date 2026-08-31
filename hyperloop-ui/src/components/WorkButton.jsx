import { useState, useCallback } from 'react'
import './WorkButton.css'

const WORK_PHRASES = [
    'Processed passenger',
    'Attended meeting',
    'Worked security',
    'Shop inspection',
    'Advertising venture',
    'Hired employee',
    'Dealt with complaint',
    'Called engineering team',
    'Updated timetable',
    'Briefed ground crew',
    'Reviewed safety report',
    'Assisted lost traveller',
]

let floatId = 0

function WorkButton({ onWork, earnings }) {
    const [floats, setFloats] = useState([])

    const handleClick = useCallback((e) => {
        onWork()
        const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)]
        const id = floatId++
        const x = e.clientX
        const y = e.clientY
        setFloats(prev => [...prev, { id, phrase, x, y }])
        setTimeout(() => {
            setFloats(prev => prev.filter(f => f.id !== id))
        }, 1500)
    }, [onWork])

    return (
        <>
            <button className="work-btn" onClick={handleClick}>
                Work
            </button>
            {floats.map(f => (
                <div
                    key={f.id}
                    className="work-float"
                    style={{ left: f.x, top: f.y }}
                >
                    <span className="work-float-phrase">{f.phrase}</span>
                    <span className="work-float-earnings">+£{earnings.toLocaleString()}</span>
                </div>
            ))}
        </>
    )
}

export default WorkButton
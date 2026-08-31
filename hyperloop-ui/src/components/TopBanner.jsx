import { useState, useRef } from 'react'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import starIcon from '../assets/misc/star.png'
import { playClickSound2, playClickSound3, playWorkClickSound } from '../utils/sound.js'

const WORK_PHRASES = [
    'Processed passenger',
    'Attended meeting',
    'Worked security',
    'Shop inspection',
    'Advertising campaign shoot',
    'Hired new employee',
    'Dealt with complaint',
    'Called engineering team',
    'Updated timetable',
    'Briefed ground crew',
    'Reviewed safety report',
    'Assisted lost traveller',
    'Found lost luggage',
    'Met with union leaders',
    'Posted to social media',
    'Delivered speech to workers',
    'Planned new development',
    'Assembled financial advisors'
]

let floatId = 0

function TopBanner({ terminalName, balance, rank, activeTab, onSelect, reputation, onWork, workEarnings }) {
    const [floats, setFloats] = useState([])
    const btnRef = useRef(null)

    const handleWork = () => {
        onWork()
        playWorkClickSound()
        const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)]
        const id = floatId++
        const rect = btnRef.current.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top
        setFloats(prev => [...prev, { id, phrase, x, y }])
        setTimeout(() => {
            setFloats(prev => prev.filter(f => f.id !== id))
        }, 1500)
    }

    return (
        <div className="TopBanner">
            <h1 className="TerminalName">{terminalName}</h1>

        <button ref={btnRef} className="work-banner-btn" onClick={handleWork}>
    Work (<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginBottom: '1px' }} /> {workEarnings.toLocaleString()})
</button>
            <div className="work-divider" />

            <div className="rightSideDetails">
                <div className="time">
                    <img src={clockIcon} alt="time" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="rank">
                    <img src={starIcon} alt="rank" /> Rank {rank}
                </div>
                <div className="balance">
                    <img src={cashIcon} alt="balance" /> £{Math.floor(balance).toLocaleString()}
                </div>
                <div className="reputation">
                    🏆 {reputation}
                </div>
            </div>

            <button
                className="MysterySpot"
                onClick={() => {
                    if (activeTab === "DepartureBoard") {
                        playClickSound3();
                    } else {
                        playClickSound2();
                    }
                    onSelect(activeTab === "DepartureBoard" ? "Home" : "DepartureBoard");
                }}
                style={{
                    backgroundImage: `url(${departureBoardImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <span className="MysterySpotLabel">DEPARTURE BOARD</span>
            </button>

            {floats.map(f => (
                <div key={f.id} className="work-float" style={{ left: f.x, top: f.y }}>
                    <span className="work-float-phrase">{f.phrase}</span>
                    <span className="work-float-earnings">+£{workEarnings.toLocaleString()}</span>
                </div>
            ))}
        </div>
    )
}

export default TopBanner
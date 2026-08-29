import { useState, useEffect } from "react"
import './DepartureBoard.css'

function FlapText({ text }) {
    return (
        <span className="flap-text">
            {text.split('').map((char, i) =>
                char === ' '
                    ? <span key={i} className="flap-space"> </span>
                    : <span key={i} className="flap-char">{char}</span>
            )}
        </span>
    )
}

function FlipStatus({ status }) {
    return (
        <td className="flip-cell">
            <div className="flip-card" key={status.label}>
                <FlapText text={status.label} />
            </div>
        </td>
    )
}

function DepartureBoard({ purchasedCities }) {
    const [schedule, setSchedule] = useState([])
    const [, setTick] = useState(0)

    function generateSchedule(cities) {
        const shuffled = [...cities].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, Math.min(100, cities.length))
        const totalMinutes = 24 * 60
        const minGap = 10
        const numPlatforms = 30
        const minPlatformGap = 30
        const slotSize = Math.floor(totalMinutes / selected.length)
        const platformLastUsed = new Array(numPlatforms + 1).fill(-Infinity)
        const departures = []

        selected.forEach((city, i) => {
            const slotStart = i * slotSize
            const slotEnd = Math.min(slotStart + slotSize, totalMinutes - 1)
            let minuteOfDay = slotStart + Math.floor(Math.random() * (slotEnd - slotStart))
            minuteOfDay = Math.floor(minuteOfDay / 5) * 5
            if (departures.length > 0) {
                const lastTime = departures[departures.length - 1].minuteOfDay
                if (minuteOfDay - lastTime < minGap) {
                    minuteOfDay = Math.ceil((lastTime + minGap) / 5) * 5
                }
            }
            const availablePlatforms = []
            for (let p = 1; p <= numPlatforms; p++) {
                if (minuteOfDay - platformLastUsed[p] >= minPlatformGap) {
                    availablePlatforms.push(p)
                }
            }
            let platform
            if (availablePlatforms.length > 0) {
                platform = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)]
            } else {
                let earliest = Infinity
                for (let p = 1; p <= numPlatforms; p++) {
                    if (platformLastUsed[p] < earliest) {
                        earliest = platformLastUsed[p]
                        platform = p
                    }
                }
            }
            platformLastUsed[platform] = minuteOfDay
            const hour = Math.floor(minuteOfDay / 60)
            const minute = minuteOfDay % 60
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
            departures.push({ name: city.name, country: city.country, time: timeString, hour, minute, minuteOfDay, platform })
        })

        return departures.sort((a, b) => a.minuteOfDay - b.minuteOfDay)
    }

    function getStatus(hour, minute) {
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const departureMinutes = hour * 60 + minute
        const diff = departureMinutes - currentMinutes
       if (diff < -5)  return { label: 'DEPARTED',   color: '#888' }
if (diff <= 0)  return { label: 'FINAL CALL',  color: 'red' }
if (diff <= 30) return { label: 'BOARDING',    color: 'limegreen' }
return           { label: 'SCHEDULED',         color: '#aaa' }
    }

    useEffect(() => {
        const today = new Date().toDateString()
        const key = `departures_${today}`
        const saved = localStorage.getItem(key)
        if (saved) {
            setSchedule(JSON.parse(saved))
        } else {
            const generated = generateSchedule(purchasedCities)
            localStorage.setItem(key, JSON.stringify(generated))
            setSchedule(generated)
        }
    }, [])

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 30000)
        return () => clearInterval(interval)
    }, [])

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const half = Math.ceil(schedule.length / 2)
    const leftColumn = schedule.slice(0, half)
    const rightColumn = schedule.slice(half)

    const renderRow = (entry, i) => {
    const status = getStatus(entry.hour, entry.minute)
    const isGone = status.label === 'DEPARTED'
    const showPlatform = status.label !== 'SCHEDULED'
    return (
        <tr key={i} style={{ opacity: isGone ? 0.4 : 1 }}>
            <td><FlapText text={entry.name.toUpperCase()} /></td>
            <td><FlapText text={entry.time} /></td>
            <td><FlapText text={showPlatform ? String(entry.platform) : '--'} /></td>
            <FlipStatus status={status} />
        </tr>
    )
}

    return (
        <div className="departure-board">
            <h2 className="board-title">🛫 Departures — {today}</h2>
            {schedule.length === 0 ? (
                <p>No departures scheduled.</p>
            ) : (
                <div className="board-columns">
                    <table className="board-table">
                        <thead>
                            <tr>
                                <th>DESTINATION</th>
                                <th>DEPARTS</th>
                                <th>PLATFORM</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>{leftColumn.map(renderRow)}</tbody>
                    </table>
                    <table className="board-table">
                        <thead>
                            <tr>
                                <th>DESTINATION</th>
                                <th>DEPARTS</th>
                                <th>PLATFORM</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>{rightColumn.map(renderRow)}</tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default DepartureBoard
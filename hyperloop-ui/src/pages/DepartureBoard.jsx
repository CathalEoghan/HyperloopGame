
import { useState, useEffect } from "react"
import './DepartureBoard.css'

function DepartureBoard({purchasedCities}) {

    const [schedule, setSchedule] = useState([])

function generateSchedule(cities) {
    const shuffled = [...cities].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(100, cities.length))

    const totalMinutes = 24 * 60
    const minGap = 10
    const numPlatforms = 12
    const minPlatformGap = 30
    const slotSize = Math.floor(totalMinutes / selected.length)
    const platformLastUsed = new Array(numPlatforms + 1).fill(-Infinity)

    const departures = []

    selected.forEach((city, i) => {
        const slotStart = i * slotSize
        const slotEnd = Math.min(slotStart + slotSize, totalMinutes - 1)

        // Random time within slot, rounded to nearest 5
        let minuteOfDay = slotStart + Math.floor(Math.random() * (slotEnd - slotStart))
        minuteOfDay = Math.floor(minuteOfDay / 5) * 5

        // Enforce minimum gap from previous departure
        if (departures.length > 0) {
            const lastTime = departures[departures.length - 1].minuteOfDay
            if (minuteOfDay - lastTime < minGap) {
                minuteOfDay = Math.ceil((lastTime + minGap) / 5) * 5
            }
        }

        // Find a platform not used in the last 30 minutes
        let platform = null
        for (let p = 1; p <= numPlatforms; p++) {
            if (minuteOfDay - platformLastUsed[p] >= minPlatformGap) {
                platform = p
                break
            }
        }
        // Fallback: pick the platform used longest ago
        if (!platform) {
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

        departures.push({
            name: city.name,
            country: city.country,
            time: timeString,
            hour,
            minute,
            minuteOfDay,
            platform
        })
    })

    return departures.sort((a, b) => a.minuteOfDay - b.minuteOfDay)
}

function getStatus(hour, minute) {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const departureMinutes = hour * 60 + minute
    const diff = departureMinutes - currentMinutes

    if (diff < -5) return { label: 'DEPARTED', color: '#666' }
    if (diff <= 0) return { label: 'BOARDING', color: 'limegreen' }
    if (diff <= 30) return { label: 'ON TIME', color: '#f5a623' }
    return { label: 'SCHEDULED', color: '#aaa' }
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

const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const half = Math.ceil(schedule.length / 2)
const leftColumn = schedule.slice(0, half)
const rightColumn = schedule.slice(half)

return (
    <div className="departure-board">
        <h2 className="board-title">🛫 Departures for {today}. Departures reset daily at 00:00.</h2>
        {schedule.length === 0 ? (
            <p>No departures scheduled.</p>
        ) : (
            <div className="board-columns">
                <table className="board-table">
                    <thead><tr><th>DESTINATION</th><th>DEPARTS</th><th>PLATFORM</th><th>STATUS</th></tr></thead>
                    <tbody>
                        {leftColumn.map((entry, i) => {
                            const status = getStatus(entry.hour, entry.minute)
                            return <tr key={i}><td>{entry.name.toUpperCase()}</td><td>{entry.time}</td><td>{entry.platform}</td><td style={{ color: status.color }}>{status.label}</td></tr>
                        })}
                    </tbody>
                </table>
                <table className="board-table">
                    <thead><tr><th>DESTINATION</th><th>DEPARTS</th><th>PLATFORM</th><th>STATUS</th></tr></thead>
                    <tbody>
                        {rightColumn.map((entry, i) => {
                            const status = getStatus(entry.hour, entry.minute)
                            return <tr key={i}><td>{entry.name.toUpperCase()}</td><td>{entry.time}</td><td>{entry.platform}</td><td style={{ color: status.color }}>{status.label}</td></tr>
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)
}
export default DepartureBoard

import { useState, useEffect } from "react"
import './DepartureBoard.css'

function DepartureBoard({purchasedCities}) {

    const [schedule, setSchedule] = useState([])

function generateSchedule(cities) {
    // Pick up to 20 cities randomly
    const shuffled = [...cities].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 20)
    
    const totalMinutes = 24 * 60 // 1440 minutes in a day
    const slotSize = Math.floor(totalMinutes / selected.length)
    
    return selected.map((city, i) => {
        // Random minute within this slot
        const slotStart = i * slotSize
        const minuteOfDay = slotStart + Math.floor(Math.random() * slotSize)
        const hour = Math.floor(minuteOfDay / 60)
        const minute = Math.floor((minuteOfDay % 60) / 5) * 5
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        
        return {
            name: city.name,
            country: city.country,
            time: timeString,
            hour,
            minute,
            platform: Math.floor(Math.random() * 12) + 1
        }
    }).sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute))
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
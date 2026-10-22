import { useState } from 'react'
import './ScheduleModal.css'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound } from '../utils/sound.js'
import { NUM_GATES, timeString, entryTimestamp, formatDuration } from '../utils/loops.js'
import { formatPerHour } from '../utils/income.js'
import { readTimetable, saveSlot, removeSlot, unscheduledCities, slotProblem, busyGates, previewLoop, MIN_LEAD } from '../utils/timetable.js'
import cashIcon from '../assets/misc/cash.png'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const GATES = Array.from({ length: NUM_GATES }, (_, i) => i + 1)

// A time and gate for a city that the timetable has room for, starting about half an hour from now
function suggestSlot(timetable, name, nowMs = Date.now()) {
    const now = new Date(nowMs)
    const start = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 5) * 5
    for (let step = 0; step < 288; step++) {
        const minuteOfDay = ((start + step * 5 - 5) % 1435) + 5
        const busy = busyGates(timetable, name, minuteOfDay)
        const gate = GATES.find(g => !busy[g])
        if (gate && !slotProblem(timetable, { name, minuteOfDay, gate }, nowMs)) return { minuteOfDay, gate }
    }
    return { minuteOfDay: 12 * 60, gate: 1 }
}

// The Schedule loop screen: add a city to the departure timetable, and move or remove the ones already on it.
// `onChange` is called after every change so the board can redraw.
export default function ScheduleModal({ purchasedCities, onChange = () => {}, onClose }) {
    const home = purchasedCities[0]
    const [version, setVersion] = useState(0)
    const timetable = readTimetable().filter(e => purchasedCities.some(c => c.name === e.name))
    const open = unscheduledCities(purchasedCities, timetable).sort((x, y) => x.name.localeCompare(y.name))
    const [editing, setEditing] = useState(null)       // the city being moved, or null when adding
    const [cityPick, setCity] = useState(() => open[0]?.name || '')
    const [slot, setSlot] = useState(() => suggestSlot(timetable, open[0]?.name || ''))
    // The city being added. When the one picked is no longer on offer (the form was hidden because every city was
    // scheduled, then one was removed), the first city on offer is the one the form shows, so it is the one used.
    const city = editing ? editing : (open.some(c => c.name === cityPick) ? cityPick : (open[0]?.name || ''))
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    void version

    const hour = Math.floor(slot.minuteOfDay / 60), minute = slot.minuteOfDay % 60
    const busy = busyGates(timetable, city, slot.minuteOfDay)
    const problem = city ? slotProblem(timetable, { name: city, ...slot }) : null
    const preview = city ? previewLoop(home.name, city, slot.minuteOfDay) : null
    const tooSoonToday = city && entryTimestamp({ hour, minute }, Date.now()) - Date.now() < MIN_LEAD * 60000
    const formVisible = editing !== null || open.length > 0

    const refresh = () => { setVersion(v => v + 1); onChange() }
    // Changing the time may land on a gate that is busy then: move to one that is free
    const setMinuteOfDay = minuteOfDay => {
        const taken = busyGates(timetable, city, minuteOfDay)
        setSlot(s => ({ minuteOfDay, gate: taken[s.gate] ? (GATES.find(g => !taken[g]) ?? s.gate) : s.gate }))
        setError(''); setNotice('')
    }
    const chooseCity = name => {
        setCity(name)
        setSlot(suggestSlot(timetable, name))
        setError(''); setNotice('')
    }
    const resetForm = () => {
        const next = unscheduledCities(purchasedCities, readTimetable()).sort((x, y) => x.name.localeCompare(y.name))
        setEditing(null)
        setCity(next[0]?.name || '')
        setSlot(suggestSlot(readTimetable(), next[0]?.name || ''))
    }
    const submit = () => {
        playClickSound2()
        const result = saveSlot({ name: city, ...slot }, purchasedCities)
        if (!result.ok) { setError(result.error); return }
        const verb = editing ? 'Moved' : 'Scheduled'
        setNotice(`${verb} ${city} to ${timeString(slot.minuteOfDay)}, Gate ${slot.gate}. ${result.today ? 'It leaves today.' : 'It starts tomorrow.'}`)
        setError('')
        resetForm()
        refresh()
    }
    const startEdit = entry => {
        playClickSound2()
        setEditing(entry.name); setCity(entry.name)
        setSlot({ minuteOfDay: entry.minuteOfDay, gate: entry.gate })
        setError(''); setNotice('')
    }
    const remove = entry => {
        playClickSound2()
        removeSlot(entry.name, purchasedCities)
        if (editing === entry.name) resetForm()
        setNotice(`${entry.name} is off the timetable.`)
        refresh()
    }

    return (
        <div className="sched-overlay" onClick={onClose}>
            <div className="sched-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label="Schedule loop">
                <div className="sched-header">
                    <span className="sched-title">Schedule departures</span>
                    <button className="sched-close" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }} aria-label="Close">✕</button>
                </div>
                <div className="sched-body">
                    <p className="sched-intro">
                        Each city can leave once a day. Loops can leave at the same time from different gates, but a gate can't be reused for 30 minutes.
                        Your timetable is saved and repeats every day at no extra cost, though passenger counts and income will vary from day to day.
                    </p>

                    {formVisible ? (
                        <div className="sched-form">
                            <div className="sched-form-title">{editing ? `Move ${editing}` : 'Add a loop'}</div>
                            <div className="sched-fields">
                                <label className="sched-field">
                                    <span>City</span>
                                    <select value={city} disabled={editing !== null} onChange={e => chooseCity(e.target.value)}>
                                        {(editing ? [{ name: editing }] : open).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </label>
                                <label className="sched-field">
                                    <span>Departs</span>
                                    <span className="sched-time">
                                        <select value={hour} onChange={e => setMinuteOfDay(Number(e.target.value) * 60 + minute)} aria-label="Hour">
                                            {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                                        </select>
                                        :
                                        <select value={minute} onChange={e => setMinuteOfDay(hour * 60 + Number(e.target.value))} aria-label="Minute">
                                            {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                                        </select>
                                    </span>
                                </label>
                                <label className="sched-field">
                                    <span>Gate</span>
                                    <select value={slot.gate} onChange={e => { setSlot(s => ({ ...s, gate: Number(e.target.value) })); setError(''); setNotice('') }}>
                                        {GATES.map(g => (
                                            <option key={g} value={g} disabled={!!busy[g]}>
                                                {`Gate ${g}${busy[g] ? ` (busy: ${busy[g]})` : ''}`}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {preview && (
                                <div className="sched-preview">
                                    <div><span>Should arrive</span><b>{preview.arriveClock}{preview.nextDay ? ' (next day)' : ''}</b><em>{formatDuration(preview.durationMin * 60000)} trip, not counting delays</em></div>
                                    <div><span>Expected passengers</span><b>about {preview.passengers}{preview.capacity ? ` / ${preview.capacity}` : ''}</b><em>{preview.band} · {Math.round(preview.capacityPercent)}% capacity</em></div>
                                    {Number.isFinite(preview.estimatedDailyIncome) && (
                                        <div><span>Estimated income</span><b style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>about <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0' }} />{formatPerHour(preview.estimatedDailyIncome)}/hr</b><em>before any boosts you own</em></div>
                                    )}
                                </div>
                            )}
                            {tooSoonToday && !problem && <p className="sched-hint">That's too soon for today, so this loop starts tomorrow.</p>}
                            {(problem || error) && <p className="sched-error">{error || problem}</p>}

                            <div className="sched-actions">
                                <button className="sched-btn sched-btn-primary" disabled={!!problem} onMouseEnter={() => playHoverSound()} onClick={submit}>
                                    {editing ? 'Save move' : 'Add to timetable'}
                                </button>
                                {editing && (
                                    <button className="sched-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); resetForm(); setError('') }}>Cancel</button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="sched-done">Every connected city has a departure. No more departures may be added.</p>
                    )}
                    {notice && <p className="sched-notice">{notice}</p>}

                    <div className="sched-list-title">Timetable ({timetable.length})</div>
                    {timetable.length === 0 ? (
                        <p className="sched-empty">Nothing is scheduled yet, so no loops will leave.</p>
                    ) : (
                        <ul className="sched-list">
                            {timetable.map(e => {
                                const p = previewLoop(home.name, e.name, e.minuteOfDay)
                                const left = entryTimestamp({ hour: Math.floor(e.minuteOfDay / 60), minute: e.minuteOfDay % 60 }, Date.now()) <= Date.now()
                                return (
                                    <li key={e.name} className={`sched-row${editing === e.name ? ' sched-row-editing' : ''}`}>
                                        <span className="sched-row-time">{timeString(e.minuteOfDay)}</span>
                                        <span className="sched-row-city">{e.name}{left && <small> · left today</small>}</span>
                                        <span className="sched-row-detail">Gate {e.gate} · arrives {p.arriveClock} · about {p.passengers}</span>
                                        <span className="sched-row-actions">
                                            <button className="sched-btn sched-btn-small" onMouseEnter={() => playHoverSound()} onClick={() => startEdit(e)}>Move</button>
                                            <button className="sched-btn sched-btn-small sched-btn-danger" onMouseEnter={() => playHoverSound()} onClick={() => remove(e)}>Remove</button>
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

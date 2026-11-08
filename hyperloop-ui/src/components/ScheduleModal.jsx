import { useState } from 'react'
import './ScheduleModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { playBoardClickSound as playClickSound2, playBoardHoverSound as playHoverSound, playSplitFlapShort } from '../utils/sound.js'
import { NUM_GATES, timeString, entryTimestamp, formatDuration } from '../utils/loops.js'
import { formatPerHour } from '../utils/income.js'
import { readTimetable, saveSlot, removeSlot, unscheduledCities, slotProblem, busyGates, busyLoopNumbers, availableLoopNumbers, previewLoop, MIN_LEAD } from '../utils/timetable.js'
import { getDeparturePool, loopCode } from '../utils/loopCodes.js'
import { mechanicalLoopCode } from '../data/cityLoopCodes.js'
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
// initialCity (optional): open straight onto that city - to add its departure, or to move it if it already has one. Used by
// the city card; the Terminal Board opens the modal without it.
export default function ScheduleModal({ purchasedCities, terminalName, onChange = () => {}, onClose, initialCity }) {
    useEscapeToClose(() => { playClickSound2(); onClose() })
    const home = purchasedCities[0]
    const [version, setVersion] = useState(0)
    const timetable = readTimetable().filter(e => purchasedCities.some(c => c.name === e.name))
    const open = unscheduledCities(purchasedCities, timetable).sort((x, y) => x.name.localeCompare(y.name))
    const startEntry = initialCity ? timetable.find(e => e.name === initialCity) : null   // already scheduled: start by moving it
    const startCity = startEntry ? startEntry.name : (initialCity && open.some(c => c.name === initialCity) ? initialCity : (open[0]?.name || ''))
    const [editing, setEditing] = useState(() => startEntry ? startEntry.name : null)   // the city being moved, or null when adding
    const [cityPick, setCity] = useState(() => startCity)
    const [slot, setSlot] = useState(() => startEntry ? { minuteOfDay: startEntry.minuteOfDay, gate: startEntry.gate } : suggestSlot(timetable, startCity))
    // This city's loop number, picked from your shared pool (see loopCodes.js) - prefilled with the first
    // one that's free at the suggested time (editable, as a pick-from-the-list, not a free-text number,
    // before it's saved - and it stays reactive to the Departs time, since a number busy at one time of
    // day can be free at another, see setMinuteOfDay below).
    const [loopNumber, setLoopNumber] = useState(() => {
        if (startEntry) return Number.isFinite(startEntry.loopNumber) ? startEntry.loopNumber : (availableLoopNumbers(timetable, startEntry.name, startEntry.minuteOfDay, purchasedCities)[0] ?? null)
        if (!startCity) return null
        const initialSlot = suggestSlot(timetable, startCity)
        return availableLoopNumbers(timetable, startCity, initialSlot.minuteOfDay, purchasedCities)[0] ?? null
    })
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
    const loopPool = getDeparturePool(purchasedCities)
    const loopBusy = city ? busyLoopNumbers(timetable, city, slot.minuteOfDay, home.name) : {}
    const loopError = !city ? null
        : loopPool.length === 0 ? 'No loop numbers are free yet.'
        : (!loopPool.includes(loopNumber) || loopBusy[loopNumber]) ? 'Pick a free loop number from your list.'
        : null

    const refresh = () => { setVersion(v => v + 1); onChange() }
    // Changing the time may land on a gate that is busy then: move to one that is free. A loop number is
    // busy only while its trip overlaps another one's (see busyLoopNumbers), so it can free up or clash
    // differently at a different time of day too - the same move-to-a-free-one applies to it.
    const setMinuteOfDay = minuteOfDay => {
        const takenGates = busyGates(timetable, city, minuteOfDay)
        setSlot(s => ({ minuteOfDay, gate: takenGates[s.gate] ? (GATES.find(g => !takenGates[g]) ?? s.gate) : s.gate }))
        const freeNumbers = availableLoopNumbers(timetable, city, minuteOfDay, purchasedCities)
        setLoopNumber(n => (freeNumbers.includes(n) ? n : (freeNumbers[0] ?? n)))
        setError(''); setNotice('')
    }
    const chooseCity = name => {
        setCity(name)
        const newSlot = suggestSlot(timetable, name)
        setSlot(newSlot)
        setLoopNumber(availableLoopNumbers(timetable, name, newSlot.minuteOfDay, purchasedCities)[0] ?? null)
        setError(''); setNotice('')
    }
    const resetForm = () => {
        const nextTimetable = readTimetable()
        const next = unscheduledCities(purchasedCities, nextTimetable).sort((x, y) => x.name.localeCompare(y.name))
        setEditing(null)
        setCity(next[0]?.name || '')
        const newSlot = suggestSlot(nextTimetable, next[0]?.name || '')
        setSlot(newSlot)
        setLoopNumber(next[0] ? (availableLoopNumbers(nextTimetable, next[0].name, newSlot.minuteOfDay, purchasedCities)[0] ?? null) : null)
    }
    const submit = () => {
        playClickSound2()
        const wasAdd = !editing
        const result = saveSlot({ name: city, ...slot, loopNumber }, purchasedCities)
        if (!result.ok) { setError(result.error); return }
        const verb = editing ? 'Moved' : 'Scheduled'
        setNotice(`${verb} ${city} to ${timeString(slot.minuteOfDay)}, Gate ${slot.gate}. ${result.today ? 'It leaves today.' : 'It starts tomorrow.'}`)
        setError('')
        // A newly added loop gets its own little flap, like the board's columns flipping to show it -
        // whichever column (SCHEDULED, or the gate if it's leaving soon enough to show one already).
        if (wasAdd && localStorage.getItem('splitFlap') !== 'false') playSplitFlapShort()
        resetForm()
        refresh()
    }
    const startEdit = entry => {
        playClickSound2()
        setEditing(entry.name); setCity(entry.name)
        setSlot({ minuteOfDay: entry.minuteOfDay, gate: entry.gate })
        // Its own current number stays on offer to it (availableLoopNumbers never excludes a city's own pick)
        setLoopNumber(Number.isFinite(entry.loopNumber) ? entry.loopNumber : (availableLoopNumbers(timetable, entry.name, entry.minuteOfDay, purchasedCities)[0] ?? null))
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
            {/* --sched-city-ch: the longest city name this panel can ever list, so the City box is one width however the list shrinks */}
            <div className="sched-panel" style={{ '--sched-city-ch': Math.max(8, ...purchasedCities.map(c => c.name.length)) }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Schedule loop">
                <div className="sched-header">
                    <span className="sched-title">Schedule departures</span>
                    <button className="sched-close" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }} aria-label="Close">✕</button>
                </div>
                <div className="sched-body">
                    <p className="sched-intro">
                        Each city can leave once a day. Loops can leave at the same time from different gates, but a gate can't be reused for 30 minutes,
                        and a loop number can't be reused until the loop it's already out on is there, back, and through maintenance.
                        Your timetable is saved and repeats every day at no extra cost, though passenger counts and income will vary from day to day.
                    </p>

                    {formVisible ? (
                        <div className="sched-form">
                            <div className="sched-form-title">{editing ? `Move ${editing}` : 'Add a loop'}</div>
                            <div className="sched-fields">
                                <label className="sched-field sched-field-city">
                                    <span>City</span>
                                    <select value={city} disabled={editing !== null} onChange={e => chooseCity(e.target.value)}>
                                        {(editing ? [{ name: editing }] : open).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </label>
                                <label className="sched-field sched-field-time">
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
                                <label className="sched-field sched-field-gate">
                                    <span>Gate</span>
                                    <select value={slot.gate} onChange={e => { setSlot(s => ({ ...s, gate: Number(e.target.value) })); setError(''); setNotice('') }}>
                                        {GATES.map(g => (
                                            <option key={g} value={g} disabled={!!busy[g]}>
                                                {`Gate ${g}${busy[g] ? ` (busy: ${busy[g]})` : ''}`}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="sched-field sched-field-loop">
                                    <span>Loop No.</span>
                                    <span className="sched-loopno">
                                        <span className="sched-loopno-prefix">{mechanicalLoopCode(terminalName)}</span>
                                        <select
                                            value={loopNumber ?? ''}
                                            onChange={e => { setLoopNumber(Number(e.target.value)); setError(''); setNotice('') }}
                                            aria-label="Loop number"
                                        >
                                            {loopPool.map(n => (
                                                <option key={n} value={n} disabled={!!loopBusy[n]}>
                                                    {`${String(n).padStart(3, '0')}${loopBusy[n] ? ` (busy: ${loopBusy[n]})` : ''}`}
                                                </option>
                                            ))}
                                        </select>
                                    </span>
                                </label>
                            </div>

                            {preview && (
                                <div className="sched-preview">
                                    <div><span>Should arrive</span><b>{preview.arriveClock}{preview.nextDay ? ' (next day)' : ''}</b><em>{formatDuration(preview.durationMin * 60000)} trip, not counting delays</em></div>
                                    <div><span>Expected passengers</span><b>about {preview.passengers}{preview.capacity ? ` / ${preview.capacity}` : ''}</b><em>{preview.band} · {Math.round(preview.capacityPercent)}% capacity</em></div>
                                    {Number.isFinite(preview.estimatedDailyIncome) && (
                                        <div><span>Estimated income</span><b style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span>about</span><span style={{ display: 'inline-flex', alignItems: 'center' }}><img src={cashIcon} alt="£" className="cash-icon" style={{ width: '11px', height: '11px', border: 'none', borderRadius: '0' }} />{formatPerHour(preview.estimatedDailyIncome)}/hr</span></b><em>before any boosts you own</em></div>
                                    )}
                                </div>
                            )}

                            <div className="sched-actions">
                                <button className="sched-btn sched-btn-primary" disabled={!!problem || !!loopError} onMouseEnter={() => playHoverSound()} onClick={submit}>
                                    {editing ? 'Save move' : 'Add to timetable'}
                                </button>
                                {editing && (
                                    <button className="sched-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); resetForm(); setError('') }}>Cancel</button>
                                )}
                                {/* The one message slot: an error, else the "too soon" hint, else the confirmation of what was just
                                    done. It lives in the button row, which is the same height whether there is a message or not, so
                                    nothing below it ever moves when one appears or goes. */}
                                {(() => {
                                    const isError = !!(error || problem || loopError)
                                    const text = error || problem || loopError || (tooSoonToday ? "That's too soon for today, so this loop starts tomorrow." : '') || notice
                                    const kind = isError ? 'sched-error' : (tooSoonToday ? 'sched-hint' : 'sched-notice')
                                    return text ? <span className={`sched-msg ${kind}`} title={text}>{text}</span> : null
                                })()}
                            </div>
                        </div>
                    ) : (
                        <p className="sched-done">Every connected city has a departure. No more departures may be added.</p>
                    )}
                    {!formVisible && notice && <p className="sched-notice">{notice}</p>}

                    <div className="sched-list-title">Timetable ({timetable.length})</div>
                    {timetable.length === 0 ? (
                        <p className="sched-empty">Nothing is scheduled yet, so no loops will leave.</p>
                    ) : (
                        <ul className="sched-list">
                            {timetable.map(e => {
                                const p = previewLoop(home.name, e.name, e.minuteOfDay)
                                const left = entryTimestamp({ hour: Math.floor(e.minuteOfDay / 60), minute: e.minuteOfDay % 60 }, Date.now()) <= Date.now()
                                const arrived = p.arriveTs <= Date.now()
                                return (
                                    <li key={e.name} className={`sched-row${editing === e.name ? ' sched-row-editing' : ''}`}>
                                        <span className="sched-row-time">{timeString(e.minuteOfDay)}</span>
                                        <span className="sched-row-city">{e.name}{left && <small> · left today</small>}</span>
                                        <span className="sched-row-detail">{loopCode(e.name, 'departure', purchasedCities, terminalName, e.loopNumber)} · Gate {e.gate} · {arrived ? 'arrived' : 'arrives'} {p.arriveClock} · {p.passengers} passengers {left ? 'onboard' : 'expected'}</span>
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

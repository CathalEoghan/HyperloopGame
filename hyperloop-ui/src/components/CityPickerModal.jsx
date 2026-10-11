import { useState, useMemo, useEffect } from 'react'
import countryFlags from '../data/countryFlags.js'
import { matchesSearch } from '../utils/search.js'
import { playHoverSound, playClickSound2 } from '../utils/sound.js'
import './CityPickerModal.css'

const TIERS = [3, 2, 1]

// Used by Lobbying Suavity (any city to unlock on a rank-up) and Personal Favours (any home city for a new run).
// Lobbying Suavity: instead of a random city, the player picks any city that isn't unlocked yet.
// Choosing is a two-step (pick, then confirm) because the choice is final: there is no re-roll.
function CityPickerModal({ cities, onPick, onCancel, title = 'Lobbying Suavity', subtitle = 'Choose any city to unlock. Your choice is final.', confirmLabel = name => `Unlock ${name}` }) {
    const [query, setQuery] = useState('')
    const [tier, setTier] = useState(0)          // 0 = every tier
    const [selected, setSelected] = useState(null)

    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onCancel() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onCancel])

    // The best earners first, then alphabetical
    const sorted = useMemo(
        () => [...cities].sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name)),
        [cities]
    )
    const shown = sorted.filter(c =>
        (tier === 0 || c.tier === tier) &&
        (query === '' || matchesSearch(c.name, query) || matchesSearch(c.country, query))
    )

    return (
        <div className="citypicker-overlay">
            <div className="citypicker-panel" role="dialog" aria-label="Choose a city">
                <h2 className="citypicker-title">{title}</h2>
                <p className="citypicker-sub">{subtitle}</p>
                <input
                    className="citypicker-search"
                    type="text"
                    placeholder="Search by city or country"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />
                <div className="citypicker-tiers">
                    {[0, ...TIERS].map(t => (
                        <button
                            key={t}
                            className={`citypicker-tier${tier === t ? ' citypicker-tier-on' : ''}`}
                            onMouseEnter={() => playHoverSound()}
                            onClick={() => setTier(t)}
                        >{t === 0 ? 'All' : `Tier ${t}`}</button>
                    ))}
                    <span className="citypicker-count">{shown.length} of {cities.length}</span>
                </div>
                <div className="citypicker-list">
                    {shown.length === 0 && <p className="citypicker-empty">No city matches that search.</p>}
                    {shown.map(city => {
                        const flag = countryFlags[city.country]
                        return (
                            <button
                                key={city.name}
                                className={`citypicker-row${selected === city ? ' citypicker-row-on' : ''}`}
                                onMouseEnter={() => playHoverSound()}
                                onClick={() => setSelected(city)}
                            >
                                {flag
                                    ? <img className="citypicker-flag" src={`https://flagcdn.com/w40/${flag}.png`} alt="" loading="lazy" />
                                    : <span className="citypicker-flag" />}
                                <span className="citypicker-name">{city.name}</span>
                                <span className="citypicker-country">{city.country}</span>
                                <span className="citypicker-badge">Tier {city.tier}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="citypicker-actions">
                    <button className="citypicker-back" onMouseEnter={() => playHoverSound()} onClick={onCancel}>Back</button>
                    <button
                        className="citypicker-confirm"
                        disabled={!selected}
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onPick(selected) }}
                    >{selected ? confirmLabel(selected.name) : 'Pick a city'}</button>
                </div>
            </div>
        </div>
    )
}

export default CityPickerModal

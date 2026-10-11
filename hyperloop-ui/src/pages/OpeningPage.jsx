import starterCities from "../data/starterCities"
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from "../data/countryFlags"
import { playClickSound2, playHoverSound, playConstructionSound } from '../utils/sound.js'
import { useState, useRef } from 'react'
import { allCities } from '../../../CityManager/CityRegistry'
import CityPickerModal from '../components/CityPickerModal.jsx'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import globeIcon from '/public/globeIcon.png'
import './OpeningPage.css'

// runStart: set after a prestige. The terminal name carries over, and the starter city was drawn for the player
// unless they own Personal Favours, which lets them choose it.
function OpeningPage({ constructionManager, setPickedCity, setTerminalName, runStart = null }) {
    const [step, setStep] = useState(runStart ? 2 : 1)
    const [localName, setLocalName] = useState(runStart?.terminalName || "")
    const canChoose = !runStart || PrestigeManager.owns('personalFavours')
    const drawn = runStart ? starterCities.find(c => c.name === runStart.city) : null
    const offered = canChoose || !drawn ? starterCities : [drawn]
    const pickedRef = useRef(false) // a double-click on a city must not start it twice or play the sounds twice (bug #122)
    // Personal Favours: besides the six usual starters, any city in the world can be the new home city
    const canPickAny = !!runStart && PrestigeManager.owns('personalFavours')
    const [pickerOpen, setPickerOpen] = useState(false)
    const startCity = (city) => {
        if (pickedRef.current) return
        pickedRef.current = true
        playClickSound2()
        playConstructionSound()
        constructionManager.startTutorialConstruction(city)
        setPickedCity(city)
    }

    const handleConfirm = () => {
        if (!localName.trim()) return
        playClickSound2()
        setTerminalName(localName.trim())
        setStep(2)
    }

    if (step === 1) {
        return (
            <div className="opening-background">
                <div className="opening-card">
                    <div className="opening-logo"><img src={globeIcon} alt="globe" className="brand-icon" /> HYPERLOOP EMPIRE</div>
                    <h1 className="opening-welcome">Welcome.</h1>
                    <p className="opening-tagline">
                        You're in charge of the world's first hyperloop network.<br />
                        Connect cities, build developments, and grow your empire!
                    </p>
                    <div className="opening-divider" />
                    <p className="opening-label">Name your terminal</p>
                    <div className="opening-input-row">
    <input
        className="opening-input"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        placeholder="e.g. Grand Central"
        autoFocus
    />
</div>
                    <p className="opening-hint">Names can be changed at any time in Settings.</p>
                    <button
                        className="opening-btn"
                        onClick={handleConfirm}
                        disabled={!localName.trim()}
                    >
                        Continue →
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="opening-background">
            <div className="opening-city-step">
                <div className="opening-logo"><img src={globeIcon} alt="globe" className="brand-icon" /> HYPERLOOP EMPIRE</div>
                <h1 className="opening-welcome">{runStart ? 'A fresh start.' : 'Good name.'}</h1>
                {runStart ? (
                    <p className="opening-tagline">
                        {canChoose
                            ? <>Personal Favours: choose where <strong>{localName}</strong> begins its next chapter.</>
                            : <>Your new home city for <strong>{localName}</strong> has been chosen for you.</>}
                    </p>
                ) : (
                    <p className="opening-tagline">
                        Where in the world is <strong>{localName}</strong> located?<br />
                        This will be your home city - the beating heart of your network.
                    </p>
                )}
                <div className="starter-city-row">
                    {offered.map((city) => (
                        <div
    className="starter-city-card"
    key={city.name}
    onMouseEnter={() => playHoverSound()}
    onClick={() => startCity(city)}
                        >
                           <img
    className="starter-city-image"
    src={cityThumbnails[city.name]}
    alt={city.name}
/>
                            <div className="starter-city-info">
                                <div className="starter-city-name-row">
                                    <img
                                        className="starter-city-flag"
                                        src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`}
                                        alt={city.country}
                                    />
                                    <span className="starter-city-name">{city.name}</span>
                                </div>
                                <span className="starter-city-country">{city.country}</span>
                                <span className="starter-city-pop">{city.population.toLocaleString('en-GB', { maximumFractionDigits: 0 })} population</span>
                                <span className="starter-city-tier">Tier {city.tier} city</span>
                            </div>
                        </div>
                    ))}
                </div>
                {canPickAny && (
                    <button className="opening-btn starter-any-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setPickerOpen(true) }}>
                        Or choose any city in the world
                    </button>
                )}
            </div>
            {pickerOpen && (
                <CityPickerModal
                    cities={allCities.filter(c => c.continent !== 'Antarctica')}
                    title="Personal Favours"
                    subtitle="Choose any city as your new home city."
                    confirmLabel={name => `Start in ${name}`}
                    onPick={startCity}
                    onCancel={() => setPickerOpen(false)}
                />
            )}
        </div>
    )
}

export default OpeningPage
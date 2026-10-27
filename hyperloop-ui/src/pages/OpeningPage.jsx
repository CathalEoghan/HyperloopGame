import starterCities from "../data/starterCities"
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from "../data/countryFlags"
import { playClickSound2, playHoverSound, playConstructionSound, playBigMomentSound } from '../utils/sound.js'
import { useState, useRef, useEffect } from 'react'
import { allCities } from '../../../CityManager/CityRegistry'
import CityPickerModal from '../components/CityPickerModal.jsx'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import officialLogo from '../assets/misc/officialLogo.png'
import './OpeningPage.css'
import { flagSrc } from '../utils/flagSrc.js'

// runStart: set after a prestige. The terminal name carries over, and the new run continues from the same home
// city the retiring run had - "home" can be any city, not just one of the six usual starters, if Personal
// Favours picked it last time. A "Change home terminal" button lets the player pick a different one of the six
// instead, and Personal Favours owners can still pick any city in the world.
function OpeningPage({ constructionManager, setPickedCity, setTerminalName, runStart = null }) {
    const [step, setStep] = useState(runStart ? 2 : 1)
    const [localName, setLocalName] = useState(runStart?.terminalName || "")
    const home = runStart ? allCities.find(c => c.name === runStart.city) : null
    const [changingHome, setChangingHome] = useState(false)
    // Freely choosing from the six starters: always for a brand-new game, or a prestige run whose home city
    // can't be found (corrupted/old save), or once the player asks to change it.
    const choosingFreely = !runStart || !home || changingHome
    const offered = choosingFreely ? starterCities : [home]
    const pickedRef = useRef(false) // a double-click on a city must not start it twice or play the sounds twice (bug #122)
    // Personal Favours: besides the six usual starters, any city in the world can be the new home city
    const canPickAny = !!runStart && PrestigeManager.owns('personalFavours')
    const [pickerOpen, setPickerOpen] = useState(false)

    // runStart is only truthy the moment this screen is reached because a run was just retired - celebrate it once.
    useEffect(() => {
        if (runStart) playBigMomentSound()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                    <div className="opening-logo"><img src={officialLogo} alt="Hyperloop Empire" /></div>
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
        maxLength={32}
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
                <div className="opening-logo"><img src={officialLogo} alt="Hyperloop Empire" /></div>
                <h1 className="opening-welcome">{runStart ? 'A fresh start.' : 'Good name.'}</h1>
                {runStart ? (
                    <p className="opening-tagline">
                        {choosingFreely
                            ? <>Choose where <strong>{localName}</strong> begins its next chapter.</>
                            : <><strong>{localName}</strong> continues from {home.name}, its home city last time.</>}
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
                                        src={flagSrc(countryFlags[city.country])}
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
                {runStart && !choosingFreely && (
                    <button className="opening-btn starter-any-btn" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setChangingHome(true) }}>
                        Change home terminal
                    </button>
                )}
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
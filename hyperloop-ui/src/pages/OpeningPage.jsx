import starterCities from "../data/starterCities"
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from "../data/countryFlags"
import { playClickSound2, playHoverSound, playConstructionSound, playBigMomentSound } from '../utils/sound.js'
import { useState, useRef, useEffect } from 'react'
import { allCities } from '../../../CityManager/CityRegistry'
import CityPickerModal from '../components/CityPickerModal.jsx'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import officialLogo from '../assets/misc/officialLogo.png'
import rightArrow from '../assets/misc/rightArrow.png'
import './OpeningPage.css'
import { flagSrc } from '../utils/flagSrc.js'
import { PLAYER_NAME_KEY, PLAYER_TITLE_KEY, PLAYER_TITLES } from '../utils/emailEngine.js'

// runStart: set after a prestige. The terminal name carries over, and the new run continues from the same home
// city the retiring run had - "home" can be any city, not just one of the six usual starters, if Personal
// Favours picked it last time. A "Change home terminal" button lets the player pick a different one of the six
// instead, and Personal Favours owners can still pick any city in the world.
// A quiet text button back to the previous step: what was typed or picked there is kept
function BackButton({ onClick }) {
    return (
        <button
            type="button"
            className="opening-back-btn"
            onMouseEnter={() => playHoverSound()}
            onClick={() => { playClickSound2(); onClick() }}
        >
            {/* The arrow is the image used as a mask over the text colour, so it turns the accent colour on hover with the word */}
            <span className="opening-back-arrow" style={{ WebkitMaskImage: `url(${rightArrow})`, maskImage: `url(${rightArrow})` }} aria-hidden="true" /> Back
        </button>
    )
}

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
    // A brand-new game asks what to call the player after the home city is picked (the emails greet them by it).
    // A retired run already knows, so it goes straight from the city to building the terminal.
    const [pendingCity, setPendingCity] = useState(null)
    const [playerName, setPlayerName] = useState(() => { try { return localStorage.getItem(PLAYER_NAME_KEY) || '' } catch { return '' } })
    const [playerTitle, setPlayerTitle] = useState(() => { try { const t = localStorage.getItem(PLAYER_TITLE_KEY); return PLAYER_TITLES.includes(t) ? t : '' } catch { return '' } })

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

    const chooseCity = (city) => {
        if (runStart) { startCity(city); return }
        playClickSound2()
        setPendingCity(city)
    }

    const confirmPlayer = () => {
        const name = playerName.trim().replace(/\s+/g, ' ')
        if (!name || !pendingCity) return
        try {
            localStorage.setItem(PLAYER_NAME_KEY, name)
            if (playerTitle) localStorage.setItem(PLAYER_TITLE_KEY, playerTitle); else localStorage.removeItem(PLAYER_TITLE_KEY)
        } catch { /* storage full */ }
        startCity(pendingCity)
    }

    const handleConfirm = () => {
        if (!localName.trim()) return
        playClickSound2()
        // Runs of spaces become one, as the header shows it (it collapsed them anyway, but the save, ticker and posts kept them)
        setTerminalName(localName.trim().replace(/\s+/g, ' '))
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
                        Continue <img className="opening-btn-arrow" src={rightArrow} alt="" />
                    </button>
                </div>
            </div>
        )
    }

    if (pendingCity) {
        return (
            <div className="opening-background">
                <div className="opening-card">
                    <div className="opening-logo"><img src={officialLogo} alt="Hyperloop Empire" /></div>
                    <h1 className="opening-welcome opening-welcome-small">What should we call you?</h1>
                    <div className="opening-divider" />
                    <div className="opening-title-row" role="group" aria-label="Title">
                        {PLAYER_TITLES.map(t => (
                            <button
                                key={t}
                                type="button"
                                className={`opening-title-btn${playerTitle === t ? ' active' : ''}`}
                                aria-pressed={playerTitle === t}
                                onMouseEnter={() => playHoverSound()}
                                // Pressing the chosen title again clears it: a title is optional
                                onClick={() => { playClickSound2(); setPlayerTitle(playerTitle === t ? '' : t) }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="opening-input-row">
                        <input
                            className="opening-input"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && confirmPlayer()}
                            placeholder="Your full name"
                            aria-label="Your name"
                            maxLength={32}
                            autoFocus
                        />
                    </div>
                    <p className="opening-hint">Your name and title can be changed at any time in Settings.</p>
                    <div className="opening-actions">
                        {/* The home city isn't kept until Launch terminal, so it can still be changed */}
                        <BackButton onClick={() => setPendingCity(null)} />
                        <button className="opening-btn" onClick={confirmPlayer} disabled={!playerName.trim()}>
                            Launch terminal <img className="opening-btn-arrow" src={rightArrow} alt="" />
                        </button>
                    </div>
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
    // A card, not a <button> (its layout is a column of blocks), so it is made reachable and pressable from the keyboard here
    role="button"
    tabIndex={0}
    aria-label={`Choose ${city.name}, ${city.country}`}
    onMouseEnter={() => playHoverSound()}
    onClick={() => chooseCity(city)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseCity(city) } }}
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
                {(() => {
                    const showChangeHome = runStart && !choosingFreely
                    if (!showChangeHome && !canPickAny) return null
                    return (
                        <div className="opening-secondary-actions">
                            {showChangeHome && (
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
                    )
                })()}
                {/* A brand-new game can go back to rename the terminal; a retired run starts on this step */}
                {!runStart && (
                    <div className="opening-corner-back">
                        <BackButton onClick={() => setStep(1)} />
                    </div>
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
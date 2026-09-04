import starterCities from "../data/starterCities"
import cityThumbnails from '../data/cityThumbnails.js'
import countryFlags from "../data/countryFlags"
import { playClickSound2, playHoverSound, playConstructionSound } from '../utils/sound.js'
import { useState } from 'react'
import globeIcon from '/public/globeIcon.png'
import './OpeningPage.css'

function OpeningPage({ constructionManager, setPickedCity, setTerminalName }) {
    const [step, setStep] = useState(1)
    const [localName, setLocalName] = useState("")

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
                <h1 className="opening-welcome">Good name.</h1>
                <p className="opening-tagline">
                    Where in the world is <strong>{localName}</strong> located?<br />
                    This will be your home city - the beating heart of your network.
                </p>
                <div className="starter-city-row">
                    {starterCities.map((city) => (
                        <div
    className="starter-city-card"
    key={city.name}
    onMouseEnter={() => playHoverSound()}
  onClick={() => {
    playClickSound2()
    playConstructionSound()
    constructionManager.startTutorialConstruction(city)
    setPickedCity(city)
}}
                        >
                           <img
    className="starter-city-image"
    src={cityThumbnails[city.name] || cityImages[city.name]}
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
                                <span className="starter-city-pop">{city.population.toLocaleString()} population</span>
                                <span className="starter-city-tier">Tier {city.tier} city</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default OpeningPage
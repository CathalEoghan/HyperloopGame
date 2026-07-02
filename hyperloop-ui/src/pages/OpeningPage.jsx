
import starterCities from "../data/starterCities"
import cityImages from "../data/cityImages"
import countryFlags from "../data/countryFlags"
import { playClickSound2 } from '../utils/sound.js'
import { useState } from 'react'
import './OpeningPage.css'

function OpeningPage({ constructionManager, setPickedCity, setTerminalName }) {

const [step, setStep] = useState(1)
const [localName, setLocalName] = useState("")

if (step === 1) {
    return (
        <div className="opening-background">
            <h1 className= "welcome">Welcome.</h1>
            <h2 className="intro-text">You're in charge of the world's first Hyperloop terminal. </h2>
                <h2 className="give-name">Give your terminal a name:</h2>
            <div className="terminal-name-input">
                <input value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="Name" />
                <span> Terminal</span>
            </div>
            <button onClick={() => {
                  playClickSound2();
                setTerminalName(localName + " Terminal")
                setStep(2)
            }}>Confirm</button>
        </div>
    )
}

return (

    <div className="opening-background">
        <h1 className="welcome">Good name.</h1>
        <h2 className="chooseStartingCity">In what city is {localName} Terminal located?</h2>
        <div className="starter-city-row">
      {starterCities.map((city) => (
          <div className="starter-city-card" key={city.name} onClick={() => {
            playClickSound2();
            constructionManager.startTutorialConstruction(city);
            setPickedCity(city);
          }}
        >
            <img className="country-flag" src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} />
            <img className="starter-city-image" src={cityImages[city.name]} alt={city.name} />
          <p>{city.name}</p>
    </div>
  ))}
</div>
</div>
)
}

export default OpeningPage
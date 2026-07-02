import { useState } from 'react';
import './CitiesPage.css'
import { allCities } from '../../../CityManager/CityRegistry'
import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'
import cashIcon from '../assets/misc/cash.png'
import { playClickSound2 } from '../utils/sound.js'
import { formatTime } from '../utils/time.js';

function CitiesPage({ purchasedCities, constructionManager, unlockedCities, balance, totalCashEarned }) {
    const [selectedCity, setSelectedCity] = useState(null)
    const [showNoFunds, setShowNoFunds] = useState(false)
const [showQueueFull, setShowQueueFull] = useState(false)

   const underConstruction = allCities.filter(city =>
    constructionManager.progressionManager.citiesUnderConstruction.some(c => c.name === city.name)
)

const purchased = allCities.filter(city => purchasedCities.some(p => p.name === city.name))
    .sort((a, b) => a.name.localeCompare(b.name))

const available = allCities.filter(city => 
    unlockedCities.includes(city) && 
    !purchasedCities.some(p => p.name === city.name) &&
    !underConstruction.some(c => c.name === city.name)
).sort((a, b) => a.name.localeCompare(b.name))

const connectedAndBuilding = [...purchased, ...underConstruction]
    .sort((a, b) => a.name.localeCompare(b.name))

    // Sort them by country
    const groupedPurchased = connectedAndBuilding.reduce((result, city) => {
    const country = city.country;
    if (!result[country]) {
        result[country] = []
    }
    result[country].push(city)
    return result
}, {})

// Sort them by country
const groupedAvailable = available.reduce((result, city) => {
    const country = city.country;
    if (!result[country]) {
        result[country] = []
    }
    result[country].push(city)
    return result
}, {})


const sortedPurchasedCountries = Object.keys(groupedPurchased).sort()
const sortedAvailableCountries = Object.keys(groupedAvailable).sort()


    return (
        <div className="background">

            {selectedCity && (
                <div className="modal-overlay" onClick={() => {
                setSelectedCity(null)}}>
                    <div className="modal" onClick={(e) => {
                        e.stopPropagation()}}>
                       {underConstruction.some(c => c.name === selectedCity.name) ? (
    <>
        <h3>🚧 {selectedCity.name}</h3>
        <p>This city's connection is currently under construction!</p>
        <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedCity.finishTime))}</strong></p> 
        <button className="closeButton" onClick={() => {
            playClickSound2();
            setSelectedCity(null)}}>Close</button>
    </>
) : available.includes(selectedCity) ? (
    <>
        <h3>Connect {selectedCity.name}?</h3>
        <button className="constructionButton" onClick={() => {
            playClickSound2();
    const cost = constructionManager.calculateTierConnectionCost(selectedCity);
    if (balance < cost) {
        setShowNoFunds(true);
        setSelectedCity(null);
    } else if (constructionManager.isConstructionQueueFull()) {
        setShowQueueFull(true);
        setSelectedCity(null);
    } else {
        constructionManager.startStationConstruction(selectedCity);
        playClickSound2();
        setSelectedCity(null);
    }
}}

>
            Connect <img className="cashIcon" src={cashIcon} alt="balance" /> ({constructionManager.calculateTierConnectionCost(selectedCity)})
        </button>
        <button className="closeButton" onClick={() => {
            playClickSound2();
            setSelectedCity(null)}}>Close</button>
    </>
) : (
    <>
        <img src={`https://flagcdn.com/w40/${countryFlags[selectedCity.country]}.png`} />
        <h3>{selectedCity.name}</h3>
        <hr />
        <p><strong>Country</strong>: {selectedCity.country}</p>
        <p><strong>Population</strong>: {selectedCity.population.toLocaleString()}</p>
        <p>Earning <strong>£15,028</strong> per day</p>
        <p><em>{selectedCity.fact}</em></p>
        <img className="modal-city-image" src={cityImages[selectedCity.name]} alt={selectedCity.name} style={{width: '160px', height: '160px', borderRadius: '10px', border: '3px solid black', objectFit: 'cover'}}/>
        <button className="closeButton" onClick={() => {
            playClickSound2();
            setSelectedCity(null)}}>Close</button>
    </>
)}
                    </div>
                </div>

            )}

            {showNoFunds && (
    <div className="modal-overlay" onClick={() => setShowNoFunds(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>💸 Not enough funds!</h3>
            <p>You need more money to connect this city.</p>
            <button className="closeButton" onClick={() => {
                playClickSound2();
                setShowNoFunds(false)}}>Close</button>
        </div>
    </div>
)}

{showQueueFull && (
    <div className="modal-overlay" onClick={() => setShowQueueFull(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🚧 Construction queue full!</h3>
            <p>Wait for your current construction to finish before starting another.</p>
            <button className="closeButton" onClick={() => {
                playClickSound2();
                setShowQueueFull(false)}}>Close</button>
        </div>
    </div>
)}

        {sortedPurchasedCountries.length > 0 && (
            <>
            <h1 className="purchasedCitiesHeader">Connected cities:</h1>
            {sortedPurchasedCountries.map(country => (
                <div key={country}>
                    <h2 className="country">
                        {country}
                        <img src={`https://flagcdn.com/w40/${countryFlags[country]}.png`} width="20" alt={country} />
                    </h2>
                    <div className="city-row">
                        {groupedPurchased[country].map(city => {
                            const isUnderConstruction = underConstruction.some(c => c.name === city.name)
                            return (
                                <button className="city" key={city.name} onClick={() => setSelectedCity(city)}>
                                    <div className="city-image-wrapper">
                                        <img className={isUnderConstruction ? "unavailable" : "city-image"} src={cityImages[city.name]} style={{width: '100%', height: '160px'}} />
                                        {isUnderConstruction && (
                                            <div className="construction-overlay">
                                                <p>UNDER CONSTRUCTION</p>
                                                <p>{formatTime(constructionManager.timeManager.getTimeRemaining(city.finishTime))}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>{city.name}</div>
                                    <div className="tierAndPopulation">
                                        Tier {city.tier} | {city.population.toLocaleString()}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
            </>
        )}

        <h1 className="availableCitiesHeader">Cities available to connect:</h1>
        {sortedAvailableCountries.map(country => (
            <div key={country}>
                <h2 className="country">
                    {country}
                    <img src={`https://flagcdn.com/w40/${countryFlags[country]}.png`} width="20" alt={country} />
                </h2>
                <div className="city-row">
                    {groupedAvailable[country].map(city => (
                        <button className="city" key={city.name} onClick={() => setSelectedCity(city)}>
                            <img className="unavailable" src={cityImages[city.name]} style={{width: '100%', height: '160px'}} />
                            <div>{city.name}</div>
                            <div className="tierAndPopulation">
                                Tier {city.tier} | {city.population.toLocaleString()}
                            </div>
                        </button>
                    ))}
                    </div>
                </div>
        ))}
          </div>
    )
}
        
export default CitiesPage
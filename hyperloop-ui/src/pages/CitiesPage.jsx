import { useState } from 'react';
import './CitiesPage.css'
import { allCities } from '../../../CityManager/CityRegistry'
import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'

function CitiesPage({ purchasedCities }) {

    const [selectedCity, setSelectedCity] = useState(null)

    const grouped = allCities.reduce((result, city) => {
        const country = city.country;
        if (!result[country]) {
            result[country] = []
        }
        result[country].push(city)
        return result
    }, {})

    const sortedCountries = Object.keys(grouped).sort()

    return (
        <div className="background">

            {selectedCity && (
                <div className="modal-overlay" onClick={() => setSelectedCity(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <img src={`https://flagcdn.com/w40/${countryFlags[selectedCity.country]}.png`} />
                        <h3>{selectedCity.name}</h3>
                        <hr />
                        <p><strong>Country</strong>: {selectedCity.country}</p>
                        <p><strong>Population</strong>: {selectedCity.population.toLocaleString()}</p>
                        <p>Earning <strong>£15,028</strong> per day</p>
                        <p><em>{selectedCity.fact}</em></p>
                        <img className="modal-city-image" src={cityImages[selectedCity.name]} alt={selectedCity.name} style={{width: '160px', height: '160px', borderRadius: '10px', border: '3px solid black', objectFit: 'cover'}}/>
                        <button className="closeButton" onClick={() => setSelectedCity(null)}>Close</button>
                    </div>
                </div>
            )}

            {sortedCountries.map(country => (
                <div key={country}>
                    <h2 className="country">
                        {country}
                        <img src={`https://flagcdn.com/w40/${countryFlags[country]}.png`} width="20" alt={country} />
                    </h2>
                    <div className="city-row">
                        {grouped[country].map(city => (
                            <button className="city" key={city.name} onClick={() => setSelectedCity(city)}>
                                <img className="city-image" src={cityImages[city.name]} style={{width: '100%', height: '160px'}} />
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

import { useState } from 'react';
import './CitiesPage.css'
import { allCities } from '../../../CityManager/CityRegistry'
import cityImages from '../data/cityImages.js'
import countryFlags from '../data/countryFlags.js'

function CitiesPage({ purchasedCities }) {

    const [ selectedCity, setSelectedCity ] = useState(null)
    const grouped = allCities.reduce((result, city) => {

        const country = city.country;

        if (!result[country]) {
            result[country] = []
        }

        result[country].push(city)

        return result

    }, {}) // Starts with an empty object

    const sortedCountries = Object.keys(grouped).sort()

     return (

    <div className="background">
        {sortedCountries.map(country => (
    <div key={country}>
        <h2 className="country">
    {country }
    <img 
        src={`https://flagcdn.com/w40/${countryFlags[country]}.png`}
        width="20"
        alt={country}
    />
</h2>
        <div className="city-row">
        {grouped[country].map(city => (
            <div className="cityWrapper">
            <button className="city" key={city.name} onClick={() => setSelectedCity(city)}>
                <img className="city-image" src={cityImages[city.name]}/>
                <div>
                {city.name}
                </div>
                <div className="tierAndPopulation">
                Tier {city.tier} | {city.population.toLocaleString()}
                </div>

            </button>
            <div className="tooltip">
    <img src={`https://flagcdn.com/w40/${countryFlags[city.country]}.png`} />
    <h3>{city.name}</h3>
    <hr />
    <p>Country: {city.country}</p>
    <p>Population: {city.population.toLocaleString()}</p>
    <p>Earning x per day</p>
    <p>{city.fact}</p>
</div>
            </div>
        ))}
        </div>
    </div>
))}
</div>

     )

    }


export default CitiesPage
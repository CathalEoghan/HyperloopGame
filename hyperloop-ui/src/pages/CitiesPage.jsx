
import { useState } from 'react';
import './CitiesPage.css'
import { allCities } from '../../../CityManager/CityRegistry'

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
        <h2>{country}</h2>
        <div className="city-row">
        {grouped[country].map(city => (
            <button key={city.name} onClick={() => setSelectedCity(city)}>
                <div className="city-image-placeholder"></div>
                <div>
                {city.name}
                </div>
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
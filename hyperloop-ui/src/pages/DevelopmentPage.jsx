
import { useState } from 'react'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry.js'
import './DevelopmentPage.css'
import developmentImages from '../data/developmentImages.js'

function DevelopmentPage({ purchasedDevelopments }) {

const [selectedDevelopment, setSelectedDevelopment] = useState(null)

    // Keeps all stores that are purchased
        const purchased = allDevelopments.filter(development => purchasedDevelopments.some(p => p.name === development.name))
    
        // Keeps all stores that are NOT purchased
        const available = allDevelopments.filter(development => !purchasedDevelopments.some(p => p.name === development.name))

        const sortedPurchased = [...purchased].sort((a,b) => a.name.localeCompare(b.name))
        const sortedAvailable = [...available].sort((a,b) => a.name.localeCompare(b.name))

return (

        <div className="background"> 
            
                        {sortedPurchased.length > 0 && ( <>
                        <h2>Completed developments:</h2>
                        <div className="development-row"> {sortedPurchased.map(development => (
                                <button className="store" key={development.name} onClick={() => setSelectedDevelopment(development)}>
                                <img className="development-image" src={developmentImages[development.name]} style={{width: '100%', height: '160px'}} />
                                <div>{development.name}</div>
                                <div className="category">
                                    {development.category}
                                </div>
                            </button>
                        ))}
                        </div>
                    </>

)}

<h2>Available developments:</h2>
        <div className="development-row">
            {sortedAvailable.map(development => (
                <button className="development" key={development.name} onClick={() => setSelectedDevelopment(development)}>
                    <img className="unavailable" src={developmentImages[development.name]} style={{width: '100%', height: '160px'}} />
                    <div>{development.name}</div>
                    <div className="category">{development.category}</div>
                </button>
            ))}
        </div>

    </div>
)

}

export default DevelopmentPage
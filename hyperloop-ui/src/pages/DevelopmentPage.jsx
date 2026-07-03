import { useState } from 'react'
import { allDevelopments } from '../../../DevelopmentManager/DevelopmentRegistry.js'
import './DevelopmentPage.css'
import developmentImages from '../data/developmentImages.js'
import { allUpgrades } from '../../../UpgradeManager/UpgradeRegistry.js'
import { formatTime } from '../utils/time.js';
import { playClickSound2 } from '../utils/sound.js'

function DevelopmentPage({ purchasedDevelopments, unlockedDevelopments, developmentsUnderConstruction, constructionManager, balance, purchasedCities }) {

const [selectedDevelopment, setSelectedDevelopment] = useState(null)
const [showNoFunds, setShowNoFunds] = useState(false)
const [showQueueFull, setShowQueueFull] = useState(false)

const allItems = [...allDevelopments, ...allUpgrades].sort((a, b) => a.name.localeCompare(b.name))

const underConstruction = allItems.filter(item =>
    developmentsUnderConstruction.some(d => d.name === item.name)
)

const purchased = allItems.filter(item =>
    purchasedDevelopments.some(p => p.name === item.name)
)

const available = allItems.filter(item =>
    unlockedDevelopments.includes(item) &&
    !purchasedDevelopments.some(p => p.name === item.name) &&
    !developmentsUnderConstruction.some(d => d.name === item.name)
).sort((a, b) => a.name.localeCompare(b.name))

const sortedPurchased = [...purchased, ...underConstruction].sort((a,b) => a.name.localeCompare(b.name))
const sortedAvailable = [...available].sort((a,b) => a.name.localeCompare(b.name))

return (
    <div className="background">

        {/* Main development modal */}
        {selectedDevelopment && (
            <div className="modal-overlay" onClick={() => setSelectedDevelopment(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    {underConstruction.some(d => d.name === selectedDevelopment.name) ? (
                        <>
                            <h3>🚧 {selectedDevelopment.name}</h3>
                            <p>Under construction!</p>
                            <p><strong>{formatTime(constructionManager.timeManager.getTimeRemaining(selectedDevelopment.finishTime))}</strong></p>
                            <button className="closeButton" onClick={() => setSelectedDevelopment(null)}>Close</button>
                        </>
                    ) : available.some(d => d.name === selectedDevelopment.name) ? (
                        <>
                            <h3>Build {selectedDevelopment.name}?</h3>
                            <img className="modal-city-image" src={developmentImages[selectedDevelopment.name]} alt={selectedDevelopment.name} />
                            {(() => {
    const sourceCity = purchasedCities.find(city => 
        city.rewards.some(r => r.name === selectedDevelopment.name)
    );
    return sourceCity ? <p><em>Unlocked with {sourceCity.name}</em></p> : null;
})()}
                            <button className="constructionButton" onClick={() => {
                                const cost = selectedDevelopment.cost;
                                if (balance < cost) {
                                    setShowNoFunds(true);
                                    setSelectedDevelopment(null);
                                } else if (constructionManager.isConstructionQueueFull()) {
                                    setShowQueueFull(true);
                                    setSelectedDevelopment(null);
                                } else {
                                    constructionManager.startDevelopmentConstruction(selectedDevelopment);
                                    setSelectedDevelopment(null);
                                }
                            }}>
                                Build (£{selectedDevelopment.cost.toLocaleString()})
                            </button>
                            <button className="closeButton" onClick={() => {
                                playClickSound2();
                                setSelectedDevelopment(null);
                            }}>Close</button>
                        </>
                    ) : (
                        <>
                            <img className="modal-city-image" src={developmentImages[selectedDevelopment.name]} alt={selectedDevelopment.name} />
                            <h3>{selectedDevelopment.name}</h3>
                            <hr />
                            <p><strong>Category</strong>: {selectedDevelopment.category}</p>
                            <p><strong>Revenue</strong>: £{selectedDevelopment.revenue?.toLocaleString() ?? 'N/A'} per day</p>
                            <button className="closeButton" onClick={() => {
                                playClickSound2();
                                setSelectedDevelopment(null);
                            }}>Close</button>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* No funds modal */}
        {showNoFunds && (
            <div className="modal-overlay" onClick={() => setShowNoFunds(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>💸 Not enough funds!</h3>
                    <p>You need more money to build this development.</p>
                    <button className="closeButton" onClick={() => setShowNoFunds(false)}>Close</button>
                </div>
            </div>
        )}

        {/* Queue full modal */}
        {showQueueFull && (
            <div className="modal-overlay" onClick={() => setShowQueueFull(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <h3>🚧 Construction queue full!</h3>
                    <p>Wait for your current construction to finish before starting another.</p>
                    <button className="closeButton" onClick={() => setShowQueueFull(false)}>Close</button>
                </div>
            </div>
        )}

        {sortedPurchased.length > 0 && (
            <>
            <h2>Completed developments:</h2>
            <div className="development-row">
               {sortedPurchased.map(development => {
    const isUnderConstruction = underConstruction.some(d => d.name === development.name)
    return (
        <button className="development" key={development.name} onClick={() => setSelectedDevelopment(development)}>
            <div className="city-image-wrapper">
                <img className={isUnderConstruction ? "unavailable" : "development-image"} src={developmentImages[development.name]} style={{width: '100%', height: '160px'}} />
                {isUnderConstruction && (
                    <div className="construction-overlay">
                        <p>UNDER CONSTRUCTION</p>
                        <p>{formatTime(constructionManager.timeManager.getTimeRemaining(development.finishTime))}</p>
                    </div>
                )}
            </div>
            <div>{development.name}</div>
            <div className="category">{development.category}</div>
        </button>
    )
})}
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
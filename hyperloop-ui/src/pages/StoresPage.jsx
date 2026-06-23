
import { useState } from 'react'
import { allStores } from '../../../StoreManager/StoreRegistry'
import './StoresPage.css'
import storeImages from '../data/storeImages.js'

function StoresPage({ purchasedStores }) {

const [selectedStore, setSelectedStore] = useState(null)

    // Keeps all stores that are purchased
        const purchased = allStores.filter(store => purchasedStores.some(p => p.name === store.name))
    
        // Keeps all stores that are NOT purchased
        const available = allStores.filter(store => !purchasedStores.some(p => p.name === store.name))

        const sortedPurchased = [...purchased].sort((a,b) => a.name.localeCompare(b.name))
        const sortedAvailable = [...available].sort((a,b) => a.name.localeCompare(b.name))

return (

        <div className="background"> 
            
                        {sortedPurchased.length > 0 && ( <>
                        <h2>Stores and venues in terminal:</h2>
                        <div className="store-row"> {sortedPurchased.map(store => (
                                <button className="store" key={store.name} onClick={() => setSelectedStore(store)}>
                                <img className="store-image" src={storeImages[store.name]} style={{width: '100%', height: '160px'}} />
                                <div>{store.name}</div>
                                <div className="category">
                                    {store.category}
                                </div>
                            </button>
                        ))}
                        </div>
                    </>

)}

<h2>Stores and venues available to construct:</h2>
        <div className="store-row">
            {sortedAvailable.map(store => (
                <button className="store" key={store.name} onClick={() => setSelectedStore(store)}>
                    <img className="store-image" src={storeImages[store.name]} style={{width: '100%', height: '160px'}} />
                    <div>{store.name}</div>
                    <div className="category">{store.category}</div>
                </button>
            ))}
        </div>

    </div>
)

}

export default StoresPage
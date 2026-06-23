
import { useState, useEffect } from "react"
import TopBanner from './components/TopBanner'
import ExperienceBar from './components/ExperienceBar'
import BottomNav from "./components/BottomNav"
import CitiesPage from "./pages/CitiesPage"
import StoresPage from "./pages/StoresPage"
import './App.css'

function App() {

const [balance, setBalance] = useState(0);
const [activeTab, setActiveTab] = useState("Home");

useEffect(() => {
  setInterval(() => {
    setBalance(prev => prev + (8000 / 86400))
  }, 1000)
}, [])

return (

<div className= "App">
<TopBanner terminalName="Hyperloop Central" balance={balance} />

<ExperienceBar current={3} max={10} />
{activeTab === "Cities" && <CitiesPage purchasedCities={[{name: "London"}]} />}
{activeTab === "Stores" && <StoresPage purchasedStores={[{name: "Cupcake Store"}]} />}
<BottomNav activeTab={activeTab} onSelect={setActiveTab}>
</BottomNav>
</div>
)

}

export default App
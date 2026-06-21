
import { useState, useEffect } from "react"
import TopBanner from './components/TopBanner'
import ExperienceBar from './components/ExperienceBar'
import BottomNav from "./components/BottomNav"
import CitiesPage from "./pages/CitiesPage"
import './App.css'

function App() {

const [balance, setBalance] = useState(0);
const [activeTab, setActiveTab] = useState("Cities");

useEffect(() => {
  setInterval(() => {
    setBalance(prev => prev + (8000 / 86400))
  }, 1000)
}, [])

return (

<div className= "App">
<TopBanner terminalName="Hyperloop Central" balance={balance} />

<ExperienceBar current={3} max={10} />
{activeTab === "Cities" && <CitiesPage purchasedCities={[]} />}
<BottomNav activeTab={activeTab} onSelect={setActiveTab}>
</BottomNav>
</div>
)

}

export default App
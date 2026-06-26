
import { useState, useEffect } from "react"
import TopBanner from './components/TopBanner'
import ExperienceBar from './components/ExperienceBar'
import BottomNav from "./components/BottomNav"
import CitiesPage from "./pages/CitiesPage"
import DevelopmentPage from "./pages/DevelopmentPage"
import './App.css'

function App() {

const [balance, setBalance] = useState(0);
const [totalCashEarned, setTotalCashEarned] = useState(0);
const [rankSet, setRankSet] = useState(1);
const [xp, setXp] = useState(0);
const [xpAtRankUp, setXpAtRankUp] = useState(0);
const [xpNeeded, setXpNeeded] = useState(5);
const [activeTab, setActiveTab] = useState("Home");

function calculateNextRankXP(rank) {
    let xpNeeded = 5;

    for (let i = 2; i < rank; i++) {
        xpNeeded *= 1.5;
    }

    return Math.round(xpNeeded);
}

useEffect(() => {
  setInterval(() => {
    const incomePerSecond = 50000 / 86400;

  setTotalCashEarned(prev => {
      const newTotal = prev + incomePerSecond;
      const newXP = Math.floor(newTotal);
      setXp(newXP);
      setRankSet(currentRank => {
    const needed = calculateNextRankXP(currentRank + 1);
    if (newXP >= needed) {
        setXpAtRankUp(newXP);
        setXpNeeded(calculateNextRankXP(currentRank + 2));
        return currentRank + 1;
    }
    return currentRank;
});
      return newTotal;   
    });          

    setBalance(prev => prev + incomePerSecond);
  }, 1000);             
}, []);                 

return (

<div className= "App">
<TopBanner terminalName="Hyperloop Central" balance={balance} rank={rankSet + 1} />

<ExperienceBar current={xp - xpAtRankUp} max={xpNeeded} nextRank={rankSet + 1} />
{activeTab === "Cities" && <CitiesPage purchasedCities={[{name: "London"}]} />}
{activeTab === "Development" && <DevelopmentPage purchasedDevelopments={[{name: "Cupcake Store"}]} />}
<BottomNav activeTab={activeTab} onSelect={setActiveTab}>
</BottomNav>
</div>
)

}

export default App
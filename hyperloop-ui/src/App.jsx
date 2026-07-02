import { useState, useEffect } from "react";
import TopBanner from "./components/TopBanner";
import ExperienceBar from "./components/ExperienceBar";
import BottomNav from "./components/BottomNav";
import RankUpModal from "./components/RankUpModal";
import CityRevealModal from "./components/CityRevealModal";
import CitiesPage from "./pages/CitiesPage";
import DevelopmentPage from "./pages/DevelopmentPage";
import OpeningPage from './pages/OpeningPage'
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import starterCities from "./data/starterCities.js";
import { allCities } from "../../CityManager/CityRegistry.js";
import { playRankUpSound } from "./utils/sound.js";
import { formatTime } from './utils/time.js';
import "./App.css";

function App() {
const [rankManager] = useState(() => new RankManager());
const [progressionManager] = useState(() => new ProgressionManager(rankManager));
const [economyManager] = useState(() => new EconomyManager(progressionManager));
const [timeManager] = useState(() => new TimeManager());
const [constructionManager] = useState(() => new ConstructionManager(progressionManager, timeManager));

  const [terminalName, setTerminalName] = useState("Hyperloop Central")
  const [balance, setBalance] = useState(0);
  const [totalCashEarned, setTotalCashEarned] = useState(0);
  const [rankSet, setRankSet] = useState(1);  
  const [activeTab, setActiveTab] = useState("Home");
  const [pickedCity, setPickedCity] = useState(null);
  const [showRankUpModal, setShowRankUpModal] = useState(false);
  const [claimedCity, setClaimedCity] = useState(null);


  useEffect(() => {
    setInterval(() => {
      const incomePerSecond = economyManager.calculateDailyIncome();

        progressionManager.addCash(incomePerSecond)
        rankManager.convertCashToXP(progressionManager.totalCashEarned);
const previousRank = rankManager.rank;
rankManager.verifyRank();

if (rankManager.rank > previousRank) {
  playRankUpSound();
  setShowRankUpModal(true);
}
    constructionManager.update();
    
      setBalance(progressionManager.balance);
    setRankSet(rankManager.rank);
    setTotalCashEarned(progressionManager.totalCashEarned);
  }, 1000);
}, [rankManager, progressionManager, economyManager, constructionManager]);

// 1. No city picked yet - show opening page
if (progressionManager.purchasedCities.length === 0 && pickedCity === null) {
    return <OpeningPage constructionManager={constructionManager} setPickedCity={setPickedCity} setTerminalName={setTerminalName}/>
}

// 2. City picked, under construction - show timer
if (progressionManager.purchasedCities.length === 0 && pickedCity !== null) {
    return (
        <div className="App opening-background">
            <h2>🚧 Setting up your terminal in {pickedCity.name}...</h2>
        </div>
    );
}

      return (
    <div className="App">
      <TopBanner
        terminalName={terminalName}
        balance={balance}
        rank={rankSet}
      />
      <ExperienceBar
        current={totalCashEarned - rankManager.getCumulativeXP(rankSet - 1)}
        max={rankManager.calculateNextRankXP(rankSet)}
        nextRank={rankSet + 1}
      />
      {activeTab === "Cities" && (
        <CitiesPage 
    purchasedCities={progressionManager.purchasedCities} 
    constructionManager={constructionManager} 
    unlockedCities={progressionManager.unlockedCities} 
    balance={balance}
    totalCashEarned={totalCashEarned}
/>
      )}
      {activeTab === "Development" && (
        <DevelopmentPage purchasedDevelopments={progressionManager.purchasedDevelopments} />
      )}
      <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
    {showRankUpModal && (
  <RankUpModal rank={rankSet} onClaim={() => {
  const newCity = progressionManager.getRandomUnlockedCity(allCities);
  if (newCity) {
    progressionManager.unlockCity(newCity);
    setClaimedCity(newCity);
  }
  setShowRankUpModal(false);
}} />
    )}
{claimedCity && (
  <CityRevealModal city={claimedCity} onClose={() => setClaimedCity(null)} />
)}
    </div>
    
      )
}

export default App;

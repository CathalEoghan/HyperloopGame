import { useState, useEffect } from "react";
import TopBanner from "./components/TopBanner";
import ExperienceBar from "./components/ExperienceBar";
import BottomNav from "./components/BottomNav";
import CitiesPage from "./pages/CitiesPage";
import DevelopmentPage from "./pages/DevelopmentPage";
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import starterCities from "./data/starterCities.js";
import "./App.css";

function App() {
const [rankManager] = useState(() => new RankManager());
const [progressionManager] = useState(() => new ProgressionManager(rankManager));
const [economyManager] = useState(() => new EconomyManager(progressionManager));
const [timeManager] = useState(() => new TimeManager());
const [constructionManager] = useState(() => new ConstructionManager(progressionManager, timeManager));


  const [balance, setBalance] = useState(0);
  const [totalCashEarned, setTotalCashEarned] = useState(0);
  const [rankSet, setRankSet] = useState(1);  
  const [activeTab, setActiveTab] = useState("Home");
  const [pickedCity, setPickedCity] = useState(null);
  const [showRankUpModal, setShowRankUpModal] = useState(false);

  useEffect(() => {
    setInterval(() => {
      const incomePerSecond = economyManager.calculateDailyIncome();

        progressionManager.addCash(incomePerSecond)
        rankManager.convertCashToXP(progressionManager.totalCashEarned);
const previousRank = rankManager.rank;
rankManager.verifyRank();

if (rankManager.rank > previousRank) {
  setShowRankUpModal(true);
}
    constructionManager.update();
    
      setBalance(progressionManager.balance);
    setRankSet(rankManager.rank);
    setTotalCashEarned(progressionManager.totalCashEarned);
  }, 1000);
}, [rankManager, progressionManager, economyManager, constructionManager]);

if (progressionManager.purchasedCities.length === 0 && pickedCity === null) {
    return (
    <div className="App">
      {starterCities.map((city) => (
        <button
          key={city.name}
          onClick={() => {
            constructionManager.startTutorialConstruction(city);
            setPickedCity(city);
          }}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}

if (progressionManager.purchasedCities.length === 0 && pickedCity !== null) {
  return (
    <div className="App">
      <p>Constructing {pickedCity.name}...</p>
    </div>
  );
}

      return (
    <div className="App">
      <TopBanner
        terminalName="Hyperloop Central"
        balance={balance}
        rank={rankSet}
      />
      <ExperienceBar
        current={totalCashEarned - rankManager.getCumulativeXP(rankSet - 1)}
        max={rankManager.calculateNextRankXP(rankSet)}
        nextRank={rankSet + 1}
      />
      {activeTab === "Cities" && (
        <CitiesPage purchasedCities={progressionManager.purchasedCities} constructionManager={constructionManager}/>
      )}
      {activeTab === "Development" && (
        <DevelopmentPage purchasedDevelopments={progressionManager.purchasedDevelopments} />
      )}
      <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
    </div>
      )
}

export default App;

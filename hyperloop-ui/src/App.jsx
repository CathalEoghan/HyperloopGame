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

  useEffect(() => {
    setInterval(() => {
      const incomePerSecond = economyManager.calculateDailyIncome();

        progressionManager.addCash(incomePerSecond)
        rankManager.convertCashToXP(progressionManager.totalCashEarned);
    rankManager.verifyRank();
    constructionManager.update();

      setBalance(progressionManager.balance);
    setRankSet(rankManager.rank);
    setTotalCashEarned(progressionManager.totalCashEarned);
  }, 1000);
}, [rankManager, progressionManager, economyManager, constructionManager]);

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
        <CitiesPage purchasedCities={[{ name: "London" }]} />
      )}
      {activeTab === "Development" && (
        <DevelopmentPage purchasedDevelopments={[{ name: "Cupcake Store" }]} />
      )}
      <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  );
}

export default App;

import { useState, useEffect, useRef } from "react";
import TopBanner from "./components/TopBanner";
import ExperienceBar from "./components/ExperienceBar";
import BottomNav from "./components/BottomNav";
import CitiesPage from "./pages/CitiesPage";
import DevelopmentPage from "./pages/DevelopmentPage";
import RankManager from "Managers/RankManager/RankManager.js";
import ProgressionManager from "Managers/ProgressionManager/ProgressionManager.js";
import EconomyManager from "Managers/EconomyManager/EconomyManager.js";

import "./App.css";

function calculateNextRankXP(rank) {
  let xpNeeded = 5;
  for (let i = 1; i < rank; i++) {
    xpNeeded *= 3;
  }
  return Math.round(xpNeeded);
}

function getCumulativeXP(rank) {
  let total = 0;
  for (let i = 1; i <= rank; i++) {
    total += calculateNextRankXP(i);
  }
  return total;
}

function App() {
  const rankManager = useRef(new RankManager()).current;
  const progressionManager = useRef(
    new ProgressionManager(rankManager),
  ).current;
  const economyManager = useRef(new EconomyManager(progressionManager)).current;

  const [balance, setBalance] = useState(0);
  const [totalCashEarned, setTotalCashEarned] = useState(0);
  const [rankSet, setRankSet] = useState(1);
  const [xpAtRankUp, setXpAtRankUp] = useState(0); // start of rank 1 = 0
  const [xpNeeded, setXpNeeded] = useState(calculateNextRankXP(1)); // rank 1 bar width = 5
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    setInterval(() => {
      const incomePerSecond = 15028 / 86400;

      setTotalCashEarned((prev) => {
        const newTotal = prev + incomePerSecond;
        const currentXP = Math.floor(newTotal);

        setRankSet((currentRank) => {
          // rank-up triggers at the end of the current rank
          if (currentXP >= getCumulativeXP(currentRank)) {
            const newRank = currentRank + 1;
            setXpAtRankUp(getCumulativeXP(newRank - 1)); // start of new rank
            setXpNeeded(calculateNextRankXP(newRank)); // width of new rank bar
            return newRank;
          }
          return currentRank;
        });

        return newTotal;
      });

      setBalance((prev) => prev + incomePerSecond);
    }, 1000);
  }, []);

  const currentXP = Math.floor(totalCashEarned);

  return (
    <div className="App">
      <TopBanner
        terminalName="Hyperloop Central"
        balance={balance}
        rank={rankSet}
      />
      <ExperienceBar
        current={currentXP - xpAtRankUp}
        max={xpNeeded}
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

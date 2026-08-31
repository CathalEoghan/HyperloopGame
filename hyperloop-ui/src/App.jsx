import { useState, useEffect, useRef } from "react";
import TopBanner from "./components/TopBanner";
import ExperienceBar from "./components/ExperienceBar";
import BottomNav from "./components/BottomNav";
import TickerBar from "./components/TickerBar";
import RankUpModal from "./components/RankUpModal";
import CityRevealModal from "./components/CityRevealModal"
import CitiesPage from "./pages/CitiesPage"
import HomePage from "./pages/HomePage"
import ProgressPage from './pages/ProgressPage.jsx'
import DepartureBoard from "./pages/DepartureBoard"
import DevelopmentPage from "./pages/DevelopmentPage";
import OpeningPage from './pages/OpeningPage'
import SettingsPage from './pages/SettingsPage'
import DelayModal from "./components/DelayModal"
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import { allCities } from "../../CityManager/CityRegistry.js";
import { playRankUpSound, playReputationWorkBonusSound } from './utils/sound.js'
import FarewellModal from "./components/FarewellModal"
import "./App.css";

function App() {
  const [terminalName, setTerminalName] = useState("Hyperloop Central");
  const [balance, setBalance] = useState(0);
  const [totalCashEarned, setTotalCashEarned] = useState(0);
  const [rankSet, setRankSet] = useState(1);
  const [activeTab, setActiveTab] = useState("Home");
  const [pickedCity, setPickedCity] = useState(null);
  const [pendingRankUps, setPendingRankUps] = useState(0);
  const [claimedCity, setClaimedCity] = useState(null);
  const [reputation, setReputation] = useState(0);
  const [activeDeparture, setActiveDeparture] = useState(null);
  const [activeDelay, setActiveDelay] = useState(null);
  const [farewellsGiven, setFarewellsGiven] = useState(0);
  const triggeredDepartures = useRef(new Set());
  const triggeredDelays = useRef(new Set());
  const hasGivenStarterBonus = useRef(false);

  const [rankManager] = useState(() => new RankManager());
  const [progressionManager] = useState(() => new ProgressionManager(rankManager));
  const [economyManager] = useState(() => new EconomyManager(progressionManager));
  const [timeManager] = useState(() => new TimeManager());
  const [constructionManager] = useState(() => new ConstructionManager(progressionManager, timeManager));
  const [purchasedCitiesCount, setPurchasedCitiesCount] = useState(() => progressionManager.purchasedCities.length);

  const workEarnings = 100;

  useState(() => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('departures_')) localStorage.removeItem(key)
    })
  });

  useEffect(() => {
    if (purchasedCitiesCount === 1 && !hasGivenStarterBonus.current) {
      hasGivenStarterBonus.current = true;
      const tier2Cities = allCities.filter(c => c.tier === 2);
      const bonus = progressionManager.getRandomUnlockedCity(tier2Cities);
      if (bonus) {
        progressionManager.unlockCity(bonus);
        setClaimedCity(bonus);
      }
    }
  }, [purchasedCitiesCount]);

  useEffect(() => {
    setInterval(() => {
      const incomePerSecond = economyManager.calculateDailyIncome();
      progressionManager.addCash(incomePerSecond);
      rankManager.convertCashToXP(progressionManager.totalCashEarned);
      const previousRank = rankManager.rank;
      rankManager.verifyRank();
      if (rankManager.rank > previousRank) {
        playRankUpSound();
        setPendingRankUps(prev => prev + 1);
      }
      constructionManager.update();
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayKey = now.toDateString();
      const schedule = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]');
      schedule.forEach(entry => {
        const key = `${todayKey}_${entry.time}`;
        const depMins = entry.hour * 60 + entry.minute;
        const farewellHour = Math.floor((depMins - 5) / 60);
        const farewellMin = (depMins - 5) % 60;
        if (currentHour === farewellHour && currentMinute === farewellMin && !triggeredDepartures.current.has(key)) {
          triggeredDepartures.current.add(key);
          setActiveDeparture(entry);
        }
      });
      if (Math.random() < 0.0002) {
        const eligible = schedule.filter(entry => {
          const diff = (entry.hour * 60 + entry.minute) - (currentHour * 60 + currentMinute);
          return diff > 60 && !triggeredDelays.current.has(entry.time);
        });
        if (eligible.length > 0) {
          const entry = eligible[Math.floor(Math.random() * eligible.length)];
          const delayMinutes = Math.ceil((Math.floor(Math.random() * 230) + 10) / 5) * 5;
          const newTotalMins = (entry.hour * 60 + entry.minute) + delayMinutes;
          const newHour = Math.floor(newTotalMins / 60) % 24;
          const newMinute = newTotalMins % 60;
          const newTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
          const compensation = Math.round(delayMinutes * 50);
          triggeredDelays.current.add(entry.time);
          const updated = schedule.map(e => e.time === entry.time
            ? { ...e, hour: newHour, minute: newMinute, time: newTime, delayed: true }
            : e);
          localStorage.setItem(`departures_${todayKey}`, JSON.stringify(updated));
          setActiveDelay({ name: entry.name, originalTime: entry.time, newTime, delayMinutes, compensation });
        }
      }
      setBalance(progressionManager.balance);
      setRankSet(rankManager.rank);
      setTotalCashEarned(progressionManager.totalCashEarned);
      setReputation(progressionManager.reputation);
      setPurchasedCitiesCount(progressionManager.purchasedCities.length);
    }, 1000);
  }, [rankManager, progressionManager, economyManager, constructionManager]);

  if (progressionManager.purchasedCities.length === 0 && pickedCity === null) {
    return <OpeningPage constructionManager={constructionManager} setPickedCity={setPickedCity} setTerminalName={setTerminalName} />;
  }
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
        activeTab={activeTab}
        onSelect={setActiveTab}
        reputation={reputation}
        onWork={() => {
          progressionManager.addCash(workEarnings);
          if (Math.random() < 0.001) {
            progressionManager.addReputation(-5);
            playReputationWorkBonusSound();
          }
        }}
        workEarnings={workEarnings}
      />
      <ExperienceBar
        current={totalCashEarned - rankManager.getCumulativeXP(rankSet - 1)}
        max={rankManager.calculateNextRankXP(rankSet)}
        nextRank={rankSet + 1}
      />
      {activeTab === "Home" && (
        <HomePage
          purchasedCities={progressionManager.purchasedCities}
          unlockedCities={progressionManager.unlockedCities}
          purchasedCitiesCount={purchasedCitiesCount}
        />
      )}
      {activeTab === "Cities" && (
        <CitiesPage
          purchasedCities={progressionManager.purchasedCities}
          constructionManager={constructionManager}
          unlockedCities={progressionManager.unlockedCities}
          balance={balance}
          totalCashEarned={totalCashEarned}
          economyManager={economyManager}
        />
      )}
      {activeTab === "Development" && (
        <DevelopmentPage
          purchasedDevelopments={progressionManager.purchasedDevelopments}
          unlockedDevelopments={progressionManager.unlockedDevelopments}
          unlockedUpgrades={progressionManager.unlockedUpgrades}
          developmentsUnderConstruction={progressionManager.developmentsUnderConstruction}
          constructionManager={constructionManager}
          balance={balance}
          purchasedCities={progressionManager.purchasedCities}
          purchasedUpgrades={progressionManager.purchasedUpgrades}
        />
      )}
      {activeTab === "Progress" && (
        <ProgressPage
          purchasedCities={progressionManager.purchasedCities}
          unlockedCities={progressionManager.unlockedCities}
          economyManager={economyManager}
          purchasedDevelopments={progressionManager.purchasedDevelopments}
          purchasedUpgrades={progressionManager.purchasedUpgrades}
          farewellsGiven={farewellsGiven}
        />
      )}
      {activeTab === "DepartureBoard" && (
        <DepartureBoard
          purchasedCities={progressionManager.purchasedCities}
          homeCity={progressionManager.purchasedCities[0]}
        />
      )}
      {activeTab === "Settings" && <SettingsPage />}
      <TickerBar />
      <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
      {activeDelay && (
        <DelayModal
          delay={activeDelay}
          onCompensate={() => {
            progressionManager.addCash(-activeDelay.compensation);
            setActiveDelay(null);
          }}
          onDismiss={() => {
            progressionManager.addReputation(-10);
            setActiveDelay(null);
          }}
        />
      )}
      {!activeDelay && activeDeparture && !claimedCity && (
        <FarewellModal
          departure={activeDeparture}
          onFarewell={() => {
            progressionManager.addReputation(5);
            setFarewellsGiven(prev => prev + 1);
            setActiveDeparture(null);
          }}
          onMiss={() => setActiveDeparture(null)}
        />
      )}
      {!activeDelay && !activeDeparture && pendingRankUps > 0 && (
        <RankUpModal rank={rankSet} onClaim={() => {
          const newCity = progressionManager.getRandomUnlockedCity(allCities);
          if (newCity) {
            progressionManager.unlockCity(newCity);
            setClaimedCity(newCity);
          }
          setPendingRankUps(prev => prev - 1);
        }} />
      )}
      {claimedCity && (
        <CityRevealModal
          city={claimedCity}
          reputation={reputation}
          onClose={() => setClaimedCity(null)}
          onReroll={() => {
            if (progressionManager.reputation < 15) return;
            progressionManager.addReputation(-15);
            progressionManager.removeUnlockedCity(claimedCity);
            const newCity = progressionManager.getRandomUnlockedCity(allCities);
            if (newCity) {
              progressionManager.unlockCity(newCity);
              setClaimedCity(null);
              setTimeout(() => setClaimedCity(newCity), 0);
            }
          }}
        />
      )}
    </div>
  );
}
export default App;
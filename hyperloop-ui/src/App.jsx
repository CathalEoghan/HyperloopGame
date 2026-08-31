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
import OfflineModal from "./components/OfflineModal"
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import { allCities } from "../../CityManager/CityRegistry.js";
import { playRankUpSound, playReputationWorkBonusSound } from './utils/sound.js'
import { saveGame, loadGame, hasSave, deleteSave, exportSave, importSave } from 'Managers/SaveManager.js'
import FarewellModal from "./components/FarewellModal"
import "./App.css";

const OFFLINE_CAP_SECONDS = 86400; // max 24 hours offline income
const OFFLINE_RATE = 0.10; // 10% of active rate

function App() {
  const [rankManager] = useState(() => new RankManager());
  const [progressionManager] = useState(() => new ProgressionManager(rankManager));
  const [economyManager] = useState(() => new EconomyManager(progressionManager));
  const [timeManager] = useState(() => new TimeManager());
  const [constructionManager] = useState(() => new ConstructionManager(progressionManager, timeManager));

  const [savedData] = useState(() => hasSave() ? loadGame(progressionManager, rankManager) : null);

  // Calculate offline income immediately after load
  const [offlineData] = useState(() => {
    if (!savedData?.lastSaved) return null;
    const offlineSeconds = Math.min((Date.now() - savedData.lastSaved) / 1000, OFFLINE_CAP_SECONDS);
    if (offlineSeconds < 60) return null; // ignore if less than 1 minute
    const incomePerSecond = economyManager.calculateDailyIncome();
    const offlineIncome = incomePerSecond * offlineSeconds * OFFLINE_RATE;
    if (offlineIncome < 1) return null;
    progressionManager.addCash(offlineIncome); // add immediately so balance is correct
    return { offlineSeconds, offlineIncome };
  });

  const [showOfflineModal, setShowOfflineModal] = useState(!!offlineData);

  const [terminalName, setTerminalName] = useState(() => savedData?.terminalName || 'Hyperloop Central');
  const [createdAt] = useState(() => savedData?.createdAt || Date.now());
  const [farewellsGiven, setFarewellsGiven] = useState(() => savedData?.farewellsGiven || 0);
  const [lastSaved, setLastSaved] = useState(() => savedData?.lastSaved || null);
  const [showSaved, setShowSaved] = useState(false);

  const [balance, setBalance] = useState(() => progressionManager.balance);
  const [totalCashEarned, setTotalCashEarned] = useState(() => progressionManager.totalCashEarned);
  const [rankSet, setRankSet] = useState(() => rankManager.rank);
  const [reputation, setReputation] = useState(() => progressionManager.reputation);
  const [purchasedCitiesCount, setPurchasedCitiesCount] = useState(() => progressionManager.purchasedCities.length);

  const [activeTab, setActiveTab] = useState("Home");
  const [pickedCity, setPickedCity] = useState(null);
  const [pendingRankUps, setPendingRankUps] = useState(0);
  const [claimedCity, setClaimedCity] = useState(null);
  const [activeDeparture, setActiveDeparture] = useState(null);
  const [activeDelay, setActiveDelay] = useState(null);

  const triggeredDepartures = useRef(new Set());
  const triggeredDelays = useRef(new Set());
  const hasGivenStarterBonus = useRef(!!savedData);
  const tickCount = useRef(0);
  const prevPurchasedCount = useRef(progressionManager.purchasedCities.length);
  const prevDevCount = useRef(progressionManager.purchasedDevelopments.length);
  const prevRank = useRef(rankManager.rank);
  const farewellsRef = useRef(savedData?.farewellsGiven || 0);

  const workEarnings = 100;

  const triggerSave = (farewells) => {
    saveGame(progressionManager, rankManager, terminalName, farewells ?? farewellsRef.current);
    setLastSaved(Date.now());
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  useState(() => {
    if (!savedData) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('departures_')) localStorage.removeItem(key)
      })
    }
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
      tickCount.current += 1;

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

      const citiesChanged = progressionManager.purchasedCities.length !== prevPurchasedCount.current;
      const devsChanged = progressionManager.purchasedDevelopments.length !== prevDevCount.current;
      const rankChanged = rankManager.rank !== prevRank.current;

      if (citiesChanged || devsChanged || rankChanged) {
        prevPurchasedCount.current = progressionManager.purchasedCities.length;
        prevDevCount.current = progressionManager.purchasedDevelopments.length;
        prevRank.current = rankManager.rank;
        triggerSave();
      }

      if (tickCount.current % 30 === 0) {
        triggerSave();
      }

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

  useEffect(() => {
    if (savedData) triggerSave();
  }, [terminalName]);

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
          reputation={reputation}
          homeCity={progressionManager.purchasedCities[0]}
          onSave={triggerSave}
          onDisconnect={(city) => {
            const disconnectCost = constructionManager.calculateTierConnectionCost(city) / 2;
            progressionManager.spendCash(disconnectCost);
            progressionManager.addReputation(-20);
            progressionManager.disconnectCity(city);
            const todayKey = new Date().toDateString();
            const schedule = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]');
            const updated = schedule.filter(e => e.name !== city.name);
            localStorage.setItem(`departures_${todayKey}`, JSON.stringify(updated));
            triggerSave();
          }}
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
          reputation={reputation}
          purchasedCities={progressionManager.purchasedCities}
          purchasedUpgrades={progressionManager.purchasedUpgrades}
          economyManager={economyManager}
          onSave={triggerSave}
          onUpgrade={(development) => {
            const success = progressionManager.upgradeDevelopment(development);
            if (success) triggerSave();
            return success;
          }}
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
          createdAt={createdAt}
        />
      )}
      {activeTab === "DepartureBoard" && (
        <DepartureBoard
          purchasedCities={progressionManager.purchasedCities}
          homeCity={progressionManager.purchasedCities[0]}
        />
      )}
      {activeTab === "Settings" && (
        <SettingsPage
          terminalName={terminalName}
          onTerminalNameChange={setTerminalName}
          lastSaved={lastSaved}
          onDeleteSave={() => { deleteSave(); window.location.reload(); }}
          onExportSave={exportSave}
          onImportSave={async (file) => { await importSave(file); window.location.reload(); }}
        />
      )}
      <TickerBar />
      <BottomNav activeTab={activeTab} onSelect={setActiveTab} />

      {showSaved && (
        <div style={{
          position: 'fixed', bottom: '108px', right: '16px',
          background: '#222', color: '#f5a623',
          fontFamily: 'Courier New, monospace', fontSize: '0.75rem',
          padding: '4px 12px', borderRadius: '6px',
          zIndex: 200, pointerEvents: 'none',
        }}>
          ✓ Saved
        </div>
      )}

      {showOfflineModal && offlineData && (
        <OfflineModal
          offlineSeconds={offlineData.offlineSeconds}
          offlineIncome={offlineData.offlineIncome}
          onCollect={() => {
            setShowOfflineModal(false);
            triggerSave();
          }}
        />
      )}

      {!showOfflineModal && activeDelay && (
        <DelayModal
          delay={activeDelay}
          onCompensate={() => { progressionManager.addCash(-activeDelay.compensation); setActiveDelay(null); }}
          onDismiss={() => { progressionManager.addReputation(-10); setActiveDelay(null); }}
        />
      )}
      {!showOfflineModal && !activeDelay && activeDeparture && !claimedCity && (
        <FarewellModal
          departure={activeDeparture}
          onFarewell={() => {
            progressionManager.addReputation(5);
            const newCount = farewellsRef.current + 1;
            farewellsRef.current = newCount;
            setFarewellsGiven(newCount);
            triggerSave(newCount);
            setActiveDeparture(null);
          }}
          onMiss={() => setActiveDeparture(null)}
        />
      )}
      {!showOfflineModal && !activeDelay && !activeDeparture && pendingRankUps > 0 && (
        <RankUpModal rank={rankSet} onClaim={() => {
          const newCity = progressionManager.getRandomUnlockedCity(allCities);
          if (newCity) { progressionManager.unlockCity(newCity); setClaimedCity(newCity); }
          setPendingRankUps(prev => prev - 1);
        }} />
      )}
      {!showOfflineModal && claimedCity && (
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
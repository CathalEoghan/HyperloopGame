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
import ConstructionScreen from "./components/ConstructionScreen"
import LoadingScreen from "./components/LoadingScreen"
import DevelopmentRevealModal from "./components/DevelopmentRevealModal"
import FarewellModal from "./components/FarewellModal"
import NotEnoughRepModal from "./components/NotEnoughRepModal"
import UpgradeRevealModal from "./components/UpgradeRevealModal"
import EventModal from "./components/EventModal"
import DailyLoginModal from "./components/DailyLoginModal"
import OnboardingModal from "./components/OnboardingModal"
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import { allCities } from "../../CityManager/CityRegistry.js";
import { playRankUpSound, playReputationWorkBonusSound, playEventSound } from './utils/sound.js'
import { saveGame, loadGame, hasSave, deleteSave, exportSave, importSave } from 'Managers/SaveManager.js'
import { getRandomEvent } from "./data/events.js"
import openingAudio from './assets/sounds/openingAudio.mp3'
import "./App.css";

const OFFLINE_RATE = 1.0;
const SECONDS_IN_A_DAY = 86400;

function App() {
  const [rankManager] = useState(() => new RankManager());
  const [progressionManager] = useState(() => new ProgressionManager(rankManager));
  const [economyManager] = useState(() => new EconomyManager(progressionManager));
  const [timeManager] = useState(() => new TimeManager());
  const [constructionManager] = useState(() => new ConstructionManager(progressionManager, timeManager));

  const [savedData] = useState(() => hasSave() ? loadGame(progressionManager, rankManager) : null);

  const [offlineData] = useState(() => {
    const hiddenAt = localStorage.getItem('hyperloop_hidden_at');
    localStorage.removeItem('hyperloop_hidden_at');
    localStorage.removeItem('hyperloop_accumulated_offline');
    if (!hiddenAt) return null;
    const totalSeconds = Math.min((Date.now() - parseInt(hiddenAt)) / 1000, economyManager.calculateOfflineCap());
    if (totalSeconds < 60) return null;
    const incomePerSecond = economyManager.calculateDailyIncome();
    const offlineIncome = incomePerSecond * totalSeconds * OFFLINE_RATE;
    if (offlineIncome < 1) return null;
    progressionManager.addCash(offlineIncome);
    return { offlineSeconds: totalSeconds, offlineIncome };
  });

  const [isLoading, setIsLoading] = useState(() => hasSave() && progressionManager.purchasedCities.length > 0);
  const [constructionReady, setConstructionReady] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(!!offlineData);
  const [terminalName, setTerminalName] = useState(() => savedData?.terminalName || 'Hyperloop Empire');
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
  const [activeDeparture, setActiveDeparture] = useState(() => {
    const saved = localStorage.getItem('hyperloop_active_departure');
    if (!saved) return null;
    try {
      const dep = JSON.parse(saved);
      if (dep.expiresAt && Date.now() > dep.expiresAt) {
        localStorage.removeItem('hyperloop_active_departure');
        return null;
      }
      const secondsRemaining = Math.max(30, Math.floor((dep.expiresAt - Date.now()) / 1000));
      return { ...dep, secondsRemaining };
    } catch { return null; }
  });
  const [activeDelay, setActiveDelay] = useState(null);
  const [devRevealQueue, setDevRevealQueue] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasFreeReroll, setHasFreeReroll] = useState(false);
  const [showNotEnoughRep, setShowNotEnoughRep] = useState(false);
  const [revealedUpgrade, setRevealedUpgrade] = useState(null);
  const [activeEvent, setActiveEvent] = useState(() => {
    const saved = localStorage.getItem('hyperloop_active_event')
    if (!saved) return null
    try {
      const event = JSON.parse(saved)
      if (Date.now() > event.expiresAt) {
        localStorage.removeItem('hyperloop_active_event')
        return null
      }
      return { ...event, durationSeconds: Math.floor((event.expiresAt - Date.now()) / 1000) }
    } catch { return null }
  });
  const [dailyLoginData, setDailyLoginData] = useState(null);

  const activeEventRef = useRef(() => {
    const saved = localStorage.getItem('hyperloop_active_event')
    if (!saved) return null
    try {
      const event = JSON.parse(saved)
      if (Date.now() > event.expiresAt) return null
      return event
    } catch { return null }
  });
  const prevUnlockedDevCount = useRef(progressionManager.unlockedDevelopments.length + progressionManager.unlockedUpgrades.length);
  const triggeredDepartures = useRef(new Set(
    JSON.parse(localStorage.getItem('hyperloop_triggered_departures') || '[]')
  ));
  const triggeredDelays = useRef(new Set());
  const tickCount = useRef(0);
  const prevPurchasedCount = useRef(progressionManager.purchasedCities.length);
  const prevDevCount = useRef(progressionManager.purchasedDevelopments.length);
  const prevRank = useRef(rankManager.rank);
  const farewellsRef = useRef(savedData?.farewellsGiven || 0);
  const lastTickTimeRef = useRef(Date.now());
  const lastFarewellDateRef = useRef(localStorage.getItem('hyperloop_last_farewell_date') || null);

  // Immediate rank detection on load (catches offline rank ups)
  useEffect(() => {
    rankManager.convertCashToXP(progressionManager.totalCashEarned);
    const startRank = rankManager.rank;
    rankManager.verifyRank();
    const rankUpsGained = rankManager.rank - startRank;
    if (rankUpsGained > 0) {
      playRankUpSound();
      setPendingRankUps(rankUpsGained);
    }
  }, []);

  // Daily login check
  useEffect(() => {
    if (!hasSave() || progressionManager.purchasedCities.length === 0) return;
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('hyperloop_last_login');
    if (lastLogin === today) return;
    localStorage.setItem('hyperloop_last_login', today);
    const hasCommemorativeDisplays = progressionManager.purchasedDevelopments.some(d => d.name === 'Commemorative Displays');
    const hasPassengerLoyalty = progressionManager.purchasedUpgrades.some(u => u.name === 'Passenger Loyalty Scheme');
    const cashBonus = hasCommemorativeDisplays ? 50000 : 25000;
    const repBonus = hasPassengerLoyalty ? 5 : 0;
    setDailyLoginData({ cashBonus, repBonus });
  }, []);

  const [workEarnings, setWorkEarnings] = useState(() => economyManager.calculateWorkClickEarnings(100));

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

  const tickIntervalRef = useRef(null);

  const startTick = () => {
    if (tickIntervalRef.current) return;
    tickIntervalRef.current = setInterval(() => {
      tickCount.current += 1;

      const now2 = Date.now();
      const elapsed = Math.min((now2 - lastTickTimeRef.current) / 1000, 10);
      lastTickTimeRef.current = now2;
      const incomePerSecond = economyManager.calculateDailyIncome();
      progressionManager.addCash(incomePerSecond * elapsed);
      rankManager.convertCashToXP(progressionManager.totalCashEarned);
      const previousRank = rankManager.rank;
      rankManager.verifyRank();
      if (rankManager.rank > previousRank) {
        playRankUpSound();
        setPendingRankUps(prev => prev + 1);
      }
      constructionManager.update();

      const currentUnlocked = [...progressionManager.unlockedDevelopments, ...progressionManager.unlockedUpgrades];
      const currentUnlockedCount = currentUnlocked.length;
      if (currentUnlockedCount > prevUnlockedDevCount.current) {
        if (progressionManager.purchasedCities.length > 1) {
          const newOnes = currentUnlocked.slice(prevUnlockedDevCount.current);
          setDevRevealQueue(q => [...q, ...newOnes]);
        }
        prevUnlockedDevCount.current = currentUnlockedCount;
      }

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
      const currentSecond = now.getSeconds();
      const todayKey = now.toDateString();
      const storedDeparturesDate = localStorage.getItem('hyperloop_departures_date');
      if (storedDeparturesDate !== todayKey) {
        localStorage.setItem('hyperloop_departures_date', todayKey);
        localStorage.removeItem('hyperloop_triggered_departures');
        triggeredDepartures.current = new Set();
      }
      const schedule = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]');

      const farewellExtensions = progressionManager.purchasedUpgrades
        .filter(u => u.effectType === 'farewellWindowExtension').length;
      const windowMinutes = 5 + (farewellExtensions * 5);

      schedule.forEach(entry => {
        const key = `${todayKey}_${entry.time}`;
        const depMins = entry.hour * 60 + entry.minute;
        const windowStart = depMins - windowMinutes;
        const currentMins = currentHour * 60 + currentMinute;
        if (currentMins >= windowStart && currentMins < depMins && !triggeredDepartures.current.has(key)) {
          triggeredDepartures.current.add(key);
          localStorage.setItem('hyperloop_triggered_departures', JSON.stringify([...triggeredDepartures.current]));
          const currentTotalSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;
          const windowStartSeconds = windowStart * 60;
          const secondsElapsed = Math.max(0, currentTotalSeconds - windowStartSeconds);
          const secondsRemaining = Math.max(30, windowMinutes * 60 - secondsElapsed);
          const expiresAt = Date.now() + secondsRemaining * 1000;
          const depEntry = { ...entry, secondsRemaining, expiresAt };
          localStorage.setItem('hyperloop_active_departure', JSON.stringify(depEntry));
          setActiveDeparture(depEntry);
        }
      });

      if (Math.random() < 0.0002) {
        const eligible = schedule.filter(entry => {
          const diff = (entry.hour * 60 + entry.minute) - (currentHour * 60 + currentMinute);
          return diff > 60 && diff <= 120 && !triggeredDelays.current.has(entry.time) && !entry.delayed;
        });
        if (eligible.length > 0) {
          const entry = eligible[Math.floor(Math.random() * eligible.length)];
          const maxDelay = (23 * 60 + 55) - (entry.hour * 60 + entry.minute);
          const delayMinutes = Math.min(
            Math.ceil((Math.floor(Math.random() * 230) + 10) / 5) * 5,
            Math.floor(maxDelay / 5) * 5
          );
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

      // Sync active event to EconomyManager
      economyManager.activeEvent = activeEventRef.current;

      // Random event trigger — rank 3+ only
      if (Math.random() < 0.0004 && !activeEventRef.current && rankSet >= 3) {
        const positiveOnly = progressionManager.purchasedUpgrades.some(u => u.effectType === 'positiveEventBoost') && Math.random() < 0.5;
        const event = getRandomEvent(positiveOnly);

        // Skip negative events based on negativeEventReduction
        if (event.type === 'negative') {
          const reduction = economyManager.getUpgradeSum('negativeEventReduction');
          if (Math.random() < reduction) return;
        }

        // bonusDurationExtension only applies to positive events
        const bonusExtension = event.type === 'positive'
          ? 1 + economyManager.getUpgradeSum('bonusDurationExtension')
          : 1;
        const durationSeconds = Math.floor(event.duration() * bonusExtension);

        if (event.effectType === 'instantCash') {
          const bonus = Math.floor(economyManager.calculateDailyIncome() * SECONDS_IN_A_DAY * 0.1);
          progressionManager.addCash(bonus);
          const fullEvent = { ...event, durationSeconds: 0, instantCashAmount: bonus, expiresAt: Date.now() + 8000 };
          activeEventRef.current = fullEvent;
          localStorage.setItem('hyperloop_active_event', JSON.stringify(fullEvent));
          playEventSound();
          setActiveEvent(fullEvent);
          setTimeout(() => { activeEventRef.current = null; setActiveEvent(null); localStorage.removeItem('hyperloop_active_event'); }, 8000);
        } else if (event.effectType === 'instantCashLoss') {
          const loss = Math.floor(economyManager.calculateDailyIncome() * SECONDS_IN_A_DAY * 0.1);
          progressionManager.addCash(-loss);
          const fullEvent = { ...event, durationSeconds: 0, instantCashAmount: -loss };
          activeEventRef.current = fullEvent;
          playEventSound();
          setActiveEvent(fullEvent);
          setTimeout(() => { activeEventRef.current = null; setActiveEvent(null); }, 8000);
        } else {
          const fullEvent = { ...event, durationSeconds, expiresAt: Date.now() + durationSeconds * 1000 };
          activeEventRef.current = fullEvent;
          localStorage.setItem('hyperloop_active_event', JSON.stringify(fullEvent));
          playEventSound();
          setActiveEvent(fullEvent);
          setTimeout(() => {
            activeEventRef.current = null;
            setActiveEvent(null);
            localStorage.removeItem('hyperloop_active_event');
          }, durationSeconds * 1000);
        }
      }

      setWorkEarnings(economyManager.calculateWorkClickEarnings(100));
      setBalance(progressionManager.balance);
      setRankSet(rankManager.rank);
      setTotalCashEarned(progressionManager.totalCashEarned);
      setReputation(progressionManager.reputation);
      setPurchasedCitiesCount(progressionManager.purchasedCities.length);
    }, 1000);
  };

  const stopTick = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  useEffect(() => {
    startTick();
    return () => stopTick();
  }, [rankManager, progressionManager, economyManager, constructionManager]);

  useEffect(() => {
    if (savedData) triggerSave();
  }, [terminalName]);

  useEffect(() => {
    const handleUnload = () => {
      localStorage.setItem('hyperloop_hidden_at', Date.now());
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  if (isLoading) return <LoadingScreen onComplete={() => setIsLoading(false)} />;

  if (progressionManager.purchasedCities.length === 0 && pickedCity === null) {
    return <OpeningPage constructionManager={constructionManager} setPickedCity={setPickedCity} setTerminalName={setTerminalName} />;
  }

  if (pickedCity !== null && !constructionReady) {
    return <ConstructionScreen
      city={pickedCity}
      isComplete={progressionManager.purchasedCities.length > 0}
      onEnter={() => {
        new Audio(openingAudio).play().catch(() => {})
        setConstructionReady(true)
        if (!savedData) setShowOnboarding(true)
      }}
    />;
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
        hasFarewellPending={!!activeDeparture}
        activeEvent={activeEvent}
        onWork={(onRepGain) => {
          progressionManager.addCash(workEarnings);
          if (Math.random() < economyManager.getWorkRepChance()) {
            progressionManager.addReputation(5);
            playReputationWorkBonusSound();
            onRepGain?.();
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
          onUpgradeBuilt={(upgrade) => setRevealedUpgrade(upgrade)}
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
          onManualSave={triggerSave}
        />
      )}
      <TickerBar terminalName={terminalName} />
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

      {dailyLoginData && (
        <DailyLoginModal
          cashBonus={dailyLoginData.cashBonus}
          repBonus={dailyLoginData.repBonus}
          onCollect={() => {
            progressionManager.addCash(dailyLoginData.cashBonus);
            if (dailyLoginData.repBonus > 0) progressionManager.addReputation(dailyLoginData.repBonus);
            setDailyLoginData(null);
            triggerSave();
          }}
        />
      )}

      {activeEvent && (
        <EventModal
          event={activeEvent}
          terminalName={terminalName}
          onContinue={() => setActiveEvent(null)}
        />
      )}

      {revealedUpgrade && (
        <UpgradeRevealModal
          upgrade={revealedUpgrade}
          onContinue={() => setRevealedUpgrade(null)}
        />
      )}

      {showNotEnoughRep && (
        <NotEnoughRepModal onClose={() => setShowNotEnoughRep(false)} />
      )}

      {showOnboarding && (
        <OnboardingModal
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {showOfflineModal && offlineData && (
        <OfflineModal
          offlineSeconds={offlineData.offlineSeconds}
          offlineIncome={offlineData.offlineIncome}
          onCollect={() => { setShowOfflineModal(false); triggerSave(); }}
        />
      )}

      {!showOfflineModal && activeDelay && (
        <DelayModal
          delay={activeDelay}
          economyManager={economyManager}
          onCompensate={(cost) => { progressionManager.addCash(-cost); setActiveDelay(null); }}
          onDismiss={(repCost) => { progressionManager.addReputation(-repCost); setActiveDelay(null); }}
        />
      )}
      {!showOfflineModal && !activeDelay && activeDeparture && !claimedCity && (
        <FarewellModal
          departure={activeDeparture}
          economyManager={economyManager}
          onFarewell={(repGain) => {
            const today = new Date().toDateString();
            const isFirstToday = lastFarewellDateRef.current !== today;
            const hasDoubleFirst = economyManager.hasUpgrade('firstFarewellOfDayDouble');
            const finalRep = (isFirstToday && hasDoubleFirst) ? (repGain ?? 5) * 2 : (repGain ?? 5);
            if (isFirstToday) {
              lastFarewellDateRef.current = today;
              localStorage.setItem('hyperloop_last_farewell_date', today);
            }
            progressionManager.addReputation(finalRep);
            const newCount = farewellsRef.current + 1;
            farewellsRef.current = newCount;
            setFarewellsGiven(newCount);
            triggerSave(newCount);
            localStorage.removeItem('hyperloop_active_departure');
            setActiveDeparture(null);
          }}
          onMiss={() => { localStorage.removeItem('hyperloop_active_departure'); setActiveDeparture(null); }}
        />
      )}
      {!showOfflineModal && !activeDelay && !activeDeparture && pendingRankUps > 0 && (
        <RankUpModal rank={rankSet} onClaim={() => {
          const newCity = progressionManager.getRandomUnlockedCity(allCities);
          if (newCity) { progressionManager.unlockCity(newCity); setClaimedCity(newCity); }
          if (economyManager.hasUpgrade('freeRerollOnRankUp')) setHasFreeReroll(true);
          setPendingRankUps(prev => prev - 1);
        }} />
      )}
      {devRevealQueue.length > 0 && !showOfflineModal && !claimedCity && (
        <DevelopmentRevealModal
          development={devRevealQueue[0]}
          onContinue={() => setDevRevealQueue(q => q.slice(1))}
        />
      )}
      {!showOfflineModal && claimedCity && (
        <CityRevealModal
          city={claimedCity}
          reputation={reputation}
          onClose={() => setClaimedCity(null)}
          onReroll={() => {
            const rerollCost = hasFreeReroll ? 0 : economyManager.getRerollRepCost(15);
            if (progressionManager.reputation < rerollCost) { setShowNotEnoughRep(true); return; }
            progressionManager.addReputation(-rerollCost);
            setHasFreeReroll(false);
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
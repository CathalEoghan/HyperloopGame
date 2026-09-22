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
import SecretCityModal from "./components/SecretCityModal"
import MilestoneModal from "./components/MilestoneModal"
import HyperLinkModal, { HyperLinkButton } from "./components/HyperLink.jsx"
import { generateHyperLinkPost } from "./utils/hyperLinkEngine.js"
import { playPhoneNotificationSound } from "./utils/sound.js"
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import { allCities } from "../../CityManager/CityRegistry.js";
import { playRankUpSound, playReputationWorkBonusSound, playEventSound, playDepartureBoardSound, playClickSound2, playHoverSound } from './utils/sound.js'
import { saveGame, loadGame, hasSave, deleteSave, exportSave, importSave } from 'Managers/SaveManager.js'
import { getRandomEvent } from "./data/events.js"
import { allUpgrades } from "../../UpgradeManager/UpgradeRegistry.js"
import openingAudio from './assets/sounds/openingAudio.mp3'
import monitorIcon from './assets/misc/monitor.png'
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
    const hiddenAt = localStorage.getItem('hyperloop_hidden_at')
        || localStorage.getItem('hyperloop_heartbeat_at');
    localStorage.removeItem('hyperloop_hidden_at');
    localStorage.removeItem('hyperloop_heartbeat_at');
    localStorage.removeItem('hyperloop_accumulated_offline');
    if (!hiddenAt) return null;
    const totalSeconds = Math.min((Date.now() - parseInt(hiddenAt)) / 1000, economyManager.calculateOfflineCap());
    if (totalSeconds < 60) return null;
    const savedCreatedAt = savedData?.createdAt || Date.now();
    const savedEvent = economyManager.activeEvent;
    economyManager.activeEvent = null;
    const incomePerSecond = economyManager.calculateDailyIncome(null, savedCreatedAt);
    economyManager.activeEvent = savedEvent;
    const offlineIncome = incomePerSecond * totalSeconds * OFFLINE_RATE;
    if (offlineIncome < 1) return null;
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
  const [devRevealQueue, setDevRevealQueue] = useState(() => {
    // Mark home city rewards as shown BEFORE building the queue
    if (progressionManager.purchasedCities.length > 0) {
      const homeCity = progressionManager.purchasedCities[0];
      const shownEarly = JSON.parse(localStorage.getItem('hyperloop_shown_reveals') || '[]');
      homeCity.rewards.forEach(r => {
        if (!shownEarly.includes(r.name)) shownEarly.push(r.name);
      });
      localStorage.setItem('hyperloop_shown_reveals', JSON.stringify(shownEarly));
    }
    const shown = JSON.parse(localStorage.getItem('hyperloop_shown_reveals') || '[]')
    const allUnlocked = [...progressionManager.unlockedDevelopments, ...progressionManager.unlockedUpgrades]
    if (progressionManager.purchasedCities.length <= 1) return []
    const homeCityRewardNames = new Set((progressionManager.purchasedCities[0]?.rewards || []).map(r => r.name));
    return allUnlocked.filter(d => !shown.includes(d.name) && !homeCityRewardNames.has(d.name))
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasFreeReroll, setHasFreeReroll] = useState(false);
  const [showNotEnoughRep, setShowNotEnoughRep] = useState(false);
  const [revealedUpgradeQueue, setRevealedUpgradeQueue] = useState([]);
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
  const [showEventModal, setShowEventModal] = useState(false);
  const [dailyLoginData, setDailyLoginData] = useState(null);
  const [showMobileWarning, setShowMobileWarning] = useState(() => window.innerWidth < 900);
  const [showSecretCityModal, setShowSecretCityModal] = useState(false);
  const [preSelectedCity, setPreSelectedCity] = useState(null);
  const [milestoneQueue, setMilestoneQueue] = useState([]);
  const [cityClaimPending, setCityClaimPending] = useState(false);
  const [hyperLinkFeed, setHyperLinkFeed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hyperloop_hyperlink_feed') || '[]') } catch { return [] }
  })
  const [hyperLinkUnread, setHyperLinkUnread] = useState(() => {
    return parseInt(localStorage.getItem('hyperloop_hyperlink_unread') || '0')
  })
  const [hyperLinkOpen, setHyperLinkOpen] = useState(false)
  const [hyperLinkBubble, setHyperLinkBubble] = useState(false)

  // Keep ref in sync so tick loop can check without stale closure
  useEffect(() => { hyperLinkOpenRef.current = hyperLinkOpen }, [hyperLinkOpen])
  const [hyperLinkTrigger, setHyperLinkTrigger] = useState(null)
  const hyperLinkTriggerRef = useRef(null)
  const hyperLinkOpenRef = useRef(false)
  const nextPostTick = useRef(180 + Math.floor(Math.random() * 120))
  const secretCityTriggered = useRef(false);
  const claimedMilestones = useRef(new Set(
    JSON.parse(localStorage.getItem('hyperloop_claimed_milestones') || '[]')
  ));
  const MILESTONES = [
    { rank: 10, upgradeName: 'Commemorative Displays' },
    { rank: 50, upgradeName: "Founders' Hall" },
  ];
  const claimedCityRef = useRef(null);

  const activeEventRef = useRef((() => {
    const saved = localStorage.getItem('hyperloop_active_event')
    if (!saved) return null
    try {
      const event = JSON.parse(saved)
      if (Date.now() > event.expiresAt) return null
      return event
    } catch { return null }
  })());

  const prevUnlockedDevCount = useRef(progressionManager.unlockedDevelopments.length + progressionManager.unlockedUpgrades.length);
  const triggeredDepartures = useRef(new Set(
    JSON.parse(localStorage.getItem('hyperloop_triggered_departures') || '[]')
  ));
  const triggeredDelays = useRef(new Set());
  const tickCount = useRef(0);
  const prevPurchasedCount = useRef(progressionManager.purchasedCities.length);
  const prevDevCount = useRef(progressionManager.purchasedDevelopments.length);
  const prevUpgradesCount = useRef(progressionManager.purchasedUpgrades.length);
  const prevRank = useRef(rankManager.rank);
  const farewellsRef = useRef(savedData?.farewellsGiven || 0);
  const lastTickTimeRef = useRef(Date.now());
  const lastFarewellDateRef = useRef(localStorage.getItem('hyperloop_last_farewell_date') || null);
  const lastModalClearedAt = useRef(Date.now() + 180000);
  const lastEventTime = useRef(Date.now());
  const rankSetRef = useRef(rankManager.rank);
  const departureBoardAudioRef = useRef(null);
  const gameStartTime = useRef(Date.now());


  // Generate departure schedule on startup if it doesn't exist yet
  useEffect(() => {
    const today = new Date().toDateString();
    const key = `departures_${today}`;
    if (localStorage.getItem(key) || progressionManager.purchasedCities.length <= 1) return;
    const homeCity = progressionManager.purchasedCities[0];
    const departureCities = progressionManager.purchasedCities.filter(c => !homeCity || c.name !== homeCity.name);
    const shuffled = [...departureCities].sort(() => Math.random() - 0.5).slice(0, Math.min(100, departureCities.length));
    const totalMinutes = 24 * 60;
    const slotSize = Math.floor(totalMinutes / shuffled.length);
    const numGates = 30;
    const gateLastUsed = new Array(numGates + 1).fill(-Infinity);
    const departures = [];
    shuffled.forEach((city, i) => {
      const slotStart = i * slotSize;
      const slotEnd = Math.min(slotStart + slotSize, totalMinutes - 1);
      let minuteOfDay = Math.floor((slotStart + Math.floor(Math.random() * (slotEnd - slotStart))) / 5) * 5;
      if (departures.length > 0) {
        const lastTime = departures[departures.length - 1].minuteOfDay;
        if (minuteOfDay - lastTime < 10) minuteOfDay = Math.ceil((lastTime + 10) / 5) * 5;
      }
      const availableGates = [];
      for (let g = 1; g <= numGates; g++) {
        if (minuteOfDay - gateLastUsed[g] >= 30) availableGates.push(g);
      }
      let gate;
      if (availableGates.length > 0) {
        gate = availableGates[Math.floor(Math.random() * availableGates.length)];
      } else {
        let earliest = Infinity;
        for (let g = 1; g <= numGates; g++) {
          if (gateLastUsed[g] < earliest) { earliest = gateLastUsed[g]; gate = g; }
        }
      }
      gateLastUsed[gate] = minuteOfDay;
      const hour = Math.floor(minuteOfDay / 60);
      const minute = minuteOfDay % 60;
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      departures.push({ name: city.name, country: city.country, time: timeString, hour, minute, minuteOfDay, gate });
    });
    departures.sort((a, b) => a.minuteOfDay - b.minuteOfDay);
    if (departures.length > 0) localStorage.setItem(key, JSON.stringify(departures));
  }, []);

  // Immediate rank detection on load (catches offline rank ups)
  useEffect(() => {
    rankManager.convertCashToXP(progressionManager.totalCashEarned);
    const startRank = rankManager.rank;
    rankManager.verifyRank();
    const rankUpsGained = rankManager.rank - startRank;
    if (rankUpsGained > 0) {
      playRankUpSound();
      setPendingRankUps(rankUpsGained);
      for (let r = startRank + 1; r <= rankManager.rank; r++) {
        const milestone = MILESTONES.find(m => m.rank === r);
        if (milestone && !claimedMilestones.current.has(`rank_${r}`)) {
          setMilestoneQueue(prev => [...prev, milestone]);
        }
      }
    }
  }, []);

  // Daily login check
  useEffect(() => {
    if (!hasSave() || progressionManager.purchasedCities.length === 0) return;
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('hyperloop_last_login');
    if (lastLogin === today) return;
    localStorage.setItem('hyperloop_last_login', today);
    const hasCommemorativeDisplays = progressionManager.purchasedUpgrades.some(u => u.name === 'Commemorative Displays');
    const hasDailyRepDoubled = progressionManager.purchasedUpgrades.some(u => u.effectType === 'dailyRepDoubled');
    const dailyIncome = economyManager.calculateDailyIncome(null, createdAt) * 86400;
    const cashBonus = Math.floor(dailyIncome * (hasCommemorativeDisplays ? 0.5 : 0.25));
    let repBonus = economyManager.getUpgradeSum('dailyLoginRep');
    if (hasDailyRepDoubled && repBonus > 0) repBonus *= 2;
    setDailyLoginData({ cashBonus, repBonus });
  }, []);

  const [workRange, setWorkRange] = useState(() => economyManager.calculateWorkClickRange(rankManager.rank));

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

  const injectCityIntoSchedule = (city) => {
    const todayKey = new Date().toDateString();
    const schedule = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]');
    if (schedule.length === 0) {
      const pending = JSON.parse(localStorage.getItem('hyperloop_pending_injections') || '[]');
      if (!pending.includes(city.name)) {
        pending.push(city.name);
        localStorage.setItem('hyperloop_pending_injections', JSON.stringify(pending));
      }
      return;
    }
    if (schedule.some(e => e.name === city.name)) return;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const minFutureMins = currentMins + 30;
    const maxMins = 23 * 60 + 30;
    if (minFutureMins >= maxMins) return;
    let newMinutes = Math.ceil((minFutureMins + Math.floor(Math.random() * 30)) / 5) * 5;
    let attempts = 0;
    while (attempts < 24) {
      const clash = schedule.some(e => Math.abs((e.hour * 60 + e.minute) - newMinutes) < 10);
      if (!clash && newMinutes <= maxMins) break;
      newMinutes += 5;
      attempts++;
    }
    if (newMinutes > maxMins) return;
    const usedGates = new Set(schedule.map(e => e.gate));
    let gate = Math.floor(Math.random() * 30) + 1;
    for (let g = 1; g <= 30; g++) {
      if (!usedGates.has(g)) { gate = g; break; }
    }
    const hour = Math.floor(newMinutes / 60);
    const minute = newMinutes % 60;
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const newEntry = { name: city.name, country: city.country, time: timeString, hour, minute, minuteOfDay: newMinutes, gate };
    const updated = [...schedule, newEntry].sort((a, b) => a.minuteOfDay - b.minuteOfDay);
    localStorage.setItem(`departures_${todayKey}`, JSON.stringify(updated));
  };

  const tickIntervalRef = useRef(null);

  const startTick = () => {
    if (tickIntervalRef.current) return;
    tickIntervalRef.current = setInterval(() => {
      tickCount.current += 1;

      const now2 = Date.now();
      const elapsed = Math.min((now2 - lastTickTimeRef.current) / 1000, 10);
      lastTickTimeRef.current = now2;
      const savedCreatedAt = savedData?.createdAt || Date.now();
      const incomePerSecond = economyManager.calculateDailyIncome(null, savedCreatedAt);
      progressionManager.addCash(incomePerSecond * elapsed);
      rankManager.convertCashToXP(progressionManager.totalCashEarned);
      const previousRank = rankManager.rank;
      rankManager.verifyRank();
      if (rankManager.rank > previousRank) {
        playRankUpSound();
        const gained = rankManager.rank - previousRank;
        setPendingRankUps(prev => prev + gained);
        // Check for milestone ranks
        for (let r = previousRank + 1; r <= rankManager.rank; r++) {
          const milestone = MILESTONES.find(m => m.rank === r);
          if (milestone && !claimedMilestones.current.has(`rank_${r}`)) {
            setMilestoneQueue(prev => [...prev, milestone]);
          }
        }
      }
      constructionManager.update();

      const currentUnlocked = [...progressionManager.unlockedDevelopments, ...progressionManager.unlockedUpgrades];
      const currentUnlockedCount = currentUnlocked.length;
      if (currentUnlockedCount > prevUnlockedDevCount.current) {
        if (progressionManager.purchasedCities.length > 1 && !claimedCityRef.current) {
          const homeCityRewardNames = new Set((progressionManager.purchasedCities[0]?.rewards || []).map(r => r.name));
          const newOnes = currentUnlocked.slice(prevUnlockedDevCount.current).filter(d => !homeCityRewardNames.has(d.name));
          setDevRevealQueue(q => [...q, ...newOnes]);
        }
        prevUnlockedDevCount.current = currentUnlockedCount;
      }

      if (progressionManager.purchasedUpgrades.length > prevUpgradesCount.current) {
        const newUpgrades = progressionManager.purchasedUpgrades.slice(prevUpgradesCount.current);
        newUpgrades.forEach(upgrade => {
          if (upgrade.effectType) setRevealedUpgradeQueue(q => [...q, upgrade]);
        });
        prevUpgradesCount.current = progressionManager.purchasedUpgrades.length;
      }

      const nonSecretPurchased = progressionManager.purchasedCities.filter(c => c.continent !== 'Antarctica');
      if (nonSecretPurchased.length === 335 && !secretCityTriggered.current) {
        secretCityTriggered.current = true;
        setShowSecretCityModal(true);
      }

      if (progressionManager.purchasedCities.length > prevPurchasedCount.current) {
        const newCities = progressionManager.purchasedCities.slice(prevPurchasedCount.current);
        const homeCity = progressionManager.purchasedCities[0];
        newCities.forEach(city => {
          if (homeCity && city.name === homeCity.name) return;
          injectCityIntoSchedule(city);
        });
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
        localStorage.setItem('hyperloop_heartbeat_at', Date.now());
      }

      // Hyper-Link post generation every 3-5 minutes
      if (tickCount.current >= nextPostTick.current && tickCount.current > 0 && progressionManager.purchasedCities.length > 1) {
        const usedPostIds = JSON.parse(localStorage.getItem('hyperloop_hyperlink_used_posts') || '[]')
        const usedPfps = JSON.parse(localStorage.getItem('hyperloop_hyperlink_used_pfps') || '[]')
        const userPfpMap = JSON.parse(localStorage.getItem('hyperloop_hyperlink_user_pfps') || '{}')
        const todayKey = new Date().toDateString()
        const sched = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]')
        const post = generateHyperLinkPost({
          terminalName,
          homeCity: progressionManager.purchasedCities[0],
          purchasedCities: progressionManager.purchasedCities,
          purchasedDevelopments: progressionManager.purchasedDevelopments,
          purchasedUpgrades: progressionManager.purchasedUpgrades,
          activeEvent: activeEventRef.current,
          rankSet: rankManager.rank,
          schedule: sched,
          usedPostIds,
          usedPfps,
          userPfpMap,
          trigger: hyperLinkTriggerRef.current,
        })
        if (post) {
          const newFeed = [...JSON.parse(localStorage.getItem('hyperloop_hyperlink_feed') || '[]'), post]
          localStorage.setItem('hyperloop_hyperlink_feed', JSON.stringify(newFeed))
          usedPostIds.push(post.usedPostId)
          localStorage.setItem('hyperloop_hyperlink_used_posts', JSON.stringify(usedPostIds))
          if (post.usedPfpId && post.usedPfpId !== 'default' && post.usedPfpId !== 'official') {
            usedPfps.push(post.usedPfpId)
            localStorage.setItem('hyperloop_hyperlink_used_pfps', JSON.stringify(usedPfps))
          }
          if (post.handle && post.pfp) {
            userPfpMap[post.handle] = { pfp: post.pfp, pfpId: post.usedPfpId }
            localStorage.setItem('hyperloop_hyperlink_user_pfps', JSON.stringify(userPfpMap))
          }
          hyperLinkTriggerRef.current = null
          setHyperLinkTrigger(null)
          nextPostTick.current = tickCount.current + 180 + Math.floor(Math.random() * 120)
          setHyperLinkFeed(newFeed)
          if (!hyperLinkOpenRef.current) {
            setHyperLinkUnread(prev => {
              const newCount = prev + 1
              localStorage.setItem('hyperloop_hyperlink_unread', newCount)
              return newCount
            })
            playPhoneNotificationSound()
            setHyperLinkBubble(true)
            setTimeout(() => setHyperLinkBubble(false), 3000)
          }
        }
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

      // Event trigger — rank 2+, 1 min into game, 3 min after modals, guaranteed every 5 min
      const timeSinceLastEvent = Date.now() - lastEventTime.current;
      const forceEvent = timeSinceLastEvent > 300000;
      if ((Math.random() < 0.002 || forceEvent) && !activeEventRef.current && rankSetRef.current >= 2 && Date.now() > lastModalClearedAt.current && Date.now() - gameStartTime.current > 60000) {
        lastEventTime.current = Date.now();
        const positiveOnly = progressionManager.purchasedUpgrades.some(u => u.effectType === 'positiveEventBoost') && Math.random() < 0.5;
        const event = getRandomEvent(positiveOnly);

        const skipEvent = event.type === 'negative' && Math.random() < economyManager.getUpgradeSum('negativeEventReduction');
        if (!skipEvent) {
          const bonusExtension = event.type === 'positive'
            ? 1 + economyManager.getUpgradeSum('bonusDurationExtension')
            : 1;
          const durationSeconds = Math.floor(event.duration() * bonusExtension);

          if (event.effectType === 'instantCash') {
            const bonus = Math.floor(economyManager.calculateDailyIncome(null, createdAt) * SECONDS_IN_A_DAY * 0.1);
            progressionManager.addCash(bonus);
            const fullEvent = { ...event, durationSeconds: 0, instantCashAmount: bonus, expiresAt: Date.now() + 8000 };
            activeEventRef.current = fullEvent;
            localStorage.setItem('hyperloop_active_event', JSON.stringify(fullEvent));
            playEventSound();
            setActiveEvent(fullEvent);
            setShowEventModal(true);
            setTimeout(() => { activeEventRef.current = null; localStorage.removeItem('hyperloop_active_event'); }, 8000);
          } else if (event.effectType === 'instantCashLoss') {
            const loss = Math.round(economyManager.calculateDailyIncome(null, createdAt) * SECONDS_IN_A_DAY * 0.02 / 100) * 100;
            progressionManager.addCash(-loss);
            const fullEvent = { ...event, durationSeconds: 0, instantCashAmount: -loss };
            activeEventRef.current = fullEvent;
            playEventSound();
            setActiveEvent(fullEvent);
            setShowEventModal(true);
            setTimeout(() => { activeEventRef.current = null; }, 8000);
          } else {
            const fullEvent = { ...event, durationSeconds, expiresAt: Date.now() + durationSeconds * 1000 };
            activeEventRef.current = fullEvent;
            localStorage.setItem('hyperloop_active_event', JSON.stringify(fullEvent));
            playEventSound();
            setActiveEvent(fullEvent);
            setShowEventModal(true);
            setTimeout(() => {
              activeEventRef.current = null;
              setActiveEvent(null);
              setShowEventModal(false);
              localStorage.removeItem('hyperloop_active_event');
            }, durationSeconds * 1000);
          }
        }
      }

      setWorkRange(economyManager.calculateWorkClickRange(rankManager.rank));
      setBalance(progressionManager.balance);
      setRankSet(rankManager.rank);
      rankSetRef.current = rankManager.rank;
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
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
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
        if (localStorage.getItem('soundEnabled') !== 'false') new Audio(openingAudio).play().catch(() => {})
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
        homeCity={progressionManager.purchasedCities[0]}
        activeTab={activeTab}
        onSelect={(tab) => {
          if (departureBoardAudioRef.current) {
            departureBoardAudioRef.current.pause();
            departureBoardAudioRef.current.currentTime = 0;
            departureBoardAudioRef.current = null;
          }
          if (tab === "DepartureBoard") {
            departureBoardAudioRef.current = playDepartureBoardSound();
          }
          setActiveTab(tab);
        }}
        reputation={reputation}
        hasFarewellPending={!!activeDeparture}
        activeEvent={activeEvent}
        onEventExpire={() => {
          activeEventRef.current = null;
          setActiveEvent(null);
          setShowEventModal(false);
          localStorage.removeItem('hyperloop_active_event');
        }}
        onWork={(onRepGain) => {
    const earned = economyManager.calculateWorkClickEarnings(rankManager.rank);
    progressionManager.addCash(earned);
    setBalance(progressionManager.balance);
    const gotRep = Math.random() < economyManager.getWorkRepChance();
    if (gotRep) {
        progressionManager.addReputation(5);
        setReputation(progressionManager.reputation);
        playReputationWorkBonusSound();
    }
    onRepGain?.(earned, gotRep);
}}
        workRange={workRange}
      />
      <ExperienceBar
        current={totalCashEarned - rankManager.getCumulativeXP(rankSet - 1)}
        max={rankManager.calculateNextRankXP(rankSet)}
        nextRank={rankSet + 1}
        activeEvent={activeEvent}
      />
      {activeTab === "Home" && (
        <HomePage
          purchasedCities={progressionManager.purchasedCities}
          unlockedCities={progressionManager.unlockedCities}
          purchasedCitiesCount={purchasedCitiesCount}
          disabled={showOnboarding || hyperLinkOpen}
          economyManager={economyManager}
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
          preSelectedCity={preSelectedCity}
          onPreSelectedCityHandled={() => setPreSelectedCity(null)}
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
          onUpgradeBuilt={(upgrade) => setRevealedUpgradeQueue(q => [...q, upgrade])}
          onUpgrade={(development, discountMultiplier = 1.0) => {
            const success = progressionManager.upgradeDevelopment(development, discountMultiplier);
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
          onCollectReward={(reward) => {
            if (reward.type === 'cash') {
              progressionManager.addCash(reward.amount);
              setBalance(progressionManager.balance);
              setTotalCashEarned(progressionManager.totalCashEarned);
            } else {
              progressionManager.addReputation(reward.amount);
              setReputation(progressionManager.reputation);
            }
            triggerSave();
          }}
        />
      )}
      {activeTab === "DepartureBoard" && (
        <DepartureBoard
          purchasedCities={progressionManager.purchasedCities}
          homeCity={progressionManager.purchasedCities[0]}
          preSelectedCity={preSelectedCity}
          onPreSelectedCityHandled={() => setPreSelectedCity(null)}
        />
      )}
      {activeTab === "Settings" && (
        <SettingsPage
          terminalName={terminalName}
          onTerminalNameChange={setTerminalName}
          lastSaved={lastSaved}
          onDeleteSave={() => { deleteSave(); localStorage.removeItem('hyperloop_shown_reveals'); window.location.reload(); }}
          onExportSave={exportSave}
          onImportSave={async (file) => { await importSave(file); window.location.reload(); }}
          onManualSave={triggerSave}
        />
      )}
      <TickerBar terminalName={terminalName} />
      <BottomNav activeTab={activeTab} onSelect={(tab) => {
        if (departureBoardAudioRef.current) {
          departureBoardAudioRef.current.pause();
          departureBoardAudioRef.current.currentTime = 0;
          departureBoardAudioRef.current = null;
        }
        if (tab === "DepartureBoard") {
          departureBoardAudioRef.current = playDepartureBoardSound();
        }
        setActiveTab(tab);
      }} />

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
          reputation={reputation}
          onSpendRep={(amount) => progressionManager.addReputation(-amount)}
          onCollect={(finalBonus) => {
            progressionManager.addCash(finalBonus);
            if (dailyLoginData.repBonus > 0) progressionManager.addReputation(dailyLoginData.repBonus);
            setDailyLoginData(null);
            lastModalClearedAt.current = Date.now() + 180000;
            triggerSave();
          }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && showEventModal && activeEvent && devRevealQueue.length === 0 && !claimedCity && (
        <EventModal
          event={activeEvent}
          terminalName={terminalName}
          onContinue={() => {
            setShowEventModal(false);
            if (activeEvent?.durationSeconds === 0) setActiveEvent(null);
          }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && revealedUpgradeQueue.length > 0 && (
        <UpgradeRevealModal
          key={revealedUpgradeQueue[0].name}
          upgrade={revealedUpgradeQueue[0]}
          onContinue={() => setRevealedUpgradeQueue(q => q.slice(1))}
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

      {!dailyLoginData && showOfflineModal && offlineData && (
        <OfflineModal
          offlineSeconds={offlineData.offlineSeconds}
          offlineIncome={offlineData.offlineIncome}
          reputation={reputation}
          onSpendRep={(amount) => progressionManager.addReputation(-amount)}
          onCollect={(finalIncome) => {
            progressionManager.addCash(finalIncome);
            setShowOfflineModal(false);
            lastModalClearedAt.current = Date.now() + 180000;
            triggerSave();
          }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && activeDelay && (
        <DelayModal
          delay={activeDelay}
          economyManager={economyManager}
          balance={balance}
          onCompensate={(cost) => { progressionManager.addCash(-cost); setActiveDelay(null); hyperLinkTriggerRef.current = { type: 'delayCompensated', data: { delayedCity: activeDelay?.name } }; setHyperLinkTrigger({ type: 'delayCompensated', data: { delayedCity: activeDelay?.name } }); }}
          onDismiss={(repCost) => { progressionManager.addReputation(-repCost); setActiveDelay(null); hyperLinkTriggerRef.current = { type: 'delayNotCompensated', data: { delayedCity: activeDelay?.name, terminalName } }; setHyperLinkTrigger({ type: 'delayNotCompensated', data: { delayedCity: activeDelay?.name, terminalName } }); }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && !activeDelay && activeDeparture && !claimedCity && (
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
            hyperLinkTriggerRef.current = { type: 'farewellGiven', data: { city: activeDeparture?.name } };
            setHyperLinkTrigger({ type: 'farewellGiven', data: { city: activeDeparture?.name } });
          }}
          onMiss={() => { localStorage.removeItem('hyperloop_active_departure'); setActiveDeparture(null); hyperLinkTriggerRef.current = { type: 'farewellMissed' }; setHyperLinkTrigger({ type: 'farewellMissed' }); }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && !activeDelay && !activeDeparture && pendingRankUps > 0 && devRevealQueue.length === 0 && !claimedCity && (
        <RankUpModal key={rankSet} rank={rankSet} onClaim={() => {
          const minTier = economyManager.getMinCityTierOnRankUp();
          let newCity = progressionManager.getRandomUnlockedCity(allCities);
          if (minTier > 1 && newCity && newCity.tier < minTier) {
            const betterCities = allCities.filter(c =>
              c.tier >= minTier &&
              !progressionManager.purchasedCities.includes(c) &&
              !progressionManager.unlockedCities.includes(c)
            );
            const betterCity = betterCities.length > 0
              ? betterCities[Math.floor(Math.random() * betterCities.length)]
              : null;
            if (betterCity) newCity = betterCity;
          }
          if (newCity) {
            progressionManager.unlockCity(newCity);
            claimedCityRef.current = newCity;
            setCityClaimPending(true);
            prevUnlockedDevCount.current = progressionManager.unlockedDevelopments.length + progressionManager.unlockedUpgrades.length;
            setTimeout(() => setClaimedCity(newCity), 300);
          }
          if (economyManager.hasUpgrade('freeRerollOnRankUp')) setHasFreeReroll(true);
          const freeRep = economyManager.getUpgradeSum('freeRepOnRankUp');
          if (freeRep > 0) progressionManager.addReputation(freeRep);
          setPendingRankUps(prev => prev - 1);
        }} />
      )}

      {!dailyLoginData && devRevealQueue.length > 0 && !showOfflineModal && !claimedCity && (
        <DevelopmentRevealModal
          key={devRevealQueue[0].name}
          development={devRevealQueue[0]}
          onContinue={() => {
            const shown = JSON.parse(localStorage.getItem('hyperloop_shown_reveals') || '[]')
            shown.push(devRevealQueue[0].name)
            localStorage.setItem('hyperloop_shown_reveals', JSON.stringify(shown))
            setDevRevealQueue(q => q.slice(1))
          }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && claimedCity && (
        <CityRevealModal
          key={claimedCity.name}
          city={claimedCity}
          reputation={reputation}
          onClose={() => {
            if (progressionManager.purchasedCities.length > 1) {
              const shown = JSON.parse(localStorage.getItem('hyperloop_shown_reveals') || '[]')
              const allUnlocked = [...progressionManager.unlockedDevelopments, ...progressionManager.unlockedUpgrades]
              const homeCityRewardNames = new Set((progressionManager.purchasedCities[0]?.rewards || []).map(r => r.name));
              const unshown = allUnlocked.filter(d => !shown.includes(d.name) && !homeCityRewardNames.has(d.name))
              setDevRevealQueue(prev => {
                const prevNames = new Set(prev.map(p => p.name))
                const newItems = unshown.filter(d => !prevNames.has(d.name))
                return newItems.length > 0 ? [...prev, ...newItems] : prev
              })
            }
            claimedCityRef.current = null;
            setCityClaimPending(false);
            setClaimedCity(null)
          }}
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
              setTimeout(() => setClaimedCity(newCity), 300);
            }
          }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && milestoneQueue.length > 0 && devRevealQueue.length === 0 && !claimedCity && !cityClaimPending && pendingRankUps === 0 && (
        <MilestoneModal
          milestone={milestoneQueue[0]}
          onContinue={() => {
            const milestone = milestoneQueue[0];
            const upgrade = allUpgrades.find(u => u.name === milestone.upgradeName);
            if (upgrade) {
              progressionManager.purchasedUpgrades.push(upgrade);
              prevUpgradesCount.current = progressionManager.purchasedUpgrades.length;
              setDevRevealQueue(prev => [...prev, upgrade]);
            }
            claimedMilestones.current.add(`rank_${milestone.rank}`);
            localStorage.setItem('hyperloop_claimed_milestones', JSON.stringify([...claimedMilestones.current]));
            setMilestoneQueue(prev => prev.slice(1));
            triggerSave();
          }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && showSecretCityModal && devRevealQueue.length === 0 && (
        <SecretCityModal onContinue={() => {
          setShowSecretCityModal(false);
          const antarcticCity = allCities.find(c => c.name === 'Antarctic Peninsula');
          if (antarcticCity) {
            constructionManager.startStationConstruction(antarcticCity);
            triggerSave();
            setClaimedCity(antarcticCity);
          }
        }} />
      )}

      {activeTab === "Home" && (
  <HyperLinkButton
    unread={hyperLinkUnread}
    showBubble={hyperLinkBubble}
    onClick={() => {
      setHyperLinkOpen(true)
      setHyperLinkUnread(0)
      localStorage.setItem('hyperloop_hyperlink_unread', '0')
    }}
  />
)}

      {hyperLinkOpen && (
        <HyperLinkModal
          feed={hyperLinkFeed}
          onClose={() => setHyperLinkOpen(false)}
        />
      )}

      {activeEvent && localStorage.getItem('hyperloop_event_tint') !== 'false' && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 15,
         background: activeEvent.type === 'positive' ? 'rgba(39,174,96,0.08)' : 'rgba(192,57,43,0.18)',
          transition: 'background 0.5s ease',
        }} />
      )}

      {showMobileWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'rgb(255, 239, 224)', border: '2px solid black',
            borderRadius: '12px', padding: '32px 24px', maxWidth: '340px',
            textAlign: 'center', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <img src={monitorIcon} alt="monitor" style={{ width: '48px', height: '48px', marginBottom: '12px', border: 'none', borderRadius: '0' }} />
            <h2 style={{ fontFamily: 'Courier New, monospace', color: '#f5a623', margin: '0 0 12px' }}>
              Desktop Recommended
            </h2>
            <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Hyperloop Empire is designed for desktop browsers. On smaller screens some features may not display correctly.
            </p>
            <button
              className="closeButton"
              onMouseEnter={() => playHoverSound()}
              onClick={() => { playClickSound2(); setShowMobileWarning(false); }}
            >
              Continue anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
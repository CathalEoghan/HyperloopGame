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
import { generateHyperLinkPost, generateOfficialEventPost, UPGRADE_KEY_MAP } from "./utils/hyperLinkEngine.js"
import { POSTS } from "./data/hyperLinkData.js"
import { playPhoneNotificationSound } from "./utils/sound.js"
import { RankManager } from "Managers/RankManager/RankManager.js";
import { ProgressionManager } from "Managers/ProgressionManager/ProgressionManager.js";
import { EconomyManager } from "Managers/EconomyManager/EconomyManager.js"
import { TimeManager } from "Managers/TimeManager/TimeManager.js";
import { ConstructionManager } from "Managers/ConstructionManager/ConstructionManager.js";
import { allCities } from "../../CityManager/CityRegistry.js";
import { departureTimestamp, minutesUntilDeparture } from './utils/time.js'
import { playRankUpSound, playReputationWorkBonusSound, playEventSound, playDepartureBoardSound, playClickSound2, playHoverSound } from './utils/sound.js'
import { saveGame, loadGame, hasSave, deleteSave, exportSave, importSave, clearGameState } from 'Managers/SaveManager.js'
import { getRandomEvent } from "./data/events.js"
import cityCoordinates from "./data/cityCoordinates.js"
import { allUpgrades } from "../../UpgradeManager/UpgradeRegistry.js"
import openingAudio from './assets/sounds/openingAudio.mp3'
import monitorIcon from './assets/misc/monitor.png'
import "./App.css";

const OFFLINE_RATE = 1.0;
const SECONDS_IN_A_DAY = 86400;
// The Antarctic finale unlocks once every regular city is connected (bug #115).
const REGULAR_CITY_COUNT = allCities.filter(c => c.continent !== 'Antarctica').length;

// A gap between ticks longer than this (laptop asleep, tab frozen) is treated as offline time.
// Shorter gaps are normal for background tabs, which browsers slow to about one tick a minute.
const LONG_GAP_SECONDS = 120;

// ---- Single active tab (bug #83) ----
// Only one tab may run the game. Any other tab shows a notice and never ticks or saves,
// otherwise each tab's autosave overwrites the other's progress.
const TAB_LOCK_KEY = 'hyperloop_active_tab';
const TAKEOVER_REQUEST_KEY = 'hyperloop_takeover_request';
// Hidden tabs can be throttled to about one tick a minute, so a lock only counts as
// abandoned after 90 seconds without a heartbeat.
const TAB_LOCK_STALE_MS = 90000;

function readTabLock() {
  try { return JSON.parse(localStorage.getItem(TAB_LOCK_KEY)); } catch { return null; }
}

function claimTabLock(id, force = false) {
  const lock = readTabLock();
  if (!force && lock && lock.id !== id && Date.now() - lock.at < TAB_LOCK_STALE_MS) return false;
  localStorage.setItem(TAB_LOCK_KEY, JSON.stringify({ id, at: Date.now() }));
  return true;
}

// ---- Farewell queue (bug #65) ----
// Departures whose farewell window is open wait in a queue, so one opening while another is on
// screen waits its turn instead of replacing it. Stored under the old key (as a list).
const DEPARTURE_KEY = 'hyperloop_active_departure';
const departureId = dep => `${dep.time}_${dep.name}`;
// A farewell whose window closed more than a minute ago is dropped, however it got left behind.
const stillOpen = dep => !dep.expiresAt || Date.now() < dep.expiresAt + 60000;
// A departure that waited its turn still gets at least 30 seconds on screen.
const withMinimumWindow = dep => ({ ...dep, expiresAt: Math.max(dep.expiresAt || 0, Date.now() + 30000) });
function saveDepartureQueue(queue) {
  if (queue.length > 0) localStorage.setItem(DEPARTURE_KEY, JSON.stringify(queue));
  else localStorage.removeItem(DEPARTURE_KEY);
}

function takeOverAndReload() {
  sessionStorage.setItem('hyperloop_takeover', '1');
  window.location.reload();
}

function App() {
    // One id per page. It's kept on window rather than in state, so a hot reload while developing
  // (which restarts App with fresh state in the same page) isn't mistaken for a second tab.
  const [tabId] = useState(() => (window.__hyperloopTabId ??= Math.random().toString(36).slice(2) + Date.now().toString(36)));
  const [blockedByOtherTab, setBlockedByOtherTab] = useState(() => {
    const takeover = sessionStorage.getItem('hyperloop_takeover') === '1';
    sessionStorage.removeItem('hyperloop_takeover');
    return !claimTabLock(tabId, takeover);
  });
  const blockedRef = useRef(blockedByOtherTab);
  const [rankManager] = useState(() => new RankManager());
  const [progressionManager] = useState(() => new ProgressionManager(rankManager));
  const [economyManager] = useState(() => {
    const em = new EconomyManager(progressionManager);
    em.coordinates = cityCoordinates;
    return em;
  });
  const [timeManager] = useState(() => new TimeManager());
  const [constructionManager] = useState(() => new ConstructionManager(progressionManager, timeManager));

  const [savedData] = useState(() => hasSave() ? loadGame(progressionManager, rankManager) : null);

  const [offlineData, setOfflineData] = useState(() => {
    if (blockedByOtherTab) return null;
    // Offline earnings are kept in storage until the player presses Collect, so closing
    // or reloading the page before then doesn't lose them (bug #84).
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem('hyperloop_pending_offline')); } catch { pending = null; }
    const fresh = calculateFreshOffline();
    if (!pending && !fresh) return null;
    const combined = {
      offlineSeconds: (pending?.offlineSeconds || 0) + (fresh?.offlineSeconds || 0),
      offlineIncome: (pending?.offlineIncome || 0) + (fresh?.offlineIncome || 0),
    };
    localStorage.setItem('hyperloop_pending_offline', JSON.stringify(combined));
    return combined;
  });

  function calculateFreshOffline() {
    // Use the most recent sign of life: a stale hidden_at left by another tab must not
    // override a newer heartbeat.
    const hiddenAt = Math.max(
      parseInt(localStorage.getItem('hyperloop_hidden_at') || '0') || 0,
      parseInt(localStorage.getItem('hyperloop_heartbeat_at') || '0') || 0
    ) || null;
    localStorage.removeItem('hyperloop_hidden_at');
    // The page is open from now on, so "last seen" starts now (a crash soon after loading must not lose the gap)
    localStorage.setItem('hyperloop_heartbeat_at', Date.now());
    localStorage.removeItem('hyperloop_accumulated_offline');
    if (!hiddenAt) return null;
    const totalSeconds = Math.min((Date.now() - parseInt(hiddenAt)) / 1000, economyManager.calculateOfflineCap());
    if (totalSeconds < 60) return null;
    // Finish any builds that completed while the player was away, so they count towards
    // offline income instead of being treated as unbuilt for the whole absence (bug #85).
    constructionManager.update();
    const savedCreatedAt = savedData?.createdAt || Date.now();
    const savedEvent = economyManager.activeEvent;
    economyManager.activeEvent = null;
    const incomePerSecond = economyManager.calculateDailyIncome(null, savedCreatedAt);
    economyManager.activeEvent = savedEvent;
    const offlineIncome = incomePerSecond * totalSeconds * OFFLINE_RATE;
    if (offlineIncome < 1) return null;
    return { offlineSeconds: totalSeconds, offlineIncome };
  }

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
  const [pendingRankUps, setPendingRankUps] = useState(() => parseInt(localStorage.getItem('hyperloop_pending_rankups') || '0') || 0);
  // Persist unclaimed rank-ups so a reload before pressing Claim doesn't lose them.
  useEffect(() => { if (!blockedRef.current) localStorage.setItem('hyperloop_pending_rankups', pendingRankUps) }, [pendingRankUps]);
  const [claimedCity, setClaimedCity] = useState(null);
  const [departureQueue, setDepartureQueue] = useState(() => {
    let queue;
    try {
      const saved = JSON.parse(localStorage.getItem(DEPARTURE_KEY));
      queue = Array.isArray(saved) ? saved : saved ? [saved] : [];   // older saves stored just one
    } catch { queue = []; }
    // The farewell that was on screen ran out while the game was closed.
    queue = queue.filter(stillOpen);
    if (queue[0]) queue[0] = withMinimumWindow(queue[0]);
    return queue;
  });
  const activeDeparture = departureQueue[0] || null;
  // Removes this particular departure (not just "the first one"), so running twice is harmless.
  const finishDeparture = (dep) => setDepartureQueue(queue => {
    const next = queue.filter(d => departureId(d) !== departureId(dep));
    if (next[0] && departureId(next[0]) !== departureId(queue[0])) next[0] = withMinimumWindow(next[0]);
    saveDepartureQueue(next);
    return next;
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
    // A new game is marked "onboarding pending" as soon as the home city is picked, so a reload
  // at any point before the welcome popup is closed still shows it.
  const [showOnboarding, setShowOnboarding] = useState(() =>
    localStorage.getItem('hyperloop_onboarding_pending') === '1' && progressionManager.purchasedCities.length > 0);
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
  const [showDepartureBoard, setShowDepartureBoard] = useState(false)
  const topOffset = activeEvent ? 145 : 113
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
  useEffect(() => { terminalNameRef.current = terminalName }, [terminalName])
  const [hyperLinkTrigger, setHyperLinkTrigger] = useState(null)
  const hyperLinkTriggerRef = useRef(null)
  const hyperLinkOpenRef = useRef(false)
  const nextPostTick = useRef(60 + Math.floor(Math.random() * 120))
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

  // Tracks which unlocked development/upgrade names have already been queued
  // for a reveal popup (whether or not the player has dismissed it yet).
  // Name-based, not count-based, because unlockedDevelopments/unlockedUpgrades
  // can shrink (e.g. disconnectCity removes unbuilt rewards) as well as grow —
  // a length/slice comparison desyncs the moment that happens and silently
  // drops later reveals. Seeded from the queue the component already computed
  // above so nothing already pending gets re-added.
  const queuedRevealNames = useRef(null);
  if (queuedRevealNames.current === null) {
    queuedRevealNames.current = new Set(devRevealQueue.map(d => d.name));
  }
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
  const terminalNameRef = useRef(terminalName);
  const departureBoardAudioRef = useRef(null);
  const gameStartTime = useRef(Date.now());


   // Generate today's departure schedule if it doesn't exist yet. Runs on load and again when the
  // date changes while the game is open (bug #66).
  function ensureTodaySchedule() {
    if (blockedRef.current) return;
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
  }
  useEffect(() => { ensureTodaySchedule(); }, []);

  // Immediate rank detection on load (catches offline rank ups)
  useEffect(() => {
    if (blockedRef.current) return;
    rankManager.convertCashToXP(progressionManager.totalCashEarned);
    const startRank = rankManager.rank;
    rankManager.verifyRank();
    const rankUpsGained = rankManager.rank - startRank;
    if (rankUpsGained > 0) {
      playRankUpSound();
      setPendingRankUps(prev => prev + rankUpsGained);
    }
    // Queue every milestone at or below the current rank that hasn't been claimed yet —
    // not just ones reached since the last save — so a reload can't lose one.
    MILESTONES.forEach(milestone => {
      if (milestone.rank <= rankManager.rank && !claimedMilestones.current.has(`rank_${milestone.rank}`)) {
        setMilestoneQueue(prev => [...prev, milestone]);
      }
    });
  }, []);

   // Daily login check. Runs on load and again when the date changes while the game is open (bug #66).
  function checkDailyLogin() {
    if (blockedRef.current || !hasSave() || progressionManager.purchasedCities.length === 0) return;
    // A bonus offered on an earlier load but never collected is still owed (bug #84).
    let pendingDaily = null;
    try { pendingDaily = JSON.parse(localStorage.getItem('hyperloop_pending_daily')); } catch { pendingDaily = null; }
    if (pendingDaily) { setDailyLoginData(pendingDaily); return; }
    const today = new Date().toDateString();
    const lastLogin = localStorage.getItem('hyperloop_last_login');
    if (lastLogin === today) return;
    localStorage.setItem('hyperloop_last_login', today);
    const hasCommemorativeDisplays = progressionManager.purchasedUpgrades.some(u => u.name === 'Commemorative Displays');
    const hasDailyRepDoubled = progressionManager.purchasedUpgrades.some(u => u.effectType === 'dailyRepDoubled');
    // The bonus is worked out without any running event, so an event can't double or halve it
    const savedEvent = economyManager.activeEvent;
    economyManager.activeEvent = null;
    const dailyIncome = economyManager.calculateDailyIncome(null, createdAt) * 86400;
    economyManager.activeEvent = savedEvent;
    const cashBonus = Math.floor(dailyIncome * (hasCommemorativeDisplays ? 0.5 : 0.25));
    let repBonus = economyManager.getUpgradeSum('dailyLoginRep');
    if (hasDailyRepDoubled && repBonus > 0) repBonus *= 2;
        localStorage.setItem('hyperloop_pending_daily', JSON.stringify({ cashBonus, repBonus }));
    setDailyLoginData({ cashBonus, repBonus });
  }
  useEffect(() => { checkDailyLogin(); }, []);

  // Reputation spent on "Double" is only taken when the reward is collected, so it can't be
  // lost if the page closes first.
  const dailyDoubleRep = useRef(0);
  const offlineDoubleRep = useRef(0);

  const [workRange, setWorkRange] = useState(() => economyManager.calculateWorkClickRange(rankManager.rank));

  const triggerSave = (farewells) => {
    if (blockedRef.current) return;
    saveGame(progressionManager, rankManager, terminalNameRef.current, farewells ?? farewellsRef.current);
    // Every save is also a sign of life, so offline time is counted from the newest save
    localStorage.setItem('hyperloop_heartbeat_at', Date.now());
    setLastSaved(Date.now());
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

    // The official post about an event waits until the event popup has closed, then arrives a
  // moment later, so its notification sound doesn't play on top of the event sound.
  const pendingEventPostRef = useRef(null);
  useEffect(() => {
    if (showEventModal || !pendingEventPostRef.current) return;
    const timer = setTimeout(() => {
      const trigger = pendingEventPostRef.current;
      pendingEventPostRef.current = null;
      // Skip it if the event has already ended, e.g. the popup stayed open, or hidden behind
      // another popup, for the whole event.
      if (trigger && (!trigger.until || activeEventRef.current?.expiresAt === trigger.until)) fireOfficialHyperLinkPost(trigger);
    }, 2500);
    return () => clearTimeout(timer);
  }, [showEventModal]);

  const fireOfficialHyperLinkPost = (trigger) => {
    const post = generateOfficialEventPost({
      terminalName: terminalNameRef.current,
      homeCity: progressionManager.purchasedCities[0],
      purchasedCities: progressionManager.purchasedCities,
      trigger,
    })
    if (post) {
      const newFeed = [...JSON.parse(localStorage.getItem('hyperloop_hyperlink_feed') || '[]'), post]
      localStorage.setItem('hyperloop_hyperlink_feed', JSON.stringify(newFeed))
      setHyperLinkFeed(newFeed)
      if (!hyperLinkOpenRef.current) {
        setHyperLinkUnread(prev => { const n = prev + 1; localStorage.setItem('hyperloop_hyperlink_unread', n); return n })
        playPhoneNotificationSound()
        setHyperLinkBubble(true)
        setTimeout(() => setHyperLinkBubble(false), 3000)
      }
    }
  }

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
  const lastWaitCheckRef = useRef(Date.now());

  const startTick = () => {
    if (tickIntervalRef.current) return;
    tickIntervalRef.current = setInterval(() => {
      const lock = readTabLock();
      if (blockedRef.current) {
        // Waiting tab: take over automatically once the active tab has gone away.
        const checkedAt = Date.now();
        const sinceLastCheck = checkedAt - lastWaitCheckRef.current;
        lastWaitCheckRef.current = checkedAt;
        // If this tab itself was asleep, the lock only looks old because of that; give the playing tab
        // a moment to refresh it before deciding it has gone away.
        if (sinceLastCheck > TAB_LOCK_STALE_MS) return;
        if (!lock || checkedAt - lock.at > TAB_LOCK_STALE_MS) takeOverAndReload();
        return;
      }
      if (lock && lock.id !== tabId) {
        // Another tab has taken over: stop touching the save.
        blockedRef.current = true;
        setBlockedByOtherTab(true);
        return;
      }
      localStorage.setItem(TAB_LOCK_KEY, JSON.stringify({ id: tabId, at: Date.now() }));
      tickCount.current += 1;

            const now2 = Date.now();
      const gap = Math.max(0, (now2 - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now2;
      const savedCreatedAt = savedData?.createdAt || Date.now();
      // Credit the real time since the last tick, so a background tab earns in full. A long gap
      // is offline time instead: it's paid through the offline popup, capped like offline
      // income, and added to any offline reward that's still waiting (bug #57).
      let elapsed = gap;
      if (gap > LONG_GAP_SECONDS) {
        elapsed = 0;
        constructionManager.update();
        const offlineSeconds = Math.min(gap, economyManager.calculateOfflineCap());
        const savedEvent = economyManager.activeEvent;
        economyManager.activeEvent = null;
        const offlineIncome = economyManager.calculateDailyIncome(null, savedCreatedAt) * offlineSeconds * OFFLINE_RATE;
        economyManager.activeEvent = savedEvent;
        if (offlineIncome >= 1) {
          let pending = null;
          try { pending = JSON.parse(localStorage.getItem('hyperloop_pending_offline')); } catch { pending = null; }
          const combined = {
            offlineSeconds: (pending?.offlineSeconds || 0) + offlineSeconds,
            offlineIncome: (pending?.offlineIncome || 0) + offlineIncome,
          };
          localStorage.setItem('hyperloop_pending_offline', JSON.stringify(combined));
          setOfflineData(combined);
          setShowOfflineModal(true);
        }
        // The gap is now paid for, so move "last seen" forward; a crash soon after must not pay it again
        triggerSave();
      }
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
      if (progressionManager.purchasedCities.length > 1 && !claimedCityRef.current) {
        const homeCityRewardNames = new Set((progressionManager.purchasedCities[0]?.rewards || []).map(r => r.name));
        const alreadyShown = new Set(JSON.parse(localStorage.getItem('hyperloop_shown_reveals') || '[]'));
        const newOnes = currentUnlocked.filter(d =>
          !homeCityRewardNames.has(d.name) &&
          !alreadyShown.has(d.name) &&
          !queuedRevealNames.current.has(d.name)
        );
        if (newOnes.length > 0) {
          newOnes.forEach(d => {
            queuedRevealNames.current.add(d.name)
          })
          setDevRevealQueue(q => [...q, ...newOnes]);
        }
      }

      if (progressionManager.purchasedUpgrades.length > prevUpgradesCount.current) {
        const newUpgrades = progressionManager.purchasedUpgrades.slice(prevUpgradesCount.current);
                newUpgrades.forEach(upgrade => {
          if (upgrade.effectType) setRevealedUpgradeQueue(q => [...q, upgrade]);
          // Upgrades with their own Hyper-Link posts get one as the next post (bug #70).
          const key = UPGRADE_KEY_MAP[upgrade.name];
          if (key) {
            hyperLinkTriggerRef.current = { type: key };
            setHyperLinkTrigger({ type: key });
          }
        });
        prevUpgradesCount.current = progressionManager.purchasedUpgrades.length;
      }

      const nonSecretPurchased = progressionManager.purchasedCities.filter(c => c.continent !== 'Antarctica');
      const secretCityOwned = progressionManager.purchasedCities.some(c => c.continent === 'Antarctica') ||
        progressionManager.citiesUnderConstruction.some(c => c.continent === 'Antarctica');
      if (nonSecretPurchased.length === REGULAR_CITY_COUNT && !secretCityOwned && !secretCityTriggered.current) {
        secretCityTriggered.current = true;
        setShowSecretCityModal(true);
      }

      if (progressionManager.purchasedCities.length > prevPurchasedCount.current) {
        const newCities = progressionManager.purchasedCities.slice(prevPurchasedCount.current);
        const homeCity = progressionManager.purchasedCities[0];
        newCities.forEach(city => {
          if (homeCity && city.name === homeCity.name) return;
          injectCityIntoSchedule(city);
          const newCityTrigger = { type: city.tier === 1 ? 'newCityTier1' : 'newCity', data: { city: city.name } }
          hyperLinkTriggerRef.current = newCityTrigger
          setHyperLinkTrigger(newCityTrigger)
        });
      }

      const citiesChanged = progressionManager.purchasedCities.length !== prevPurchasedCount.current;
      const devsChanged = progressionManager.purchasedDevelopments.length !== prevDevCount.current;
      const rankChanged = rankManager.rank !== prevRank.current;

      if (citiesChanged || devsChanged || rankChanged) {
        if (devsChanged) {
          const devCatMap = { Shopping: 'newDevelopmentShopping', Recreation: 'newDevelopmentRecreation', Service: 'newDevelopmentService' }
          progressionManager.purchasedDevelopments.slice(prevDevCount.current).forEach(dev => {
            const key = devCatMap[dev.category]
            if (key) {
              hyperLinkTriggerRef.current = { type: key, data: { store: dev.name, recreation: dev.name, service: dev.name } }
              setHyperLinkTrigger({ type: key, data: { store: dev.name, recreation: dev.name, service: dev.name } })
            }
          })
        }
        prevPurchasedCount.current = progressionManager.purchasedCities.length;
        prevDevCount.current = progressionManager.purchasedDevelopments.length;
        prevRank.current = rankManager.rank;
        triggerSave();
      }

      if (tickCount.current % 30 === 0) {
        triggerSave();
      }

      // Hyper-Link post generation every 3-5 minutes
      if (tickCount.current >= nextPostTick.current && tickCount.current > 0 && progressionManager.purchasedCities.length > 1) {
        // Clean up posts older than 2 days
        const twoDaysAgo = Date.now() - 172800000
        const cleanFeed = JSON.parse(localStorage.getItem('hyperloop_hyperlink_feed') || '[]').filter(p => p.timestamp > twoDaysAgo)
        localStorage.setItem('hyperloop_hyperlink_feed', JSON.stringify(cleanFeed))
        const validPostIds = new Set(cleanFeed.map(p => p.usedPostId).filter(Boolean))
        const cleanedPostIds = JSON.parse(localStorage.getItem('hyperloop_hyperlink_used_posts') || '[]').filter(id => validPostIds.has(id))
        localStorage.setItem('hyperloop_hyperlink_used_posts', JSON.stringify(cleanedPostIds))

        const usedPostIds = cleanedPostIds
        // Month posts (see hyperLinkEngine.js) stay "used" for the whole calendar year instead of
        // just the 2-day feed window, so the small monthly pools don't repeat constantly. Storage
        // holds {id, year} entries; only keep ones from the current year, so it naturally clears
        // itself out and each post becomes eligible again once that month comes back around.
        const currentYear = new Date().getFullYear()
        const usedMonthPostRecords = JSON.parse(localStorage.getItem('hyperloop_hyperlink_used_month_posts') || '[]')
          .filter(e => e.year === currentYear)
        const usedMonthPostIds = usedMonthPostRecords.map(e => e.id)
        const usedPfps = JSON.parse(localStorage.getItem('hyperloop_hyperlink_used_pfps') || '[]')
        const userPfpMap = JSON.parse(localStorage.getItem('hyperloop_hyperlink_user_pfps') || '{}')
        const firedDevCategories = JSON.parse(localStorage.getItem('hyperloop_hyperlink_fired_devposts') || '[]')
        const todayKey = new Date().toDateString()
        const sched = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]')
        const post = generateHyperLinkPost({
          terminalName: terminalNameRef.current,
          homeCity: progressionManager.purchasedCities[0],
          purchasedCities: progressionManager.purchasedCities,
          purchasedDevelopments: progressionManager.purchasedDevelopments,
          purchasedUpgrades: progressionManager.purchasedUpgrades,
          activeEvent: activeEventRef.current,
          rankSet: rankManager.rank,
          reputation: progressionManager.reputation,
          schedule: sched,
          usedPostIds,
          usedMonthPostIds,
          usedPfps,
          userPfpMap,
          firedDevCategories,
          trigger: hyperLinkTriggerRef.current,
        })
        if (post) {
          const newFeed = [...cleanFeed, post]
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
          if (post.firedDevCategory && !firedDevCategories.includes(post.firedDevCategory)) {
            firedDevCategories.push(post.firedDevCategory)
            localStorage.setItem('hyperloop_hyperlink_fired_devposts', JSON.stringify(firedDevCategories))
          }
          if (post.monthPostId) {
            usedMonthPostRecords.push({ id: post.monthPostId, year: currentYear })
            localStorage.setItem('hyperloop_hyperlink_used_month_posts', JSON.stringify(usedMonthPostRecords))
          }
          hyperLinkTriggerRef.current = null
          setHyperLinkTrigger(null)
          nextPostTick.current = tickCount.current + 60 + Math.floor(Math.random() * 120)
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
      const todayKey = now.toDateString();
      const storedDeparturesDate = localStorage.getItem('hyperloop_departures_date');
            if (storedDeparturesDate !== todayKey) {
        localStorage.setItem('hyperloop_departures_date', todayKey);
        localStorage.removeItem('hyperloop_triggered_departures');
        triggeredDepartures.current = new Set();
        // A new day while the game is open: build its schedule and offer the daily bonus (bug #66),
        // and drop earlier days' schedules so they don't pile up in storage (bug #78).
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('departures_') && key !== `departures_${todayKey}`) localStorage.removeItem(key);
        });
        ensureTodaySchedule();
        checkDailyLogin();
      }
      const schedule = JSON.parse(localStorage.getItem(`departures_${todayKey}`) || '[]');

      const farewellExtensions = progressionManager.purchasedUpgrades
        .filter(u => u.effectType === 'farewellWindowExtension').length;
      const windowMinutes = 5 + (farewellExtensions * 5);

        setDepartureQueue(queue => {
        if (queue.every(stillOpen)) return queue;
        const next = queue.filter(stillOpen);
        saveDepartureQueue(next);
        return next;
      });

      schedule.forEach(entry => {
        // The city is part of the key, so two departures at the same minute both get a farewell.
        const key = `${todayKey}_${entry.time}_${entry.name}`;
        // Real moments in time, so the clocks changing can't skip or repeat a departure
        const depTs = departureTimestamp(entry, now.getTime());
        const windowStartTs = depTs - windowMinutes * 60000;
        const nowMinuteTs = Math.floor(now.getTime() / 60000) * 60000;
        if (nowMinuteTs >= windowStartTs && nowMinuteTs < depTs && !triggeredDepartures.current.has(key)) {
          triggeredDepartures.current.add(key);
          localStorage.setItem('hyperloop_triggered_departures', JSON.stringify([...triggeredDepartures.current]));
          const secondsElapsed = Math.max(0, Math.floor((now.getTime() - windowStartTs) / 1000));
          const secondsRemaining = Math.max(30, windowMinutes * 60 - secondsElapsed);
          const expiresAt = Date.now() + secondsRemaining * 1000;
          const depEntry = { ...entry, secondsRemaining, expiresAt };
          setDepartureQueue(queue => {
            if (queue.some(d => departureId(d) === departureId(depEntry))) return queue;
            const next = [...queue, depEntry];
            saveDepartureQueue(next);
            return next;
          });
        }
      });

      if (Math.random() < 0.0002) {
        const eligible = schedule.filter(entry => {
          const diff = minutesUntilDeparture(entry, now.getTime());
          const maxDelay = (23 * 60 + 55) - (entry.hour * 60 + entry.minute);
          // Require at least 10 minutes of headroom before the 23:55 cutoff — the
          // random delay below is always at least 10 minutes, so a departure with
          // less room than that would otherwise get its delay silently capped down
          // to 0 minutes (and £0 compensation) while still popping the delay modal.
          return diff > 60 && diff <= 120 && maxDelay >= 10 && !triggeredDelays.current.has(entry.time) && !entry.delayed;
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
                    // The delayed departure takes its new place in the day's order (bug #103).
          const updated = schedule.map(e => e.time === entry.time
            ? { ...e, hour: newHour, minute: newMinute, time: newTime, minuteOfDay: newTotalMins, delayed: true }
            : e).sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
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
        const positiveOnly = Math.random() < Math.min(1, economyManager.getUpgradeSum('positiveEventBoost'));
        const event = getRandomEvent(positiveOnly);

        const skipEvent = event.type === 'negative' && Math.random() < Math.min(1, economyManager.getUpgradeSum('negativeEventReduction'));
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
            if (POSTS.officialEvent?.[event.id]) pendingEventPostRef.current = { type: 'officialEvent', data: { eventId: event.id } };
            setTimeout(() => { activeEventRef.current = null; localStorage.removeItem('hyperloop_active_event'); }, 8000);
          } else if (event.effectType === 'instantCashLoss') {
            const loss = Math.round(economyManager.calculateDailyIncome(null, createdAt) * SECONDS_IN_A_DAY * 0.02 / 100) * 100;
            progressionManager.addCash(-loss);
            const fullEvent = { ...event, durationSeconds: 0, instantCashAmount: -loss };
            activeEventRef.current = fullEvent;
            playEventSound();
            setActiveEvent(fullEvent);
            setShowEventModal(true);
            if (POSTS.officialEvent?.[event.id]) pendingEventPostRef.current = { type: 'officialEvent', data: { eventId: event.id } };
            setTimeout(() => { activeEventRef.current = null; }, 8000);
          } else {
            const fullEvent = { ...event, durationSeconds, expiresAt: Date.now() + durationSeconds * 1000 };
            activeEventRef.current = fullEvent;
            localStorage.setItem('hyperloop_active_event', JSON.stringify(fullEvent));
            playEventSound();
            setActiveEvent(fullEvent);
            setShowEventModal(true);
            if (POSTS.officialEvent?.[event.id]) pendingEventPostRef.current = { type: 'officialEvent', data: { eventId: event.id }, until: fullEvent.expiresAt };
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
      if (blockedRef.current) return;
      localStorage.setItem('hyperloop_hidden_at', Date.now());
      if (readTabLock()?.id === tabId) localStorage.removeItem(TAB_LOCK_KEY);
    };
    // Another tab asked to take over: save everything now, then step aside.
    const handleStorage = (e) => {
      if (e.key !== TAKEOVER_REQUEST_KEY || !e.newValue || e.newValue === tabId || blockedRef.current) return;
      saveGame(progressionManager, rankManager, terminalNameRef.current, farewellsRef.current);
      localStorage.setItem('hyperloop_heartbeat_at', Date.now());
      blockedRef.current = true;
      stopTick();
      localStorage.removeItem(TAB_LOCK_KEY);
      setBlockedByOtherTab(true);
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (blockedByOtherTab) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '24px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgb(255, 239, 224)', border: '2px solid black', borderRadius: '12px', padding: '32px 24px', maxWidth: '380px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ fontFamily: 'Courier New, monospace', color: '#f5a623', margin: '0 0 12px' }}>Open in another tab</h2>
          <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
            Hyperloop Empire is already running in another tab. Only one tab can play at a time, so your progress isn&#39;t overwritten.
          </p>
          <button className="closeButton" onClick={() => {
            // Ask the active tab to save and step aside; take over anyway if it doesn't answer.
            localStorage.setItem(TAKEOVER_REQUEST_KEY, tabId);
            const started = Date.now();
            const wait = setInterval(() => {
              if (!readTabLock() || Date.now() - started > 3000) {
                clearInterval(wait);
                localStorage.removeItem(TAKEOVER_REQUEST_KEY);
                takeOverAndReload();
              }
            }, 200);
          }}>
            Play here instead
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingScreen onComplete={() => setIsLoading(false)} />;

    if (progressionManager.purchasedCities.length === 0 && pickedCity === null) {
    return <OpeningPage constructionManager={constructionManager} setPickedCity={city => {
      localStorage.setItem('hyperloop_onboarding_pending', '1');
      setPickedCity(city);
    }} setTerminalName={setTerminalName} />;
  }

  if (pickedCity !== null && !constructionReady) {
    return <ConstructionScreen
      city={pickedCity}
      isComplete={progressionManager.purchasedCities.length > 0}
      onEnter={() => {
        if (localStorage.getItem('soundEnabled') !== 'false') new Audio(openingAudio).play().catch(() => { })
        setConstructionReady(true)
        setShowOnboarding(true)
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
          if (tab === "DepartureBoard") {
            if (!showDepartureBoard && departureBoardAudioRef.current === null) {
              departureBoardAudioRef.current = playDepartureBoardSound();
            } else if (showDepartureBoard && departureBoardAudioRef.current) {
              departureBoardAudioRef.current.pause();
              departureBoardAudioRef.current.currentTime = 0;
              departureBoardAudioRef.current = null;
            }
            setShowDepartureBoard(prev => !prev);
          } else {
            if (departureBoardAudioRef.current) {
              departureBoardAudioRef.current.pause();
              departureBoardAudioRef.current.currentTime = 0;
              departureBoardAudioRef.current = null;
            }
            setShowDepartureBoard(false);
            setActiveTab(tab);
          }
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
          balance={balance}
          constructionManager={constructionManager}
          onConnectCity={triggerSave}
        />
      )}
      {activeTab === "Cities" && (
        <CitiesPage
          topOffset={topOffset}
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
          topOffset={topOffset}
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
          onUpgrade={(development, discountMultiplier = 1.0) => {
            const success = progressionManager.upgradeDevelopment(development, discountMultiplier);
            if (success) {
              triggerSave();
              hyperLinkTriggerRef.current = { type: 'developmentUpgraded', data: { development: development.name } }
              setHyperLinkTrigger({ type: 'developmentUpgraded', data: { development: development.name } })
            }
            return success;
          }}
        />
      )}
      {activeTab === "Progress" && (
        <ProgressPage
          topOffset={topOffset}
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
      {showDepartureBoard && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 250,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
          onClick={() => {
            if (departureBoardAudioRef.current) {
              departureBoardAudioRef.current.pause();
              departureBoardAudioRef.current.currentTime = 0;
              departureBoardAudioRef.current = null;
            }
            setShowDepartureBoard(false);
          }}
        >
          <div style={{
            background: '#0a0a0a',
            border: '2px solid #f5a623',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '98vw',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 0 60px rgba(245,166,35,0.15), 0 24px 80px rgba(0,0,0,0.9)',
            animation: 'boardModalIn 0.25s ease-out',
          }}
            onClick={e => e.stopPropagation()}
          >
            <DepartureBoard
              purchasedCities={progressionManager.purchasedCities}
              homeCity={progressionManager.purchasedCities[0]}
              preSelectedCity={preSelectedCity}
              onPreSelectedCityHandled={() => setPreSelectedCity(null)}
              onClose={() => {
                if (departureBoardAudioRef.current) {
                  departureBoardAudioRef.current.pause();
                  departureBoardAudioRef.current.currentTime = 0;
                  departureBoardAudioRef.current = null;
                }
                setShowDepartureBoard(false);
              }}
            />
          </div>
        </div>
      )}
      {activeTab === "Settings" && (
        <SettingsPage
          topOffset={topOffset}
          terminalName={terminalName}
          onTerminalNameChange={setTerminalName}
          lastSaved={lastSaved}
                    onDeleteSave={() => {
            stopTick();
            deleteSave();
            clearGameState();
            window.location.reload();
          }}
          onExportSave={() => {triggerSave(); exportSave(); }}
          onImportSave={async (file) => {
            stopTick();
            try { await importSave(file); } catch (err) { startTick(); throw err; }
            window.location.reload();
          }}
          onManualSave={triggerSave}
          onReputationBonus={(amount) => { progressionManager.addReputation(amount); setReputation(progressionManager.reputation); }}
        />
      )}
      <TickerBar terminalName={terminalName} />
      <BottomNav activeTab={activeTab} onSelect={(tab) => {
        if (departureBoardAudioRef.current) {
          departureBoardAudioRef.current.pause();
          departureBoardAudioRef.current.currentTime = 0;
          departureBoardAudioRef.current = null;
        }
        setShowDepartureBoard(false);
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
          onSpendRep={(amount) => { dailyDoubleRep.current += amount; }}
          onCollect={(finalBonus) => {
            progressionManager.addReputation(-dailyDoubleRep.current);
            dailyDoubleRep.current = 0;
            localStorage.removeItem('hyperloop_pending_daily');
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
                    onDismiss={() => {
            localStorage.removeItem('hyperloop_onboarding_pending');
            setShowOnboarding(false);
          }}
        />
      )}

      {!dailyLoginData && showOfflineModal && offlineData && (
        <OfflineModal
          offlineSeconds={offlineData.offlineSeconds}
          offlineIncome={offlineData.offlineIncome}
          capHours={Math.round(economyManager.calculateOfflineCap() / 3600)}
          reputation={reputation}
          onSpendRep={(amount) => { offlineDoubleRep.current += amount; }}
          onCollect={(finalIncome) => {
            progressionManager.addReputation(-offlineDoubleRep.current);
            offlineDoubleRep.current = 0;
            localStorage.removeItem('hyperloop_pending_offline');
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
          onCompensate={(cost) => { progressionManager.addCash(-cost); setActiveDelay(null); hyperLinkTriggerRef.current = { type: 'delayCompensated', data: { delayedCity: activeDelay?.name } }; setHyperLinkTrigger({ type: 'delayCompensated', data: { delayedCity: activeDelay?.name } }); fireOfficialHyperLinkPost({ type: 'officialDelayCompensated', data: { delayedCity: activeDelay?.name } }); }}
          onDismiss={(repCost) => { progressionManager.addReputation(-repCost); setActiveDelay(null); hyperLinkTriggerRef.current = { type: 'delayNotCompensated', data: { delayedCity: activeDelay?.name, terminalName } }; setHyperLinkTrigger({ type: 'delayNotCompensated', data: { delayedCity: activeDelay?.name, terminalName } }); fireOfficialHyperLinkPost({ type: 'officialDelay', data: { delayedCity: activeDelay?.name } }); }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && !activeDelay && activeDeparture && !claimedCity && (
        <FarewellModal
          key={departureId(activeDeparture)}
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
            // Personal Image Branding: +10% of the departing city's daily income per farewell.
            const farewellCity = allCities.find(c => c.name === activeDeparture?.name);
            const farewellCash = farewellCity ? economyManager.getFarewellCityIncomeBonus(farewellCity) : 0;
            if (farewellCash > 0) {
              progressionManager.addCash(farewellCash);
              setBalance(progressionManager.balance);
            }
            const newCount = farewellsRef.current + 1;
            farewellsRef.current = newCount;
            setFarewellsGiven(newCount);
            triggerSave(newCount);
            finishDeparture(activeDeparture);
            hyperLinkTriggerRef.current = { type: 'farewellGiven', data: { city: activeDeparture?.name } };
            setHyperLinkTrigger({ type: 'farewellGiven', data: { city: activeDeparture?.name } });
          }}
          onMiss={() => { finishDeparture(activeDeparture); hyperLinkTriggerRef.current = { type: 'farewellMissed' }; setHyperLinkTrigger({ type: 'farewellMissed' }); }}
        />
      )}

      {!dailyLoginData && !showOfflineModal && !activeDelay && !activeDeparture && pendingRankUps > 0 && devRevealQueue.length === 0 && !claimedCity && (
        <RankUpModal key={rankSet} rank={rankSet} onClaim={() => {
         const newCity = progressionManager.getRandomUnlockedCity(allCities, null, economyManager.getMinCityTierOnRankUp());
          if (newCity) {
            progressionManager.unlockCity(newCity);
            claimedCityRef.current = newCity;
            setCityClaimPending(true);
            setTimeout(() => setClaimedCity(newCity), 300);
          }
          if (economyManager.hasUpgrade('freeRerollOnRankUp')) setHasFreeReroll(true);
          const freeRep = economyManager.getUpgradeSum('freeRepOnRankUp');
          if (freeRep > 0) progressionManager.addReputation(freeRep);
          setPendingRankUps(prev => prev - 1);
          triggerSave();
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
          rerollCost={hasFreeReroll ? 0 : economyManager.getRerollRepCost(15)}
          onClose={() => {
            if (progressionManager.purchasedCities.length > 1) {
              const shown = JSON.parse(localStorage.getItem('hyperloop_shown_reveals') || '[]')
              const allUnlocked = [...progressionManager.unlockedDevelopments, ...progressionManager.unlockedUpgrades]
              const homeCityRewardNames = new Set((progressionManager.purchasedCities[0]?.rewards || []).map(r => r.name));
              const unshown = allUnlocked.filter(d => !shown.includes(d.name) && !homeCityRewardNames.has(d.name))
              setDevRevealQueue(prev => {
                const prevNames = new Set(prev.map(p => p.name))
                const newItems = unshown.filter(d => !prevNames.has(d.name))
                                newItems.forEach(d => {
                  queuedRevealNames.current.add(d.name)
                })
                return newItems.length > 0 ? [...prev, ...newItems] : prev
              })
            }
            claimedCityRef.current = null;
            setCityClaimPending(false);
            setClaimedCity(null)
          }}
                    // No re-roll button when the offered city is the only one left to unlock.
          onReroll={!progressionManager.getRandomUnlockedCity(allCities, claimedCity) ? undefined : () => {
            const rerollCost = hasFreeReroll ? 0 : economyManager.getRerollRepCost(15);
            if (progressionManager.reputation < rerollCost) { setShowNotEnoughRep(true); return; }
            // Pick the replacement first, never the city being re-rolled away, and only then charge
            // and swap, so a re-roll can't return the same city or cost reputation for nothing (bug #106).
            const newCity = progressionManager.getRandomUnlockedCity(allCities, claimedCity, economyManager.getMinCityTierOnRankUp());
            if (!newCity) return;
            progressionManager.addReputation(-rerollCost);
            setHasFreeReroll(false);
            progressionManager.removeUnlockedCity(claimedCity);
            progressionManager.unlockCity(newCity);
            triggerSave();
            setClaimedCity(null);
            setTimeout(() => setClaimedCity(newCity), 300);
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
          terminalName={terminalName}
          onClose={() => setHyperLinkOpen(false)}
        />
      )}

      {activeEvent && localStorage.getItem('hyperloop_event_tint') !== 'false' && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 15,
          background: activeEvent.type === 'positive' ? 'rgba(245,166,35,0.1)' : 'rgba(192,57,43,0.18)',
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
# Prestige upgrades: what is live and what is not

The source of truth is `NOT_IMPLEMENTED` at the top of `prestigeUpgrades.js`. An upgrade not listed
there is live. Un-listed ones show a "Coming soon" badge on the Prestige page. When you finish one,
delete its line from `NOT_IMPLEMENTED` and move it to the live table below.

All percentages are additive with the normal boosts (never multiplied).

## Live (23 of 26)

| Layer | Upgrade | Effect in the game | Where |
|---|---|---|---|
| 1 | Staff Feedback Forms | +250% to city and development income | EconomyManager `getPrestigeDevBoost` / `getPrestigeCityBoost` |
| 2 | Oral Hygiene | Farewell Reputation x6 (adds +5x; with the x2 upgrade it is x7) | `getFarewellRepGain` |
| 2 | Better Interest Rates | Daily bonus cash x10 | App.jsx `checkDailyLogin` |
| 2 | Elite Accountants | Offline "double" becomes x4, same 20 Rep | OfflineModal `bonusFactor` |
| 2 | Cult of Celebrity | +1 Rep for each Hyper-Link post liked (likes are permanent) | HyperLink `onLikeReward` |
| 2 | Good Standing | Developments upgrade for 0 Rep | ProgressionManager `getDevelopmentUpgradeCostInfo` |
| 2 | Amicable Breakups | Disconnect costs nothing and refunds half the connection cost | App.jsx `onDisconnect`, CitiesPage |
| 2 | Advanced Engineering | Cities and developments build immediately (finish on the next tick) | ConstructionManager |
| 2 | Video Message | Farewell is sent automatically after 2.5 s | FarewellModal |
| 2 | Viral Superstar | Progress rewards x3 (adds +2x; with the x2 upgrade it is x4) | ProgressPage `handleCardClick` |
| 3 | Automated Scheduling | No cap on offline earnings | `calculateOfflineCap` returns Infinity |
| 3 | Personal Favours | After a prestige you choose your starter city; without it the city is drawn for you | OpeningPage `runStart` |
| 3 | Pizza Parties | Positive events +200% stronger (effect tripled, instant cash x3) | App.jsx event trigger |
| 3 | Irresistible Discounts | Developments +500% | `getPrestigeDevBoost` |
| 3 | Bulletproof Planning | No delays | App.jsx delay block |
| 3 | Founders Hall Expansion | Founders' Hall step 1% to 2% per 10 days | `getFoundersHallMultiplier` |
| 3 | Trophy Cabinet | +25% city and development income per unique achievement (passive income only, not Work) | `getPrestigeCityBoost`, `getPrestigeDevBoost` |
| 3 | VIP Pods | VIP chance x10 (2% becomes 20%) | `getVipChance` |
| 3 | Five-Star Researchers | Experimental Technology gives 10 Prestige Points | `PrestigeManager.award` |
| 4 | Fast Learner | Prestige Points gained are doubled (applied after Five-Star) | `PrestigeManager.award` |
| 4 | Speedy Conveyor Belts | Work earnings x4 (+300%, additive with the Work upgrades) | `getWorkMultiplier` |
| 4 | Global Ticket Cuts | Cities +750% | `getPrestigeCityBoost` |
| 4 | Crisis Avoidance Specialists | No negative events | App.jsx event trigger |

## Not live yet (3 of 26)

| Layer | Upgrade | Waiting for |
|---|---|---|
| 4 | Government Grants | Start-of-run setup (Rank 25, 24 cities and developments unlocked); prestige runs now exist |
| 4 | Lobbying Suavity | A city-picker on the rank-up screen |
| 4 | Best P.A. Ever | Making the Work button clickable from code (auto-click every 500 ms) |

## Milestone upgrades

- **Early Retirement** (Rank 100, built): arrives unlocked under Development > Upgrades and costs 250 Reputation (no cash, no build time). Owning it enables **Retire** on the Prestige page. Re-earned every run.
- **Anniversary Sales** (Rank 25, built, live): +5% Work earnings per unique achievement (additive).

## Prestige runs

- Points for a run: 1 per 50 ranks reached (2 at Rank 100), doubled by Fast Learner. Five-Star Researchers only affects Experimental Technology.
- Retire resets: cash, rank, Reputation, cities, developments, upgrades, milestones, Founders' Hall clock, farewell count.
- Retire keeps: Prestige Points and upgrades, run history, terminal name, Hyper-Link likes, and the daily-bonus and first-farewell date stamps (so a new run can't be handed today's bonuses twice).
- New run: a fresh start screen; the starter city is drawn (Personal Favours lets you choose). No first-time walkthrough.
- Each finished run is logged (`hyperloop_prestige_history`) and shown under Past runs.
- Experimental Technology (5 points) is a reward of the Antarctic Peninsula, which only opens once every regular city is connected, so those points need a complete run.

## Achievements

- 38 achievements in `Managers/AchievementManager/achievements.js`. Unlocked ids are stored in `hyperloop_achievements`, running totals (Work presses, farewells) in `hyperloop_achievement_counters`, the Hyper-Link mute in `hyperloop_hyperlink_muted`.
- They are permanent: a prestige keeps all three, only Delete Save clears them. Importing a save replaces them with the file's.
- State achievements (cities, builds, balance, rank, likes, counters, Prestige) are checked every second; event ones are unlocked where they happen (mute, credits portrait, retiring).
- Upgrades count as developments (the Enterprise and Infrastructure categories only exist as upgrades). Milestone upgrades (Anniversary Sales, Early Retirement, Founders' Hall, Commemorative Displays) do not count.
- Only manual Work presses count (Best P.A. Ever will not). Treasury achievements check the balance at any moment.
- Truly Global = every regular city; Top Secret = the Antarctic Peninsula.
- **Very Important Person** is earned by giving a farewell to a VIP passenger (see below).
- Achievements already earned count for Trophy Cabinet and Anniversary Sales from the moment they unlock.

## VIP passengers

- When a departure's farewell window opens, `App.jsx` rolls `economyManager.getVipChance()` (2%, x10 with VIP Pods) and stores `vip: true` on the queued departure, so it survives a reload.
- A VIP uses the normal Farewell modal with VIP wording and plays `specialChime.mp3` instead of the leaving sound. The farewell is worth x5 Reputation on top of every other bonus (`getFarewellRepGain(base, isVip)`), and unlocks Very Important Person.
- Tuning: `VIP_BASE_CHANCE` and `VIP_REP_MULTIPLIER` at the top of `EconomyManager.js`.

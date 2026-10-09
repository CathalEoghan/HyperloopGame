// The Prestige upgrade tree. Four layers; every upgrade in a layer must be owned before the
// next layer opens. A layer's upgrades all cost the same.
// Effects are listed as plain text for the tree page; they are wired into the game one by one.

export const PRESTIGE_LAYERS = [
    { layer: 1, cost: 1 },
    { layer: 2, cost: 2 },
    { layer: 3, cost: 3 },
    { layer: 4, cost: 5 },
]

export const PRESTIGE_UPGRADES = [
    // Layer 1
    { id: 'staffFeedbackForms', layer: 1, name: 'Staff Feedback Forms', description: '+250% income.' },

    // Layer 2
    { id: 'oralHygiene', layer: 2, name: 'Oral Hygiene', description: 'x6 Reputation from farewells.' },
    { id: 'betterInterestRates', layer: 2, name: 'Better Interest Rates', description: 'x10 cash from the daily bonus.' },
    { id: 'eliteAccountants', layer: 2, name: 'Elite Accountants', description: 'The optional double bonus when claiming offline earnings becomes a quadruple bonus, for the same cost.' },
    { id: 'cultOfCelebrity', layer: 2, name: 'Cult of Celebrity', description: 'Liking a Hyper-Link post now gives 1 Reputation.' },
    { id: 'goodStanding', layer: 2, name: 'Good Standing', description: 'Upgrading developments costs no Reputation.' },
    { id: 'amicableBreakups', layer: 2, name: 'Amicable Breakups', description: 'Disconnecting costs nothing and refunds half the cost.' },
    { id: 'advancedEngineering', layer: 2, name: 'Advanced Engineering', description: 'Cities and developments are constructed immediately.' },
    { id: 'videoMessage', layer: 2, name: 'Video Message', description: 'Farewells are accepted automatically.' },
    { id: 'viralSuperstar', layer: 2, name: 'Viral Superstar', description: 'Progress rewards are tripled.' },

    // Layer 3
    { id: 'automatedScheduling', layer: 3, name: 'Automated Scheduling', description: 'No cap on offline earnings.' },
    { id: 'trophyCabinet', layer: 3, name: 'Trophy Cabinet', description: '+25% earnings for each unique achievement unlocked.' },
    { id: 'irresistibleDiscounts', layer: 3, name: 'Irresistible Discounts', description: 'Developments earn +500%.' },
    { id: 'bulletproofPlanning', layer: 3, name: 'Bulletproof Planning', description: 'No more delays, ever.' },
    { id: 'personalFavours', layer: 3, name: 'Personal Favours', description: 'Choose your starting city every run.' },
    { id: 'vipPods', layer: 3, name: 'VIP Pods', description: 'x10 VIP chance.' },

    // Layer 4
    { id: 'fastLearner', layer: 4, name: 'Fast Learner', description: '+1 Prestige Point for every 1 Prestige Point gained.' },
    { id: 'governmentGrants', layer: 4, name: 'Government Grants', description: 'Start at Rank 25, with 24 cities and developments already unlocked.' },
    { id: 'speedyConveyorBelts', layer: 4, name: 'Speedy Conveyor Belts', description: 'Work earnings are quadrupled.' },
    { id: 'globalTicketCuts', layer: 4, name: 'Global Ticket Cuts', description: 'Cities earn +750%.' },
    { id: 'bestPAEver', layer: 4, name: 'Best P.A. Ever', description: 'Work clicks itself once every 500ms.' },
    { id: 'lobbyingSuavity', layer: 4, name: 'Lobbying Suavity', description: 'Choose any city to connect when ranking up.' },
    { id: 'crisisAvoidanceSpecialists', layer: 4, name: 'Crisis Avoidance Specialists', description: 'No negative events, ever.' },
].map(u => ({ ...u, cost: PRESTIGE_LAYERS.find(l => l.layer === u.layer).cost }))

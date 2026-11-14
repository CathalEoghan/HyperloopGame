// Every email written by hand. This is the only file you need to edit to write emails.
//
// HOW IT WORKS
// An email is for one request type (build, greet, ...) and comes from one sender: a recurring character
// (stakeholder, inspector, complainer, fan, assistant, security, journalist, politician, engineer) or `public`
// (a random member of the public, with a random name). When the game sends that sender asking for that type of request, it picks
// one of the emails you wrote for it, preferring ones you haven't seen yet in this save. If you haven't written any for a
// sender and type, the game falls back on its built-in wording (utils/emailEngine.js).
//
// REQUEST TYPES (what the player is asked to do - the game decides the numbers and the deadline, you write the story)
//   build            Build a development of one category          {category}
//   greet            Greet the passengers {n} times
//   farewell         Say farewell {n} times
//   schedule         Add {n} loops to the timetable
//   cash             Earn {n} (a sum of money, already formatted, e.g. £32M)
//   rep              Earn {n} Reputation
//   connectContinent Connect a new city in {continent}
//   connectCities    Connect {n} new cities
//   rankUp           Take the terminal up a rank
//   upgradeDev       Upgrade a development {n} times
//   upgradeDevCategory  Upgrade {n} different developments of one category {category} (set `category`, e.g. 'Food')
//   upgradeCity      Upgrade a city's line {n} times
//   shop             Buy something from the Shop
//   work             Click Work {n} times
//   rename           Rename {n} developments
//   like             Like {n} Hyper-Link posts
//
// ONE EMAIL
//   {
//     subject: 'What shows in the inbox list',
//     body: 'The whole email, from "Dear {name}," to the signature. Use \n for a new line.',
//     // Optional. Leave any out and the game writes a plain one for you:
//     agree:     'Your reply when the player presses Agree (it is signed by the player, so end it with {fullName}).',
//     refuse:    'Your reply when the player presses Refuse.',
//     fulfilled: 'What the sender says when the request is done in time.',
//     failed:    'What the sender says when the deadline is missed.',
//     refused:   'What the sender says after a Refuse.',
//     ignored:   'What the sender says when the player never answered.',
//     target: 200,                 // optional: fix the number asked for ({n}) instead of letting the game choose (it is ignored if it would be impossible, e.g. more cities than exist)
//     category: 'Infrastructure',  // optional, build and upgradeDevCategory emails: the development category it is about (it is only sent once that category is unlocked)
//     id: 'optional-short-name',   // keep the same id if you reorder emails, so "already seen" is remembered correctly
//   }
//
// THINGS YOU CAN PUT IN THE TEXT (they are swapped for the real value)
//   {name}       the player's first name (or "Manager" if they haven't set one)
//   {fullName}   the player's full name
//   {from}       the sender's first name        {fromFull}  their full name        {role}  their job, e.g. Health Inspector
//   {n}          the number asked for (for cash it is a sum of money, e.g. £32M)
//   {category}   the development category (Food, Shopping, ...)      {continent}   the continent
//   {time}       how long the player gets, e.g. "a day" or "36 hours"       {hours}  the same as a number
//   {ask}        the game's own one-line version of the request, e.g. "greet the passengers 4 times"
//   {loop|loops} singular or plural: the first word if {n} is 1, the second otherwise
//
// KEEP IT SAFE: like the Hyper-Link posts, an email must not claim the terminal has facilities it might not have, or describe
// things that happen live (delays, crowds, weather).
//
// While you are still writing, you can make the game send ONLY the emails written here (nothing from the built-in wording).
// Set this to true once you want that; requests with no email written for them are then never sent.
export const ONLY_WRITTEN = false

// The examples below are placeholders to show the layout. Replace them and add your own.
export const EMAILS = {
    stakeholder: {
        build: [
            {
                id: 'example-stakeholder-build',
                subject: 'New {category} development',
                body: 'Dear {name},\n\nMy father opened a {category} business in this city in 1974 with one table and a borrowed till. I would like this terminal to have a {category} development I can point to and say "that is what we are about".\n\nBuild one. You have {time}.\n\nRegards,\n{fromFull}\n{role}',
                agree: 'Dear {from},\n\nUnderstood. I will have it built within {time}.\n\n{fullName}',
                refuse: 'Dear {from},\n\nI am sorry, I cannot take on a new {category} development right now.\n\n{fullName}',
                fulfilled: 'Good. My father would have approved.',
                failed: 'I am disappointed. That was important to me.',
            },
        ],
    },
    inspector: {
        upgradeDevCategory: [
            {
                id: 'inspector-restaurants',
                category: 'Food',
                target: 3,
                subject: 'Restaurant Health Standards',
                body: "Dear Manager,\n\nWhat a lovely day for working inside - or outside!\n\nSpeaking of work, I'd really like to see some more work put into your restaurants. So many of them fell below my standards on my last health inspection💔\n\nFix these within the time limit - you can do it! A positive mindset will go a long way!\n\nBest wishes,\n{from}",
                refused: "Dear Manager,\n\nNo. You must. You will fail my next health inspection if you don't.\n\nYour lack of compliance is noted here. Good luck.\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nNo problem, I will set to work on improving our restaurants.\n\n{fullName}',
                refuse: 'Dear {from},\n\nI will try my best, but I cannot guarantee much improvement considering the narrow timeframe.\n\n{fullName}',
                failed: "Dear Manager,\n\nThis is extremely disappointing. Your restaurants are still below my health and safety standards. I sincerely hope my next inspection will net better results.\n\nYou have a lot of work to do.\n\nBest wishes,\n{from}",
                fulfilled: "Dear Manager,\n\nExcellent - your restaurants passed with flying colours. Thank you for your compliance. The full report will be sent to your secretary.\n\nBest wishes,\n{from}",
            },
            {
                id: 'inspector-recreation',
                category: 'Recreation',
                target: 3,
                subject: 'Recreation Area Concerns',
                body: "Dear Manager,\n\nMy last health & safety report has been drafted - it's anything but PURRfect! Your recreational areas demand attention. As it stands, they fall short of several key health & safety standards.\n\nI expect them to comply fully with regulations on my next visit.\n\nBest wishes,\n{from}",
                agree: "Dear {from},\n\nUnderstood, I'm on it.\n\nBest,\n{fullName}",
                refuse: 'Dear {from},\n\nI will try, but I am unlikely to improve the conditions significantly.\n\nBest regards,\n{fullName}',
                refused: "Dear Manager,\n\nI'm not convinced you're taking this seriously at all. Your report has been updated.\n\nBest wishes,\n{from}",
                failed: 'Dear Manager,\n\nTut tut! I am so severely disappointed. Your recreational areas fall short completely of my regulations - for a second time in a row!\n\nThis report will be made public in the upcoming month.\n\nBest wishes,\n{from}',
                fulfilled: 'Dear Manager,\n\nGood. I see these areas are now fully compliant.\n\nUntil my next visit, you cool kitten!🐱\n\nBest wishes,\n{from}',
            },
        ],
        build: [
            {
                id: 'inspector-infrastructure-safety',
                category: 'Infrastructure',
                subject: 'Infrastructure Safety Concerns',
                body: "Dear Manager,\n\nWhat's your favourite day of the week? I can't decide between Monday or Tuesday - going to work is such a privilege!\n\nSpeaking of work, it looks like your infrastructure could use some. On my recent visit I noticed some outdated architecture and structural issues😿\n\nThis is so disappointing - I know we can do better than this! Let's aim to make some improvements in this area for my next visit!\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you. I will prioritise the infrastructure of our terminal ahead of the next inspection.\n\n{fullName}',
                refuse: 'Dear {from},\n\nThese requests are not realistic. I will try but cannot guarantee results.\n\n{fullName}',
                refused: "Dear Manager,\n\nI'm so sorry - what? This is not optional. I have no choice here but to mark your compliance down in my report - hopefully my next visit can lift your score higher.\n\nThis seems less likely though.\n\nBest wishes,\n{from}",
                fulfilled: "Dear Manager,\n\nHow wonderful! Those structural issues have cleared, mostly. Good job! We are such an amazing team! I tried to attach a celebration GIF but couldn't find the link, drat!😿❤️\n\nUntil my next visit!\n\nBest wishes,\n{from}",
                failed: "Dear Manager,\n\nThe recent health & safety report is being drafted, but I must warn you in advance, it is not looking good for your terminal. My recent request to review those concerns regarding infrastructure was seemingly ignored - this contributed quite a lot to your poor overall performance.\n\nI earnestly hope my next request will be more fruitful.\n\nBest wishes,\n{from}",
            },
        ],
        work: [
            {
                id: 'inspector-health-concerns',
                target: 200,
                subject: 'Health Concerns',
                body: 'Dear Manager,\n\nSo so sorry to interrupt your managerial duties! However, following a recent inspection, your terminal is a little below our standards😿\n\nOur next inspection is in {time}. I really hope for a more positive experience next time! You certainly have your work cut out for you.❤️\n\nBest wishes,\n{from}',
                refused: 'Dear Manager,\n\nYour lack of preparation for my next visit is noted.\n\nBest wishes,\n{from}',
                agree: 'Dear {from},\n\nOkay. I will get to work on this immediately.\n\n{fullName}',
                refuse: 'Dear {from},\n\nI am sorry, but this workload is not feasible at the moment.\n\n{fullName}',
                fulfilled: "Dear Manager,\n\nI have noticed your work recently. Very good! I knew you had it in you! Here's to TEAMWORK!❤️❤️\n\nBest wishes,\n{from}",
                failed: 'Dear Manager,\n\nYour recent health inspection report will follow shortly. I am rather disappointed in your lack of preparations for this visit, considering I sent you a quick action plan before of how best to tackle this concern.\n\nIf you have any questions do not hesitate to reach out. I hope my next visit will yield more promising results.\n\nBest wishes,\n{from}',
            },
        ],
        greet: [
            {
                id: 'example-inspector-greet',
                subject: 'A friendly hello',
                body: 'Dear {name},\n\nI was having the loveliest morning and I got to thinking how far a little kindness goes! Could you {ask}? Pretty please, with a cherry on top!\n\nYou have {time}.\n\nWarmest wishes,\n{from}',
            },
        ],
    },
    public: {
        like: [
            {
                id: 'example-public-like',
                subject: 'Please like our post',
                body: 'Dear {name},\n\nMy daughter and I made a little video about our train journey last week and we would be thrilled if you could like {n} {post|posts} on Hyper-Link. It does not have to be ours, but it would be nice!\n\nThank you,\n{fromFull}',
            },
        ],
    },
}

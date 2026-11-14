// Every email written by hand. This is the only file you need to edit to write emails.
//
// HOW IT WORKS
// An email is for one request type (build, greet, ...) and comes from one sender: a recurring character
// (inspector, assistant, security, marketing, journalist, fan, politician, complainer (the Dissatisfied Customer), cfo, lawyer) or `public`
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
//   connectTier3     Connect {n} new Tier 3 cities (the top tier)
//   negativeEvents   Live through {n} negative events (random bad events at the terminal; not something the player controls)
//   holdCash         Keep at least {n} in the bank until the deadline (like holdRep; {n} is worked out from their balance)
//   clearInbox       Answer the {n} emails waiting in the inbox
//   holdRep          Keep Reputation above {n} until the deadline (a task to avoid, not do; {n} is worked out from their Reputation)
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
//     body: 'The whole email, from "Dear {formal}," to the signature. Use \n for a new line.',
//     ask: 'Optional. Words the request shown under the email your way (it still means the same task), e.g. "buy something new to freshen up the terminal".',
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
//   {formal}     how the sender addresses the player: "Dr. Smith" if the player chose a title in Settings (it goes before the last word
//                of their name), otherwise their first name, and "Manager" only if they have not set a name. Start every email "Dear {formal},"
//   {FORMAL}     the same in capitals, for shouting
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
// The game sends ONLY the emails written here (nothing from the built-in wording). A sender or request with no email written
// for it is never sent. Set this to false to let the game fill the gaps with its built-in wording.
export const ONLY_WRITTEN = true

// The examples below are placeholders to show the layout. Replace them and add your own.
export const EMAILS = {
    inspector: {
        upgradeDevCategory: [
            {
                id: 'inspector-restaurants',
                category: 'Food',
                target: 3,
                subject: 'Restaurant Health Standards',
                body: "Dear {formal},\n\nWhat a lovely day for working inside - or outside!\n\nSpeaking of work, I'd really like to see some more work put into your restaurants. So many of them fell below my standards on my last health inspection💔\n\nFix these within the time limit - you can do it! A positive mindset will go a long way!\n\nBest wishes,\n{from}",
                refused: "Dear {formal},\n\nNo. You must. You will fail my next health inspection if you don't.\n\nYour lack of compliance is noted here. Good luck.\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nNo problem, I will set to work on improving our restaurants.\n\n{fullName}',
                refuse: 'Dear {from},\n\nI will try my best, but I cannot guarantee much improvement considering the narrow timeframe.\n\n{fullName}',
                failed: "Dear {formal},\n\nThis is extremely disappointing. Your restaurants are still below my health and safety standards. I sincerely hope my next inspection will net better results.\n\nYou have a lot of work to do.\n\nBest wishes,\n{from}",
                fulfilled: "Dear {formal},\n\nExcellent - your restaurants passed with flying colours. Thank you for your compliance. The full report will be sent to your secretary.\n\nBest wishes,\n{from}",
            },
            {
                id: 'inspector-recreation',
                category: 'Recreation',
                target: 3,
                subject: 'Recreation Area Concerns',
                body: "Dear {formal},\n\nMy last health & safety report has been drafted - it's anything but PURRfect! Your recreational areas demand attention. As it stands, they fall short of several key health & safety standards.\n\nI expect them to comply fully with regulations on my next visit.\n\nBest wishes,\n{from}",
                agree: "Dear {from},\n\nUnderstood, I'm on it.\n\nBest,\n{fullName}",
                refuse: 'Dear {from},\n\nI will try, but I am unlikely to improve the conditions significantly.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nI'm not convinced you're taking this seriously at all. Your report has been updated.\n\nBest wishes,\n{from}",
                failed: 'Dear {formal},\n\nTut tut! I am so severely disappointed. Your recreational areas fall short completely of my regulations - for a second time in a row!\n\nThis report will be made public in the upcoming month.\n\nBest wishes,\n{from}',
                fulfilled: 'Dear {formal},\n\nGood. I see these areas are now fully compliant.\n\nUntil my next visit, you cool kitten!🐱\n\nBest wishes,\n{from}',
            },
            {
                id: 'inspector-shopping',
                category: 'Shopping',
                target: 3,
                subject: 'Shopping Area Standards',
                body: "Dear {formal},\n\nGood day to you! I was looking at your shops and, honestly, I was feline a little let down. 🐱 A few of them need some serious TLC before they meet our standards.\n\nPlease give three of them a proper makeover before my next visit. A clean shop is a happy shop, and happy shops are PURRfectly profitable!\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you for the feedback. I will see that three of our shops are improved.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the suggestion, but I cannot commit to renovating the shops at the moment.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nOh, what a shame! I was so hopeful. I have made a note on the report, and I'll be keeping a close eye on those shops.\n\nBest wishes,\n{from}",
                failed: "Dear {formal},\n\nOh dear, those shops are still not up to scratch. I did so want to give you a glowing report. I'm afraid I must mark this one down.\n\nBest wishes,\n{from}",
                fulfilled: 'Dear {formal},\n\nMarvellous! Those shops are positively gleaming. Thank you for taking my advice so seriously. 🐱\n\nUntil my next visit!\n\nBest wishes,\n{from}',
            },
            {
                id: 'inspector-service',
                category: 'Service',
                target: 3,
                subject: 'Service Area Standards',
                body: "Dear {formal},\n\nHello, hello! I do hope your day is going swimmingly. Mine would be even better with a nice cup of tea and a tidy terminal! ☕\n\nNow, on to business. I took a good look at your service areas on my last inspection and, I'm sorry to say, a few of them are not quite up to scratch. Service is the heart of any terminal, and standards simply must be paw-sitively consistent.\n\nPlease give three of them some proper attention before my next visit. I know you can pull it off!\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you for letting me know. I will make sure three of our service areas are improved.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the advice, but I am unable to take on these improvements at the moment.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nOh dear. I did so hope you would say yes. I have noted it in the report, and I will be keeping an eye on those service areas.\n\nBest wishes,\n{from}',
                failed: "Dear {formal},\n\nI'm afraid those service areas are still not up to my standards. I really wanted to give you a glowing report, but I must mark this one down.\n\nBest wishes,\n{from}",
                fulfilled: 'Dear {formal},\n\nWonderful! Your service areas are now a credit to the terminal. Thank you for taking my advice so seriously. 🐱\n\nUntil my next visit!\n\nBest wishes,\n{from}',
            },
        ],
        build: [
            {
                id: 'inspector-infrastructure-safety',
                category: 'Infrastructure',
                subject: 'Infrastructure Safety Concerns',
                body: "Dear {formal},\n\nWhat's your favourite day of the week? I can't decide between Monday or Tuesday - going to work is such a privilege!\n\nSpeaking of work, it looks like your infrastructure could use some. On my recent visit I noticed some outdated architecture and structural issues😿\n\nThis is so disappointing - I know we can do better than this! Let's aim to make some improvements in this area for my next visit!\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you. I will prioritise the infrastructure of our terminal ahead of the next inspection.\n\n{fullName}',
                refuse: 'Dear {from},\n\nThese requests are not realistic. I will try but cannot guarantee results.\n\n{fullName}',
                refused: "Dear {formal},\n\nI'm so sorry - what? This is not optional. I have no choice here but to mark your compliance down in my report - hopefully my next visit can lift your score higher.\n\nThis seems less likely though.\n\nBest wishes,\n{from}",
                fulfilled: "Dear {formal},\n\nHow wonderful! Those structural issues have cleared, mostly. Good job! We are such an amazing team! I tried to attach a celebration GIF but couldn't find the link, drat!😿❤️\n\nUntil my next visit!\n\nBest wishes,\n{from}",
                failed: "Dear {formal},\n\nThe recent health & safety report is being drafted, but I must warn you in advance, it is not looking good for your terminal. My recent request to review those concerns regarding infrastructure was seemingly ignored - this contributed quite a lot to your poor overall performance.\n\nI earnestly hope my next request will be more fruitful.\n\nBest wishes,\n{from}",
            },
        ],
        work: [
            {
                id: 'inspector-health-concerns',
                target: 200,
                subject: 'Health Concerns',
                body: 'Dear {formal},\n\nSo so sorry to interrupt your managerial duties! However, following a recent inspection, your terminal is a little below our standards😿\n\nOur next inspection is in {time}. I really hope for a more positive experience next time! You certainly have your work cut out for you.❤️\n\nBest wishes,\n{from}',
                refused: 'Dear {formal},\n\nYour lack of preparation for my next visit is noted.\n\nBest wishes,\n{from}',
                agree: 'Dear {from},\n\nOkay. I will get to work on this immediately.\n\n{fullName}',
                refuse: 'Dear {from},\n\nI am sorry, but this workload is not feasible at the moment.\n\n{fullName}',
                fulfilled: "Dear {formal},\n\nI have noticed your work recently. Very good! I knew you had it in you! Here's to TEAMWORK!❤️❤️\n\nBest wishes,\n{from}",
                failed: 'Dear {formal},\n\nYour recent health inspection report will follow shortly. I am rather disappointed in your lack of preparations for this visit, considering I sent you a quick action plan before of how best to tackle this concern.\n\nIf you have any questions do not hesitate to reach out. I hope my next visit will yield more promising results.\n\nBest wishes,\n{from}',
            },
        ],
        rename: [
            {
                id: 'inspector-signage',
                target: 2,
                subject: 'Unclear Signage',
                body: "Dear {formal},\n\nWhat a PURRfectly lovely morning! I do hope you're well.\n\nOn my last inspection I got a little lost. Several of your developments are not labelled clearly, and clear names make a terminal safer for everyone - especially if there's ever a cat-astrophe!😼\n\nPlease give {n} of them a proper name before my next visit. It's a small change, but a big step towards a safer terminal.\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will see that our developments are named more clearly.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nI do not consider renaming a priority at present, and I cannot promise anything in this timeframe.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nI see. I shall note in my report that visitors are expected to find their way by guesswork. I am not impressed.\n\nBest wishes,\n{from}",
                fulfilled: 'Dear {formal},\n\nMuch better! I can now tell one development from the next, and I did not get lost once.\n\nKeep up the good work, you clever cat!🐱\n\nBest wishes,\n{from}',
                failed: "Dear {formal},\n\nI got lost AGAIN. I have been walking in circles for quite some time.\n\nThis is a hazard, and it will be going in my report.\n\nBest wishes,\n{from}",
            },
        ],
        schedule: [
            {
                id: 'inspector-timetable',
                target: 2,
                subject: 'A Fuller Timetable',
                body: "Dear {formal},\n\nHello, hello! Did you know a cat can sleep for up to sixteen hours a day? I'm told it's a very healthy habit. I wish I could say the same for your timetable.\n\nOn my last visit I found it rather thin. Passengers who wait too long between departures get restless, and a restless passenger is a safety hazard! A fuller timetable keeps everyone moving.\n\nPlease add {n} more {loop|loops} to the timetable before my next inspection.\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you for the advice. I will add more departures to the timetable.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot commit to timetable changes in this timeframe, but I will keep it in mind.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nHmm. Idle passengers are a risk to everyone, themselves included. I shall be keeping a close eye on your timetable.\n\nBest wishes,\n{from}",
                fulfilled: 'Dear {formal},\n\nWonderful - a much fuller timetable! Passengers can keep moving, and so can I.\n\nSee you at my next inspection!\n\nBest wishes,\n{from}',
                failed: "Dear {formal},\n\nYour timetable is no fuller than before. I am disappointed. Waiting passengers are fidgety passengers, and fidgety passengers are a hazard.\n\nI shall be watching.\n\nBest wishes,\n{from}",
            },
        ],
    },
    complainer: {
        build: [
            {
                id: 'complainer-restaurants',
                category: 'Food',
                target: 3,
                subject: 'Not enough restaurants!!',
                body: "Dear {formal},\n\nThis is, like, unacceptable. I have been travelling through this terminal a few times and am just stunned at how little food restaurants there are.\n\nI was told to speak to the manager and that's exactly what I'm doing! I'm so close to leaving a negative review for this place online.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. We take all customer concerns very seriously. I'm happy to share that several new food developments are on their way to the terminal!\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your email. There are currently no plans to develop any more restaurants within the terminal.\n\nBest regards,\n{fullName}",
                refused: "{FORMAL}.\n\nAre you serious?! This is like, so UNACCEPTABLE. WHAT THE HELL?\n\nOkay. Trying to calm down. Do you have a supervisor?\n\n{from}",
                fulfilled: "Dear {formal},\n\nI've noticed some more restaurants around. Good. But I just wanted to pass on that some of the staff working there have pretty bad attitudes.\n\nOne girl told me the customer isn't automatically always in the right? I want her fired.\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nEnjoy reading my most recent negative review.\n\nBest,\n{from}",
            },
        ],
        connectCities: [
            {
                id: 'complainer-connections',
                target: 2,
                subject: 'Is this ALL you have??',
                body: "Dear {formal},\n\nSo I'm, like, standing at the board looking at where I can go and it's the SAME cities as last time?! I have been to every single one of them. Twice. Is that really all this terminal has to offer?!\n\nI want somewhere new. Connect {n} more cities and I might not tell everyone I know how boring it is here.\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for getting in touch, and I'm sorry for the inconvenience. We are working on connecting more cities to the terminal and will have them running soon.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. Unfortunately we can't promise any new connections in that timeframe.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nUm, excuse me?? You can't promise ANYTHING? I'm literally a paying customer here!\n\nI'm telling everyone. Every. Single. Person. I'm not even joking.\n\n{from}",
                fulfilled: "Dear {formal},\n\nOkay. I saw the new connections on the board. That's, like, fine, I guess.\n\nBut why is the board so BRIGHT? I got a headache reading it. Can someone look into that?\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nStill nothing. I waited and waited and there is still no way to get where I'm going.\n\nI've just posted five stars. Kidding. It was ONE. And it's a long review.\n\nBest,\n{from}",
            },
        ],
        greet: [
            {
                id: 'complainer-no-welcome',
                target: 3,
                subject: 'Nobody even said HELLO',
                body: "Dear {formal},\n\nI arrived at your terminal this morning and NOBODY said hello. I stood there for, like, a whole minute. Where is the customer service?!\n\nI'm not asking for a parade. But a welcome would have been nice. Is that really too much?\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email, and I'm sorry you weren't made to feel welcome. I'll see what I can do.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I'm afraid we can't guarantee a greeting for every arrival.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nYou can't guarantee a HELLO?! It's one word! It's not even a long word!\n\nI'm writing this down. In pen.\n\n{from}",
                fulfilled: "Dear {formal},\n\nI saw you say hello to me this morning. Fine. Good.\n\nBut you said it THREE times to the same person, and it was, like, really loud. Is that necessary? I was trying to enjoy my coffee.\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nNobody said hello again. I have put a note in your suggestions box.\n\nThe note says 'hello'.\n\nBest,\n{from}",
            },
        ],
        like: [
            {
                id: 'complainer-no-likes',
                target: 3,
                subject: 'My post has ZERO likes',
                body: "Dear {formal},\n\nI posted about my experience at your terminal on Hyper-Link, and it has, like, ZERO likes. Zero! Do people not care about customer feedback?!\n\nI would like to see you take an interest in what people are saying. It's the least you can do.\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. Your feedback matters to us, and I'll make sure to spend some time on Hyper-Link.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I'm afraid I can't promise to like anything on request.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nSo you're ignoring my post AND my email? That's, like, two ways of ignoring me!\n\nI'm going to post about THIS too.\n\n{from}",
                fulfilled: "Dear {formal},\n\nI see you've been liking things on Hyper-Link. Good. But the fact I had to ask you to do it is horrible. Do better.\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nMy post now has one like. It's from my mum.\n\nI hope you're proud of yourself.\n\nBest,\n{from}",
            },
        ],
        work: [
            {
                id: 'complainer-lazy-staff',
                target: 150,
                subject: 'Do you EVER work?!',
                body: "Dear {formal},\n\nI was told to speak to the manager, so I went looking for you. And what were you doing? NOTHING. Just sitting there. For ten whole minutes. I timed it.\n\nIs this a terminal or a waiting room?! Get to work. Now.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for bringing this to my attention, and I apologise. I'll get straight back to work.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I work very hard, and I can't make any promises about what you saw.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nSo you're saying I'm LYING?! I have, like, photos. Okay I don't have photos. But I have a very good memory.\n\nI know what I saw. You. Doing nothing.\n\n{from}",
                fulfilled: "Dear {formal},\n\nI see you've been working. Good. I can't fault it.\n\nBut now you're so BUSY that you won't talk to me. I came to complain and was told to wait. Wait! Me!\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nSame chair. Same spot. Still doing nothing. I've started timing you again. It's up to twenty minutes now - a new record.\n\nThis is going in my review.\n\nBest,\n{from}",
            },
        ],
        shop: [
            {
                id: 'complainer-decor',
                subject: 'Ever heard of DECOR?',
                body: "Dear {formal},\n\nI have been through this terminal so many times and it looks EXACTLY the same every time. Same colours. Same everything. It is, like, so boring I could cry.\n\nMy cousin says her terminal gets a whole new look all the time. Treat the place to something nice. It's not that hard.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. We're always looking at ways to refresh the terminal, and I'll see what I can do.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. We're happy with how the terminal looks at the moment and have no plans to change it.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nHAPPY with it?! HAPPY?! It looks like a dentist's waiting room.\n\nI'm telling my cousin. She has opinions about this sort of thing.\n\n{from}",
                fulfilled: "Dear {formal},\n\nOkay, I noticed something new. It's... fine. But it's a different colour now and I liked the old one better.\n\nCan you change it back?\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nStill exactly the same. I've decided to bring my own decorations.\n\nThey're plastic flowers. You're welcome.\n\nBest,\n{from}",
            },
        ],
        rename: [
            {
                id: 'complainer-boring-names',
                target: 2,
                subject: 'Who NAMES these things??',
                body: "Dear {formal},\n\nI have been walking around your terminal and some of the names are, like, SO boring. I could have come up with better in my sleep. Does nobody here have any imagination?!\n\nGive {n} of them a new name. Something with some flair! Is that really so hard?\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. Creative names are a great idea, and I'll see what I can come up with.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. We're happy with the names we have and have no plans to change them.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nHAPPY with them?! Fine. Keep your boring names.\n\nI'll just call everything whatever I like. Out loud. Very loudly.\n\n{from}",
                fulfilled: "Dear {formal},\n\nI've seen the new names. They're... fine. A bit try-hard, honestly. But better than before, I suppose.\n\nDon't let it go to your head.\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nStill boring. So I've started giving them my own names. 'Food Place'. 'Shop Place'. 'The Other Shop Place'.\n\nYou're welcome.\n\nBest,\n{from}",
            },
        ],
        rep: [
            {
                id: 'complainer-reputation',
                subject: 'Your REPUTATION',
                body: "Dear {formal},\n\nI told all my friends about my experience at your terminal and apparently your reputation is, like, not good. One of them actually laughed. In my face!\n\nDo something about it. I'm sure you can find a way to make people like this place more.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. We're always working to improve the terminal's reputation, and I'll make it a priority.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I'm afraid I can't promise any change to our reputation in that timeframe.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nSo you just don't care what people think? Wow.\n\nFine. I'll keep telling everyone the truth. Starting with everyone I know.\n\n{from}",
                fulfilled: "Dear {formal},\n\nI've heard people are saying nicer things about this place. That's, like, great, I suppose.\n\nIt's a bit disappointing, actually. I had a whole speech prepared.\n\nBest,\n{from}",
                failed: "Dear {formal},\n\nNobody I know wants to visit your terminal now. I told them everything. One of them said she'd rather walk.\n\nI hope you're proud of yourself.\n\nBest,\n{from}",
            },
        ],
    },
    cfo: {
        cash: [
            {
                id: 'cfo-quarterly-figures',
                subject: 'Quarterly Figures',
                body: "Dear {formal},\n\nI have reviewed the latest figures. They are, to put it politely, adequate.\n\nAdequate is not a word I like to see in a report. I would like the terminal to earn {n} before my next review. I trust that is not an unreasonable request.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will see that the terminal reaches that figure.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThat figure is not realistic in the time given, and I would rather not promise what I cannot deliver.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nNoted. I shall record the target as 'declined' in the quarterly report. Investors do read those.\n\nRegards,\n{from}",
                fulfilled: 'Dear {formal},\n\nThe target has been met. I will record it as a satisfactory quarter.\n\nDo not take that as praise. It is merely accurate.\n\nRegards,\n{from}',
                failed: 'Dear {formal},\n\nThe target was missed. I have adjusted the forecast accordingly, and not upwards.\n\nRegards,\n{from}',
            },
        ],
        shop: [
            {
                id: 'cfo-justified-expense',
                subject: 'A Justified Expense',
                body: "Dear {formal},\n\nI have been going through the books and could not help noticing how little we spend on ourselves.\n\nSome modest purchases would show confidence in our own product. I would call it an expense. The accountants would call it a justified expense.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will make a purchase or two.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI do not believe now is the right time for that expense. Let us revisit it later.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nI see. I shall log it as a missed opportunity, which is an accounting term for 'a mistake'.\n\nRegards,\n{from}",
                fulfilled: 'Dear {formal},\n\nThe receipt has been filed. An excellent expense, now that I see it.\n\nI am almost tempted to approve another. Almost.\n\nRegards,\n{from}',
                failed: 'Dear {formal},\n\nNo purchase was made. The line in the books remains empty, and I dislike an empty line.\n\nRegards,\n{from}',
            },
        ],
        rep: [
            {
                id: 'cfo-intangible-asset',
                subject: 'An Intangible Asset',
                body: "Dear {formal},\n\nReputation is, technically, an intangible asset. I cannot put it on the balance sheet, which is a shame, because it is the one asset everyone insists on discussing.\n\nI would be grateful if you could build some up. Investors do not like surprises, but they do like a good name.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will work on the terminal\'s reputation.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot commit to improving something so intangible in this timeframe.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nVery well. I shall continue to leave it off the balance sheet. It will not be missed, until it is.\n\nRegards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThe terminal\'s standing has improved. I cannot measure it precisely, but I notice that people have stopped asking me about it.\n\nThat is the best result I could ask for.\n\nRegards,\n{from}',
                failed: "Dear {formal},\n\nThe terminal's reputation has not improved. I have written it down as 'unchanged', which is the kindest word available.\n\nRegards,\n{from}",
            },
        ],
        upgradeDev: [
            {
                id: 'cfo-return-on-investment',
                subject: 'Return on Investment',
                body: "Dear {formal},\n\nI have been reviewing our assets. A development that is never improved is, in my profession, called a liability.\n\nPlease upgrade a development and let us see what a little capital can do. I expect a modest but respectable return.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will see which upgrades are worthwhile.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI do not believe further capital spending is justified at this time.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNoted. Capital left idle earns nothing. I shall mention it at the next meeting, in a neutral tone.\n\nRegards,\n{from}',
                fulfilled: "Dear {formal},\n\nThe upgrades are complete, and the return looks favourable. I shall describe it as 'prudent'.\n\nFrom me, that is a compliment.\n\nRegards,\n{from}",
                failed: "Dear {formal},\n\nNo upgrades were made, and the capital remains idle. I have noted this in the margin, where I keep such things.\n\nRegards,\n{from}",
            },
        ],
        schedule: [
            {
                id: 'cfo-revenue-events',
                target: 2,
                subject: 'Revenue Events',
                body: "Dear {formal},\n\nI have been reviewing the timetable. Every departure is, in my terms, a revenue event, and there are fewer of them than I would like.\n\nPlease add {n} more {loop|loops} to the timetable. Our costs do not change with the timetable, but our income does.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will add the departures to the timetable.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot commit to further timetable changes in this timeframe.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNoted. The timetable will remain as it is, and so will the revenue it produces.\n\nRegards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThe new departures are in the timetable. More revenue events, as I like to call them. I have revised the forecast upwards, for once.\n\nRegards,\n{from}',
                failed: 'Dear {formal},\n\nThe timetable is unchanged, and so is the forecast. I had hoped to revise it upwards.\n\nRegards,\n{from}',
            },
        ],
        rankUp: [
            {
                id: 'cfo-investor-confidence',
                subject: 'Investor Confidence',
                body: "Dear {formal},\n\nInvestors like numbers that only go up, and rank is the easiest of them to put in a presentation.\n\nI would be grateful if you could take the terminal up a rank. It makes the slide look so much better.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will see to it that the terminal moves up a rank.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot promise a promotion in this timeframe. Rank is earned, not scheduled.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nVery well. The slide will have to remain as it is. I shall describe it as 'stable'.\n\nRegards,\n{from}",
                fulfilled: 'Dear {formal},\n\nThe terminal has moved up a rank. The slide looks much better, and the investors nodded twice. I counted.\n\nRegards,\n{from}',
                failed: "Dear {formal},\n\nThe terminal has not moved up a rank. I have described the slide as 'stable', which is what one calls a number that has stopped going up.\n\nRegards,\n{from}",
            },
        ],
        connectCities: [
            {
                id: 'cfo-new-markets',
                target: 2,
                subject: 'New Markets',
                body: "Dear {formal},\n\nOur network has a finite number of destinations, and every new one is a new market. I have yet to meet a market that did not, eventually, produce a profit.\n\nPlease connect {n} more cities to the network. I would call it expansion. The board would call it growth.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will connect the new cities.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot commit to expansion in this timeframe. New markets take time.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNoted. The network will stay as it is, and so will the market. I shall not pretend to be surprised.\n\nRegards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThe new cities are connected. New markets, new passengers and, in time, new line items. The board will be pleased, though it will not say so.\n\nRegards,\n{from}',
                failed: "Dear {formal},\n\nThe network has not grown. A market that is not entered belongs to someone else. I have recorded it under 'opportunities'.\n\nRegards,\n{from}",
            },
        ],
        work: [
            {
                id: 'cfo-billable-hours',
                target: 150,
                subject: 'Billable Hours',
                body: "Dear {formal},\n\nI have noticed that the terminal earns more when its manager is at the desk. I would like the numbers to confirm it.\n\nI would be grateful if you could put in some hands-on work. Consider it a low-cost investment with a reliable return.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will put in the time.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI am afraid my time is better spent elsewhere in this timeframe.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nVery well. I shall record your time as 'allocated elsewhere'. It is the kindest phrase I know.\n\nRegards,\n{from}",
                fulfilled: 'Dear {formal},\n\nThe hours have been logged, and the terminal duly earned while you worked. I did say it would.\n\nRegards,\n{from}',
                failed: 'Dear {formal},\n\nNo hours were logged. The terminal, I am sorry to report, earned nothing extra from your absence.\n\nRegards,\n{from}',
            },
        ],
    },
    assistant: {
        schedule: [
            {
                id: 'assistant-tidy-timetable',
                target: 2,
                subject: 'So sorry to bother you',
                body: "Dear {formal},\n\nI'm so sorry to bother you. I know how busy you are, and I would never normally dare. Please feel free to ignore this entirely. (Please don't ignore it entirely.)\n\nI was tidying the timetable, only because it needed tidying, and I noticed a few gaps. Would you perhaps, if it's not too much trouble, add {n} more {loop|loops}? I'm so sorry. I'll make tea.\n\nVery respectfully,\n{from}",
                agree: 'Dear {from},\n\nThank you for letting me know. I will add the departures to the timetable.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks, but I cannot add more departures at the moment.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nOh. Of course. No, that's absolutely fine. I'm so sorry I asked. I'll just, um, put the kettle on.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nYou did it! I mean, of course you did. I never doubted you. Not that I would have dared to.\n\nThe timetable looks wonderful. I'm going to go and lie down.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nPlease don't worry about the timetable. It's absolutely not a problem. I'll simply tell people it was always like that.\n\nI hope that's alright. Please don't be cross.\n\nVery respectfully,\n{from}",
            },
        ],
        build: [
            {
                id: 'assistant-enterprise',
                category: 'Enterprise',
                subject: 'A small suggestion (sorry)',
                body: "Dear {formal},\n\nI hope this finds you well. I'm so sorry to mention it, but a few people have been saying that not much has happened on the company side of things recently. Not me! I would never say that. I wouldn't dare.\n\nI just thought, very quietly, that a new business venture might, um, quiet them down. If you wanted. Only if you wanted. Sorry.\n\nVery respectfully,\n{from}",
                agree: 'Dear {from},\n\nGood idea. I will look into starting a new business venture.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the suggestion, but we will not be starting a new business venture right now.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nOf course! Absolutely. I'll tell them you have big plans. Very big. Please don't ask me what they are.\n\nI'm so sorry.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nThe new venture is wonderful. Everyone who was complaining has gone very quiet. Not that I was ever one of them. I wasn't.\n\nI'll be at my desk. Being very quiet too.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nPeople are still saying not much has happened on the company side. I told them you have plans. They asked what plans. I said I wasn't sure.\n\nPlease don't be cross. I'll try to sound more confident next time.\n\nVery respectfully,\n{from}",
            },
        ],
        work: [
            {
                id: 'assistant-diary',
                target: 100,
                subject: 'Your diary (sorry)',
                body: "Dear {formal},\n\nI'm so sorry to bother you again. I was going through your diary and noticed there's quite a lot of, um, free time in it. Not that I'm saying you're not busy! You're obviously extremely busy doing very important things. I wouldn't dare suggest otherwise.\n\nI just thought that, if you happened to have a spare moment, some hands-on work at the desk might look good in the report. Only if you want to. I'll put it in your diary in pencil.\n\nVery respectfully,\n{from}",
                agree: 'Dear {from},\n\nThanks for noticing. I will put some time in at the desk.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nI have other priorities in this timeframe, so I will have to pass.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nOf course! Absolutely! You're very busy. I'll rub out the pencil. And I'll never mention it again. Sorry.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nI saw the report and it says you've been working! I'm so proud. I mean, not that I'm in any position to be proud of you. Sorry.\n\nI've put it in your diary in pen.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nThe report is in and, um, it says very little about the desk. Please don't worry! I've written 'busy elsewhere', which I'm sure is true.\n\nI hope that was alright. I panicked.\n\nVery respectfully,\n{from}",
            },
        ],
        rename: [
            {
                id: 'assistant-names',
                target: 2,
                subject: 'Names (sorry)',
                body: "Dear {formal},\n\nI'm so sorry to ask. I've been trying to write the developments in your diary and I keep mixing them up. I've been calling them 'the big one' and 'the other one', which is very unprofessional of me.\n\nWould you perhaps give {n} of them a proper name? It would help me enormously. Please don't think I'm complaining. I'd never.\n\nVery respectfully,\n{from}",
                agree: 'Dear {from},\n\nThanks for letting me know. I will give some developments new names to make things easier.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks, but I cannot rename developments at the moment.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nOf course! No, 'the big one' is a perfectly good name. I'm so sorry I brought it up.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nThe new names are wonderful! I can finally tell them apart. I nearly didn't cry. I mean, I did. A little. Please don't tell anyone.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nI'm still calling them 'the big one' and 'the other one'. It's fine. Honestly, it's growing on me.\n\nI'm so sorry.\n\nVery respectfully,\n{from}",
            },
        ],
        rep: [
            {
                id: 'assistant-overheard',
                subject: 'Something I overheard',
                body: "Dear {formal},\n\nI'm so sorry to mention this. I overheard some people by the coffee machine talking about the terminal's reputation. They weren't talking about you! Not specifically. I'd never let them.\n\nI just thought, very quietly, that a little more Reputation might, um, give them something else to talk about. Like the weather.\n\nVery respectfully,\n{from}",
                agree: 'Dear {from},\n\nThanks for the heads up. I will work on improving our reputation.\n\nBest,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks, but I cannot promise to improve our reputation in this timeframe.\n\nBest regards,\n{fullName}',
                refused: "Dear {formal},\n\nOf course! The weather is lovely anyway. I'll just keep, um, listening. Not that I listen. Sorry.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nThe people by the coffee machine have stopped talking about reputation. They're talking about the weather now. It's a miracle. Thank you.\n\nI'm going to go and sit down.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nThey're still talking by the coffee machine. I pretended to be busy with the photocopier. I don't think it worked.\n\nI'm so sorry.\n\nVery respectfully,\n{from}",
            },
        ],
        cash: [
            {
                id: 'assistant-finance',
                subject: 'The figures (sorry)',
                body: "Dear {formal},\n\nI'm so sorry to bother you. The finance department keeps sending me very polite emails about the figures, which is somehow worse than rude ones.\n\nI wondered, if it's not too much trouble, whether the terminal might earn {n}? It would make my inbox a lot quieter. I'm so sorry. I'll leave you to it.\n\nVery respectfully,\n{from}",
                agree: "Dear {from},\n\nThanks for letting me know. I'll see that the terminal earns that.\n\nBest,\n{fullName}",
                refuse: "Dear {from},\n\nThanks, but I cannot promise those figures in this timeframe.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nOf course! No, that's fine. I'll tell finance you're 'considering it'. I'll say it very confidently. Sorry.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nFinance sent me a thank-you. A thank-you! I've never had one. I've put it in a frame. Please don't tell them.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nFinance has sent me another very polite email. I've decided not to open it. It's been sitting there since this morning. I think it knows.\n\nVery respectfully,\n{from}",
            },
        ],
        upgradeCity: [
            {
                id: 'assistant-tired-lines',
                target: 2,
                subject: 'The lines (sorry)',
                body: "Dear {formal},\n\nI was looking at the map of the lines and, um, some of them look a little tired. Not that it's your fault! Lines get tired. I know the feeling.\n\nWould you perhaps upgrade a city's line {n} times? Only if it's not too much trouble. I'll stand over there, out of the way.\n\nVery respectfully,\n{from}",
                agree: "Dear {from},\n\nThanks. I'll look at upgrading some lines.\n\nBest,\n{fullName}",
                refuse: "Dear {from},\n\nThanks, but I cannot upgrade any lines at the moment.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nOf course! The lines are, um, resting. It's a very good word for it. I'm so sorry.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\nThe lines look wonderful. Much less tired. I feel less tired too, just looking at them. Thank you.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nThe lines are still tired. It's fine. We all are. I've put a little note on the map. It says 'sorry'.\n\nVery respectfully,\n{from}",
            },
        ],
        connectContinent: [
            {
                id: 'assistant-new-continent',
                subject: 'Somewhere new (sorry)',
                body: "Dear {formal},\n\nI'm so sorry to ask, but a few people have asked me whether the terminal will ever reach {continent}. I said I'd check with you. I haven't. I was too nervous to knock, so I'm asking by email, which feels safer.\n\nWould you perhaps consider connecting a new city in {continent}? Only if it fits with your plans. You must have so many plans.\n\nVery respectfully,\n{from}",
                agree: "Dear {from},\n\nThanks for asking. I will connect a new city in {continent}.\n\nBest,\n{fullName}",
                refuse: "Dear {from},\n\nThanks, but we are not expanding into {continent} right now.\n\nBest regards,\n{fullName}",
                refused: "Dear {formal},\n\nOf course! I'll tell them you're 'thinking about it'. I'll say it very quickly, and then leave. Sorry.\n\nVery respectfully,\n{from}",
                fulfilled: "Dear {formal},\n\n{continent}! You really did it! I told them, and one of them said 'wow'. Out loud. To me.\n\nI'm going to need a moment. Thank you.\n\nVery respectfully,\n{from}",
                failed: "Dear {formal},\n\nI had to tell them that {continent} isn't happening yet. They were very nice about it, which was worse.\n\nI think I'm going to hide in the stationery cupboard for a bit. Sorry.\n\nVery respectfully,\n{from}",
            },
        ],
    },
    lawyer: {
        connectTier3: [
            {
                id: 'lawyer-tier-three',
                target: 1,
                subject: 'A Tier 3 city',
                body: "Dear {formal},\n\nI will be direct, as it saves us both time. The terminal would be in a much stronger position with a Tier 3 city on the network, and I would like you to connect one.\n\nI appreciate that it is a significant step, and I would not ask if I did not think it was worthwhile.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so clear. I will connect a Tier 3 city.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate you being direct, but I cannot take on a Tier 3 city right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for being clear with me. It is your decision to make. I will raise it again when the time is better.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThat is excellent. A Tier 3 city is a real asset, and I am grateful you made the time.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nI see the Tier 3 city has not been connected. I will not dwell on it, but I would like you to know that it was a missed opportunity.\n\nKind regards,\n{from}',
            },
        ],
        build: [
            {
                id: 'lawyer-service-developments',
                category: 'Service',
                target: 2,
                subject: 'Service developments',
                body: "Dear {formal},\n\nI will get straight to the point. The terminal needs more service developments, and I would like you to build two.\n\nPeople rely on these services far more than they tend to notice, and I would rather we get ahead of that than be asked about it afterwards.\n\nThank you for hearing me out.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so straightforward. I will build two Service developments.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate you raising it, but I cannot build more Service developments at the moment.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for a clear answer. I would only ask that you reconsider before it becomes pressing.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThank you. The new service developments are exactly what I had in mind, and I appreciate how quickly you moved.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nThe service developments were not built in time. I will not make a fuss, but I did say it was worth doing.\n\nKind regards,\n{from}',
            },
        ],
        upgradeDev: [
            {
                id: 'lawyer-development-upgrades',
                target: 2,
                subject: 'Upgrading our developments',
                body: "Dear {formal},\n\nI will be upfront: several of our developments have been left as they were for some time, and I would like you to upgrade two of them.\n\nI would sooner we looked after what we already own than had to explain why we did not.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so clear. I will upgrade two developments.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate you raising it, but I cannot upgrade developments at the moment.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for being plain with me. I would only ask that you keep it in mind.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThank you. The upgrades are exactly what I hoped for, and I am glad we did not leave it any longer.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nThe developments were not upgraded in time. I will not labour the point, but I did say it mattered.\n\nKind regards,\n{from}',
            },
        ],
        rankUp: [
            {
                id: 'lawyer-moving-up',
                subject: 'Moving up',
                body: "Dear {formal},\n\nI will say this plainly: the terminal is ready for a higher rank, and I would like you to take it up one.\n\nA higher rank carries more weight with everyone we deal with, and I would rather we had it than needed it.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so direct. I will take the terminal up a rank.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate you saying so, but I cannot take the terminal up a rank just now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for a straight answer. I will raise it again when the timing is better.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nCongratulations on the new rank. I am pleased, and I think it will serve us well.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nThe terminal has not moved up a rank. I will not press the matter, but it was an opportunity worth taking.\n\nKind regards,\n{from}',
            },
        ],
        holdRep: [
            {
                id: 'lawyer-reputation-floor',
                subject: 'Our reputation',
                body: "Dear {formal},\n\nI will be upfront about my concern: reputation is far easier to lose than to rebuild, and the terminal's is worth protecting.\n\nI would like you to maintain a high reputation for the meantime. Nothing needs doing beyond avoiding anything that would bring it down.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so clear. I will try and maintain our reputation.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the concern, but I cannot make any promises.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for being honest. I would only ask that you take care with it regardless.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThank you. Our reputation held, and I am grateful for the care you took with it.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nOur reputation fell quite a bit. I will not lecture you, but it is exactly what I hoped to avoid.\n\nKind regards,\n{from}',
            },
        ],
        rep: [
            {
                id: 'lawyer-building-our-standing',
                subject: 'Building our standing',
                body: "Dear {formal},\n\nI will be direct: our standing with the public could be stronger, and I would like you to do something about it.\n\nGood standing is worth far more than it costs, and I would rather we had it before we needed it.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so clear. I will do what I can.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate you raising it, but I cannot take that on at the moment.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for being straightforward. I will raise it again when the time is better.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThank you. Our standing is noticeably stronger, and I am grateful for the effort.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nWe did not redeem ourselves here. I will not dwell on it.\n\nKind regards,\n{from}',
            },
        ],
        holdCash: [
            {
                id: 'lawyer-cash-reserve',
                subject: 'A cash reserve',
                body: "Dear {formal},\n\nI will be direct: I would like the terminal to keep a cash reserve. Legal costs have a habit of arriving at the least convenient moment.\n\nCould you please keep at least {n} in the bank for the time being? You are welcome to spend whatever lies above it.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for being so clear. I will keep at least {n} in the bank.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the caution, but I cannot commit to holding that much back.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for a straight answer. I only hope the money is well spent.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThank you. The reserve stayed in place, and I will sleep a little better for it.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nThe balance dropped below {n}. I will not press the point, but a reserve is only useful if it is there when needed.\n\nKind regards,\n{from}',
            },
        ],
        clearInbox: [
            {
                id: 'lawyer-unanswered-correspondence',
                subject: 'Unanswered correspondence',
                body: "Dear {formal},\n\nI will be upfront: there {is|are} {n} {email|emails} waiting for an answer in your inbox, and unanswered correspondence has a way of becoming a problem.\n\nI would be grateful if you would reply to {it|them all}, whichever way you decide.\n\nKind regards,\n{from}",
                agree: 'Dear {from},\n\nThank you for raising it. I will answer my emails.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the reminder, but I would rather deal with my inbox in my own time.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood, and thank you for being frank. I will leave you to it.\n\nKind regards,\n{from}',
                fulfilled: 'Dear {formal},\n\nThank you. A clear inbox is a great comfort to me, and I am glad you took the time.\n\nKind regards,\n{from}',
                failed: 'Dear {formal},\n\nThe emails were not answered in time. I will not dwell on it, but I did ask.\n\nKind regards,\n{from}',
            },
        ],
    },
    marketing: {
        greet: [
            {
                id: 'marketing-first-impressions',
                target: 3,
                subject: 'First impressions!',
                body: "Dear {formal},\n\nBig news, and I want us to move the needle on this: our passengers' first impression of the terminal is our brand, and right now we are leaving it to chance!\n\nCould you greet the arriving passengers {n} times? A warm welcome is the best advertising there is, and it costs us nothing. Think of the buzz!\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nLove the energy! I will greet the passengers {n} times.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the enthusiasm, but I cannot make time for greetings right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem at all, we will circle back to this! I still think a friendly welcome could be huge for us.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! Those greetings are going straight into the deck. Our passengers will be telling everyone!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe greetings did not happen in time, but let us not worry! We will pivot and try again soon.\n\nOnwards and upwards,\n{from}',
            },
        ],
        like: [
            {
                id: 'marketing-engagement',
                target: 5,
                subject: 'Engagement is everything',
                body: "Dear {formal},\n\nCircling back with a quick win for the brand: our Hyper-Link presence is live, and the audience is ready to engage!\n\nCould you like {n} Hyper-Link posts? Nothing says we are listening like a bit of love in the feed. It would really elevate us.\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nHappy to help! I will like {n} Hyper-Link posts.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the idea, but I cannot spend time on Hyper-Link right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! The feed will still be there when you are ready.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! The engagement numbers are looking great, and the feed is buzzing. Thank you!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe feed did not get its likes in time, but let us not dwell on it! We will pivot.\n\nOnwards and upwards,\n{from}',
            },
        ],
        shop: [
            {
                id: 'marketing-design-overhaul',
                subject: 'Time for a design overhaul!',
                ask: 'buy something new to freshen up the terminal',
                body: "Dear {formal},\n\nBig news: the terminal needs a design overhaul! The brand is only as strong as it feels, and right now everything feels a little, shall we say, classic.\n\nCould you pick up something new to freshen things up? A new sound, a new look, anything with a bit more personality. Spend a little, and let us see the difference. Think of the buzz!\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nLove it! I will pick up something to freshen things up.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the idea, but I would rather keep things as they are for now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! Classic never goes out of style, right?\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! The new look is exactly what the brand needed. It already feels so much fresher!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe overhaul did not happen in time, but let us not worry! We will pivot and try again soon.\n\nOnwards and upwards,\n{from}',
            },
        ],
        rename: [
            {
                id: 'marketing-rebrand',
                target: 2,
                subject: 'A fresh new look',
                body: "Dear {formal},\n\nBig news: it is time for a refresh! Names are the heart of any brand, and a few of our developments are overdue for something with a bit more personality.\n\nCould you rename {n} developments? Something memorable, something people will talk about. Think of the buzz!\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nLove a refresh! I will rename {n} developments.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the idea, but I would rather leave the names as they are.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! The old names still have their charm.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! Those new names are fantastic, and the whole terminal feels fresh. Thank you!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe rebrand did not land in time, but let us not worry! We will regroup and pivot.\n\nOnwards and upwards,\n{from}',
            },
        ],
        farewell: [
            {
                id: 'marketing-lasting-impressions',
                target: 3,
                subject: 'Leave them wanting more',
                body: "Dear {formal},\n\nHere is a thought I cannot shake: people remember how a visit ends far more than how it begins. A great goodbye is the best advertising we have, and it costs us nothing!\n\nCould you say farewell to the departing passengers {n} times? Let us send them off with a smile, and they will be back and telling everyone they know.\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nLove it! I will say farewell to the passengers {n} times.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the thought, but I cannot make time for farewells right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! A good goodbye will still be worth it another day.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! Those send-offs are exactly what I had in mind. Our passengers will be back before we know it!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe farewells did not happen in time, but let us not worry! We will pivot and try again soon.\n\nOnwards and upwards,\n{from}',
            },
        ],
        rep: [
            {
                id: 'marketing-brand-awareness',
                subject: 'Getting the word out',
                body: "Dear {formal},\n\nCircling back with a quick win for the brand: awareness is the engine of everything we do, and our Reputation is the best measure of it we have!\n\nCould you earn {n} Reputation for the terminal? Every bit of it means more people know who we are. It would really elevate us.\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nHappy to help! I will earn the {n} Reputation.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the push, but I cannot take that on right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! The word will get out in its own time.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! The awareness numbers are looking brilliant, and it is all down to you. Thank you!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe Reputation did not come in time, but let us not dwell on it! We will pivot and go again.\n\nOnwards and upwards,\n{from}',
            },
        ],
        work: [
            {
                id: 'marketing-hands-on',
                target: 100,
                subject: 'Leading from the front',
                body: "Dear {formal},\n\nBig news: the best campaigns are led from the front! People notice when the person at the top gets stuck in, and the whole terminal feels the energy.\n\nCould you roll up your sleeves and click Work {n} times? A little hands-on effort goes a very long way. Think of the buzz!\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nLove the energy! I will click Work {n} times.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nThanks for the thought, but I am not able to put in the time for that right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! The energy will still be there when you are ready.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! That is what leading from the front looks like. The whole terminal is buzzing!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe work did not get done in time, but let us not worry! We will pivot and try again soon.\n\nOnwards and upwards,\n{from}',
            },
        ],
        connectTier3: [
            {
                id: 'marketing-big-name-city',
                target: 1,
                subject: 'A headline destination',
                body: "Dear {formal},\n\nBig news, and I want us to move the needle on this: nothing gets people talking like a big-name destination, and a Tier 3 city is exactly that!\n\nCould you connect a new Tier 3 city to the network? It would be a headline for our brand, and I already have the launch ideas ready. Think of the buzz!\n\nOnwards and upwards,\n{from}",
                agree: 'Dear {from},\n\nNow that is a headline! I will connect a Tier 3 city.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nLove the ambition, but I cannot take on a Tier 3 city right now.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nNo problem, we will circle back to this! A destination like that will still be big news when the time is right.\n\nOnwards and upwards,\n{from}',
                fulfilled: 'Dear {formal},\n\nSmashed it! A new Tier 3 city is going straight on the front of the deck. Everyone will be talking about it!\n\nOnwards and upwards,\n{from}',
                failed: 'Dear {formal},\n\nThe new city did not connect in time, but let us not worry! We will pivot and make it happen soon.\n\nOnwards and upwards,\n{from}',
            },
        ],
    },
    journalist: {
        cash: [
            {
                id: 'journalist-the-figures',
                subject: 'A few figures, if I may',
                body: "Dear {formal},\n\nI am putting together a piece on the terminal, and I have a few questions. First of all, how much do you actually take home from all this? Sorry, that is far too personal. Please ignore it.\n\nWhat I can ask, professionally, is whether you could earn {n} for the terminal. People will want to know it can be done, and I would love to be able to say so. And is it true you check the balance before breakfast? No, no, forget I said that.\n\nLooking forward to hearing from you,\n{from}",
                agree: 'Dear {from},\n\nI will earn {n} for the terminal. And no, I will not be telling you what I do before breakfast.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot promise {n} right now, and my breakfast routine is my own business.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nA no. Might I ask what is behind it? Actually, never mind, that is not my business at all.\n\nLooking forward to hearing from you,\n{from}',
                fulfilled: 'Dear {formal},\n\nYou did it! How does it feel? Did you celebrate? Please ignore that, I am getting ahead of myself.\n\nLooking forward to hearing from you,\n{from}',
                failed: 'Dear {formal},\n\nThe figure was not reached. Was it the numbers, or something more personal? Forget the second part, I should not have asked.\n\nLooking forward to hearing from you,\n{from}',
            },
        ],
        connectCities: [
            {
                id: 'journalist-expansion',
                target: 3,
                subject: 'Expansion plans?',
                body: "Dear {formal},\n\nI hear the terminal is growing, which makes me wonder: is it true you cannot sleep until the map looks complete? Oh dear, that came out wrong. Please strike it from the record.\n\nPurely professionally, could you connect {n} new cities to the network? A story like that needs a bigger map, and I would love to tell it. Is it also true that you have already chosen them? No, no, never mind.\n\nLooking forward to hearing from you,\n{from}",
                agree: 'Dear {from},\n\nI will connect {n} new cities. And I am not telling you whether I have chosen them yet.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot take on {n} new cities right now, and my sleeping habits are my own business.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nA no, then. Is the map really so complete? Forget I asked, I have no right to.\n\nLooking forward to hearing from you,\n{from}',
                fulfilled: 'Dear {formal},\n\nThree new cities! Was it a long-held dream, or a sudden whim? Please pretend I did not ask. Wonderful news.\n\nLooking forward to hearing from you,\n{from}',
                failed: 'Dear {formal},\n\nThe cities were not connected in time. Was something holding you back? Or someone? I should not have said that.\n\nLooking forward to hearing from you,\n{from}',
            },
        ],
        upgradeDevCategory: [
            {
                id: 'journalist-service-desk',
                target: 1,
                category: 'Service',
                subject: 'Behind the service desk',
                body: "Dear {formal},\n\nA little bird tells me the Service side of the terminal looks a bit tired. Who was the little bird? I cannot say. Was it you? Forgive me, that was unfair, please disregard it.\n\nWhat I can ask is whether you could upgrade a Service development. I would like to write that someone is looking after the people who look after everyone else. And do you actually use the services yourself? No, never mind, that is none of my business.\n\nLooking forward to hearing from you,\n{from}",
                agree: 'Dear {from},\n\nI will upgrade a Service development. And whether I use the services myself is my own business.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI cannot upgrade a Service development right now, and I will not be naming any little birds.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood. Is it the cost, or the principle? Forget I asked, it is not my place.\n\nLooking forward to hearing from you,\n{from}',
                fulfilled: 'Dear {formal},\n\nThe Service side has been upgraded. Is that guilt I hear, or pride? Please ignore that. A lovely story, thank you.\n\nLooking forward to hearing from you,\n{from}',
                failed: 'Dear {formal},\n\nThe Service development was not upgraded in time. Were you perhaps too busy? Or too embarrassed? I should not have asked.\n\nLooking forward to hearing from you,\n{from}',
            },
        ],
        negativeEvents: [
            {
                id: 'journalist-bad-days',
                target: 2,
                subject: 'When things go wrong',
                body: "Dear {formal},\n\nI am writing about how terminals cope when things go wrong, and I would love to hear how you handle it. Is it true that you go quiet and stare out of the window? Sorry, that is far too personal. Please ignore it.\n\nIf you were to live through {n} negative events at the terminal, would you be willing to tell me how it went? Honest stories are the best ones. And do your hands shake, at all? No, no, forget I said that.\n\nLooking forward to hearing from you,\n{from}",
                agree: 'Dear {from},\n\nVery well. If {n} negative events come along, I will tell you how it went. My hands are not your concern.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI would rather not promise to live through bad events for a story, and my window-staring is my own business.\n\nBest regards,\n{fullName}',
                refused: 'Dear {formal},\n\nUnderstood. Perhaps it was too much to ask. Were you afraid it might go badly? Forget I said that.\n\nLooking forward to hearing from you,\n{from}',
                fulfilled: 'Dear {formal},\n\nYou came through two bad events. How are you holding up? Are you sleeping? Sorry, not my place. A wonderful story, thank you.\n\nLooking forward to hearing from you,\n{from}',
                failed: 'Dear {formal},\n\nTwo bad days did not come. Lucky, or is there something you are not telling me? Please forget I asked.\n\nLooking forward to hearing from you,\n{from}',
            },
        ],
    },
    public: {
    },
}

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
// While you are still writing, you can make the game send ONLY the emails written here (nothing from the built-in wording).
// Set this to true once you want that; requests with no email written for them are then never sent.
export const ONLY_WRITTEN = false

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
                body: "Dear {formal},\n\nI have been going through the books and could not help noticing how little we spend on ourselves.\n\nA modest purchase from the Shop would show confidence in our own product. I would call it an expense. The accountants would call it a justified expense.\n\nRegards,\n{from}",
                agree: 'Dear {from},\n\nUnderstood. I will make a purchase from the Shop.\n\nBest regards,\n{fullName}',
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
    },
    public: {
    },
}

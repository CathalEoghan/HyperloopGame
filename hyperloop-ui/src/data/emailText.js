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
            {
                id: 'inspector-shopping',
                category: 'Shopping',
                target: 3,
                subject: 'Shopping Area Standards',
                body: "Dear Manager,\n\nGood day to you! I was looking at your shops and, honestly, I was feline a little let down. 🐱 A few of them need some serious TLC before they meet our standards.\n\nPlease give three of them a proper makeover before my next visit. A clean shop is a happy shop, and happy shops are PURRfectly profitable!\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you for the feedback. I will see that three of our shops are improved.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the suggestion, but I cannot commit to renovating the shops at the moment.\n\nBest regards,\n{fullName}',
                refused: "Dear Manager,\n\nOh, what a shame! I was so hopeful. I have made a note on the report, and I'll be keeping a close eye on those shops.\n\nBest wishes,\n{from}",
                failed: "Dear Manager,\n\nOh dear, those shops are still not up to scratch. I did so want to give you a glowing report. I'm afraid I must mark this one down.\n\nBest wishes,\n{from}",
                fulfilled: 'Dear Manager,\n\nMarvellous! Those shops are positively gleaming. Thank you for taking my advice so seriously. 🐱\n\nUntil my next visit!\n\nBest wishes,\n{from}',
            },
            {
                id: 'inspector-service',
                category: 'Service',
                target: 3,
                subject: 'Service Area Standards',
                body: "Dear Manager,\n\nHello, hello! I do hope your day is going swimmingly. Mine would be even better with a nice cup of tea and a tidy terminal! ☕\n\nNow, on to business. I took a good look at your service areas on my last inspection and, I'm sorry to say, a few of them are not quite up to scratch. Service is the heart of any terminal, and standards simply must be paw-sitively consistent.\n\nPlease give three of them some proper attention before my next visit. I know you can pull it off!\n\nBest wishes,\n{from}",
                agree: 'Dear {from},\n\nThank you for letting me know. I will make sure three of our service areas are improved.\n\nBest regards,\n{fullName}',
                refuse: 'Dear {from},\n\nI appreciate the advice, but I am unable to take on these improvements at the moment.\n\nBest regards,\n{fullName}',
                refused: 'Dear Manager,\n\nOh dear. I did so hope you would say yes. I have noted it in the report, and I will be keeping an eye on those service areas.\n\nBest wishes,\n{from}',
                failed: "Dear Manager,\n\nI'm afraid those service areas are still not up to my standards. I really wanted to give you a glowing report, but I must mark this one down.\n\nBest wishes,\n{from}",
                fulfilled: 'Dear Manager,\n\nWonderful! Your service areas are now a credit to the terminal. Thank you for taking my advice so seriously. 🐱\n\nUntil my next visit!\n\nBest wishes,\n{from}',
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
    },
    complainer: {
        build: [
            {
                id: 'complainer-restaurants',
                category: 'Food',
                target: 3,
                subject: 'Not enough restaurants!!',
                body: "Dear Manager,\n\nThis is, like, unacceptable. I have been travelling through this terminal a few times and am just stunned at how little food restaurants there are.\n\nI was told to speak to the manager and that's exactly what I'm doing! I'm so close to leaving a negative review for this place online.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. We take all customer concerns very seriously. I'm happy to share that several new food developments are on their way to the terminal!\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your email. There are currently no plans to develop any more restaurants within the terminal.\n\nBest regards,\n{fullName}",
                refused: "MANAGER.\n\nAre you serious?! This is like, so UNACCEPTABLE. WHAT THE HELL?\n\nOkay. Trying to calm down. Do you have a supervisor?\n\n{from}",
                fulfilled: "Dear Manager,\n\nI've noticed some more restaurants around. Good. But I just wanted to pass on that some of the staff working there have pretty bad attitudes.\n\nOne girl told me the customer isn't automatically always in the right? I want her fired.\n\nBest,\n{from}",
                failed: "Dear Manager,\n\nEnjoy reading my most recent negative review.\n\nBest,\n{from}",
            },
        ],
        connectCities: [
            {
                id: 'complainer-connections',
                target: 2,
                subject: 'Is this ALL you have??',
                body: "Dear Manager,\n\nSo I'm, like, standing at the board looking at where I can go and it's the SAME cities as last time?! I have been to every single one of them. Twice. Is that really all this terminal has to offer?!\n\nI want somewhere new. Connect {n} more cities and I might not tell everyone I know how boring it is here.\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for getting in touch, and I'm sorry for the inconvenience. We are working on connecting more cities to the terminal and will have them running soon.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. Unfortunately we can't promise any new connections in that timeframe.\n\nBest regards,\n{fullName}",
                refused: "Dear Manager,\n\nUm, excuse me?? You can't promise ANYTHING? I'm literally a paying customer here!\n\nI'm telling everyone. Every. Single. Person. I'm not even joking.\n\n{from}",
                fulfilled: "Dear Manager,\n\nOkay. I saw the new connections on the board. That's, like, fine, I guess.\n\nBut why is the board so BRIGHT? I got a headache reading it. Can someone look into that?\n\nBest,\n{from}",
                failed: "Dear Manager,\n\nStill nothing. I waited and waited and there is still no way to get where I'm going.\n\nI've just posted five stars. Kidding. It was ONE. And it's a long review.\n\nBest,\n{from}",
            },
        ],
        greet: [
            {
                id: 'complainer-no-welcome',
                target: 3,
                subject: 'Nobody even said HELLO',
                body: "Dear Manager,\n\nI arrived at your terminal this morning and NOBODY said hello. I stood there for, like, a whole minute. Where is the customer service?!\n\nI'm not asking for a parade. But a welcome would have been nice. Is that really too much?\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email, and I'm sorry you weren't made to feel welcome. I'll see what I can do.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I'm afraid we can't guarantee a greeting for every arrival.\n\nBest regards,\n{fullName}",
                refused: "Dear Manager,\n\nYou can't guarantee a HELLO?! It's one word! It's not even a long word!\n\nI'm writing this down. In pen.\n\n{from}",
                fulfilled: "Dear Manager,\n\nI saw you say hello to me this morning. Fine. Good.\n\nBut you said it THREE times to the same person, and it was, like, really loud. Is that necessary? I was trying to enjoy my coffee.\n\nBest,\n{from}",
                failed: "Dear Manager,\n\nNobody said hello again. I have put a note in your suggestions box.\n\nThe note says 'hello'.\n\nBest,\n{from}",
            },
        ],
        like: [
            {
                id: 'complainer-no-likes',
                target: 3,
                subject: 'My post has ZERO likes',
                body: "Dear Manager,\n\nI posted about my experience at your terminal on Hyper-Link, and it has, like, ZERO likes. Zero! Do people not care about customer feedback?!\n\nI would like to see you take an interest in what people are saying. It's the least you can do.\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for your email. Your feedback matters to us, and I'll make sure to spend some time on Hyper-Link.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I'm afraid I can't promise to like anything on request.\n\nBest regards,\n{fullName}",
                refused: "Dear Manager,\n\nSo you're ignoring my post AND my email? That's, like, two ways of ignoring me!\n\nI'm going to post about THIS too.\n\n{from}",
                fulfilled: "Dear Manager,\n\nI see you've been liking things on Hyper-Link. Good. But the fact I had to ask you to do it is horrible. Do better.\n\nBest,\n{from}",
                failed: "Dear Manager,\n\nMy post now has one like. It's from my mum.\n\nI hope you're proud of yourself.\n\nBest,\n{from}",
            },
        ],
        work: [
            {
                id: 'complainer-lazy-staff',
                target: 150,
                subject: 'Do you EVER work?!',
                body: "Dear Manager,\n\nI was told to speak to the manager, so I went looking for you. And what were you doing? NOTHING. Just sitting there. For ten whole minutes. I timed it.\n\nIs this a terminal or a waiting room?! Get to work. Properly.\n\nYou have {time}.\n\nRegards.\n{from}",
                agree: "Dear {from},\n\nThank you for bringing this to my attention, and I apologise. I'll get straight back to work.\n\nAll the best,\n{fullName}",
                refuse: "Dear {from},\n\nThanks for your feedback. I work very hard, and I can't make any promises about what you saw.\n\nBest regards,\n{fullName}",
                refused: "Dear Manager,\n\nSo you're saying I'm LYING?! I have, like, photos. Okay I don't have photos. But I have a very good memory.\n\nI know what I saw. You. Doing nothing.\n\n{from}",
                fulfilled: "Dear Manager,\n\nI see you've been working. Good. I can't fault it.\n\nBut now you're so BUSY that you won't talk to me. I came to complain and was told to wait. Wait! Me!\n\nBest,\n{from}",
                failed: "Dear Manager,\n\nSame chair. Same spot. Still doing nothing. I've started timing you again. It's up to twenty minutes now - a new record.\n\nThis is going in my review.\n\nBest,\n{from}",
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

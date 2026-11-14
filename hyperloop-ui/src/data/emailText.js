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

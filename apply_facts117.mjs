// Fixes city-fact issues from bug #117. Run from the repo root:  node apply_facts117.mjs
// Each change replaces one exact piece of text and stops with a message if it is not found,
// so nothing is changed by guesswork. Safe to run twice (already-applied changes are skipped).
import fs from 'fs'

const changes = [
  ['Lisbon', "started in the 17th century, but the dome wasn't officially completed until 1966—a construction period spanning over 300 years.",
             "started in 1682, but the dome wasn't officially completed until 1966—a construction period spanning almost 300 years."],
  ['Paris', "To see every single piece of art for just 30 seconds straight, you would be exploring for 35 days without sleeping.",
            "To see each of its roughly 35,000 works on display for just 30 seconds, you would need about 12 days of non-stop looking."],
  ['Valletta', "0.8 square kilometers (about 0.3 square miles)", "0.61 square kilometers (about 0.24 square miles)"],
  ['Antwerp', "It is the only museum in the world designated as a UNESCO World Heritage site.",
              "It is one of the very few museums in the world to be a UNESCO World Heritage site in its own right."],
  ['Sanaa', "Sana'a is often called the world's first 'skyscraper city' because of its ancient multi-story tower houses that rise up to nine stories high.",
            "Sana'a's Old City is famous for its ancient multi-story tower houses that rise up to nine stories high, an early form of the skyscraper city."],
  ['Kyoto', "who had visited and admired the city on his honeymoon—insisting", "who had visited and admired the city—insisting"],
  ['Bangalore', "was the first city in Asia to have electric streetlights, turned on in August 1905. This earned the 'Silicon Valley of India' its early nickname.",
                "was one of the first cities in Asia to have electric streetlights, turned on in August 1905. That early appetite for technology foreshadowed its later nickname, the 'Silicon Valley of India'."],
  ['Aberdeen', "Aberdeen is home to the world's first-ever commercial MRI scanner, developed in the city in the 1980s and used to take the first clinical scan of a patient's internal organs.",
               "Aberdeen is home to the world's first full-body MRI scanner, a research prototype built by University of Aberdeen scientists in the late 1970s and used for the first clinical scan of a patient in 1980."],
  ['George_Town', "was the very first British settlement in Southeast Asia, founded by Francis Light in 1786.",
                  "was one of the first British settlements in Southeast Asia, founded by Francis Light in 1786."],
  ['Georgetown', "an intricate 17th-century Dutch-engineered system", "an intricate Dutch-engineered, 18th-century system"],
  ['Nagoya', "which held the Guinness World Record for the world's largest planetarium dome until 2017.",
             "which Guinness World Records lists as having the world's largest planetarium dome."],
  ['BuenosAires', "a specific sub-neighborhood - Palermo Chico - is affectionately nicknamed", "a specific sub-neighborhood of Palermo, around Plaza Güemes, is affectionately nicknamed"],
  ['Philadelphia', "oldest continuously operating theatre in the English-speaking world", "oldest continuously operating theatre in the United States"],
  ['Havana', "by what is said to be a 25-carat diamond that once belonged to Russian Tsar Nicholas II.",
             "by a diamond set into the floor, a replica of a 25-carat gem said to have once belonged to Russian Tsar Nicholas II."],
  ['SanFrancisco', "is officially named 'Karl,' inspired by the giant from the movie Big Fish. Karl even has a massive social media presence with hundreds of thousands of followers tracking his movements.",
                   "is affectionately nicknamed 'Karl,' after the giant from the movie Big Fish. Karl even has a huge social media following, with a popular account tracking his movements."],
  ['MonteCarlo', "This staggering 1 in 67 million event birthed the psychological phenomenon known as the Gambler's Fallacy.",
                 "This staggering 1 in 67 million event became the classic example of the psychological phenomenon known as the Gambler's Fallacy, also called the Monte Carlo Fallacy."],
  ['LosAngeles', "its official name was over 40 characters long:", "its name is traditionally given as:"],
  ['Tehran', "The area of Tehran dates back to the Elamite kingdom of the 4th millennium BC – the oldest civilization known in the region.",
             "The Tehran area has been settled for thousands of years, and the ancient city of Ray, now part of greater Tehran, is among the oldest known settlements in the region."],
  ['CapeTown', "(except Sundays) since 1806, making it one of the oldest daily time signals in the world.",
               "(except Sundays) since 1902, continuing a time-signal tradition that dates back to 1806."],
  ['Milwaukee', "The first practical typewriter was invented in Milwaukee in 1869, which is where the familiar QWERTY keyboard layout was perfected by C. Latham Sholes.",
                "The first practical typewriter was invented in Milwaukee and patented in 1868 by C. Latham Sholes, who also perfected the familiar QWERTY keyboard layout there."],
  ['Bucharest', "Ploieșt.", "Ploiești."],
  ['Islamabad', "in an grid-like sector system", "in a grid-like sector system"],
  ['Tallinn', "after a major battle..", "after a major battle."],
  ['Miami', "Black Caeser", "Black Caesar"],
  ['Hanoi', "The historic Old Quarter features uniquely narrow houses built to avoid French colonial property taxes, which were once calculated by the width of the building's street-facing facade.",
            "The historic Old Quarter's narrow streets were each named after the trade guild that once worked there, which is why so many are still called after goods such as silk, silver and paper."],
  ['Hamburg', "more bridges than Venice, Amsterdam, and London combined - earning it the nickname the 'Venice of the North'.",
              "more bridges than Venice, Amsterdam, and London combined."],
]

let failed = 0
for (const [file, oldText, newText] of changes) {
  const path = `CityManager/${file}.js`
  if (!fs.existsSync(path)) { console.log(`MISSING FILE ${path}`); failed++; continue }
  const text = fs.readFileSync(path, 'utf8')
  const hits = text.split(oldText).length - 1
  if (hits === 1) { fs.writeFileSync(path, text.replace(oldText, () => newText)); console.log(`changed  ${file}`) }
  else if (text.includes(newText)) console.log(`already  ${file}`)
  else { console.log(`NOT FOUND (${hits} matches) ${file}`); failed++ }
}
console.log(failed ? `${failed} change(s) need attention` : 'all done')

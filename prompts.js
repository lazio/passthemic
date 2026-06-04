/* prompts.js — prompt corpus (1000+ distinct prompts), title word bank, player colors.
   Exposed as globals (no modules) so the page works from file:// with plain <script> tags.

   Prompts are plain strings in natural case; the big on-screen reveal upper-cases them
   via CSS. The corpus is assembled from curated lists plus a handful of templated
   families expanded over word banks, then de-duplicated. */

(function () {
  "use strict";

  /* ----------------------------- helpers ----------------------------- */
  const cat = (...arrs) => [].concat(...arrs);
  const uniq = (arr) => Array.from(new Set(arr));
  // Expand "{x}" in a template across a list of fills.
  const cross = (tmpl, xs) => xs.map((x) => tmpl.replace("{x}", x));
  // Expand "{x}" and "{y}" across two lists (full cross product).
  const cross2 = (tmpl, xs, ys) => xs.flatMap((x) => ys.map((y) => tmpl.replace("{x}", x).replace("{y}", y)));

  /* --------------------------- word banks ---------------------------- */
  const WORDS = [
    "Intuition", "First impressions", "Morning routines", "The perfect weekend", "Silence",
    "Ambition", "Nostalgia", "Luck", "Boredom", "Curiosity", "Fear", "Regret", "Jealousy",
    "Kindness", "Patience", "Chaos", "Routine", "Money", "Fame", "Power", "Friendship",
    "Loneliness", "Home", "Travel", "Food", "Music", "Sleep", "Dreams", "Time", "Memory",
    "Habits", "Failure", "Success", "Risk", "Comfort", "Change", "Identity", "Reputation",
    "Trust", "Honesty", "Forgiveness", "Gratitude", "Confidence", "Doubt", "Hope", "Anger",
    "Joy", "Grief", "Wonder", "Focus", "Discipline", "Freedom", "Loyalty", "Pride", "Shame",
    "Empathy", "Generosity", "Stubbornness", "Imagination", "Logic", "Instinct", "Willpower",
    "Charisma", "Humor", "Awkwardness", "Small talk", "Deadlines", "Mondays", "Weekends",
    "Coffee", "Tea", "Rain", "Sunsets", "The ocean", "Mountains", "Cities", "Small towns",
    "Libraries", "Bookstores", "Road trips", "Airports", "Long walks", "Cold weather",
    "Heat waves", "Thunderstorms", "Starlight", "Campfires", "Old photographs", "Handwriting",
    "Voicemails", "Group chats", "Inside jokes", "Childhood", "Growing up", "Getting older",
    "Reinvention", "Beginnings", "Endings", "Goodbyes", "Reunions", "Strangers", "Neighbors",
    "Mentors", "Rivals", "Heroes", "Villains", "Underdogs", "Comebacks", "Second chances",
    "Plot twists", "Cliffhangers", "Sequels", "Reboots", "The future", "The past", "Right now",
    "Procrastination", "Perfectionism", "Multitasking", "Burnout", "Side quests", "Hobbies",
    "Collections", "Rituals", "Superstitions", "Traditions", "Holidays", "Birthdays",
    "Anniversaries", "Milestones", "Bucket lists", "New Year's resolutions", "Spontaneity",
    "Planning", "Maps", "Shortcuts", "Detours", "Dead ends", "Open doors", "Closed chapters",
    "Fresh starts", "Comfort food", "Guilty pleasures", "Hidden talents", "Bad habits",
    "Pet peeves", "White lies", "Big dreams", "Quiet victories", "Loud opinions",
  ];

  const EVERYDAY_STARTERS = [
    "The one app I could never delete is...",
    "My most useful everyday skill is...",
    "The smartest purchase I ever made was...",
    "A small thing that instantly improves my day is...",
    "The household chore I secretly enjoy is...",
    "My ideal Sunday looks like...",
    "The snack I'd defend with my life is...",
    "The piece of advice I give most often is...",
    "Something I do differently from everyone I know is...",
    "The last thing that made me laugh out loud was...",
    "My go-to order at a coffee shop is, and here's why...",
    "The most overrated part of my daily routine is...",
    "A habit I picked up that genuinely changed my life is...",
    "The thing I always forget no matter what is...",
    "If you opened my fridge right now, you'd learn that...",
    "The notification I dread most is...",
    "My phone's screen time says a lot about me, namely...",
    "The chore I'll do anything to avoid is...",
    "A tiny luxury I refuse to give up is...",
    "The weirdest thing in my bag right now is...",
    "My most-used emoji says this about me...",
    "The song stuck in my head right now is...",
    "I know it's going to be a good day when...",
    "The last photo I took was of...",
    "My browser has way too many tabs open about...",
    "The most random fact I know is...",
    "A skill everyone should learn before turning thirty is...",
    "The best way to spend a rainy afternoon is...",
    "My favorite way to waste time is...",
    "The thing I'm weirdly competitive about is...",
    "I'd survive a week without my phone by...",
    "The compliment I get most often is...",
    "Something I believed as a kid that turned out to be wrong is...",
    "The most useless thing I'm strangely good at is...",
    "My signature dish, if I had to cook for ten people, would be...",
    "The thing in my home I'd grab first in a fire is...",
    "A trend I refused to follow and don't regret is...",
    "The last time I tried something for the first time was...",
    "My favorite smell, and the memory attached to it, is...",
    "The shortcut I take every day that no one knows about is...",
  ];

  const PERSONAL_STARTERS = [
    "Few people know I could talk for hours about...",
    "The best advice I ever ignored was...",
    "The moment I realized I was an adult was...",
    "The hardest lesson I've ever learned was...",
    "The story I tell at every party is...",
    "The version of me from ten years ago would be shocked that...",
    "If my life had a theme song, it would be, and here's why...",
    "The compliment that meant the most to me was...",
    "A risk I took that completely paid off was...",
    "A risk I took that absolutely did not pay off was...",
    "The person who changed my life the most is...",
    "The fear I'm slowly learning to let go of is...",
    "Something I'm proud of that I rarely talk about is...",
    "The decision I agonized over but would make again is...",
    "A belief I've completely changed my mind about is...",
    "The thing I wish I'd started sooner is...",
    "The kindest thing a stranger ever did for me was...",
    "What I'd tell my younger self if I had sixty seconds is...",
    "The habit I'm most trying to break right now is...",
    "A moment I knew everything was about to change was...",
    "The compliment I find hardest to accept is...",
    "Something that used to scare me but doesn't anymore is...",
    "The dream I've quietly held onto for years is...",
    "A time I completely surprised myself was...",
    "The relationship that taught me the most was...",
    "If I could relive one ordinary day, it would be...",
    "The mistake I'm actually grateful for is...",
    "What I've learned about myself this past year is...",
    "The tradition I want to pass on is...",
    "A small act of bravery I'm proud of is...",
    "The thing I'm still figuring out about myself is...",
    "What 'home' really means to me is...",
    "The conversation I wish I could have again is...",
    "The way I've changed that I'm happiest about is...",
    "Something I forgave myself for is...",
    "The moment I felt most alive was...",
    "A door that closed and led somewhere better was...",
    "The advice I'd give to anyone starting over is...",
    "What I want to be remembered for is...",
    "The part of my story I'm still writing is...",
  ];

  const WILD_STARTERS = [
    "Invent a new holiday and explain exactly how we celebrate it.",
    "You've just been made mayor of the Moon. What's your first law?",
    "Pitch a reality show starring house pets.",
    "Convince me that cereal is a soup.",
    "You can add one new rule to society that everyone must follow. What is it?",
    "Describe the perfect theme park ride that doesn't exist yet.",
    "You wake up able to speak to one species of animal. Which, and what now?",
    "Design the ultimate breakfast and defend every choice.",
    "If you could rename a color, which one and what would you call it?",
    "You're handed a billboard in Times Square for one day. What goes on it?",
    "Invent a sport that combines two existing ones.",
    "You can teleport, but only to places you've already been. Where do you go first?",
    "Pitch the worst possible superhero and their useless power.",
    "You're in charge of the next national anthem. What's the vibe?",
    "Describe a museum dedicated entirely to your life.",
    "You can make one food calorie-free forever. Pick wisely and defend it.",
    "Invent a gadget that solves your most annoying daily problem.",
    "You're a tour guide for aliens visiting Earth. What's the first stop?",
    "Design a new emoji the world desperately needs.",
    "You can pause time for everyone but you, once a day, for ten minutes. How do you use it?",
    "Pitch a restaurant with the strangest possible theme.",
    "You're given a dragon as a pet. Walk me through day one.",
    "Invent a new sense humans don't have and describe living with it.",
    "You can swap lives with any fictional character for a week. Who?",
    "Describe the city of the future you'd actually want to live in.",
    "You're handed the world's loudspeaker for thirty seconds. What do you say?",
    "Invent a board game and explain how to win.",
    "You can make any object float forever. What do you choose?",
    "Pitch a sequel to a movie that absolutely doesn't need one.",
    "You're designing the perfect amusement for a planet with no gravity.",
    "Invent a word for a feeling that doesn't have one yet.",
    "You can summon any historical figure for dinner. Who, and what do you order?",
    "Describe the most useless invention you're sure would still sell.",
    "You're in charge of redesigning money. What does it look like?",
    "Invent a new school subject everyone should take.",
    "You can give every person on Earth one small skill. Which?",
    "Pitch a vacation destination that only exists in your imagination.",
    "You're the villain in a heist movie. What are you stealing and why?",
    "Invent a holiday food and describe the tradition around it.",
    "You can rewrite one law of physics for a single day. Which one?",
  ];

  const WORK_STARTERS = [
    "The most useless meeting I ever sat through was about...",
    "If I could automate one part of my job, it would be...",
    "The best boss I ever had did this one thing...",
    "The career advice that turned out to be totally wrong was...",
    "A skill I learned at work that helps me in real life is...",
    "The most satisfying problem I ever solved was...",
    "If I started my own company tomorrow, it would do...",
    "The workplace tradition I'd ban forever is...",
    "The hardest feedback I ever received was...",
    "What I wish someone had told me on my first day was...",
    "The project I'm proudest of, and why, is...",
    "The job I'd love to try for exactly one week is...",
    "My definition of a 'good day at work' is...",
    "The most overrated piece of career wisdom is...",
    "If money didn't matter, I'd spend my time...",
    "The colleague who taught me the most taught me...",
    "The email I'll never forget sending was...",
    "What burnout taught me about myself is...",
    "The smartest decision my team ever made was...",
    "The skill I think will matter most in ten years is...",
    "A time I had to think completely on my feet was...",
    "The work habit I'd recommend to anyone is...",
    "The meeting that could have been an email was about...",
    "If I could give every new graduate one tip, it would be...",
    "The risk I took in my career that defined it was...",
    "What I've learned about leading people is...",
    "The most creative solution I've ever seen was...",
    "The thing I underestimated about working with others is...",
    "A failure at work that taught me the most was...",
    "The job title I'd invent for what I actually do is...",
    "The best way to recover from a mistake at work is...",
    "What success at work means to me now versus five years ago is...",
    "The tool I can't imagine working without is...",
    "The moment I knew I'd chosen the right path was...",
    "If I could redesign the workweek, it would look like...",
    "The hardest part of changing careers is...",
    "What I'd tell my first-day self now is...",
    "The most valuable thing experience taught me is...",
    "The advice I'd give about handling pressure is...",
    "The kind of work that makes me lose track of time is...",
  ];

  const STORY_STARTERS = [
    "Tell the story of the best meal you've ever had.",
    "Tell the story of a journey that didn't go as planned.",
    "Tell the story of how you met your closest friend.",
    "Tell the story of the worst haircut you've ever had.",
    "Tell the story of a time you got hopelessly lost.",
    "Tell the story of your most embarrassing moment.",
    "Tell the story of a gift you'll never forget.",
    "Tell the story of the first time you felt truly independent.",
    "Tell the story of a stranger who left a mark on you.",
    "Tell the story of the bravest thing you've ever done.",
    "Tell the story of a plan that fell apart spectacularly.",
    "Tell the story of a coincidence too strange to be true.",
    "Tell the story of the last time you laughed until it hurt.",
    "Tell the story of a moment you wish you could relive.",
    "Tell the story of the time you proved someone wrong.",
    "Tell the story of a decision made in a split second.",
    "Tell the story of the place you felt most at peace.",
    "Tell the story of an adventure that started by accident.",
    "Tell the story of the time everything went right.",
    "Tell the story of a small kindness you've never forgotten.",
    "Tell the story of the scariest thing that turned out fine.",
    "Tell the story of a tradition in your family and where it came from.",
    "Tell the story of the time you took a leap of faith.",
    "Tell the story of a misunderstanding that became a great memory.",
    "Tell the story of the night you'll always remember.",
    "Tell the story of the time you surprised yourself.",
    "Tell the story of a door that opened unexpectedly.",
    "Tell the story of the hardest goodbye you've said.",
    "Tell the story of a risk that changed your direction.",
    "Tell the story of the best advice you ever received and from whom.",
  ];

  /* ----------------------- templated families ----------------------- */
  const TIME_YOU = [
    "got completely lost", "changed your mind about something big", "surprised yourself",
    "failed spectacularly", "helped a total stranger", "had to improvise", "broke the rules",
    "stood up for someone", "took a huge risk", "made a snap decision", "lost track of time",
    "felt completely out of your depth", "proved someone wrong", "had to apologize",
    "discovered a hidden talent", "couldn't stop laughing", "were genuinely speechless",
    "trusted your gut", "learned something the hard way", "felt unstoppable",
    "had to start over", "did something you swore you never would", "met someone unforgettable",
    "were brave when it counted", "completely changed your plans", "got an unexpected surprise",
    "had to keep a straight face", "felt truly understood", "made a great first impression",
    "embarrassed yourself and survived", "found exactly what you needed", "took the long way",
    "said yes when you wanted to say no", "stayed calm under pressure", "got lucky",
    "let go of something", "fixed something no one thought you could", "asked for help",
    "made a memory you'll keep forever", "saw something you couldn't explain",
    "did the right thing when it was hard", "kept a promise", "learned to let go",
    "took the road less traveled", "felt at home somewhere new",
  ];

  const RATE_NOUNS = [
    "honesty", "ambition", "tradition", "spontaneity", "comfort", "routine", "advice",
    "patience", "optimism", "planning", "multitasking", "networking", "small talk",
    "gut instinct", "experience", "talent", "discipline", "passion", "perfectionism",
    "willpower", "confidence", "luck", "timing", "first impressions", "second chances",
    "loyalty", "ambition", "modesty", "competition", "compromise", "nostalgia",
    "positivity", "skepticism", "curiosity", "consistency", "charisma", "intuition",
    "kindness", "boldness", "caution", "reinvention", "specialization", "versatility",
    "early mornings", "late nights", "deadlines", "free time", "solitude", "teamwork",
    "expert opinions",
  ];

  const CONVINCE = [
    "a hot dog is a sandwich", "cereal is a soup", "the best pizza topping is pineapple",
    "breakfast food is better at night", "cats are smarter than dogs", "winter is the best season",
    "the book is not always better than the movie", "Mondays are underrated",
    "small talk is actually meaningful", "boredom is good for you", "being late can be polite",
    "the middle seat has hidden advantages", "everyone should learn to juggle",
    "silence is the best sound", "the second pancake is always the best one",
    "walking is the superior form of travel", "handwritten notes beat texts every time",
    "doing nothing is a skill worth mastering", "the worst movie you love is secretly great",
    "alphabetizing your bookshelf is a mistake", "leftovers taste better the next day",
    "talking to yourself is healthy", "weekends should be three days long",
    "the best ideas come in the shower", "naps are a sign of intelligence",
    "the office printer is sentient and hates you", "a messy desk is a creative desk",
    "you should always read the last page first", "elevators should play music",
    "socks with sandals are misunderstood", "the snooze button is a trap",
    "instructions are optional", "the best plans are no plans", "queuing is an art form",
    "spoilers make stories better", "the aux cord is a sacred responsibility",
    "every meeting should end five minutes early", "umbrellas are overrated",
    "the middle child has it best", "you can judge a city by its sandwiches",
    "phone calls are scarier than they need to be", "the dishwasher should be loaded your way",
    "tea is superior to coffee", "the best seat in any room is by the window",
    "deadlines spark creativity",
  ];

  const RATHER = [
    "Would you rather be able to fly or be invisible? Why?",
    "Would you rather always be ten minutes early or twenty minutes late? Why?",
    "Would you rather have unlimited money or unlimited time? Why?",
    "Would you rather know how you die or when you die? Why?",
    "Would you rather be famous or be the power behind someone famous? Why?",
    "Would you rather lose all your old memories or never make new ones? Why?",
    "Would you rather always say what you think or never speak again? Why?",
    "Would you rather live in a city forever or the countryside forever? Why?",
    "Would you rather travel only to the past or only to the future? Why?",
    "Would you rather be the funniest or the smartest person in every room? Why?",
    "Would you rather have a personal chef or a personal driver? Why?",
    "Would you rather give up music or give up movies? Why?",
    "Would you rather always be a little too hot or a little too cold? Why?",
    "Would you rather have more hours in the day or more days in the week? Why?",
    "Would you rather be able to talk to animals or speak every human language? Why?",
    "Would you rather never use the internet again or never travel again? Why?",
    "Would you rather be feared or be loved? Why?",
    "Would you rather start every conversation or end every conversation? Why?",
    "Would you rather have a rewind button or a pause button for your life? Why?",
    "Would you rather be amazing at one thing or good at everything? Why?",
    "Would you rather always know the truth or always be blissfully unaware? Why?",
    "Would you rather live without a phone or without a car for a year? Why?",
    "Would you rather be remembered for one great thing or loved by everyone you meet? Why?",
    "Would you rather have the perfect comeback every time or never need one? Why?",
    "Would you rather explore the deep ocean or outer space? Why?",
    "Would you rather have an extra hour of sleep or an extra hour of free time? Why?",
    "Would you rather only whisper or only shout for a day? Why?",
    "Would you rather win the lottery or find your perfect job? Why?",
    "Would you rather be able to teleport or to read minds? Why?",
    "Would you rather relive your best day or skip to your best day yet to come? Why?",
    "Would you rather have a photographic memory or a flawless sense of direction? Why?",
    "Would you rather never feel embarrassed or never feel pain? Why?",
    "Would you rather be the hero of a small story or a minor character in a huge one? Why?",
    "Would you rather have endless books or endless music? Why?",
    "Would you rather be brilliant but unknown or famous but average? Why?",
    "Would you rather control your dreams or remember every one? Why?",
    "Would you rather be able to undo one decision or predict one outcome? Why?",
    "Would you rather always have the perfect outfit or the perfect words? Why?",
    "Would you rather live the same great year on repeat or a different ordinary year each time? Why?",
    "Would you rather have a quiet life full of comfort or a wild one full of stories? Why?",
    "Would you rather be able to change the past or see the future? Why?",
    "Would you rather always find a parking spot or never wait in a line? Why?",
    "Would you rather have one true talent or a thousand small ones? Why?",
    "Would you rather be the teacher or the eternal student? Why?",
    "Would you rather give up sweets or give up salt forever? Why?",
    "Would you rather have a year off to travel or a year off to create? Why?",
    "Would you rather always be slightly underdressed or slightly overdressed? Why?",
    "Would you rather be unforgettable to a few or pleasant to everyone? Why?",
    "Would you rather have the answer to any question or the solution to any problem? Why?",
    "Would you rather be content with little or always reaching for more? Why?",
  ];

  const EXPLAIN_CONCEPTS = [
    "the internet", "taxes", "falling in love", "jet lag", "sarcasm", "the stock market",
    "memes", "democracy", "deadlines", "social media", "music", "why we dream",
  ];
  const EXPLAIN_AUDIENCES = [
    "a medieval knight", "a five-year-old", "an alien who just landed", "your grandparents",
    "a caveman", "a very logical robot", "someone from the year 1900", "a houseplant",
  ];

  const IF_YOU_COULD = [
    "live anywhere in the world for a year", "master any skill overnight",
    "have dinner with anyone in history", "erase one invention from existence",
    "relive any single day", "know the answer to one big question",
    "swap lives with anyone for a week", "instantly become fluent in three languages",
    "add one hour to every day", "remove one chore from your life forever",
    "make one rule everyone had to follow", "see one day in your own future",
    "give the world one piece of advice", "un-invent one piece of technology",
    "have any view from your window", "trade talents with anyone you know",
    "freeze one age forever", "automatically be great at one sport",
    "have a conversation with your future self", "fix one global problem instantly",
    "restart one part of your life", "remember everything you ever read",
    "teleport to one place right now", "spend a year doing only what you love",
    "give one gift to everyone you've ever met", "undo one common mistake people make",
    "have one superpower with a small catch", "wake up in any era of history",
    "make one food healthy forever", "have any animal as a loyal companion",
    "trade a week of your life for a week in any fictional world", "be invisible for one day",
    "ask any person one honest question", "control the weather for a single day",
    "speak to one version of your past self", "instantly finish one thing you've been avoiding",
    "hear everyone's honest opinion for an hour", "have unlimited do-overs for one skill",
    "live without needing sleep", "press pause on the world for ten minutes",
  ];

  const TAUGHT_ME = [
    "Failure", "Travel", "Silence", "Boredom", "A good rival", "Losing", "Winning too easily",
    "A long walk", "Saying no", "Saying yes", "Being wrong", "Waiting", "Letting go",
    "Starting over", "A difficult person", "An unexpected friendship", "A bad job",
    "A great teacher", "A small failure", "A big risk", "Quiet mornings", "Hard conversations",
    "Asking for help", "Being the new person", "A missed opportunity", "A lucky break",
    "Living with less", "An honest mistake", "A change of plans", "Time alone",
  ];

  const RATE_THINGS = [
    "morning people", "open-plan offices", "to-do lists", "voice notes", "group projects",
    "buffets", "road trips", "surprise parties", "résumés", "first dates", "résumé buzzwords",
    "motivational quotes", "five-year plans", "icebreakers", "fancy restaurants",
    "self-help books", "productivity apps", "standing desks", "cold showers", "meal prep",
    "early flights", "loyalty cards", "gym memberships", "smartwatches", "subscription boxes",
    "personality tests", "vision boards", "networking events", "the snooze button", "small talk",
    "leftover pizza", "window seats", "aisle seats", "scented candles", "houseplants",
    "podcasts at double speed", "reply-all emails", "out-of-office replies", "name tags",
    "team-building retreats", "inspirational posters", "the office coffee", "open floor plans",
    "guided meditation", "morning meetings", "diet trends", "instruction manuals",
    "all-you-can-eat deals", "long intros", "the comment section", "airport lounges",
    "spreadsheets", "fast fashion", "infinite scroll", "loyalty programs", "smart fridges",
    "noise-canceling headphones", "weekend errands", "to-go containers", "phone cases",
    "online reviews", "auto-correct", "the fold-out couch", "alarm clocks",
    "double-clicking on everything", "buffet desserts", "matching luggage", "the salad bar",
    "the express checkout", "office birthday cake", "the suggestion box", "the parking lottery",
    "small talk in elevators", "the family group chat", "the welcome email", "scented markers",
    "the snooze alarm", "fancy water", "the loyalty stamp card", "the office plant",
    "shared playlists", "the conference call hold music",
  ];

  const HOT_TOPICS = [
    "Pineapple on pizza", "Working from home", "The metric system", "Voice assistants",
    "Reality TV", "Energy drinks", "Subscription services", "Smartphones at dinner",
    "Self-checkout", "The five-day workweek", "Streaming everything", "Open offices",
    "New Year's resolutions", "Group fitness classes", "Fast food breakfast", "Audiobooks",
    "Remote meetings", "The handshake", "Tipping culture", "The morning alarm",
    "Productivity hacks", "The gig economy", "Loyalty programs", "Going viral",
    "The 'reply all' button", "Daylight saving time", "The buffet", "The salad as a meal",
    "Inbox zero", "The standing ovation", "Small talk", "The participation trophy",
  ];
  const HOT_CLAIMS = [
    "is wildly overrated.", "is secretly underrated.", "peaked years ago.",
    "quietly changed everything.", "deserves way more credit.", "needs to be reinvented.",
  ];

  const NEVER_UNDERSTAND = [
    "love horror movies", "wake up early on weekends", "leave reviews for everything",
    "narrate their own lives online", "keep their phone on full brightness",
    "enjoy spicy food competitions", "read the ending of books first",
    "hate the sound of their own voice", "save the best bite for last", "fold pizza",
    "refuse to use bookmarks", "reply to texts a week later", "keep every receipt",
    "talk during movies", "run for fun", "skip breakfast", "love airports",
    "color-code their calendars", "leave one tab open for months", "hoard plastic bags",
    "name their cars", "clap when the plane lands", "reuse the same password everywhere",
    "keep the heating low to 'build character'", "stand on the left of the escalator",
    "reply to 'thank you' with 'thank YOU'", "alphabetize their spice rack",
    "buy books faster than they can read them", "screenshot instead of bookmarking",
    "leave voicemails in the year we live in",
  ];

  const DESCRIBE_WITHOUT = [
    ["the color blue", "blue"], ["your hometown", "nice"], ["your best friend", "friend"],
    ["the ocean", "water"], ["a smartphone", "phone"], ["happiness", "happy"],
    ["coffee", "coffee"], ["winter", "cold"], ["love", "love"], ["a rainbow", "color"],
    ["music", "sound"], ["the internet", "internet"], ["a dog", "dog"], ["money", "money"],
    ["a city at night", "lights"], ["your favorite food", "delicious"], ["fire", "hot"],
    ["a library", "books"], ["the sun", "bright"], ["laughter", "funny"],
    ["a thunderstorm", "loud"], ["a forest", "trees"], ["the moon", "round"],
    ["a beach", "sand"], ["time", "clock"],
  ];

  /* --------------------------- assembly ------------------------------ */
  const everyday = uniq(cat(
    WORDS,
    EVERYDAY_STARTERS,
    cross("{x}: overrated or underrated?", RATE_THINGS),
  ));

  const personal = uniq(cat(
    PERSONAL_STARTERS,
    cross("Tell me about a time you {x}.", TIME_YOU),
    cross("What {x} taught me.", TAUGHT_ME),
    cross("I'll never understand why people {x}.", NEVER_UNDERSTAND),
  ));

  const hotTakes = uniq(cat(
    cross("The most overrated thing about {x} is...", RATE_NOUNS),
    cross("The most underrated thing about {x} is...", RATE_NOUNS),
    cross("Convince me that {x}.", CONVINCE),
    cross2("Hot take — {x} {y}", HOT_TOPICS, HOT_CLAIMS),
  ));

  const storytelling = uniq(cat(
    STORY_STARTERS,
    cross("Tell me about a time you {x}.", TIME_YOU.slice(0, 25).map((s) => s)),
  ));

  const wouldYouRather = uniq(RATHER);

  const hypothetical = uniq(cat(
    WILD_STARTERS,
    cross2("Explain {x} to {y}.", EXPLAIN_CONCEPTS, EXPLAIN_AUDIENCES),
    cross("If you could {x}, would you? Why?", IF_YOU_COULD),
    DESCRIBE_WITHOUT.map(([thing, word]) => `Describe ${thing} without using the word "${word}".`),
  ));

  const workLife = uniq(cat(
    WORK_STARTERS,
    cross("In one minute, sell me on {x}.", RATE_THINGS.slice(0, 30)),
  ));

  const everything = uniq(cat(
    everyday, personal, hotTakes, storytelling, wouldYouRather, hypothetical, workLife,
  ));

  /* The dropdown order; the first key is the default selection. */
  const PROMPT_SETS = {
    "Everything": everything,
    "Everyday": everyday,
    "Personal": personal,
    "Hot Takes": hotTakes,
    "Storytelling": storytelling,
    "Would You Rather": wouldYouRather,
    "Hypothetical": hypothetical,
    "Work & Life": workLife,
  };

  /* Parts for the optional "suggest a title" podcast title generator. */
  const TITLE_PARTS = {
    adjectives: ["Curious", "Honest", "Unfiltered", "Bold", "Restless", "Quiet",
      "Wandering", "Caffeinated", "Late-Night", "Midweek", "Reluctant", "Brilliant",
      "Wholesome", "Chaotic", "Overthinking", "Unscripted", "Half-Baked", "Spontaneous"],
    nouns: ["Mind", "Hour", "Tangent", "Couch", "Microphone", "Detour", "Ramble",
      "Roundtable", "Frequency", "Conversation", "Take", "Signal", "Debrief", "Hangout",
      "Soapbox", "Two Cents", "Open Mic", "Deep End"],
  };

  /* Player colors assigned in order. Player 1 = yellow, Player 2 = pink. */
  const PLAYER_COLORS = [
    "#FFD23F", // yellow
    "#FF5DA2", // pink
    "#43E6C8", // cyan
    "#6BE26B", // green
    "#FF9F45", // orange
    "#B98CFF", // purple
  ];

  // Expose as globals.
  window.PROMPT_SETS = PROMPT_SETS;
  window.TITLE_PARTS = TITLE_PARTS;
  window.PLAYER_COLORS = PLAYER_COLORS;
})();

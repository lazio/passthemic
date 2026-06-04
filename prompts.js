/* prompts.js — built-in word sets, title word bank, and player color palette.
   Exposed as globals (no modules) so the page works from file:// with plain <script> tags. */

/* Each prompt: { text, difficulty: 1 (easy) | 2 (medium) | 3 (hard) }.
   A mix of single-word topics and open-ended sentence starters. */
const PROMPT_SETS = {
  Clean: [
    { text: "INTUITION", difficulty: 1 },
    { text: "FIRST IMPRESSIONS", difficulty: 1 },
    { text: "MORNING ROUTINES", difficulty: 1 },
    { text: "THE PERFECT WEEKEND", difficulty: 1 },
    { text: "FEW PEOPLE KNOW I COULD TALK FOR HOURS ABOUT...", difficulty: 2 },
    { text: "THE BEST ADVICE I EVER IGNORED WAS...", difficulty: 2 },
    { text: "IF I RAN THE WORLD FOR A DAY, THE FIRST THING I'D CHANGE IS...", difficulty: 2 },
    { text: "THE MOMENT I REALIZED I WAS AN ADULT WAS...", difficulty: 2 },
    { text: "WHY DOES EVERYONE PRETEND TO LIKE...", difficulty: 3 },
    { text: "THE MOST OVERRATED IDEA OF OUR GENERATION IS...", difficulty: 3 },
    { text: "DEFEND THE INDEFENSIBLE: PINEAPPLE BELONGS ON PIZZA.", difficulty: 3 },
  ],
  Personal: [
    { text: "MY HAPPY PLACE", difficulty: 1 },
    { text: "A SKILL I WISH I HAD", difficulty: 1 },
    { text: "MY GUILTY PLEASURE", difficulty: 1 },
    { text: "THE STORY I TELL AT EVERY PARTY IS...", difficulty: 2 },
    { text: "SOMETHING THAT INSTANTLY MAKES MY DAY BETTER IS...", difficulty: 2 },
    { text: "THE HARDEST LESSON I'VE EVER LEARNED WAS...", difficulty: 2 },
    { text: "IF MY LIFE HAD A THEME SONG, IT WOULD BE... AND HERE'S WHY.", difficulty: 3 },
    { text: "THE VERSION OF ME FROM TEN YEARS AGO WOULD BE SHOCKED THAT...", difficulty: 3 },
  ],
  Wild: [
    { text: "ALIENS", difficulty: 1 },
    { text: "TIME TRAVEL", difficulty: 1 },
    { text: "CONVINCE ME THAT CEREAL IS A SOUP.", difficulty: 2 },
    { text: "INVENT A NEW HOLIDAY AND EXPLAIN HOW WE CELEBRATE IT.", difficulty: 2 },
    { text: "YOU'VE JUST BEEN MADE MAYOR OF THE MOON. WHAT'S YOUR FIRST LAW?", difficulty: 3 },
    { text: "EXPLAIN THE INTERNET TO A MEDIEVAL KNIGHT.", difficulty: 3 },
    { text: "PITCH A REALITY SHOW STARRING HOUSE PETS.", difficulty: 3 },
  ],
};

/* Parts for the optional "suggest a title" podcast title generator. */
const TITLE_PARTS = {
  adjectives: ["Curious", "Honest", "Unfiltered", "Bold", "Restless", "Quiet",
    "Wandering", "Caffeinated", "Late-Night", "Midweek", "Reluctant", "Brilliant"],
  nouns: ["Mind", "Hour", "Tangent", "Couch", "Microphone", "Detour", "Ramble",
    "Roundtable", "Frequency", "Conversation", "Take", "Signal"],
};

/* Player colors assigned in order. Player 1 = yellow, Player 2 = pink (matching the example). */
const PLAYER_COLORS = [
  "#FFD23F", // yellow
  "#FF5DA2", // pink
  "#43E6C8", // cyan
  "#6BE26B", // green
  "#FF9F45", // orange
  "#B98CFF", // purple
];

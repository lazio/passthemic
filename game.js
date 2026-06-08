/* game.js — Pass the Mic state machine, timer, speaker cycling, and sound cues.
   Depends on globals from prompts.js: PROMPT_SETS, TITLE_PARTS, PLAYER_COLORS. */

(function () {
  "use strict";

  /* ----------------------------- Constants ----------------------------- */
  const PHASE = { SETUP: "setup", REVEAL: "reveal", SPEAKING: "speaking", ROUND_END: "round_end" };

  // Difficulty controls how long each player speaks before the mic passes to the next.
  // `turn` is the [min, max] turn length in seconds; each turn picks a random value in range.
  // `scale: true` makes turns relative to game longevity — they grow/shrink proportionally
  // with the chosen round length (calibrated to the reference below), so a longer game gives
  // proportionally longer turns and a similar number of exchanges. Fast/Random stay absolute:
  // Fast must remain genuinely rapid-fire on any game length, and Random must be able to pass
  // the mic "at any moment" regardless of how long the round is.
  const TURN_REF_SECONDS = 60; // scaled ranges are tuned to a 1-minute round
  const DIFFICULTY = {
    random: { turn: [3, 24], scale: false }, // wildly unpredictable — mic can pass any moment
    fast:   { turn: [5, 7], scale: false },  // very short, high-pressure turns
    medium: { turn: [8, 16], scale: true },  // moderate, varying — relative to game length
    slow:   { turn: [18, 26], scale: true }, // longer, comfortable stretches — relative to length
  };
  const MIN_PLAYERS = 1, MAX_PLAYERS = 6;
  const MIN_TIMER = 15, MAX_TIMER = 900; // seconds

  /* ------------------------------- State ------------------------------- */
  const state = {
    phase: PHASE.SETUP,
    config: null,        // built on Start
    deck: [],            // shuffled prompt queue for the chosen set/difficulty
    deckPos: 0,
    prompt: null,
    title: "",
    // round timing
    roundDuration: 0,    // seconds
    elapsed: 0,          // seconds into the speaking phase
    endAt: 0,            // performance.now() timestamp (ms) the round ends
    pauseRemaining: 0,   // seconds left when paused
    tickId: null,
    paused: false,
    activeIndex: -1,     // current speaker index (drives swap animation/sound)
    nextSwapAt: 0,       // elapsed seconds at which the mic next passes
    muted: false,
    revealTimers: [],    // pending setTimeout ids during reveal/round-end
  };

  /* ----------------------------- DOM refs ------------------------------ */
  const $ = (sel) => document.querySelector(sel);
  const el = {};
  let setupColors = []; // per-player colors chosen on the setup screen (by index)
  let savedNames = [];  // restored player names (fallback when rebuilding rows)

  const SETTINGS_KEY = "passthemic.settings.v1";
  function cacheDom() {
    el.setupScreen = $("#setup-screen");
    el.gameScreen = $("#game-screen");
    el.form = $("#setup-form");
    el.timerInput = $("#timer-input");
    el.playersCount = $("#players-count");
    el.wordsetSelect = $("#wordset-select");
    el.difficultyGroup = $("#difficulty-group");
    el.titleToggle = $("#title-toggle");
    el.playerNames = $("#player-names");
    el.reveal = $("#reveal");
    el.revealTitle = $("#reveal-title");
    el.revealPrompt = $("#reveal-prompt");
    el.revealCue = $("#reveal-cue");
    el.stage = $("#stage");
    el.activeName = $("#active-name");
    el.roundEnd = $("#round-end");
    el.promptReminder = $("#prompt-reminder");
    el.timerDisplay = $("#timer-display");
    el.btnPause = $("#btn-pause");
    el.btnSkip = $("#btn-skip");
    el.btnMute = $("#btn-mute");
    el.btnEnd = $("#btn-end");
  }

  /* ------------------------------ Helpers ------------------------------ */
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function parseTimer(str) {
    const s = String(str).trim();
    let secs;
    if (s.includes(":")) {
      const [m, sec] = s.split(":");
      secs = (parseInt(m, 10) || 0) * 60 + (parseInt(sec, 10) || 0);
    } else {
      secs = parseInt(s, 10) || 0;
    }
    return clamp(secs, MIN_TIMER, MAX_TIMER);
  }

  function formatTime(totalSecs) {
    const s = Math.max(0, Math.ceil(totalSecs));
    const m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  }

  // Fisher–Yates shuffle (returns a new array).
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Pick black or white "ink" for readable text on a given background color,
  // using WCAG relative luminance so it works for any palette entry.
  function contrastInk(hex) {
    const c = hex.replace("#", "");
    const ch = (i) => parseInt(c.substr(i, 2), 16) / 255;
    const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4));
    return L > 0.45 ? "#14151b" : "#ffffff";
  }

  // The game screen takes on the active speaker's color; --ink keeps text readable.
  function applyPlayerTheme(player) {
    el.gameScreen.style.backgroundColor = player.color;
    el.gameScreen.style.setProperty("--ink", contrastInk(player.color));
  }
  function clearPlayerTheme() {
    el.gameScreen.style.backgroundColor = ""; // revert to the default dark bg
    el.gameScreen.style.removeProperty("--ink");
  }

  function generateTitle() {
    return "The " + pick(TITLE_PARTS.adjectives) + " " + pick(TITLE_PARTS.nouns) + " Podcast";
  }

  /* --------------------------- Sound cues ------------------------------ */
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, start, dur, type, gainPeak) {
    const ctx = audioCtx;
    if (!ctx || state.muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainPeak || 0.2, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  // Wrapper: audio must NEVER break the game loop, so swallow any error.
  function safe(fn) { try { ensureAudio(); fn(); } catch (e) { /* ignore audio failures */ } }
  const sound = {
    go() { safe(() => { tone(523.25, 0, 0.15, "triangle"); tone(783.99, 0.12, 0.3, "triangle"); }); },
    swap() { safe(() => tone(660, 0, 0.12, "sine", 0.15)); },
    end() { safe(() => { tone(180, 0, 0.5, "sawtooth", 0.18); tone(120, 0.05, 0.55, "sawtooth", 0.15); }); },
  };

  /* --------------------------- Setup screen ---------------------------- */
  function initSetup() {
    // Word set dropdown
    el.wordsetSelect.innerHTML = "";
    Object.keys(PROMPT_SETS).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      el.wordsetSelect.appendChild(opt);
    });

    applySavedSettings(); // restore last-used config before building rows
    renderNameInputs();

    // Steppers
    document.querySelectorAll(".stepper").forEach((stepper) => {
      stepper.querySelectorAll(".step-btn").forEach((btn) => {
        btn.addEventListener("click", () => onStep(stepper.dataset.stepper, parseInt(btn.dataset.step, 10)));
      });
    });
    el.timerInput.addEventListener("blur", () => {
      el.timerInput.value = formatTime(parseTimer(el.timerInput.value));
    });

    // Difficulty segmented control
    el.difficultyGroup.querySelectorAll(".seg").forEach((seg) => {
      seg.addEventListener("click", () => setActiveDifficulty(seg.dataset.value));
    });

    // Title toggle
    el.titleToggle.addEventListener("click", () => setTitleToggle(!el.titleToggle.classList.contains("on")));

    el.form.addEventListener("submit", (e) => { e.preventDefault(); startGame(); });
  }

  function setActiveDifficulty(value) {
    el.difficultyGroup.querySelectorAll(".seg").forEach((s) => {
      s.classList.toggle("active", s.dataset.value === value);
    });
  }

  function setTitleToggle(on) {
    el.titleToggle.classList.toggle("on", on);
    el.titleToggle.setAttribute("aria-checked", String(on));
  }

  /* ----------------------- Settings persistence ------------------------ */
  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || null; }
    catch (e) { return null; }
  }

  function saveSettings() {
    try {
      const data = {
        timer: el.timerInput.value,
        players: parseInt(el.playersCount.value, 10) || 2,
        difficulty: (el.difficultyGroup.querySelector(".seg.active") || {}).dataset?.value || "medium",
        suggestTitle: el.titleToggle.classList.contains("on"),
        wordSet: el.wordsetSelect.value,
        names: Array.from(el.playerNames.querySelectorAll("input")).map((i) => i.value.trim()),
        colors: setupColors.slice(),
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable — ignore */ }
  }

  function applySavedSettings() {
    const s = loadSettings();
    if (!s) return;
    if (s.timer) el.timerInput.value = formatTime(parseTimer(s.timer));
    if (s.players) el.playersCount.value = String(clamp(s.players, MIN_PLAYERS, MAX_PLAYERS));
    if (s.difficulty) setActiveDifficulty(s.difficulty);
    if (typeof s.suggestTitle === "boolean") setTitleToggle(s.suggestTitle);
    if (s.wordSet && PROMPT_SETS[s.wordSet]) el.wordsetSelect.value = s.wordSet;
    if (Array.isArray(s.colors)) setupColors = s.colors.slice();
    if (Array.isArray(s.names)) savedNames = s.names.slice();
  }

  function onStep(which, delta) {
    if (which === "timer") {
      const next = parseTimer(el.timerInput.value) + delta;
      el.timerInput.value = formatTime(clamp(next, MIN_TIMER, MAX_TIMER));
    } else if (which === "players") {
      const next = clamp(parseInt(el.playersCount.value, 10) + delta, MIN_PLAYERS, MAX_PLAYERS);
      el.playersCount.value = String(next);
      renderNameInputs();
    }
  }

  function firstUnusedColor(used) {
    return PLAYER_COLORS.find((c) => !used.includes(c)) || PLAYER_COLORS[used.length % PLAYER_COLORS.length];
  }

  // Keep one distinct color per player; preserve existing picks, fill new slots.
  function ensureColors(count) {
    setupColors = setupColors.slice(0, count);
    for (let i = setupColors.length; i < count; i++) setupColors[i] = firstUnusedColor(setupColors);
  }

  // A random color for player i — avoids the colors other players hold (and the
  // current one when possible) so players stay visually distinct.
  function randomColorFor(i) {
    const others = setupColors.filter((_, j) => j !== i);
    let pool = PLAYER_COLORS.filter((c) => !others.includes(c) && c !== setupColors[i]);
    if (pool.length === 0) pool = PLAYER_COLORS.filter((c) => !others.includes(c));
    if (pool.length === 0) pool = PLAYER_COLORS.slice();
    return pick(pool);
  }

  function renderNameInputs() {
    const count = clamp(parseInt(el.playersCount.value, 10) || 2, MIN_PLAYERS, MAX_PLAYERS);
    const existing = Array.from(el.playerNames.querySelectorAll("input")).map((i) => i.value);
    ensureColors(count);
    el.playerNames.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "name-row";

      // Clickable color dot — click to roll a new random color for this player.
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "color-dot";
      dot.style.background = setupColors[i];
      dot.title = "Click for a random color";
      dot.addEventListener("click", () => {
        setupColors[i] = randomColorFor(i);
        dot.style.background = setupColors[i];
      });

      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 20;
      input.value = existing[i] || savedNames[i] || "Player " + (i + 1);
      input.placeholder = "Player " + (i + 1);

      row.appendChild(dot);
      row.appendChild(input);
      el.playerNames.appendChild(row);
    }
  }

  /* ---------------------------- Start game ----------------------------- */
  function startGame() {
    const diffKey = el.difficultyGroup.querySelector(".seg.active").dataset.value;
    const players = Array.from(el.playerNames.querySelectorAll("input")).map((input, i) => ({
      name: (input.value.trim() || "Player " + (i + 1)).toUpperCase(),
      color: setupColors[i] || PLAYER_COLORS[i % PLAYER_COLORS.length],
    }));

    state.config = {
      timer: parseTimer(el.timerInput.value),
      difficulty: diffKey,
      suggestTitle: el.titleToggle.classList.contains("on"),
      wordSet: el.wordsetSelect.value,
      players,
    };
    state.muted = false;
    updateMuteButton();
    saveSettings(); // remember this configuration for next time

    buildDeck();
    ensureAudio(); // first user gesture — unlock audio

    el.setupScreen.classList.remove("active");
    el.gameScreen.classList.add("active");

    nextRound();
  }

  function buildDeck() {
    // Difficulty no longer filters prompts — it only controls turn length, so the
    // full chosen word set is in play regardless of tier.
    const all = PROMPT_SETS[state.config.wordSet] || [];
    state.deck = shuffle(all.slice());
    state.deckPos = 0;
  }

  function drawPrompt() {
    if (state.deckPos >= state.deck.length) {
      // Exhausted: reshuffle for a fresh pass.
      state.deck = shuffle(state.deck);
      state.deckPos = 0;
    }
    return state.deck[state.deckPos++];
  }

  /* --------------------------- Round lifecycle ------------------------- */
  function clearRevealTimers() {
    state.revealTimers.forEach(clearTimeout);
    state.revealTimers = [];
  }
  function after(ms, fn) {
    const id = setTimeout(fn, ms);
    state.revealTimers.push(id);
    return id;
  }

  function nextRound() {
    clearRevealTimers();
    stopLoop();
    state.prompt = drawPrompt();
    state.title = state.config.suggestTitle ? generateTitle() : "";
    state.activeIndex = -1;
    showReveal();
  }

  function showReveal() {
    state.phase = PHASE.REVEAL;
    clearPlayerTheme(); // reveal shows on the neutral dark background
    // Hide gameplay corners + stage
    el.stage.classList.add("hidden");
    el.roundEnd.classList.add("hidden");
    el.promptReminder.classList.add("hidden");
    el.timerDisplay.classList.add("hidden");

    el.revealTitle.textContent = state.title;
    el.revealTitle.style.display = state.title ? "block" : "none";
    el.revealPrompt.textContent = state.prompt;
    el.revealCue.textContent = "";
    el.reveal.classList.remove("hidden");

    const cues = ["Ready?", "Set.", "Go!"];
    cues.forEach((word, i) => {
      after(900 * (i + 1), () => {
        el.revealCue.textContent = word;
        el.revealCue.classList.remove("pop");
        void el.revealCue.offsetWidth; // restart animation
        el.revealCue.classList.add("pop");
        if (word === "Go!") sound.go();
      });
    });
    after(900 * 3 + 600, beginSpeaking);
  }

  function beginSpeaking() {
    state.phase = PHASE.SPEAKING;
    el.reveal.classList.add("hidden");
    el.stage.classList.remove("hidden");
    el.promptReminder.classList.remove("hidden");
    el.timerDisplay.classList.remove("hidden");
    el.timerDisplay.classList.remove("low");
    el.promptReminder.textContent = state.prompt;

    state.roundDuration = state.config.timer;
    state.elapsed = 0;
    state.paused = false;
    state.endAt = performance.now() + state.roundDuration * 1000;
    el.btnPause.textContent = "Pause";

    renderTimer();
    state.activeIndex = Math.floor(Math.random() * state.config.players.length); // random opener each round
    renderActiveName(false); // first speaker — no swap chime
    scheduleNextSwap();
    startLoop();
  }

  // A single turn's length in seconds: a random value in the difficulty's range,
  // scaled to the actual round length so turns stay relative to game longevity.
  function turnLengthSeconds() {
    const cfg = DIFFICULTY[state.config.difficulty];
    const [lo, hi] = cfg.turn;
    const scale = cfg.scale ? state.roundDuration / TURN_REF_SECONDS : 1;
    const secs = (lo + Math.random() * (hi - lo)) * scale;
    return clamp(secs, 2, state.roundDuration);
  }

  function scheduleNextSwap() {
    state.nextSwapAt = state.elapsed + turnLengthSeconds();
  }

  function renderActiveName(isSwap) {
    const player = state.config.players[state.activeIndex];
    el.activeName.textContent = player.name;
    applyPlayerTheme(player); // background + readable ink follow the active speaker
    // Re-trigger entry animation
    el.activeName.classList.remove("swap");
    void el.activeName.offsetWidth;
    el.activeName.classList.add("swap");
    if (isSwap) sound.swap();
  }

  function maybeSwap() {
    if (state.config.players.length <= 1) return; // solo: name stays the whole round
    if (state.elapsed < state.nextSwapAt) return;
    state.activeIndex = (state.activeIndex + 1) % state.config.players.length;
    renderActiveName(true);
    scheduleNextSwap();
  }

  function renderTimer() {
    const remaining = state.roundDuration - state.elapsed;
    el.timerDisplay.textContent = formatTime(remaining);
    el.timerDisplay.classList.toggle("low", remaining <= 10);
  }

  /* ------------------------------- Loop -------------------------------- */
  // Self-correcting countdown: elapsed is derived from the wall clock each tick,
  // so a single bad tick (or a thrown sound call) can never freeze the timer, and
  // it keeps counting even when the tab is backgrounded (unlike requestAnimationFrame).
  function startLoop() {
    stopLoop();
    state.tickId = setInterval(tick, 200);
  }

  function stopLoop() {
    if (state.tickId) clearInterval(state.tickId);
    state.tickId = null;
  }

  function tick() {
    if (state.phase !== PHASE.SPEAKING || state.paused) return;
    const remaining = (state.endAt - performance.now()) / 1000;
    state.elapsed = state.roundDuration - remaining;
    if (remaining <= 0) {
      state.elapsed = state.roundDuration;
      renderTimer();
      endRound();
      return;
    }
    renderTimer();
    maybeSwap();
  }

  function endRound() {
    stopLoop();
    state.phase = PHASE.ROUND_END;
    sound.end();
    clearPlayerTheme(); // reset icon shows on the neutral dark background
    el.stage.classList.add("hidden");
    el.promptReminder.classList.add("hidden");
    el.timerDisplay.classList.add("hidden");
    el.roundEnd.classList.remove("hidden");
    after(1600, nextRound);
  }

  /* ----------------------------- Controls ------------------------------ */
  function togglePause() {
    if (state.phase !== PHASE.SPEAKING) return;
    state.paused = !state.paused;
    if (state.paused) {
      // Freeze remaining time so resume continues exactly where it left off.
      state.pauseRemaining = (state.endAt - performance.now()) / 1000;
    } else {
      state.endAt = performance.now() + state.pauseRemaining * 1000;
    }
    el.btnPause.textContent = state.paused ? "Resume" : "Pause";
  }

  function skip() {
    if (state.phase === PHASE.SETUP) return;
    nextRound();
  }

  function toggleMute() {
    state.muted = !state.muted;
    updateMuteButton();
  }
  function updateMuteButton() {
    el.btnMute.textContent = state.muted ? "🔇" : "🔊";
  }

  function endGame() {
    clearRevealTimers();
    stopLoop();
    clearPlayerTheme();
    state.phase = PHASE.SETUP;
    el.gameScreen.classList.remove("active");
    el.setupScreen.classList.add("active");
  }

  function bindControls() {
    el.btnPause.addEventListener("click", togglePause);
    el.btnSkip.addEventListener("click", skip);
    el.btnMute.addEventListener("click", toggleMute);
    el.btnEnd.addEventListener("click", endGame);

    document.addEventListener("keydown", (e) => {
      if (state.phase === PHASE.SETUP) return;
      if (e.code === "Space") { e.preventDefault(); togglePause(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); skip(); }
      else if (e.code === "Escape") { e.preventDefault(); endGame(); }
      else if (e.key === "m" || e.key === "M") { toggleMute(); }
    });
  }

  /* ------------------------------- Init -------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    initSetup();
    bindControls();
  });
})();

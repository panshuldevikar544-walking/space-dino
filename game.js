/**
 * CHROME DINO: EVOLUTION - ARCADE WEB GAME ENGINE
 * Complete canvas-based runner with procedural retro pixel sprites,
 * tight hitboxes, Web Audio synthesizer, dynamic day/night cycles,
 * particle effects, power-ups, achievements, and responsive controls.
 */

// ============================================================
// 1. AUDIO CONTROLLER (Web Audio API Synthesizer)
// ============================================================
class AudioController {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.init();
  }

  init() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 8-bit Jump chirp (frequency rises rapidly)
  playJump() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Quick slide / duck whoosh
  playDuck() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 100-point classic milestone chime (dual tone)
  playMilestone() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(659.25, now, 0.1);       // E5
    playTone(880.00, now + 0.1, 0.18); // A5
  }

  // Power-up collect fanfare (C major arpeggio)
  playPowerup() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // Shield shatter / deflection burst
  playShieldBreak() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Crash / Game Over crunch (noise + deep drop)
  playHit() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Pitch dive
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);

    // Noise blast
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Retro 8-bit dynamic chiptune background beat
  startBGM() {
    if (!this.bgmEnabled || !this.ctx || this.bgmTimer) return;
    this.resume();
    const bassline = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
    const tempoMs = 180;

    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.bgmEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = bassline[this.bgmStep % bassline.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // Hi-hat tick on off-beats
      if (this.bgmStep % 2 === 1) {
        const hOsc = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        hOsc.type = 'square';
        hOsc.frequency.setValueAtTime(3200, now);
        hGain.gain.setValueAtTime(0.02, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hOsc.connect(hGain);
        hGain.connect(this.ctx.destination);
        hOsc.start(now);
        hOsc.stop(now + 0.05);
      }

      this.bgmStep++;
    }, tempoMs);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }
}

// ============================================================
// 2. PIXEL SPRITE MATRIX GENERATOR
// ============================================================
// Authentic pixel art rendered accurately at any scale without external image loads!
const PIXEL_DATA = {
  // Dino Running Frame 1 (16x16 simplified pixel matrix)
  dinoRun1: [
    "..........XXXX..",
    ".........XXXXXXX",
    ".........XX.XXXX",
    ".........XXXXXXX",
    ".........XXXX...",
    "........XXXXXXXX",
    "..X....XXXXXXXX.",
    "..XX..XXXXXXXX..",
    "..XXXXXXXXXXX...",
    "...XXXXXXXXX....",
    "....XXXXXXX.....",
    ".....XXXXXX.....",
    "......X..X......",
    "......X...X.....",
    "......XX........",
    "................"
  ],
  // Dino Running Frame 2
  dinoRun2: [
    "..........XXXX..",
    ".........XXXXXXX",
    ".........XX.XXXX",
    ".........XXXXXXX",
    ".........XXXX...",
    "........XXXXXXXX",
    "..X....XXXXXXXX.",
    "..XX..XXXXXXXX..",
    "..XXXXXXXXXXX...",
    "...XXXXXXXXX....",
    "....XXXXXXX.....",
    ".....XXXXXX.....",
    "......X..X......",
    ".....X...X......",
    ".........XX.....",
    "................"
  ],
  // Dino Jumping
  dinoJump: [
    "..........XXXX..",
    ".........XXXXXXX",
    ".........XX.XXXX",
    ".........XXXXXXX",
    ".........XXXX...",
    "........XXXXXXXX",
    "..X....XXXXXXXX.",
    "..XX..XXXXXXXX..",
    "..XXXXXXXXXXX...",
    "...XXXXXXXXX....",
    "....XXXXXXX.....",
    ".....XXXXXX.....",
    "......X..X......",
    ".....XX..XX.....",
    "................",
    "................"
  ],
  // Dino Ducking Frame 1 (Low & elongated: 24 wide x 12 high)
  dinoDuck1: [
    "..................XXXXXX",
    "................XXXXXXXX",
    "................XX.XXXXX",
    "................XXXXXXXX",
    "....XXXXXXXXXXXXXXXXXXXX",
    "..XXXXXXXXXXXXXXXXXX....",
    "XXXXXXXXXXXXXXXXXXXX....",
    ".XXXXXXXXXXXXXXXXXX.....",
    "..XXXXXXXXXXXXXX........",
    "....XXXX..XXXX..........",
    "....XX.....XX...........",
    "....XXX................."
  ],
  // Dino Ducking Frame 2
  dinoDuck2: [
    "..................XXXXXX",
    "................XXXXXXXX",
    "................XX.XXXXX",
    "................XXXXXXXX",
    "....XXXXXXXXXXXXXXXXXXXX",
    "..XXXXXXXXXXXXXXXXXX....",
    "XXXXXXXXXXXXXXXXXXXX....",
    ".XXXXXXXXXXXXXXXXXX.....",
    "..XXXXXXXXXXXXXX........",
    "....XXXX..XXXX..........",
    ".....XX....XX...........",
    "...........XXX.........."
  ],
  // Dino Dead (Surprised / X eyes)
  dinoDead: [
    "..........XXXX..",
    ".........XXXXXXX",
    ".........X.X.XXX",
    ".........XXXXXXX",
    ".........XXXX...",
    "........XXXXXXXX",
    "..X....XXXXXXXX.",
    "..XX..XXXXXXXX..",
    "..XXXXXXXXXXX...",
    "...XXXXXXXXX....",
    "....XXXXXXX.....",
    ".....XXXXXX.....",
    "......X..X......",
    "......X..X......",
    ".....XX..XX.....",
    "................"
  ],
  // Pterodactyl Wing Up (16x14)
  pteroUp: [
    ".....XX.........",
    "....XXXX........",
    "...XXXXXX.......",
    "..XXXXXXXX......",
    ".XXXXXXXXX......",
    "XXXXXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXX...",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    "......XXXX......",
    ".......XX.......",
    "................",
    "................"
  ],
  // Pterodactyl Wing Down
  pteroDown: [
    "................",
    "................",
    "XXXXXXXXXXXXXX..",
    "XXXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXX...",
    "....XXXXXXXX....",
    ".....XXXXXX.....",
    "......XXXX......",
    ".....XXXXXX.....",
    "....XXXXXXXX....",
    "...XXXXXXXXXX...",
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXX..",
    "XXXXXXXXXXXXXXXX"
  ],
  // Small Cactus (10x16)
  cactusSmall: [
    "...XX.....",
    "...XX.....",
    "...XX..XX.",
    ".X.XX..XX.",
    ".X.XX..XX.",
    ".X.XX..XX.",
    ".XXXXX.XX.",
    "...XXXXXX.",
    "...XX..XX.",
    "...XX.....",
    "...XX.....",
    "...XX.....",
    "...XX.....",
    "...XX.....",
    "...XX.....",
    "..XXXX...."
  ],
  // Tall Cactus (12x22)
  cactusTall: [
    "....XX......",
    "....XX......",
    "....XX..XX..",
    ".XX.XX..XX..",
    ".XX.XX..XX..",
    ".XX.XX..XX..",
    ".XXXXX..XX..",
    ".XXXXX.XXX..",
    "....XXXXXX..",
    "....XX..XX..",
    "....XX......",
    "....XX......",
    "....XX......",
    "....XX..XX..",
    "....XX.XXX..",
    "....XXXXX...",
    "....XX......",
    "....XX......",
    "....XX......",
    "....XX......",
    "....XX......",
    "...XXXX....."
  ]
};

// ============================================================
// 3. MAIN GAME ENGINE
// ============================================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new AudioController();

    // Virtual Game Coordinates
    this.V_WIDTH = 1400;
    this.V_HEIGHT = 450;
    this.GROUND_Y = 390;

    // Game States
    this.STATE_IDLE = 'IDLE';
    this.STATE_PLAYING = 'PLAYING';
    this.STATE_PAUSED = 'PAUSED';
    this.STATE_GAMEOVER = 'GAMEOVER';
    this.state = this.STATE_IDLE;

    // Physics Constants - Calculated via Projection Motion Formula
    // Range (R) = vx * t_air = vx * (2 * |vy|) / g
    // Target: R = ~175px range (increased), H = ~191px height (increased)
    // R = 2.0 * (2 * 8.75) / 0.20 = 175px
    // H = vy^2 / (2g) = 8.75^2 / 0.40 = 191.4px
    this.BASE_SPEED = 2.0;          // Slower starting speed
    this.MAX_SPEED = 12.0;          // Lower max speed
    this.GRAVITY = 0.20;            // Slower falling speed
    this.JUMP_FORCE = -8.75;        // Adjusted for height and range goals

    // Game Variables
    this.speed = this.BASE_SPEED;
    this.score = 0;
    this.distanceRun = 0;
    this.highScore = parseInt(localStorage.getItem('dino_highscore') || '0', 10);
    this.birdsDodged = 0;
    this.powerupsCollected = 0;
    this.lastMilestoneScore = 0;
    this.isNewHighScore = false;

    // Day/Night & Environment
    this.timeOfDay = 0; // 0 to 1 cycle: 0 = day, 0.35 = sunset, 0.5 = night, 0.85 = sunrise
    this.stars = [];
    this.clouds = [];
    this.groundPebbles = [];
    this.distantMountains = [];

    // Player Dino
    this.dino = {
      x: 70,
      y: this.GROUND_Y - 50,
      w: 48,
      h: 52,
      vy: 0,
      isGrounded: true,
      isDucking: false,
      jumpHold: false,
      runAnimTimer: 0,
      runFrame: 0,
      shieldActive: false,
      slowMoActive: false,
      jetpackActive: false,
      powerupTimeLeft: 0,
      powerupTotalTime: 0,
      activePowerupType: null
    };

    // Entities
    this.obstacles = [];
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.nextObstacleDistance = 0;

    // Themes
    this.theme = 'cyberpunk';
    this.themeColors = {
      cyberpunk: {
        skyDay: '#0e0b1d',
        skyNight: '#04020a',
        sun: '#ff2a85',
        moon: '#00f0ff',
        ground: '#181236',
        groundLine: '#00f0ff',
        dino: '#00f0ff',
        obstacle: '#ff2a85',
        ptero: '#ffe600',
        particle: '#00f0ff',
        cloud: 'rgba(255, 42, 133, 0.15)'
      },
      classic: {
        skyDay: '#f7f7f7',
        skyNight: '#202124',
        sun: '#e0e0e0',
        moon: '#ffffff',
        ground: '#e0e0e0',
        groundLine: '#535353',
        dino: '#535353',
        obstacle: '#535353',
        ptero: '#535353',
        particle: '#808080',
        cloud: 'rgba(0, 0, 0, 0.08)'
      },
      sunset: {
        skyDay: '#2b1029',
        skyNight: '#0e0513',
        sun: '#ff8438',
        moon: '#ffc43d',
        ground: '#36152b',
        groundLine: '#ff8438',
        dino: '#ffc43d',
        obstacle: '#ff3366',
        ptero: '#ff8438',
        particle: '#ffc43d',
        cloud: 'rgba(255, 132, 56, 0.2)'
      },
      matrix: {
        skyDay: '#031407',
        skyNight: '#010803',
        sun: '#00ff66',
        moon: '#00ffaa',
        ground: '#06240d',
        groundLine: '#00ff66',
        dino: '#00ff66',
        obstacle: '#00ffaa',
        ptero: '#88ff00',
        particle: '#00ff66',
        cloud: 'rgba(0, 255, 102, 0.12)'
      }
    };

    // Stats & Achievements
    this.careerStats = JSON.parse(localStorage.getItem('dino_career_stats') || JSON.stringify({
      runs: 0,
      totalDistance: 0,
      birdsDodged: 0,
      powerupsCollected: 0
    }));

    this.achievements = [
      { id: 'first_leap', title: 'First Leap', desc: 'Perform your first jump', icon: '🦘', unlocked: false },
      { id: 'century', title: 'Century Club', desc: 'Reach a score of 100', icon: '💯', unlocked: false },
      { id: 'bird_dodger', title: 'Sky Acrobat', desc: 'Dodge 5 pterodactyls', icon: '🦅', unlocked: false },
      { id: 'shield_up', title: 'Iron Hide', desc: 'Collect a Shield power-up', icon: '🛡️', unlocked: false },
      { id: 'jetpack_joy', title: 'Stratosphere', desc: 'Soar with a Jetpack', icon: '🚀', unlocked: false },
      { id: 'night_owl', title: 'Night Owl', desc: 'Survive through a night cycle', icon: '🌙', unlocked: false },
      { id: 'speed_demon', title: 'Warp Speed', desc: 'Reach 2.0x game speed', icon: '⚡', unlocked: false },
      { id: 'legend', title: 'Dino Legend', desc: 'Achieve a score of 1,000+', icon: '👑', unlocked: false }
    ];
    this.loadAchievements();

    // DOM Elements
    this.bindDOMElements();
    this.setupListeners();
    this.setupEnvironment();
    this.handleResize();

    // Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // ============================================================
  // DOM & UI BINDINGS
  // ============================================================
  bindDOMElements() {
    this.hudSpeed = document.getElementById('hudSpeed');
    this.hudHealth = document.getElementById('hudHealth');
    this.hudHighScore = document.getElementById('hudHighScore');
    this.hudCurrentScore = document.getElementById('hudCurrentScore');
    this.hudPowerupPill = document.getElementById('hudPowerupPill');
    this.hudPowerupIcon = document.getElementById('hudPowerupIcon');
    this.hudPowerupName = document.getElementById('hudPowerupName');
    this.hudPowerupFill = document.getElementById('hudPowerupFill');

    this.startOverlay = document.getElementById('startOverlay');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOverOverlay = document.getElementById('gameOverOverlay');
    this.newRecordBanner = document.getElementById('newRecordBanner');
    this.finalScoreVal = document.getElementById('finalScoreVal');
    this.bestScoreVal = document.getElementById('bestScoreVal');
    this.statDistance = document.getElementById('statDistance');
    this.statPowerups = document.getElementById('statPowerups');
    this.statDodges = document.getElementById('statDodges');
    this.leaderboardList = document.getElementById('leaderboardList');

    this.sfxToggle = document.getElementById('sfxToggle');
    this.musicToggle = document.getElementById('musicToggle');
    this.crtToggle = document.getElementById('crtToggle');
    this.crtOverlay = document.getElementById('crtOverlay');
    this.achievementsBtn = document.getElementById('achievementsBtn');
    this.achievementsModal = document.getElementById('achievementsModal');
    this.closeAchievements = document.getElementById('closeAchievements');
    this.achievementsList = document.getElementById('achievementsList');
    this.careerStatsContainer = document.getElementById('careerStats');

    this.updateHUD();
  }

  setupEnvironment() {
    // Generate initial twinkling stars
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.V_WIDTH,
        y: Math.random() * (this.GROUND_Y - 90),
        size: Math.random() * 2 + 1,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }

    // Generate parallax clouds
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: (this.V_WIDTH / 4) * i + Math.random() * 60,
        y: 40 + Math.random() * 90,
        speed: 0.35 + Math.random() * 0.25,
        scale: 0.8 + Math.random() * 0.5
      });
    }

    // Generate ground pebbles
    this.groundPebbles = [];
    for (let i = 0; i < 30; i++) {
      this.groundPebbles.push({
        x: Math.random() * this.V_WIDTH,
        y: this.GROUND_Y + 4 + Math.random() * 30,
        width: 2 + Math.random() * 6,
        height: 2 + Math.random() * 2
      });
    }

    // Distant mountain skyline
    this.distantMountains = [];
    let curX = 0;
    while (curX < this.V_WIDTH + 150) {
      const peakW = 80 + Math.random() * 100;
      const peakH = 40 + Math.random() * 65;
      this.distantMountains.push({ x: curX, w: peakW, h: peakH });
      curX += peakW * 0.85;
    }
  }

  // ============================================================
  // EVENT LISTENERS & INPUTS
  // ============================================================
  setupListeners() {
    window.addEventListener('resize', () => this.handleResize());

    // Keyboard
    window.addEventListener('keydown', (e) => {
      // Audio context unlock on any key
      this.audio.resume();

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.handleJumpPress();
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.handleDuck(true);
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        this.togglePause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        this.toggleMusicUI();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.handleJumpRelease();
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.handleDuck(false);
      }
    });

    // Button Clicks
    document.getElementById('btnPlay').addEventListener('click', () => this.startGame());
    document.getElementById('btnResume').addEventListener('click', () => this.togglePause());
    document.getElementById('btnRestartFromPause').addEventListener('click', () => this.restartGame());
    document.getElementById('btnRestart').addEventListener('click', () => this.restartGame());

    // Theme Picker
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.setTheme(e.currentTarget.dataset.theme);
      });
    });

    // Audio & CRT Toggles
    this.sfxToggle.addEventListener('click', () => {
      const active = this.audio.toggleSFX();
      this.sfxToggle.classList.toggle('muted', !active);
    });

    this.musicToggle.addEventListener('click', () => {
      this.toggleMusicUI();
    });

    this.crtToggle.addEventListener('click', () => {
      this.crtOverlay.classList.toggle('disabled');
      this.crtToggle.classList.toggle('muted', this.crtOverlay.classList.contains('disabled'));
    });

    // Touch Controls
    const touchJump = document.getElementById('touchJump');
    const touchDuck = document.getElementById('touchDuck');

    touchJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleJumpPress();
    }, { passive: false });

    touchJump.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleJumpRelease();
    }, { passive: false });

    touchDuck.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleDuck(true);
    }, { passive: false });

    touchDuck.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleDuck(false);
    }, { passive: false });

    // Tap on Canvas itself (Jump on top 70%, duck on bottom 30%)
    this.canvas.addEventListener('pointerdown', (e) => {
      this.audio.resume();
      if (this.state === this.STATE_IDLE || this.state === this.STATE_GAMEOVER) {
        this.startGame();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top) / rect.height;
      if (relativeY > 0.7) {
        this.handleDuck(true);
      } else {
        this.handleJumpPress();
      }
    });

    this.canvas.addEventListener('pointerup', () => {
      this.handleJumpRelease();
      this.handleDuck(false);
    });

    // Achievements Modal
    this.achievementsBtn.addEventListener('click', () => this.showAchievementsModal());
    this.closeAchievements.addEventListener('click', () => this.hideAchievementsModal());
    this.achievementsModal.addEventListener('click', (e) => {
      if (e.target === this.achievementsModal) this.hideAchievementsModal();
    });
  }

  toggleMusicUI() {
    const active = this.audio.toggleBGM();
    this.musicToggle.classList.toggle('muted', !active);
  }

  setTheme(themeName) {
    if (this.themeColors[themeName]) {
      this.theme = themeName;
      document.body.className = `theme-${themeName}`;
    }
  }

  handleResize() {
    const viewport = document.getElementById('canvasViewport');
    const dpr = window.devicePixelRatio || 1;
    const rect = viewport.getBoundingClientRect();

    // Dynamically calculate V_WIDTH to match the actual CSS aspect ratio 
    // This completely eliminates stretching/squishing on mobile phones!
    const aspectRatio = rect.width / rect.height;
    this.V_WIDTH = this.V_HEIGHT * aspectRatio;

    // Scale canvas buffer for high-DPI clarity while preserving internal coordinates
    this.canvas.width = this.V_WIDTH * dpr;
    this.canvas.height = this.V_HEIGHT * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = false; // Keep pixel crispness!
  }

  // ============================================================
  // GAMEPLAY ACTIONS & INPUT HANDLERS
  // ============================================================
  handleJumpPress() {
    if (this.state === this.STATE_IDLE || this.state === this.STATE_GAMEOVER) {
      this.startGame();
      return;
    }
    if (this.state === this.STATE_PAUSED) return;

    if (this.dino.isGrounded) {
      this.dino.vy = this.JUMP_FORCE;
      this.dino.isGrounded = false;
      this.dino.jumpHold = true;
      this.audio.playJump();
      this.triggerAchievement('first_leap');

      // Create enhanced ground dust burst on jump
      this.createPuffParticles(this.dino.x + 24, this.GROUND_Y, 15, '#ffffff');
    }
  }

  handleJumpRelease() {
    this.dino.jumpHold = false;
    // Variable jump height: release early to cut upward velocity
    if (this.dino.vy < -5) {
      this.dino.vy *= 0.5;
    }
  }

  handleDuck(isDucking) {
    if (this.state !== this.STATE_PLAYING) return;

    if (isDucking) {
      this.dino.isDucking = true;
      this.dino.h = 30; // Shorter hitbox
      this.dino.w = 58;

      // Fast fall if ducking in air
      if (!this.dino.isGrounded) {
        this.dino.vy += 4.5;
      } else {
        this.audio.playDuck();
      }
    } else {
      this.dino.isDucking = false;
      this.dino.h = 52;
      this.dino.w = 48;
    }
  }

  togglePause() {
    if (this.state === this.STATE_PLAYING) {
      this.state = this.STATE_PAUSED;
      this.pauseOverlay.classList.remove('hidden');
    } else if (this.state === this.STATE_PAUSED) {
      this.state = this.STATE_PLAYING;
      this.pauseOverlay.classList.add('hidden');
    }
  }

  // ============================================================
  // GAME LIFECYCLE
  // ============================================================
  startGame() {
    this.state = this.STATE_PLAYING;
    this.speed = this.BASE_SPEED;
    this.score = 0;
    this.dino.health = 3;
    this.updateHealthHUD();
    this.distanceRun = 0;
    this.birdsDodged = 0;
    this.powerupsCollected = 0;
    this.lastMilestoneScore = 0;
    this.isNewHighScore = false;
    this.timeOfDay = 0;

    // Reset Dino
    this.dino.y = this.GROUND_Y - 52;
    this.dino.vy = 0;
    this.dino.isGrounded = true;
    this.dino.isDucking = false;
    this.dino.shieldActive = false;
    this.dino.slowMoActive = false;
    this.dino.jetpackActive = false;
    this.dino.fallingFromJetpack = false;
    this.dino.invincibleTimeLeft = 0;
    this.dino.powerupTimeLeft = 0;
    this.dino.activePowerupType = null;

    // Clear obstacles & particles
    this.obstacles = [];
    this.powerups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.nextObstacleDistance = 280; // Gentle runway before first obstacle spawns

    // Overlays
    this.startOverlay.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');
    this.gameOverOverlay.classList.add('hidden');
    this.hudPowerupPill.classList.add('hidden');

    this.careerStats.runs++;
    this.saveCareerStats();
  }

  restartGame() {
    this.startGame();
  }

  getLeaderboard() {
    try {
      const data = localStorage.getItem('dino_leaderboard');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveLeaderboard(leaderboard) {
    localStorage.setItem('dino_leaderboard', JSON.stringify(leaderboard));
  }

  renderLeaderboard(currentName = null) {
    if (!this.leaderboardList) return;
    const leaderboard = this.getLeaderboard();
    this.leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
      this.leaderboardList.innerHTML = '<li><em>No records yet</em></li>';
      return;
    }
    
    leaderboard.forEach((entry, index) => {
      const li = document.createElement('li');
      if (entry.name === currentName && entry.score === this.score) {
        li.className = 'current-player';
      }
      
      const rank = document.createElement('span');
      rank.textContent = `#${index + 1} ${entry.name}`;
      
      const score = document.createElement('span');
      score.textContent = this.padScore(entry.score);
      
      li.appendChild(rank);
      li.appendChild(score);
      this.leaderboardList.appendChild(li);
    });
  }

  gameOver() {
    this.state = this.STATE_GAMEOVER;
    this.audio.playHit();

    // Check High Score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      localStorage.setItem('dino_highscore', this.highScore.toString());
    }

    // Death particles burst
    const colors = [this.themeColors[this.theme].dino, '#ffffff', '#ff2a85'];
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: this.dino.x + 20,
        y: this.dino.y + 20,
        vx: (Math.random() * 2 - 1) * 7,
        vy: (Math.random() * 2 - 1) * 7 - 2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }

    // Update Career Stats
    this.careerStats.totalDistance += Math.floor(this.distanceRun);
    this.careerStats.birdsDodged += this.birdsDodged;
    this.careerStats.powerupsCollected += this.powerupsCollected;
    this.saveCareerStats();

    // Show Game Over Overlay
    this.finalScoreVal.textContent = this.padScore(this.score);
    this.bestScoreVal.textContent = this.padScore(this.highScore);
    this.newRecordBanner.classList.toggle('hidden', !this.isNewHighScore);
    this.statDistance.textContent = `🏃 Distance: ${Math.floor(this.distanceRun)}m`;
    this.statPowerups.textContent = `⚡ Powerups: ${this.powerupsCollected}`;
    this.statDodges.textContent = `🦅 Birds Dodged: ${this.birdsDodged}`;

    this.gameOverOverlay.classList.remove('hidden');

    // Leaderboard Prompt Logic
    let leaderboard = this.getLeaderboard();
    if (this.score > 0 && (leaderboard.length < 5 || this.score > (leaderboard[leaderboard.length - 1]?.score || 0))) {
      setTimeout(() => {
        let name = prompt(`Great job! You scored ${this.score}. Enter your name for the leaderboard:`, "Player");
        if (name) {
          name = name.trim().substring(0, 15) || "Player";
          leaderboard.push({ name: name, score: this.score });
          leaderboard.sort((a, b) => b.score - a.score);
          leaderboard = leaderboard.slice(0, 5);
          this.saveLeaderboard(leaderboard);
          this.renderLeaderboard(name);
        } else {
          this.renderLeaderboard();
        }
      }, 300); // Small delay so overlay is visible first
    } else {
      this.renderLeaderboard();
    }
  }

  // ============================================================
  // UPDATE LOOP (PHYSICS & SPAWNING)
  // ============================================================
  update(dt) {
    if (this.state !== this.STATE_PLAYING) return;

    // Day / Night Cycle (Full day-night in 45 seconds of running)
    this.timeOfDay = (this.timeOfDay + dt * 0.022) % 1.0;
    if (this.timeOfDay > 0.5 && this.timeOfDay < 0.6) {
      this.triggerAchievement('night_owl');
    }

    // Speed Ramping using a mathematical curve
    let currentMax = this.MAX_SPEED;
    if (this.dino.slowMoActive) {
      currentMax *= 0.6;
    }
    // Curve: speed = BASE_SPEED + (distanceRun / 1000)^1.25
    // Provides a very slow start that builds up much more gradually
    let calculatedSpeed = this.BASE_SPEED + Math.pow(this.distanceRun / 1000, 1.25);
    this.speed = Math.min(calculatedSpeed, currentMax);

    if (this.speed >= this.BASE_SPEED * 2.0) {
      this.triggerAchievement('speed_demon');
    }

    // Update Distance & Score
    const effectiveSpeed = this.dino.slowMoActive ? this.speed * 0.6 : this.speed;
    this.distanceRun += (effectiveSpeed * dt * 3.5);
    this.score = Math.floor(this.distanceRun / 3);

    // 100-Point Milestone Celebrations
    if (this.score > 0 && Math.floor(this.score / 100) > Math.floor(this.lastMilestoneScore / 100)) {
      this.lastMilestoneScore = this.score;
      this.audio.playMilestone();
      this.addFloatingText('+100 MILESTONE', this.dino.x + 80, this.dino.y - 20, '#ffe600');
    }

    // Check Achievements
    if (this.score >= 100) this.triggerAchievement('century');
    if (this.score >= 1000) this.triggerAchievement('legend');

    // Power-up Timer
    if (this.dino.invincibleTimeLeft > 0) {
      this.dino.invincibleTimeLeft -= dt;
    }

    if (this.dino.powerupTimeLeft > 0) {
      this.dino.powerupTimeLeft -= dt;
      const progress = Math.max(0, this.dino.powerupTimeLeft / this.dino.powerupTotalTime);
      this.hudPowerupFill.style.width = `${progress * 100}%`;

      if (this.dino.powerupTimeLeft <= 0) {
        this.clearActivePowerup();
      }
    }

    // Dino Physics & Movement
    if (this.dino.jetpackActive) {
      // Smooth hover in the sky!
      const targetSkyY = this.GROUND_Y - 140;
      this.dino.y += (targetSkyY - this.dino.y) * 0.1;
      this.dino.isGrounded = false;

      // Jetpack sparks
      if (Math.random() < 0.6) {
        this.particles.push({
          x: this.dino.x + 10,
          y: this.dino.y + 40,
          vx: -3 - Math.random() * 4,
          vy: 2 + Math.random() * 3,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#ffe600' : '#ff2a85',
          life: 1.0,
          decay: 0.08
        });
      }
    } else {
      // Normal Gravity
      this.dino.vy += this.GRAVITY;
      this.dino.y += this.dino.vy;

      const targetGroundY = this.GROUND_Y - this.dino.h;
      if (this.dino.y >= targetGroundY) {
        // Landing Effect
        if (!this.dino.isGrounded) {
          this.createPuffParticles(this.dino.x + 24, this.GROUND_Y, 12, '#ffffff');
          
          if (this.dino.fallingFromJetpack) {
            this.dino.fallingFromJetpack = false;
            this.dino.invincibleTimeLeft = 5.0; // 5 seconds of invincibility
            this.addFloatingText('INVINCIBLE!', this.dino.x + 30, this.dino.y - 30, '#ffe600');
          }
        }
        this.dino.y = targetGroundY;
        this.dino.vy = 0;
        this.dino.isGrounded = true;
      }
    }

    // Run Animation
    this.dino.runAnimTimer += dt * (effectiveSpeed * 1.5);
    if (this.dino.runAnimTimer > 1) {
      this.dino.runAnimTimer = 0;
      this.dino.runFrame = (this.dino.runFrame + 1) % 2;

      // Small footstep dust
      if (this.dino.isGrounded && !this.dino.jetpackActive && Math.random() < 0.4) {
        this.createPuffParticles(this.dino.x + 8, this.GROUND_Y, 2);
      }
    }

    // Environment Parallax Update
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * (effectiveSpeed / this.BASE_SPEED);
      if (cloud.x < -100) cloud.x = this.V_WIDTH + 50;
    });

    this.groundPebbles.forEach(pebble => {
      pebble.x -= effectiveSpeed;
      if (pebble.x < -20) pebble.x = this.V_WIDTH + Math.random() * 30;
    });

    this.distantMountains.forEach(m => {
      m.x -= effectiveSpeed * 0.15;
      if (m.x + m.w < 0) {
        m.x = this.V_WIDTH + 20;
      }
    });

    // Obstacle Spawning & Movement
    this.nextObstacleDistance -= effectiveSpeed;
    if (this.nextObstacleDistance <= 0) {
      this.spawnObstacle();
      // Variable distance between obstacles to keep gameplay rhythmic
      const minDistance = Math.max(160, 320 - effectiveSpeed * 8);
      const maxDistance = Math.max(260, 500 - effectiveSpeed * 10);
      this.nextObstacleDistance = minDistance + Math.random() * (maxDistance - minDistance);
    }

    // Random Power-up Spawning (Chance every ~12 seconds)
    if (Math.random() < 0.0025 && this.powerups.length === 0 && !this.dino.activePowerupType) {
      this.spawnPowerup();
    }

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= effectiveSpeed;

      // Wing flap for Pterodactyl
      if (obs.type === 'ptero') {
        obs.animTimer = (obs.animTimer || 0) + dt * 8;
        obs.frame = Math.floor(obs.animTimer) % 2;

        // Check if safely dodged
        if (!obs.dodged && obs.x + obs.w < this.dino.x) {
          obs.dodged = true;
          this.birdsDodged++;
          if (this.birdsDodged >= 5) this.triggerAchievement('bird_dodger');
        }
      }

      // Collision Detection
      if (this.checkCollision(this.dino, obs)) {
        if (this.dino.invincibleTimeLeft > 0) {
          // Smash through obstacle!
          this.audio.playShieldBreak();
          this.createPuffParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, 20, '#ffe600');
          this.addFloatingText('SMASH!', this.dino.x + 30, this.dino.y - 20, '#ffe600');
          this.obstacles.splice(i, 1);
          continue;
        } else if (this.dino.shieldActive) {
          // Shield absorbs the blow!
          this.audio.playShieldBreak();
          this.createPuffParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, 20, '#00f0ff');
          this.addFloatingText('SHIELD SAVED!', this.dino.x + 30, this.dino.y - 20, '#00f0ff');
          this.clearActivePowerup();
          this.obstacles.splice(i, 1);
          continue;
        } else {
          // Take damage instead of instant game over
          this.dino.health--;
          this.updateHealthHUD();
          if (this.dino.health > 0) {
            this.audio.playShieldBreak(); // Reuse break sound for damage
            this.createPuffParticles(this.dino.x + 24, this.dino.y + 24, 20, '#ff0000');
            this.addFloatingText('-1 HP!', this.dino.x + 30, this.dino.y - 20, '#ff0000');
            this.dino.invincibleTimeLeft = 2.0; // 2 seconds of mercy invincibility
            this.obstacles.splice(i, 1);
            continue;
          } else {
            this.gameOver();
            return;
          }
        }
      }

      // Remove off-screen obstacles
      if (obs.x + obs.w < -60) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pup = this.powerups[i];
      pup.x -= effectiveSpeed;
      pup.floatPhase = (pup.floatPhase || 0) + dt * 5;
      pup.renderY = pup.y + Math.sin(pup.floatPhase) * 6;

      // Check Collection
      if (this.checkCollision(this.dino, { x: pup.x, y: pup.renderY, w: pup.w, h: pup.h })) {
        this.collectPowerup(pup);
        this.powerups.splice(i, 1);
        continue;
      }

      if (pup.x + pup.w < -40) {
        this.powerups.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 25;
      ft.life -= dt * 0.8;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    this.updateHUD();
  }

  // ============================================================
  // SPAWNING MECHANICS
  // ============================================================
  spawnObstacle() {
    const isPteroAllowed = this.score > 120;
    const spawnPtero = isPteroAllowed && Math.random() < 0.38;

    if (spawnPtero) {
      // 3 Pterodactyl Heights:
      // High (can run under), Mid (must duck), Low (must jump)
      const heights = [
        this.GROUND_Y - 95, // High
        this.GROUND_Y - 60, // Mid (DUCK REQUIRED)
        this.GROUND_Y - 32  // Low (JUMP REQUIRED)
      ];
      const selectedY = heights[Math.floor(Math.random() * heights.length)];

      this.obstacles.push({
        type: 'ptero',
        x: this.V_WIDTH + 20,
        y: selectedY,
        w: 48,
        h: 38,
        animTimer: 0,
        frame: 0,
        dodged: false
      });
    } else {
      // Cacti Variations - progressive challenge unlocking as score increases
      let cactusTypes = ['small'];
      if (this.score >= 35) {
        cactusTypes.push('tall');
      }
      if (this.score >= 80) {
        cactusTypes.push('double_small');
      }
      if (this.score >= 140) {
        cactusTypes.push('triple_small', 'tall_group');
      }
      const pick = cactusTypes[Math.floor(Math.random() * cactusTypes.length)];

      let w = 24;
      let h = 44;
      if (pick === 'tall') {
        w = 26;
        h = 60;
      } else if (pick === 'double_small') {
        w = 46;
        h = 44;
      } else if (pick === 'triple_small') {
        w = 66;
        h = 44;
      } else if (pick === 'tall_group') {
        w = 54;
        h = 60;
      }

      this.obstacles.push({
        type: 'cactus',
        subtype: pick,
        x: this.V_WIDTH + 20,
        y: this.GROUND_Y - h,
        w: w,
        h: h
      });
    }
  }

  spawnPowerup() {
    const types = ['shield', 'slowmo', 'jetpack', 'bonus'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    this.powerups.push({
      type: chosenType,
      x: this.V_WIDTH + 40,
      y: this.GROUND_Y - 80 - Math.random() * 40,
      w: 32,
      h: 32,
      floatPhase: 0
    });
  }

  collectPowerup(pup) {
    this.audio.playPowerup();
    this.powerupsCollected++;
    this.createPuffParticles(pup.x + 16, pup.y + 16, 16, '#ffe600');

    if (pup.type === 'shield') {
      this.activatePowerup('shield', 'SHIELD', '🛡️', 12);
      this.dino.shieldActive = true;
      this.triggerAchievement('shield_up');
      this.addFloatingText('SHIELD ONLINE!', this.dino.x + 30, this.dino.y - 20, '#00f0ff');
    } else if (pup.type === 'slowmo') {
      this.activatePowerup('slowmo', 'SLOW-MO', '⏱️', 7);
      this.dino.slowMoActive = true;
      this.addFloatingText('CHRONO SLOW!', this.dino.x + 30, this.dino.y - 20, '#05ffa1');
    } else if (pup.type === 'jetpack') {
      this.activatePowerup('jetpack', 'JETPACK', '🚀', 6);
      this.dino.jetpackActive = true;
      this.triggerAchievement('jetpack_joy');
      this.addFloatingText('JETPACK BOOST!', this.dino.x + 30, this.dino.y - 20, '#ff2a85');
    } else if (pup.type === 'bonus') {
      this.distanceRun += 450;
      this.addFloatingText('+150 BONUS!', this.dino.x + 30, this.dino.y - 20, '#ffe600');
    }
  }

  activatePowerup(type, name, icon, duration) {
    this.clearActivePowerup();
    this.dino.activePowerupType = type;
    this.dino.powerupTotalTime = duration;
    this.dino.powerupTimeLeft = duration;

    this.hudPowerupName.textContent = name;
    this.hudPowerupIcon.textContent = icon;
    this.hudPowerupFill.style.width = '100%';
    this.hudPowerupPill.classList.remove('hidden');
  }

  clearActivePowerup() {
    if (this.dino.jetpackActive) {
      this.dino.fallingFromJetpack = true;
    }
    this.dino.shieldActive = false;
    this.dino.slowMoActive = false;
    this.dino.jetpackActive = false;
    this.dino.activePowerupType = null;
    this.dino.powerupTimeLeft = 0;
    this.hudPowerupPill.classList.add('hidden');
  }

  // ============================================================
  // FAIR HITBOX COLLISION SYSTEM
  // ============================================================
  checkCollision(dino, entity) {
    // Generous inset padding so players don't die on transparent sprite fringes!
    const dinoPaddingX = 8;
    const dinoPaddingY = dino.isDucking ? 4 : 8;

    const dinoBox = {
      x: dino.x + dinoPaddingX,
      y: dino.y + dinoPaddingY,
      w: dino.w - dinoPaddingX * 2,
      h: dino.h - dinoPaddingY * 2
    };

    const entPadding = 6;
    const entityBox = {
      x: entity.x + entPadding,
      y: entity.y + entPadding,
      w: entity.w - entPadding * 2,
      h: entity.h - entPadding * 2
    };

    return (
      dinoBox.x < entityBox.x + entityBox.w &&
      dinoBox.x + dinoBox.w > entityBox.x &&
      dinoBox.y < entityBox.y + entityBox.h &&
      dinoBox.y + dinoBox.h > entityBox.y
    );
  }

  // ============================================================
  // PARTICLES & POPUPS
  // ============================================================
  createPuffParticles(x, y, count = 6, customColor = null) {
    const color = customColor || this.themeColors[this.theme].particle;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + (Math.random() * 6 - 3),
        vx: -1.5 - Math.random() * 2.5,
        vy: -0.5 - Math.random() * 1.5,
        size: 2 + Math.random() * 3,
        color: color,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.03
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: 1.0
    });
  }

  // ============================================================
  // RENDERING ENGINE
  // ============================================================
  render() {
    const ctx = this.ctx;
    const colors = this.themeColors[this.theme];

    // Sky Background based on time of day
    this.renderSkyAndCelestial(ctx, colors);

    // Distant Mountains / Skyline
    this.renderMountains(ctx, colors);

    // Parallax Clouds
    this.renderClouds(ctx, colors);

    // Ground Horizon Line & Pebbles
    this.renderGround(ctx, colors);

    // Obstacles
    this.renderObstacles(ctx, colors);

    // Power-ups
    this.renderPowerups(ctx);

    // Dino Player
    this.renderDino(ctx, colors);

    // Particles
    this.renderParticles(ctx);

    // Floating Texts
    this.renderFloatingTexts(ctx);
  }

  renderSkyAndCelestial(ctx, colors) {
    // Dynamic Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.GROUND_Y);

    // Calculate daylight factor (0 = full night, 1 = midday)
    // 0 = day, 0.3 = sunset, 0.5 = night, 0.8 = dawn
    let dayFactor = Math.cos(this.timeOfDay * Math.PI * 2) * 0.5 + 0.5;

    gradient.addColorStop(0, colors.skyDay);
    gradient.addColorStop(1, colors.skyNight);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

    // Render Stars (glow when night factor is high)
    const nightIntensity = 1.0 - dayFactor;
    if (nightIntensity > 0.15) {
      this.stars.forEach(star => {
        const twinkle = Math.sin(performance.now() * 0.005 + star.twinkleOffset) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${nightIntensity * twinkle})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
    }

    // Celestial Body (Sun/Moon moving along an arc across the sky)
    const celestialAngle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const celestialX = this.V_WIDTH / 2 + Math.cos(celestialAngle) * (this.V_WIDTH * 0.45);
    const celestialY = 160 + Math.sin(celestialAngle) * 110;

    if (celestialY < this.GROUND_Y + 20) {
      const isSun = (this.timeOfDay < 0.35 || this.timeOfDay > 0.85);
      const celestialColor = isSun ? colors.sun : colors.moon;

      ctx.save();
      ctx.fillStyle = celestialColor;
      ctx.shadowColor = celestialColor;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Crescent Moon Cutout
      if (!isSun) {
        ctx.fillStyle = colors.skyNight;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(celestialX + 5, celestialY - 4, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  renderMountains(ctx, colors) {
    ctx.save();
    ctx.fillStyle = colors.cloud;
    this.distantMountains.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.x, this.GROUND_Y);
      ctx.lineTo(m.x + m.w / 2, this.GROUND_Y - m.h);
      ctx.lineTo(m.x + m.w, this.GROUND_Y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  renderClouds(ctx, colors) {
    ctx.save();
    ctx.fillStyle = colors.cloud;
    this.clouds.forEach(c => {
      const x = c.x;
      const y = c.y;
      const s = c.scale;
      ctx.beginPath();
      ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
      ctx.arc(x + 14 * s, y - 8 * s, 20 * s, 0, Math.PI * 2);
      ctx.arc(x + 36 * s, y, 15 * s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderGround(ctx, colors) {
    ctx.save();
    // Solid Ground Base
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, this.GROUND_Y, this.V_WIDTH, this.V_HEIGHT - this.GROUND_Y);

    // Glowing Horizon Line
    ctx.strokeStyle = colors.groundLine;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = colors.groundLine;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, this.GROUND_Y);
    ctx.lineTo(this.V_WIDTH, this.GROUND_Y);
    ctx.stroke();

    // Ground Pebbles & Texture
    ctx.fillStyle = colors.groundLine;
    ctx.shadowBlur = 0;
    this.groundPebbles.forEach(p => {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Retro Neon Ground Grid (for Cyberpunk & Matrix themes)
    if (this.theme === 'cyberpunk' || this.theme === 'matrix') {
      ctx.strokeStyle = `rgba(${this.theme === 'cyberpunk' ? '0, 240, 255' : '0, 255, 102'}, 0.15)`;
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      const offsetX = (this.distanceRun * 2) % gridSpacing;
      for (let x = -offsetX; x < this.V_WIDTH; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, this.GROUND_Y);
        ctx.lineTo(x - 30, this.V_HEIGHT);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderDino(ctx, colors) {
    ctx.save();
    let spriteMatrix;

    if (this.state === this.STATE_GAMEOVER) {
      spriteMatrix = PIXEL_DATA.dinoDead;
    } else if (!this.dino.isGrounded && !this.dino.jetpackActive) {
      spriteMatrix = PIXEL_DATA.dinoJump;
    } else if (this.dino.isDucking) {
      spriteMatrix = this.dino.runFrame === 0 ? PIXEL_DATA.dinoDuck1 : PIXEL_DATA.dinoDuck2;
    } else {
      spriteMatrix = this.dino.runFrame === 0 ? PIXEL_DATA.dinoRun1 : PIXEL_DATA.dinoRun2;
    }

    const pixelSize = 3;
    const dinoColor = colors.dino;

    // Draw procedural pixel matrix
    ctx.fillStyle = dinoColor;
    ctx.shadowColor = dinoColor;
    ctx.shadowBlur = this.theme === 'classic' ? 0 : 10;

    for (let r = 0; r < spriteMatrix.length; r++) {
      const row = spriteMatrix[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === 'X') {
          ctx.fillRect(this.dino.x + c * pixelSize, this.dino.y + r * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    // Invincibility Aura
    if (this.dino.invincibleTimeLeft > 0) {
      if (Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 20;
      const invincibleRadius = Math.max(this.dino.w, this.dino.h) * 0.8;
      ctx.beginPath();
      ctx.arc(this.dino.x + this.dino.w / 2, this.dino.y + this.dino.h / 2, invincibleRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Shield Aura if active
    if (this.dino.shieldActive) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      const shieldRadius = Math.max(this.dino.w, this.dino.h) * 0.75;
      ctx.beginPath();
      ctx.arc(this.dino.x + this.dino.w / 2, this.dino.y + this.dino.h / 2, shieldRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Jetpack Backpack & Thruster
    if (this.dino.jetpackActive) {
      ctx.fillStyle = '#ff2a85';
      ctx.fillRect(this.dino.x - 6, this.dino.y + 12, 8, 18);
    }
    ctx.restore();
  }

  renderObstacles(ctx, colors) {
    ctx.save();
    this.obstacles.forEach(obs => {
      if (obs.type === 'cactus') {
        const cactusColor = colors.obstacle;
        ctx.fillStyle = cactusColor;
        ctx.shadowColor = cactusColor;
        ctx.shadowBlur = this.theme === 'classic' ? 0 : 8;

        const sprite = (obs.subtype === 'tall' || obs.subtype === 'tall_group') 
          ? PIXEL_DATA.cactusTall 
          : PIXEL_DATA.cactusSmall;
        const pixelSize = (obs.subtype === 'tall' || obs.subtype === 'tall_group') ? 2.8 : 2.8;

        const count = obs.subtype === 'double_small' ? 2 : (obs.subtype === 'triple_small' ? 3 : (obs.subtype === 'tall_group' ? 2 : 1));
        const spacing = (obs.subtype === 'tall' || obs.subtype === 'tall_group') ? 26 : 22;

        for (let i = 0; i < count; i++) {
          const offsetX = obs.x + i * spacing;
          for (let r = 0; r < sprite.length; r++) {
            const row = sprite[r];
            for (let c = 0; c < row.length; c++) {
              if (row[c] === 'X') {
                ctx.fillRect(offsetX + c * pixelSize, obs.y + r * pixelSize, pixelSize, pixelSize);
              }
            }
          }
        }
      } else if (obs.type === 'ptero') {
        const pteroColor = colors.ptero;
        ctx.fillStyle = pteroColor;
        ctx.shadowColor = pteroColor;
        ctx.shadowBlur = this.theme === 'classic' ? 0 : 10;

        const sprite = obs.frame === 0 ? PIXEL_DATA.pteroUp : PIXEL_DATA.pteroDown;
        const pixelSize = 2.8;

        for (let r = 0; r < sprite.length; r++) {
          const row = sprite[r];
          for (let c = 0; c < row.length; c++) {
            if (row[c] === 'X') {
              ctx.fillRect(obs.x + c * pixelSize, obs.y + r * pixelSize, pixelSize, pixelSize);
            }
          }
        }
      }
    });
    ctx.restore();
  }

  renderPowerups(ctx) {
    ctx.save();
    this.powerups.forEach(pup => {
      const renderY = pup.renderY || pup.y;
      let symbol = '🛡️';
      let glowColor = '#00f0ff';

      if (pup.type === 'slowmo') {
        symbol = '⏱️';
        glowColor = '#05ffa1';
      } else if (pup.type === 'jetpack') {
        symbol = '🚀';
        glowColor = '#ff2a85';
      } else if (pup.type === 'bonus') {
        symbol = '⭐';
        glowColor = '#ffe600';
      }

      // Outer Glowing Ring
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(pup.x + 16, renderY + 16, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Icon Text
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, pup.x + 16, renderY + 17);
    });
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    this.floatingTexts.forEach(ft => {
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = ft.life;
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();
  }

  // ============================================================
  // HUD & UI UPDATES
  // ============================================================
  updateHUD() {
    this.hudSpeed.textContent = `${(this.speed / this.BASE_SPEED).toFixed(1)}x`;
    this.hudHighScore.textContent = this.padScore(this.highScore);
    this.hudCurrentScore.textContent = this.padScore(this.score);
  }

  updateHealthHUD() {
    if (!this.hudHealth) return;
    let hearts = '';
    for (let i = 0; i < this.dino.health; i++) hearts += '❤️';
    this.hudHealth.textContent = hearts || '💀';
  }

  padScore(num) {
    return num.toString().padStart(5, '0');
  }

  // ============================================================
  // ACHIEVEMENTS & STATS
  // ============================================================
  loadAchievements() {
    const saved = localStorage.getItem('dino_achievements');
    if (saved) {
      try {
        const unlockedIds = JSON.parse(saved);
        this.achievements.forEach(a => {
          if (unlockedIds.includes(a.id)) a.unlocked = true;
        });
      } catch (e) {
        console.error('Error loading achievements', e);
      }
    }
  }

  triggerAchievement(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      const unlockedIds = this.achievements.filter(a => a.unlocked).map(a => a.id);
      localStorage.setItem('dino_achievements', JSON.stringify(unlockedIds));

      this.audio.playPowerup();
      this.addFloatingText(`🏆 UNLOCKED: ${ach.title}`, this.dino.x + 30, this.dino.y - 40, '#ffe600');
    }
  }

  showAchievementsModal() {
    this.achievementsList.innerHTML = '';
    this.achievements.forEach(ach => {
      const item = document.createElement('div');
      item.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
      item.innerHTML = `
        <span class="achieve-icon">${ach.icon}</span>
        <div class="achieve-details">
          <h5>${ach.title} ${ach.unlocked ? '✓' : ''}</h5>
          <p>${ach.desc}</p>
        </div>
      `;
      this.achievementsList.appendChild(item);
    });

    this.careerStatsContainer.innerHTML = `
      <span>Runs: <strong>${this.careerStats.runs}</strong></span>
      <span>Total Distance: <strong>${this.careerStats.totalDistance}m</strong></span>
      <span>Birds Dodged: <strong>${this.careerStats.birdsDodged}</strong></span>
      <span>Power-ups: <strong>${this.careerStats.powerupsCollected}</strong></span>
    `;

    this.achievementsModal.classList.remove('hidden');
  }

  hideAchievementsModal() {
    this.achievementsModal.classList.add('hidden');
  }

  saveCareerStats() {
    localStorage.setItem('dino_career_stats', JSON.stringify(this.careerStats));
  }

  // ============================================================
  // MAIN GAME LOOP (DELTA-TIME SMOOTH ANIMATION)
  // ============================================================
  gameLoop(currentTime) {
    let dt = (currentTime - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; // Cap delta time to prevent spiral of death
    this.lastTime = currentTime;

    // Use a fixed timestep to decouple game speed from monitor refresh rate.
    // A 240Hz base rate matches the normal PC speed on all devices.
    const fixedStep = 1 / 240;
    
    if (this.accumulator === undefined) {
      this.accumulator = 0;
    }
    
    this.accumulator += dt;

    while (this.accumulator >= fixedStep) {
      this.update(fixedStep);
      this.accumulator -= fixedStep;
    }

    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// Initialize when DOM content is ready
window.addEventListener('DOMContentLoaded', () => {
  window.dinoGame = new GameEngine();
});

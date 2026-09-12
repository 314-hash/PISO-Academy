/**
 * Web Audio API Sound Synthesizer for PISO Academy Cyberpunk HUD
 * Synthesizes retro-futuristic arcade & cyber SFX without any external asset downloads.
 */

class SoundFXService {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playLaser() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playWarp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  playSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major triad)

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.18, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.35);
    });
  }

  playCoins() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const coinTones = [987.77, 1318.51, 1567.98]; // B5, E6, G6 arcade coin sound
    coinTones.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.18);
    });
  }

  playBlip() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const randomPitch = 600 + Math.random() * 300;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(randomPitch, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playQuestComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99], // C Major
      [587.33, 739.99, 880.00], // D Major
      [659.25, 830.61, 987.77], // E Major
      [1046.5, 1318.5, 1567.98], // High C Major
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + step * 0.1);
        gain.gain.setValueAtTime(0.08, now + step * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.005, now + step * 0.1 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + step * 0.1);
        osc.stop(now + step * 0.1 + 0.22);
      });
    });
  }

  playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  playDoubleJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Primary booster chirp
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.exponentialRampToValueAtTime(980, now + 0.18);
    gain1.gain.setValueAtTime(0.16, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Harmonic radiant booster
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(840, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
    gain2.gain.setValueAtTime(0.1, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.2);
  }

  // -------------------------------------------------------------
  // ANIME SUPER POWERS & COMIC SFX
  // -------------------------------------------------------------

  /**
   * Dragon Ball Ki Energy Charge-Up (Rising resonant aura hum)
   */
  playAnimeCharge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.65;

    // Resonant rising Ki oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + dur);

    // Ki vibration LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(14, now);
    lfoGain.gain.setValueAtTime(25, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + dur * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  /**
   * Dragon Ball / Naruto Laser Beam Blast
   */
  playAnimeBeam() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 1.1;

    // Primary laser core (detuned dual sawtooth)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(220, now);
    osc2.frequency.setValueAtTime(224, now);

    osc1.frequency.linearRampToValueAtTime(160, now + dur);
    osc2.frequency.linearRampToValueAtTime(164, now + dur);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.linearRampToValueAtTime(0.2, now + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
  }

  /**
   * Heavy Anime Explosion with deep 40Hz sub-bass impact
   */
  playAnimeExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 1.2;

    // 1. Sub-bass seismic drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.6);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.8);

    // 2. White noise fireball crackle
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
  }

  /**
   * Naruto Chidori Lightning Blade (Electric chirping pulse train)
   */
  playChidoriLightning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.8;

    // High frequency electric chirp
    for (let i = 0; i < 5; i++) {
      const startTime = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600 + Math.random() * 800, startTime);
      osc.frequency.exponentialRampToValueAtTime(300, startTime + 0.09);

      gain.gain.setValueAtTime(0.14, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.09);
    }
  }

  /**
   * Tsinelas ni Nanay flying whip & cartoon slap BAM!
   */
  playTsinelasSlap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // High-pitch whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Percussive slap impact at 0.16s
    const slapTime = now + 0.16;
    const slapOsc = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();
    slapOsc.type = 'square';
    slapOsc.frequency.setValueAtTime(280, slapTime);
    slapOsc.frequency.exponentialRampToValueAtTime(60, slapTime + 0.07);
    slapGain.gain.setValueAtTime(0.3, slapTime);
    slapGain.gain.exponentialRampToValueAtTime(0.01, slapTime + 0.07);
    slapOsc.connect(slapGain);
    slapGain.connect(this.ctx.destination);
    slapOsc.start(slapTime);
    slapOsc.stop(slapTime + 0.07);
  }

  /**
   * Cartoon spring boing for Filipino Puns & Banats
   */
  playFunnyPunBoing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.35;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + dur * 0.6);
    osc.frequency.exponentialRampToValueAtTime(450, now + dur);

    // Wobble vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(22, now);
    lfoGain.gain.setValueAtTime(40, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  /**
   * One Piece Gear 5 Joyboy Bounce
   */
  playGear5Laugh() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 880, 1046.5]; // C5, E5, G5, C6, A5, C6

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.14, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.1);
    });
  }

  /**
   * Naruto Rasengan Spinning Chakra Sphere
   */
  playRasenganSpiral() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * One Piece Sapapok Gatling Barrage (Rapid comic punches)
   */
  playGatlingRapidPunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const punchTime = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180 + Math.random() * 60, punchTime);
      osc.frequency.exponentialRampToValueAtTime(50, punchTime + 0.06);

      gain.gain.setValueAtTime(0.2, punchTime);
      gain.gain.exponentialRampToValueAtTime(0.01, punchTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(punchTime);
      osc.stop(punchTime + 0.06);
    }
  }

  /**
   * Bathala's Divine Lightning Thunderstorm (Sky thunder claps)
   */
  playThunderstormStrike() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass thunder roll
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.9);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.9);

    // Crackle
    for (let i = 0; i < 3; i++) {
      const strikeTime = now + i * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2200, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(200, strikeTime + 0.12);
      gain.gain.setValueAtTime(0.18, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.01, strikeTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(strikeTime);
      osc.stop(strikeTime + 0.12);
    }
  }

  /**
   * Walis Tambo Cyclone Spin
   */
  playCycloneSpin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.25);
    osc.frequency.linearRampToValueAtTime(180, now + 0.55);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  /**
   * Tabo Holy Water Deluge Surge
   */
  playWaterSurge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /**
   * Cooldown warning buzz (when skill is not ready yet)
   */
  playCooldownBuzz() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Heavy combat impact thud
   */
  playImpact() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Kamehameha / Energy beam charge & blast
   */
  playKamehameha() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const SoundFX = new SoundFXService();

/**
 * PISO Academy Metaverse — Unified Cross-Platform Game Control System
 * Central InputManager Singleton Pipeline
 */

import {
  PlayerInput,
  ControlPreferences,
  DEFAULT_CONTROL_PREFERENCES,
  InteractionContextTarget,
  detectTouchSupport,
  detectIsMobileScreen,
} from './InputTypes';
import { KeyboardInput } from './KeyboardInput';
import { MouseInput } from './MouseInput';
import { GamepadInput, GamepadStateSnapshot } from './GamepadInput';
import { TouchInput } from './TouchInput';
import { KeybindConfig, DEFAULT_KEYBINDS } from '../context/AcademyContext';

export class InputManager {
  private static _instance: InputManager | null = null;

  public static get instance(): InputManager {
    if (!InputManager._instance) {
      InputManager._instance = new InputManager();
    }
    return InputManager._instance;
  }

  // Sub-handlers
  public readonly keyboard: KeyboardInput;
  public readonly mouse: MouseInput;
  public readonly gamepad: GamepadInput;
  public readonly touch: TouchInput;

  // Preferences & settings
  private preferences: ControlPreferences = { ...DEFAULT_CONTROL_PREFERENCES };

  // Current normalized input frame (reused mutable object to avoid 60 FPS garbage collection)
  private currentInput: PlayerInput = {
    moveX: 0,
    moveY: 0,
    moveMagnitude: 0,
    lookX: 0,
    lookY: 0,
    zoomDelta: 0,
    jump: false,
    jumpHeld: false,
    sprint: false,
    interact: false,
    interactHeld: false,
    mine: false,
    actionPrimary: false,
    activeDevice: 'keyboard',
    timestamp: Date.now(),
  };

  // Context-aware interaction target near the player
  private currentContextTarget: InteractionContextTarget | null = null;
  private onContextChangeCallbacks: Set<(target: InteractionContextTarget | null) => void> = new Set();

  private isInitialized = false;

  private constructor() {
    this.keyboard = new KeyboardInput();
    this.mouse = new MouseInput();
    this.gamepad = new GamepadInput();
    this.touch = new TouchInput();

    this.loadPreferences();

    // Determine initial active device
    if (detectTouchSupport() || detectIsMobileScreen()) {
      this.currentInput.activeDevice = 'touch';
    } else {
      this.currentInput.activeDevice = 'keyboard';
    }
  }

  public init(container?: HTMLElement) {
    if (container) {
      this.mouse.attach(container);
    }
    this.applyPreferences();
    this.isInitialized = true;
  }

  public loadPreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('piso_control_preferences');
      if (saved) {
        this.preferences = { ...DEFAULT_CONTROL_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {}
  }

  public savePreferences(prefs: Partial<ControlPreferences>) {
    this.preferences = { ...this.preferences, ...prefs };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('piso_control_preferences', JSON.stringify(this.preferences));
      } catch {}
    }
    this.applyPreferences();
  }

  public getPreferences(): ControlPreferences {
    return { ...this.preferences };
  }

  public setKeybinds(binds: KeybindConfig) {
    this.keyboard.setKeybinds(binds);
  }

  private applyPreferences() {
    const p = this.preferences;

    this.mouse.setConfig({
      sensitivity: p.cameraSensitivity,
      invertPitch: p.invertPitch,
      invertYaw: p.invertYaw,
    });

    this.gamepad.setConfig({
      cameraSensitivity: p.cameraSensitivity,
      invertPitch: p.invertPitch,
      invertYaw: p.invertYaw,
      vibration: p.vibration,
    });

    this.touch.setConfig({
      joystickSensitivity: p.joystickSensitivity,
      cameraSensitivity: p.cameraSensitivity,
      invertPitch: p.invertPitch,
      invertYaw: p.invertYaw,
      vibration: p.vibration,
    });
  }

  /**
   * Set or clear the current contextual interaction target
   */
  public setContextTarget(target: InteractionContextTarget | null) {
    if (
      (this.currentContextTarget === null && target === null) ||
      (this.currentContextTarget?.id === target?.id &&
        this.currentContextTarget?.actionLabel === target?.actionLabel)
    ) {
      return;
    }

    this.currentContextTarget = target;
    this.onContextChangeCallbacks.forEach((cb) => cb(target));
  }

  public getContextTarget(): InteractionContextTarget | null {
    return this.currentContextTarget;
  }

  public subscribeContextChange(callback: (target: InteractionContextTarget | null) => void): () => void {
    this.onContextChangeCallbacks.add(callback);
    return () => {
      this.onContextChangeCallbacks.delete(callback);
    };
  }

  /**
   * Samples all input sources and updates the normalized PlayerInput.
   * MUST be called once per render frame inside the animation loop.
   */
  public update(delta: number): PlayerInput {
    const kb = this.keyboard.sample();
    const mouse = this.mouse.sample();
    const gp = this.gamepad.sample(delta);
    const touch = this.touch.sample();

    // 1. Detect and switch active device based on user interaction
    if (gp.hasActivity) {
      this.currentInput.activeDevice = 'gamepad';
    } else if (touch.hasActivity) {
      this.currentInput.activeDevice = 'touch';
    } else if (kb.hasActivity || mouse.hasActivity) {
      this.currentInput.activeDevice = 'keyboard';
    }

    // 2. Normalized Movement Vector (Priority: Touch Stick -> Gamepad Stick -> Keyboard)
    let moveX = 0;
    let moveY = 0;
    let moveMagnitude = 0;

    if (touch.hasActivity && touch.moveMagnitude > 0.05) {
      moveX = touch.moveX;
      moveY = touch.moveY;
      moveMagnitude = touch.moveMagnitude;
    } else if (gp.hasActivity && gp.moveMagnitude > 0.05) {
      moveX = gp.moveX;
      moveY = gp.moveY;
      moveMagnitude = gp.moveMagnitude;
    } else if (kb.hasActivity && kb.moveMagnitude > 0) {
      moveX = kb.moveX;
      moveY = kb.moveY;
      moveMagnitude = 1.0;
    }

    // 3. Camera Look (Accumulate deltas from all active pointing devices)
    const lookX = mouse.lookX + gp.lookX + touch.lookX;
    const lookY = mouse.lookY + gp.lookY + touch.lookY;
    const zoomDelta = mouse.zoomDelta;

    // 4. Action triggers (OR condition across inputs)
    const jump = kb.jump || gp.jump || touch.jump;
    const jumpHeld = kb.jumpHeld || gp.jumpHeld || touch.jumpHeld;

    const sprint =
      this.preferences.autoSprint ||
      kb.sprint ||
      gp.sprint ||
      touch.sprint;

    const interact = kb.interact || gp.interact || touch.interact;
    const interactHeld = kb.interactHeld || gp.interactHeld || touch.interactHeld;

    const mine = kb.mine || gp.mine || touch.mine;
    const actionPrimary = kb.actionPrimary || gp.actionPrimary || touch.actionPrimary;

    // 5. Update cached state in-place (Zero garbage collection)
    const out = this.currentInput;
    out.moveX = moveX;
    out.moveY = moveY;
    out.moveMagnitude = moveMagnitude;
    out.lookX = lookX;
    out.lookY = lookY;
    out.zoomDelta = zoomDelta;
    out.jump = jump;
    out.jumpHeld = jumpHeld;
    out.sprint = sprint;
    out.interact = interact;
    out.interactHeld = interactHeld;
    out.mine = mine;
    out.actionPrimary = actionPrimary;
    out.timestamp = Date.now();

    return out;
  }

  /**
   * Returns current input state without updating (for external inspectors)
   */
  public getInput(): PlayerInput {
    return this.currentInput;
  }

  /**
   * Returns snapshot for InputDebugger overlay
   */
  public getDebugSnapshot(): {
    input: PlayerInput;
    gamepad: GamepadStateSnapshot;
    preferences: ControlPreferences;
  } {
    return {
      input: { ...this.currentInput },
      gamepad: this.gamepad.getSnapshot(),
      preferences: { ...this.preferences },
    };
  }

  public dispose() {
    this.keyboard.dispose();
    this.mouse.dispose();
    this.onContextChangeCallbacks.clear();
  }
}

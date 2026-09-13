/**
 * PISO Academy Metaverse — Unified Cross-Platform Game Control System
 * Native HTML5 Gamepad API Input Handler
 */

export interface GamepadStateSnapshot {
  connected: boolean;
  id: string;
  index: number;
  axes: number[];
  buttons: boolean[];
}

export class GamepadInput {
  private deadzone = 0.15;
  private cameraSensitivity = 1.0;
  private invertPitch = false;
  private invertYaw = false;
  private vibrationEnabled = true;

  // Track previous button states for edge trigger detection
  private prevButtons: boolean[] = [];

  private isEnabled = true;

  constructor() {
    // Gamepad API connects automatically via navigator.getGamepads()
  }

  public setConfig(config: {
    deadzone?: number;
    cameraSensitivity?: number;
    invertPitch?: boolean;
    invertYaw?: boolean;
    vibration?: boolean;
    enabled?: boolean;
  }) {
    if (config.deadzone !== undefined) this.deadzone = config.deadzone;
    if (config.cameraSensitivity !== undefined) this.cameraSensitivity = config.cameraSensitivity;
    if (config.invertPitch !== undefined) this.invertPitch = config.invertPitch;
    if (config.invertYaw !== undefined) this.invertYaw = config.invertYaw;
    if (config.vibration !== undefined) this.vibrationEnabled = config.vibration;
    if (config.enabled !== undefined) this.isEnabled = config.enabled;
  }

  /**
   * Triggers haptic feedback if supported by the physical controller
   */
  public vibrate(weak = 0.4, strong = 0.2, durationMs = 80) {
    if (!this.vibrationEnabled || typeof navigator === 'undefined' || !navigator.getGamepads) return;

    try {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (!gp || !gp.connected) continue;
        const actuator = (gp as any).vibrationActuator;
        if (actuator && typeof actuator.playEffect === 'function') {
          actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: durationMs,
            weakMagnitude: weak,
            strongMagnitude: strong,
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }

  /**
   * Applies radial deadzone to an analog stick pair
   */
  private applyRadialDeadzone(x: number, y: number): { x: number; y: number; mag: number } {
    const mag = Math.sqrt(x * x + y * y);
    if (mag <= this.deadzone) {
      return { x: 0, y: 0, mag: 0 };
    }
    // Scale smoothly from 0 at deadzone edge to 1.0 at maximum
    const normalizedMag = Math.min(1.0, (mag - this.deadzone) / (1.0 - this.deadzone));
    return {
      x: (x / mag) * normalizedMag,
      y: (y / mag) * normalizedMag,
      mag: normalizedMag,
    };
  }

  /**
   * Samples active gamepad state for the current frame
   */
  public sample(delta: number) {
    if (!this.isEnabled || typeof navigator === 'undefined' || !navigator.getGamepads) {
      return {
        moveX: 0,
        moveY: 0,
        moveMagnitude: 0,
        lookX: 0,
        lookY: 0,
        jump: false,
        jumpHeld: false,
        sprint: false,
        interact: false,
        interactHeld: false,
        mine: false,
        actionPrimary: false,
        startPressed: false,
        hasActivity: false,
        connected: false,
        gamepadId: '',
      };
    }

    const gamepads = navigator.getGamepads();
    let primaryGamepad: Gamepad | null = null;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        primaryGamepad = gp;
        break;
      }
    }

    if (!primaryGamepad) {
      this.prevButtons = [];
      return {
        moveX: 0,
        moveY: 0,
        moveMagnitude: 0,
        lookX: 0,
        lookY: 0,
        jump: false,
        jumpHeld: false,
        sprint: false,
        interact: false,
        interactHeld: false,
        mine: false,
        actionPrimary: false,
        startPressed: false,
        hasActivity: false,
        connected: false,
        gamepadId: '',
      };
    }

    const axes = primaryGamepad.axes || [];
    const buttons = primaryGamepad.buttons || [];

    // 1. Left Stick (Axes 0, 1): Movement
    // Axis 0: -1 = Left, +1 = Right
    // Axis 1: -1 = Forward, +1 = Backward (standard gamepad inverted Y)
    const rawLeftX = axes[0] || 0;
    const rawLeftY = -(axes[1] || 0); // Invert so positive is forward
    const leftStick = this.applyRadialDeadzone(rawLeftX, rawLeftY);

    // D-Pad Fallback (Buttons 12=Up, 13=Down, 14=Left, 15=Right)
    let dpadX = 0;
    let dpadY = 0;
    if (buttons[12]?.pressed) dpadY += 1;
    if (buttons[13]?.pressed) dpadY -= 1;
    if (buttons[14]?.pressed) dpadX -= 1;
    if (buttons[15]?.pressed) dpadX += 1;

    let moveX = leftStick.x;
    let moveY = leftStick.y;
    let moveMagnitude = leftStick.mag;

    if (dpadX !== 0 || dpadY !== 0) {
      const dpadMag = Math.sqrt(dpadX * dpadX + dpadY * dpadY);
      moveX = dpadX / dpadMag;
      moveY = dpadY / dpadMag;
      moveMagnitude = 1.0;
    }

    // 2. Right Stick (Axes 2, 3): Camera Orbit Look
    // Axis 2: Yaw (-1 = Left, +1 = Right)
    // Axis 3: Pitch (-1 = Up, +1 = Down)
    const rawRightX = axes[2] || 0;
    const rawRightY = axes[3] || 0;
    const rightStick = this.applyRadialDeadzone(rawRightX, rawRightY);

    const yawDirection = this.invertYaw ? 1 : -1;
    const pitchDirection = this.invertPitch ? -1 : 1;
    const lookSpeed = 2.4 * this.cameraSensitivity * delta;

    const lookX = rightStick.x * lookSpeed * yawDirection;
    const lookY = rightStick.y * lookSpeed * pitchDirection;

    // 3. Buttons (Standard Mapping)
    // Button 0 (A / Cross): Jump
    // Button 1 (B / Circle): Interact
    // Button 2 (X / Square): Mine
    // Button 3 (Y / Triangle): Primary Superpower
    // Button 4 (LB / L1) or 10 (L3 / Left Stick Press): Sprint
    // Button 9 (Start): Menu / Options
    const isPressed = (index: number) => Boolean(buttons[index]?.pressed);
    const wasPressed = (index: number) => Boolean(this.prevButtons[index]);
    const isJustPressed = (index: number) => isPressed(index) && !wasPressed(index);

    const jump = isJustPressed(0);
    const jumpHeld = isPressed(0);
    const interact = isJustPressed(1);
    const interactHeld = isPressed(1);
    const mine = isJustPressed(2);
    const actionPrimary = isJustPressed(3);
    const sprint = isPressed(4) || isPressed(10) || isPressed(6); // LB or L3 or LT
    const startPressed = isJustPressed(9);

    // Update button states for next frame
    this.prevButtons = buttons.map((b) => b.pressed);

    const hasActivity =
      moveMagnitude > 0.05 ||
      Math.abs(rightStick.x) > 0.05 ||
      Math.abs(rightStick.y) > 0.05 ||
      jump ||
      interact ||
      mine ||
      actionPrimary ||
      sprint;

    if (jump || mine) {
      this.vibrate(0.3, 0.1, 40);
    }

    return {
      moveX,
      moveY,
      moveMagnitude,
      lookX,
      lookY,
      jump,
      jumpHeld,
      sprint,
      interact,
      interactHeld,
      mine,
      actionPrimary,
      startPressed,
      hasActivity,
      connected: true,
      gamepadId: primaryGamepad.id || 'Standard Gamepad',
    };
  }

  /**
   * Returns snapshot for input debugger
   */
  public getSnapshot(): GamepadStateSnapshot {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return { connected: false, id: '', index: -1, axes: [], buttons: [] };
    }
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        return {
          connected: true,
          id: gp.id,
          index: gp.index,
          axes: Array.from(gp.axes),
          buttons: gp.buttons.map((b) => b.pressed),
        };
      }
    }
    return { connected: false, id: '', index: -1, axes: [], buttons: [] };
  }
}

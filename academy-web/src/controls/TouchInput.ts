/**
 * PISO Academy Metaverse — Unified Cross-Platform Game Control System
 * Multitouch Coordinator & Virtual Joystick Input Handler
 */

export interface TouchMoveState {
  x: number;          // -1.0 to 1.0 (left to right)
  y: number;          // -1.0 to 1.0 (backward to forward)
  intensity: number;  // 0.0 to 1.0
  active: boolean;
}

export interface TouchLookState {
  deltaX: number;     // Yaw delta
  deltaY: number;     // Pitch delta
  active: boolean;
}

export class TouchInput {
  private moveState: TouchMoveState = { x: 0, y: 0, intensity: 0, active: false };
  private lookState: TouchLookState = { deltaX: 0, deltaY: 0, active: false };

  // Frame triggers
  private jumpTriggered = false;
  private jumpHeld = false;
  private interactTriggered = false;
  private interactHeld = false;
  private mineTriggered = false;
  private actionPrimaryTriggered = false;
  private sprintActive = false;

  private joystickSensitivity = 1.0;
  private cameraSensitivity = 1.0;
  private invertPitch = false;
  private invertYaw = false;
  private vibrationEnabled = true;

  private isEnabled = true;

  constructor() {}

  public setConfig(config: {
    joystickSensitivity?: number;
    cameraSensitivity?: number;
    invertPitch?: boolean;
    invertYaw?: boolean;
    vibration?: boolean;
    enabled?: boolean;
  }) {
    if (config.joystickSensitivity !== undefined) this.joystickSensitivity = config.joystickSensitivity;
    if (config.cameraSensitivity !== undefined) this.cameraSensitivity = config.cameraSensitivity;
    if (config.invertPitch !== undefined) this.invertPitch = config.invertPitch;
    if (config.invertYaw !== undefined) this.invertYaw = config.invertYaw;
    if (config.vibration !== undefined) this.vibrationEnabled = config.vibration;
    if (config.enabled !== undefined) this.isEnabled = config.enabled;
  }

  /**
   * Device haptic vibration helper
   */
  public vibrate(durationMs = 15) {
    if (!this.vibrationEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(durationMs);
    } catch {}
  }

  // --- External Setters from DualVirtualJoystick & MobileActionCluster ---

  public setMoveInput(x: number, y: number, intensity: number, active: boolean) {
    this.moveState = {
      x,
      y,
      intensity: Math.min(1.0, intensity * this.joystickSensitivity),
      active,
    };
  }

  public setLookDelta(dx: number, dy: number, active: boolean) {
    const yawMul = this.invertYaw ? 1 : -1;
    const pitchMul = this.invertPitch ? -1 : 1;
    const factor = 0.007 * this.cameraSensitivity;

    this.lookState.deltaX += dx * factor * yawMul;
    this.lookState.deltaY += dy * factor * pitchMul;
    this.lookState.active = active;
  }

  public triggerJump(held = false) {
    this.jumpTriggered = true;
    this.jumpHeld = held;
    this.vibrate(18);
  }

  public setJumpHeld(held: boolean) {
    this.jumpHeld = held;
  }

  public triggerInteract(held = false) {
    this.interactTriggered = true;
    this.interactHeld = held;
    this.vibrate(15);
  }

  public setInteractHeld(held: boolean) {
    this.interactHeld = held;
  }

  public triggerMine() {
    this.mineTriggered = true;
    this.vibrate(25);
  }

  public triggerActionPrimary() {
    this.actionPrimaryTriggered = true;
    this.vibrate(20);
  }

  public toggleSprint(active?: boolean) {
    this.sprintActive = active !== undefined ? active : !this.sprintActive;
    this.vibrate(10);
    return this.sprintActive;
  }

  public isSprintActive(): boolean {
    return this.sprintActive;
  }

  /**
   * Samples touch inputs for the current frame
   */
  public sample() {
    if (!this.isEnabled) {
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
        hasActivity: false,
      };
    }

    const moveX = this.moveState.active ? this.moveState.x : 0;
    const moveY = this.moveState.active ? this.moveState.y : 0;
    const moveMagnitude = this.moveState.active ? this.moveState.intensity : 0;

    const lookX = this.lookState.deltaX;
    const lookY = this.lookState.deltaY;

    // Reset accumulated look deltas
    this.lookState.deltaX = 0;
    this.lookState.deltaY = 0;

    const jump = this.jumpTriggered;
    const interact = this.interactTriggered;
    const mine = this.mineTriggered;
    const actionPrimary = this.actionPrimaryTriggered;

    // Reset single-frame triggers
    this.jumpTriggered = false;
    this.interactTriggered = false;
    this.mineTriggered = false;
    this.actionPrimaryTriggered = false;

    const hasActivity =
      this.moveState.active ||
      this.lookState.active ||
      jump ||
      this.jumpHeld ||
      interact ||
      mine ||
      actionPrimary;

    return {
      moveX,
      moveY,
      moveMagnitude,
      lookX,
      lookY,
      jump,
      jumpHeld: this.jumpHeld,
      sprint: this.sprintActive,
      interact,
      interactHeld: this.interactHeld,
      mine,
      actionPrimary,
      hasActivity,
    };
  }

  public reset() {
    this.moveState = { x: 0, y: 0, intensity: 0, active: false };
    this.lookState = { deltaX: 0, deltaY: 0, active: false };
    this.jumpTriggered = false;
    this.jumpHeld = false;
    this.interactTriggered = false;
    this.interactHeld = false;
    this.mineTriggered = false;
    this.actionPrimaryTriggered = false;
  }
}

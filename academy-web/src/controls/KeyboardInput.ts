/**
 * PISO Academy Metaverse — Unified Cross-Platform Game Control System
 * Desktop Keyboard Input Handler
 */

import { KeybindConfig, DEFAULT_KEYBINDS } from '../context/AcademyContext';

export class KeyboardInput {
  private keys: Record<string, boolean> = {};
  private keybinds: KeybindConfig = { ...DEFAULT_KEYBINDS };

  // Frame triggers (active for 1 frame until consumed)
  private jumpTriggered = false;
  private interactTriggered = false;
  private mineTriggered = false;
  private actionPrimaryTriggered = false;

  private isEnabled = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('blur', this.handleBlur);
    }
  }

  public setKeybinds(binds: KeybindConfig) {
    this.keybinds = { ...DEFAULT_KEYBINDS, ...binds };
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearKeys();
    }
  }

  public clearKeys() {
    this.keys = {};
    this.jumpTriggered = false;
    this.interactTriggered = false;
    this.mineTriggered = false;
    this.actionPrimaryTriggered = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (!this.isEnabled) return;

    // Ignore keyboard input when player is typing in form elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    this.keys[key] = true;
    if (e.code === 'Space') this.keys[' '] = true;
    if (e.shiftKey) this.keys['shift'] = true;

    const kb = this.keybinds;

    // Jump detection
    const isJump = (kb.jump === ' ' && (e.code === 'Space' || e.key === ' ')) || key === (kb.jump || ' ').toLowerCase();
    if (isJump) {
      e.preventDefault();
      this.jumpTriggered = true;
    }

    // Interact detection (Default 'b' or 'e')
    const isInteract = key === (kb.interact || 'b').toLowerCase() || key === 'b';
    if (isInteract) {
      this.interactTriggered = true;
    }

    // Mine detection (Default 'q')
    const isMine = key === (kb.mine || 'q').toLowerCase() || key === 'q';
    if (isMine) {
      this.mineTriggered = true;
    }

    // Skill Primary detection (Default 'e')
    const isSkillPrimary = key === (kb.skillPrimary || 'e').toLowerCase() || key === 'e';
    if (isSkillPrimary) {
      this.actionPrimaryTriggered = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
    if (e.code === 'Space') this.keys[' '] = false;
    if (!e.shiftKey) this.keys['shift'] = false;
  }

  private handleBlur() {
    this.clearKeys();
  }

  /**
   * Samples keyboard state for the current animation frame
   */
  public sample() {
    const kb = this.keybinds;

    let rawX = 0;
    let rawY = 0;

    const isFwd =
      this.keys[(kb.forward || 'w').toLowerCase()] ||
      this.keys['arrowup'] ||
      false;
    const isBack =
      this.keys[(kb.backward || 's').toLowerCase()] ||
      this.keys['arrowdown'] ||
      false;
    const isLeft =
      this.keys[(kb.left || 'a').toLowerCase()] ||
      this.keys['arrowleft'] ||
      false;
    const isRight =
      this.keys[(kb.right || 'd').toLowerCase()] ||
      this.keys['arrowright'] ||
      false;

    if (isFwd) rawY += 1.0;
    if (isBack) rawY -= 1.0;
    if (isLeft) rawX -= 1.0;
    if (isRight) rawX += 1.0;

    // Normalize diagonal movement
    let moveX = rawX;
    let moveY = rawY;
    const mag = Math.sqrt(rawX * rawX + rawY * rawY);
    if (mag > 0) {
      moveX = rawX / mag;
      moveY = rawY / mag;
    }

    const isSprint =
      this.keys[(kb.sprint || 'shift').toLowerCase()] ||
      this.keys['shift'] ||
      false;

    const isJumpHeld =
      this.keys[(kb.jump || ' ').toLowerCase()] ||
      this.keys[' '] ||
      false;

    const isInteractHeld =
      this.keys[(kb.interact || 'b').toLowerCase()] ||
      this.keys['b'] ||
      false;

    const isSkillPrimaryHeld =
      this.keys[(kb.skillPrimary || 'e').toLowerCase()] ||
      this.keys['e'] ||
      false;

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
      mag > 0 ||
      isSprint ||
      jump ||
      isJumpHeld ||
      interact ||
      mine ||
      actionPrimary;

    return {
      moveX,
      moveY,
      moveMagnitude: mag > 0 ? 1.0 : 0.0,
      sprint: isSprint,
      jump,
      jumpHeld: isJumpHeld,
      interact,
      interactHeld: isInteractHeld || isSkillPrimaryHeld,
      mine,
      actionPrimary,
      hasActivity,
    };
  }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('blur', this.handleBlur);
    }
  }
}

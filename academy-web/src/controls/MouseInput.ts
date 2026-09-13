/**
 * PISO Academy Metaverse — Unified Cross-Platform Game Control System
 * Desktop Mouse Orbit, Zoom & Pointer Input Handler
 */

export class MouseInput {
  private deltaYaw = 0;
  private deltaPitch = 0;
  private zoomDelta = 0;

  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  private sensitivity = 1.0;
  private invertPitch = false;
  private invertYaw = false;
  private isEnabled = true;

  private container: HTMLElement | null = null;

  constructor() {
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
  }

  public attach(container: HTMLElement) {
    this.detach();
    this.container = container;

    container.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    container.addEventListener('wheel', this.handleWheel, { passive: false });
    container.addEventListener('contextmenu', this.handleContextMenu);
  }

  public detach() {
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.handlePointerDown);
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerup', this.handlePointerUp);
      window.removeEventListener('pointercancel', this.handlePointerUp);
      this.container.removeEventListener('wheel', this.handleWheel);
      this.container.removeEventListener('contextmenu', this.handleContextMenu);
      this.container = null;
    }
  }

  public setConfig(config: {
    sensitivity?: number;
    invertPitch?: boolean;
    invertYaw?: boolean;
    enabled?: boolean;
  }) {
    if (config.sensitivity !== undefined) this.sensitivity = config.sensitivity;
    if (config.invertPitch !== undefined) this.invertPitch = config.invertPitch;
    if (config.invertYaw !== undefined) this.invertYaw = config.invertYaw;
    if (config.enabled !== undefined) this.isEnabled = config.enabled;
  }

  private handlePointerDown(e: PointerEvent) {
    if (!this.isEnabled) return;
    // Right click (button 2) triggers camera orbit drag
    if (e.button === 2) {
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.isEnabled || !this.isDragging) return;

    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const yawDirection = this.invertYaw ? 1 : -1;
    const pitchDirection = this.invertPitch ? -1 : 1;

    // Base sensitivity factor
    const factor = 0.006 * this.sensitivity;

    this.deltaYaw += dx * factor * yawDirection;
    this.deltaPitch += dy * factor * pitchDirection;
  }

  private handlePointerUp(e: PointerEvent) {
    if (e.button === 2 || !e.buttons) {
      this.isDragging = false;
    }
  }

  private handleWheel(e: WheelEvent) {
    if (!this.isEnabled) return;
    e.preventDefault();
    // Delta normalized (+1 for zoom out, -1 for zoom in)
    const sign = Math.sign(e.deltaY);
    this.zoomDelta += sign * 1.5;
  }

  private handleContextMenu(e: MouseEvent) {
    e.preventDefault();
  }

  /**
   * Sample mouse deltas for the current animation frame
   */
  public sample() {
    const yaw = this.deltaYaw;
    const pitch = this.deltaPitch;
    const zoom = this.zoomDelta;

    // Reset accumulated deltas
    this.deltaYaw = 0;
    this.deltaPitch = 0;
    this.zoomDelta = 0;

    const hasActivity = Math.abs(yaw) > 0.0001 || Math.abs(pitch) > 0.0001 || Math.abs(zoom) > 0.01;

    return {
      lookX: yaw,
      lookY: pitch,
      zoomDelta: zoom,
      isDragging: this.isDragging,
      hasActivity,
    };
  }

  public dispose() {
    this.detach();
  }
}

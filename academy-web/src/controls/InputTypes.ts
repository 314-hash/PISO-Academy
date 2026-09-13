/**
 * PISO Academy Metaverse — Unified Cross-Platform Game Control System
 * Core Input Types & Contracts
 */

export type ControlMode = 'auto' | 'touch' | 'keyboard' | 'gamepad';

export interface PlayerInput {
  /** Horizontal movement (-1.0 = left, 1.0 = right) */
  moveX: number;
  /** Forward/backward movement (-1.0 = backward, 1.0 = forward) */
  moveY: number;
  /** Movement vector magnitude (0.0 to 1.0) */
  moveMagnitude: number;
  /** Camera orbit yaw delta in radians */
  lookX: number;
  /** Camera pitch elevation delta in radians */
  lookY: number;
  /** Camera zoom delta from mouse wheel or touch pinch */
  zoomDelta: number;
  /** Jump button triggered this frame (single & double jump) */
  jump: boolean;
  /** Jump button is currently held */
  jumpHeld: boolean;
  /** Sprint / turbo speed active */
  sprint: boolean;
  /** Contextual interact button triggered this frame */
  interact: boolean;
  /** Interact button is currently held (for auto-seek / continuous mining) */
  interactHeld: boolean;
  /** Mine action triggered */
  mine: boolean;
  /** Primary anime superpower cast triggered */
  actionPrimary: boolean;
  /** Active primary input device */
  activeDevice: 'keyboard' | 'touch' | 'gamepad';
  /** Timestamp of this input frame */
  timestamp: number;
}

export interface ControlPreferences {
  controlMode: ControlMode;
  cameraSensitivity: number;   // 0.5 to 2.5 (default 1.0)
  joystickSensitivity: number; // 0.5 to 2.5 (default 1.0)
  cameraSmoothing: number;     // 0.02 to 0.25 (default 0.09)
  invertPitch: boolean;        // Invert Y axis
  invertYaw: boolean;          // Invert X axis
  autoSprint: boolean;         // Always run when moving
  vibration: boolean;          // Haptic feedback enabled
  showTouchControls: 'auto' | 'always_on' | 'always_off';
  swapJoystickSide: boolean;   // Left-handed mode
}

export const DEFAULT_CONTROL_PREFERENCES: ControlPreferences = {
  controlMode: 'auto',
  cameraSensitivity: 1.0,
  joystickSensitivity: 1.0,
  cameraSmoothing: 0.09,
  invertPitch: false,
  invertYaw: false,
  autoSprint: false,
  vibration: true,
  showTouchControls: 'auto',
  swapJoystickSide: false,
};

export type InteractionType = 'mentor' | 'player' | 'block' | 'district' | 'terminal' | 'none';

export interface InteractionContextTarget {
  type: InteractionType;
  id: string;
  name: string;
  title?: string;
  actionLabel: string; // e.g. "TALK", "MEET", "MINE", "WARP", "OPEN"
  color: string;       // HEX or CSS color
  distance: number;    // Distance in meters
  icon: string;        // Emoji icon
  targetObject?: any;
}

/**
 * Capability-based device detection (not just User-Agent regex)
 */
export function detectTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function detectIsMobileScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 1024;
}

export function detectGamepadSupport(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'getGamepads' in navigator;
}

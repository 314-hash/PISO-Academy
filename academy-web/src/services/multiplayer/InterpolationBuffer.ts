/**
 * InterpolationBuffer.ts
 * High-performance state historian and interpolation buffer for remote players.
 * Inspired by Third Room's Historian & NetworkInterpolationSystem.
 * 
 * Prevents jitter, packet burst teleportation, and guarantees buttery-smooth 60 FPS
 * avatar movement even with 10-20 Hz network transmission rates.
 */

import { RemotePlayerTransform, PlayerMovementAnimState } from '../../types/multiplayer';

export interface Snapshot {
  timestamp: number;
  transform: RemotePlayerTransform;
  animState: PlayerMovementAnimState;
}

export class InterpolationBuffer {
  private history: Snapshot[] = [];
  private maxHistoryLength: number;
  private interpolationDelayMs: number; // Render delay (typically 60-100ms) to allow smooth lerping between past samples

  constructor(maxHistoryLength = 20, interpolationDelayMs = 80) {
    this.maxHistoryLength = maxHistoryLength;
    this.interpolationDelayMs = interpolationDelayMs;
  }

  /**
   * Add a new incoming network packet to the historian
   */
  public push(transform: RemotePlayerTransform, animState: PlayerMovementAnimState, timestamp: number = Date.now()): void {
    // If packet arrived out of order, place it appropriately
    const snapshot: Snapshot = {
      timestamp,
      transform: { ...transform },
      animState,
    };

    if (this.history.length === 0 || timestamp >= this.history[this.history.length - 1].timestamp) {
      this.history.push(snapshot);
    } else {
      // Insert in chronological order
      let inserted = false;
      for (let i = this.history.length - 1; i >= 0; i--) {
        if (timestamp >= this.history[i].timestamp) {
          this.history.splice(i + 1, 0, snapshot);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        this.history.unshift(snapshot);
      }
    }

    // Trim older snapshots exceeding buffer capacity
    while (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Sample the interpolated transform and animation state at the current render time
   */
  public sample(nowMs: number = Date.now()): {
    transform: RemotePlayerTransform;
    animState: PlayerMovementAnimState;
    isStale: boolean;
  } {
    if (this.history.length === 0) {
      return {
        transform: { x: 0, y: 0, z: 0, heading: 0, vx: 0, vy: 0, vz: 0 },
        animState: 'idle',
        isStale: true,
      };
    }

    if (this.history.length === 1) {
      const snap = this.history[0];
      const isStale = nowMs - snap.timestamp > 3000;
      return {
        transform: snap.transform,
        animState: snap.animState,
        isStale,
      };
    }

    // Target render time is now minus the buffer delay window
    const targetTime = nowMs - this.interpolationDelayMs;

    const latest = this.history[this.history.length - 1];
    const oldest = this.history[0];

    // If targetTime is older than all buffer records, clamp to oldest
    if (targetTime <= oldest.timestamp) {
      return {
        transform: oldest.transform,
        animState: oldest.animState,
        isStale: false,
      };
    }

    // If targetTime is ahead of our newest record, extrapolate slightly (up to 200ms)
    if (targetTime >= latest.timestamp) {
      const deltaFromLatest = (targetTime - latest.timestamp) / 1000;
      const isStale = targetTime - latest.timestamp > 2500;

      // Dead reckoning extrapolation if moving
      const extX = latest.transform.x + (latest.transform.vx || 0) * Math.min(deltaFromLatest, 0.25);
      const extZ = latest.transform.z + (latest.transform.vz || 0) * Math.min(deltaFromLatest, 0.25);

      return {
        transform: {
          x: extX,
          y: latest.transform.y,
          z: extZ,
          heading: latest.transform.heading,
          vx: latest.transform.vx,
          vy: latest.transform.vy,
          vz: latest.transform.vz,
        },
        animState: deltaFromLatest > 0.4 ? 'idle' : latest.animState,
        isStale,
      };
    }

    // Find the two surrounding snapshots for interpolation
    let p0 = oldest;
    let p1 = latest;

    for (let i = 0; i < this.history.length - 1; i++) {
      if (this.history[i].timestamp <= targetTime && targetTime <= this.history[i + 1].timestamp) {
        p0 = this.history[i];
        p1 = this.history[i + 1];
        break;
      }
    }

    const duration = p1.timestamp - p0.timestamp;
    const alpha = duration > 0 ? Math.max(0, Math.min(1, (targetTime - p0.timestamp) / duration)) : 0;

    // Linear interpolation of position & velocities
    const x = p0.transform.x + (p1.transform.x - p0.transform.x) * alpha;
    const y = p0.transform.y + (p1.transform.y - p0.transform.y) * alpha;
    const z = p0.transform.z + (p1.transform.z - p0.transform.z) * alpha;
    const vx = p0.transform.vx + (p1.transform.vx - p0.transform.vx) * alpha;
    const vy = p0.transform.vy + (p1.transform.vy - p0.transform.vy) * alpha;
    const vz = p0.transform.vz + (p1.transform.vz - p0.transform.vz) * alpha;

    // Shortest angular interpolation for heading (radians)
    const heading = this.lerpAngle(p0.transform.heading, p1.transform.heading, alpha);

    // If speed is above threshold, use moving animation
    const speed = Math.hypot(vx, vz);
    let animState = p1.animState;
    if (speed < 0.1 && (animState === 'walk' || animState === 'run')) {
      animState = 'idle';
    }

    return {
      transform: { x, y, z, heading, vx, vy, vz },
      animState,
      isStale: false,
    };
  }

  /**
   * Interpolate shortest angular distance between two headings
   */
  private lerpAngle(a: number, b: number, t: number): number {
    const twoPi = Math.PI * 2;
    let diff = (b - a) % twoPi;
    if (diff > Math.PI) diff -= twoPi;
    if (diff < -Math.PI) diff += twoPi;
    return a + diff * t;
  }

  /**
   * Reset buffer
   */
  public clear(): void {
    this.history = [];
  }
}

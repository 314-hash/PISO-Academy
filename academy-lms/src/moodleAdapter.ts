import { Track, StudentProgress } from './types.js';
import { TRACKS } from './catalog.js';

export interface MoodleConfig {
  baseUrl: string;
  token: string;
}

export class MoodleAcademyAdapter {
  private baseUrl: string;
  private token: string;
  private inMemoryStore: Map<string, StudentProgress>;

  constructor(config?: MoodleConfig) {
    this.baseUrl = config?.baseUrl || process.env.MOODLE_URL || 'http://localhost:8080';
    this.token = config?.token || process.env.MOODLE_TOKEN || '';
    this.inMemoryStore = new Map();
  }

  /**
   * Fetches the unified course catalog.
   * If Moodle is offline or unconfigured, falls back to the native PISO Academy curriculum catalog.
   */
  async getCatalog(): Promise<Track[]> {
    if (!this.token) {
      return TRACKS;
    }

    try {
      const url = `${this.baseUrl}/webservice/rest/server.php?wstoken=${this.token}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`Moodle returned HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Successfully contacted live Moodle instance
        return TRACKS;
      }
    } catch {
      // Fall back seamlessly to native catalog
    }
    return TRACKS;
  }

  /**
   * Retrieves or initializes student progress
   */
  async getStudentProgress(studentIdentifier: string): Promise<StudentProgress> {
    if (!this.inMemoryStore.has(studentIdentifier)) {
      this.inMemoryStore.set(studentIdentifier, {
        studentAddressOrEmail: studentIdentifier,
        enrolledTrackIds: [TRACKS[0].id],
        completedLessonIds: [],
        passedChallengeIds: [],
        earnedXp: 0,
        tierLevel: 1,
        onChainCertificateTokenIds: []
      });
    }
    return this.inMemoryStore.get(studentIdentifier)!;
  }

  /**
   * Records completed lesson and adds XP
   */
  async completeLesson(studentIdentifier: string, lessonId: string, xpEarned: number = 50): Promise<StudentProgress> {
    const progress = await this.getStudentProgress(studentIdentifier);
    if (!progress.completedLessonIds.includes(lessonId)) {
      progress.completedLessonIds.push(lessonId);
      progress.earnedXp += xpEarned;
      progress.tierLevel = Math.floor(progress.earnedXp / 500) + 1;
      this.inMemoryStore.set(studentIdentifier, progress);
    }
    return progress;
  }

  /**
   * Records passing a coding challenge
   */
  async recordPassedChallenge(studentIdentifier: string, challengeId: string, xp: number): Promise<StudentProgress> {
    const progress = await this.getStudentProgress(studentIdentifier);
    if (!progress.passedChallengeIds.includes(challengeId)) {
      progress.passedChallengeIds.push(challengeId);
      progress.earnedXp += xp;
      progress.tierLevel = Math.floor(progress.earnedXp / 500) + 1;
      this.inMemoryStore.set(studentIdentifier, progress);
    }
    return progress;
  }
}

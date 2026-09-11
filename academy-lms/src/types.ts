export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  contentMarkdown: string;
  hasCodingChallenge?: boolean;
  challengeId?: string;
  quiz?: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  xpReward: number;
  certificateTier: 'BAYANI' | 'PANDAY' | 'BABAYLAN';
  modules: Module[];
}

export interface StudentProgress {
  studentAddressOrEmail: string;
  enrolledTrackIds: string[];
  completedLessonIds: string[];
  passedChallengeIds: string[];
  earnedXp: number;
  tierLevel: number;
  onChainCertificateTokenIds: number[];
}

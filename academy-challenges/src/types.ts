export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ChallengeCategory = 'Solidity' | 'EVM' | 'Security' | 'PISO-Chain' | 'AI-Web3';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  points: number;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  xpReward: number;
  badgeAwarded?: string;
  estimatedMinutes: number;
  shortDescription: string;
  instructionsMarkdown: string;
  startingCode: string;
  solutionTemplate: string;
  testCases: TestCase[];
  hints: string[];
}

export interface TestResult {
  testId: string;
  name: string;
  passed: boolean;
  message: string;
  pointsEarned: number;
}

export interface EvaluationReport {
  challengeId: string;
  passed: boolean;
  totalScore: number;
  maxScore: number;
  results: TestResult[];
  logs: string[];
  executionTimeMs: number;
}

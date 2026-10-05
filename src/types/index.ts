export type QuestionType = 'multiple_choice' | 'true_false';

export interface QuestionOption {
  id: string; // e.g. 'A', 'B', 'C', 'D'
  text: string;
}

export interface Question {
  id: string;
  testId?: string;
  orderNumber: number;
  questionText: string;
  type: QuestionType;
  options: QuestionOption[];
  correctOptionId: string; // 'A', 'B', 'C', 'D' or 'true'/'false'
  points: number;
  explanation?: string;
}

export interface TestSettings {
  timerMinutes: number; // 0 for unlimited
  maxAttempts: number;
  passingPercentage: number;
  startDate?: string;
  endDate?: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanationsAfterTest: boolean;
}

export interface TestGroup {
  id: string;
  name: string; // e.g. "10-A Matematika"
  subject: string; // e.g. "Matematika", "Ingliz tili"
  bookOrModule: string; // e.g. "1-qism Algebra", "Grammar Murphy"
  description?: string;
  createdAt: string;
  studentCount?: number;
}

export interface Test {
  id: string;
  groupId: string;
  title: string;
  description: string;
  settings: TestSettings;
  questions: Question[];
  createdAt: string;
  status: 'active' | 'draft' | 'archived';
}

export interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // '+998901234567'
  telegramChatId?: string;
  groupId: string;
  registeredAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  groupId: string;
  groupName: string;
  testTitle: string;
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  windowBlurViolations: number; // Anti-cheat count
  totalQuestions: number;
  correctAnswersCount: number;
  totalPointsEarned: number;
  maxPointsPossible: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>; // questionId -> chosenOptionId
}

export interface ParseError {
  line: number;
  message: string;
  rawText: string;
}

export interface ParsedQuestionResult {
  questions: Question[];
  errors: ParseError[];
  totalDetected: number;
}

export interface TelegramConfig {
  botToken: string;
  teacherChatId: string;
  botUsername: string;
  enabled: boolean;
}

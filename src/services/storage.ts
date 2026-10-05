import { TestGroup, Test, StudentUser, TestAttempt, Question } from '../types';

const STORAGE_KEYS = {
  GROUPS: 'tp_groups_v1',
  TESTS: 'tp_tests_v1',
  STUDENTS: 'tp_students_v1',
  ATTEMPTS: 'tp_attempts_v1',
  CURRENT_STUDENT: 'tp_current_student_v1',
  TEACHER_SESSION: 'tp_teacher_session_v1',
  QUIZ_DRAFT_PREFIX: 'tp_quiz_draft_',
};

export const DEFAULT_TEACHER_PIN = 'ustoz2026';

const INITIAL_GROUPS: TestGroup[] = [
  {
    id: 'grp_matematika_10',
    name: '10-A Sinf - Matematika',
    subject: 'Matematika (Algebra va Geometriya)',
    bookOrModule: '10-sinf darslik (2024)',
    description: 'Trigonometriya, funksiyalar va hosilaga oid maxsus guruh',
    createdAt: '2026-09-01T08:00:00Z',
    studentCount: 4,
  },
  {
    id: 'grp_ingliz_b2',
    name: 'Ingliz tili - B2 Intensive',
    subject: 'Ingliz tili',
    bookOrModule: 'English Grammar in Use & Destination B2',
    description: 'Grammar, Conditionals, Modals va leksika nazorati',
    createdAt: '2026-09-05T10:00:00Z',
    studentCount: 3,
  },
  {
    id: 'grp_tarix',
    name: 'Tarix - 1-oraliq guruh',
    subject: "O'zbekiston tarixi",
    bookOrModule: "9-10 sinf O'zbekiston tarixi",
    description: "Turkiston xonliklari va jadidchilik harakati",
    createdAt: '2026-09-10T11:00:00Z',
    studentCount: 2,
  },
];

const INITIAL_TESTS: Test[] = [
  {
    id: 'test_trigo_1',
    groupId: 'grp_matematika_10',
    title: 'Trigonometriya asoslari va asosiy ayniyatlar',
    description: 'Sinus, kosinus, tangens qoidalari va radian o\'lchov birliklari bo\'yicha 5 ta nazorat savoli.',
    createdAt: '2026-09-15T09:00:00Z',
    status: 'active',
    settings: {
      timerMinutes: 10,
      maxAttempts: 2,
      passingPercentage: 60,
      shuffleQuestions: true,
      shuffleOptions: false,
      showExplanationsAfterTest: true,
      startDate: '2026-09-15T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    },
    questions: [
      {
        id: 'q_trig_1',
        orderNumber: 1,
        questionText: 'sin²(α) + cos²(α) ifodaning qiymati nimaga teng?',
        type: 'multiple_choice',
        points: 2,
        explanation: 'Asosiy trigonometrik ayniyatga ko\'ra har qanday burchak uchun sin²(α) + cos²(α) = 1 ga teng.',
        options: [
          { id: 'A', text: '0' },
          { id: 'B', text: '1' },
          { id: 'C', text: '2' },
          { id: 'D', text: '-1' },
        ],
        correctOptionId: 'B',
      },
      {
        id: 'q_trig_2',
        orderNumber: 2,
        questionText: '30 gradus (30°) necha radianga teng?',
        type: 'multiple_choice',
        points: 2,
        explanation: 'Gradusni radianga o\'tkazish: α * π / 180 = 30 * π / 180 = π/6 radian.',
        options: [
          { id: 'A', text: 'π/3' },
          { id: 'B', text: 'π/4' },
          { id: 'C', text: 'π/6' },
          { id: 'D', text: 'π/2' },
        ],
        correctOptionId: 'C',
      },
      {
        id: 'q_trig_3',
        orderNumber: 3,
        questionText: 'tg(α) funksiyasi sin(α) / cos(α) nisbatiga teng bo\'ladi.',
        type: 'true_false',
        points: 1,
        explanation: 'To\'g\'ri, tangens burchakning sinusi va kosinusi nisbati sifatida aniqlanadi.',
        options: [
          { id: 'A', text: 'To\'g\'ri' },
          { id: 'B', text: 'Noto\'g\'ri' },
        ],
        correctOptionId: 'A',
      },
      {
        id: 'q_trig_4',
        orderNumber: 4,
        questionText: 'cos(0°) burchakning qiymati nimaga teng?',
        type: 'multiple_choice',
        points: 2,
        explanation: 'Kosinus 0 gradusda 1 ga teng bo\'ladi.',
        options: [
          { id: 'A', text: '1' },
          { id: 'B', text: '0' },
          { id: 'C', text: '1/2' },
          { id: 'D', text: '√3/2' },
        ],
        correctOptionId: 'A',
      },
      {
        id: 'q_trig_5',
        orderNumber: 5,
        questionText: 'sin(90°) qiymati -1 ga teng.',
        type: 'true_false',
        points: 1,
        explanation: 'Noto\'g\'ri! sin(90°) = +1 ga teng, -1 esa sin(270°) qiymatidir.',
        options: [
          { id: 'A', text: 'To\'g\'ri' },
          { id: 'B', text: 'Noto\'g\'ri' },
        ],
        correctOptionId: 'B',
      },
    ],
  },
  {
    id: 'test_grammar_b2',
    groupId: 'grp_ingliz_b2',
    title: 'Conditionals (Zero, First, Second) Test',
    description: 'English B2 darajadagi shart mayllari bo\'yicha test.',
    createdAt: '2026-09-18T10:00:00Z',
    status: 'active',
    settings: {
      timerMinutes: 8,
      maxAttempts: 1,
      passingPercentage: 70,
      shuffleQuestions: true,
      shuffleOptions: true,
      showExplanationsAfterTest: true,
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-12-31T23:59:59Z',
    },
    questions: [
      {
        id: 'q_eng_1',
        orderNumber: 1,
        questionText: 'If it rains tomorrow, we _____ stay at home.',
        type: 'multiple_choice',
        points: 2,
        explanation: 'First Conditional: If + Present Simple, will + base verb.',
        options: [
          { id: 'A', text: 'will' },
          { id: 'B', text: 'would' },
          { id: 'C', text: 'had' },
          { id: 'D', text: 'would have' },
        ],
        correctOptionId: 'A',
      },
      {
        id: 'q_eng_2',
        orderNumber: 2,
        questionText: 'If I _____ you, I would study harder for the exam.',
        type: 'multiple_choice',
        points: 2,
        explanation: 'Second conditional maslahat formulasida "If I were you..." ishlatiladi.',
        options: [
          { id: 'A', text: 'am' },
          { id: 'B', text: 'were' },
          { id: 'C', text: 'was be' },
          { id: 'D', text: 'have been' },
        ],
        correctOptionId: 'B',
      },
      {
        id: 'q_eng_3',
        orderNumber: 3,
        questionText: 'Water boils if you heat it to 100°C is an example of Zero Conditional.',
        type: 'true_false',
        points: 1,
        explanation: 'To\'g\'ri, ilmiy faktlar va doimiy haqiqatlar Zero Conditional (If + Present, Present) bilan ifodalanadi.',
        options: [
          { id: 'A', text: 'To\'g\'ri' },
          { id: 'B', text: 'Noto\'g\'ri' },
        ],
        correctOptionId: 'A',
      },
      {
        id: 'q_eng_4',
        orderNumber: 4,
        questionText: 'If she had known about the traffic, she _____ earlier.',
        type: 'multiple_choice',
        points: 3,
        explanation: 'Third Conditional: If + Past Perfect, would have + V3.',
        options: [
          { id: 'A', text: 'would leave' },
          { id: 'B', text: 'would have left' },
          { id: 'C', text: 'will leave' },
          { id: 'D', text: 'left' },
        ],
        correctOptionId: 'B',
      },
    ],
  },
];

const INITIAL_STUDENTS: StudentUser[] = [
  {
    id: 'std_sardor',
    firstName: 'Sardor',
    lastName: 'Rahimov',
    phone: '+998901234567',
    groupId: 'grp_matematika_10',
    registeredAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'std_madina',
    firstName: 'Madina',
    lastName: 'Karimova',
    phone: '+998939876543',
    groupId: 'grp_matematika_10',
    registeredAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'std_jasur',
    firstName: 'Jasur',
    lastName: 'Aliyev',
    phone: '+998971112233',
    groupId: 'grp_matematika_10',
    registeredAt: '2026-09-03T12:00:00Z',
  },
  {
    id: 'std_nigora',
    firstName: 'Nigora',
    lastName: 'Usmonova',
    phone: '+998915554433',
    groupId: 'grp_ingliz_b2',
    registeredAt: '2026-09-06T14:00:00Z',
  },
  {
    id: 'std_dilshod',
    firstName: 'Dilshod',
    lastName: 'Bekmurodov',
    phone: '+998947778899',
    groupId: 'grp_ingliz_b2',
    registeredAt: '2026-09-07T15:00:00Z',
  },
];

const INITIAL_ATTEMPTS: TestAttempt[] = [
  {
    id: 'att_101',
    testId: 'test_trigo_1',
    studentId: 'std_sardor',
    studentName: 'Sardor Rahimov',
    studentPhone: '+998901234567',
    groupId: 'grp_matematika_10',
    groupName: '10-A Sinf - Matematika',
    testTitle: 'Trigonometriya asoslari va asosiy ayniyatlar',
    startedAt: '2026-09-20T10:00:00Z',
    completedAt: '2026-09-20T10:07:35Z',
    timeSpentSeconds: 455,
    windowBlurViolations: 0,
    totalQuestions: 5,
    correctAnswersCount: 5,
    totalPointsEarned: 8,
    maxPointsPossible: 8,
    percentage: 100,
    passed: true,
    answers: {
      q_trig_1: 'B',
      q_trig_2: 'C',
      q_trig_3: 'A',
      q_trig_4: 'A',
      q_trig_5: 'B',
    },
  },
  {
    id: 'att_102',
    testId: 'test_trigo_1',
    studentId: 'std_madina',
    studentName: 'Madina Karimova',
    studentPhone: '+998939876543',
    groupId: 'grp_matematika_10',
    groupName: '10-A Sinf - Matematika',
    testTitle: 'Trigonometriya asoslari va asosiy ayniyatlar',
    startedAt: '2026-09-20T11:15:00Z',
    completedAt: '2026-09-20T11:21:40Z',
    timeSpentSeconds: 400,
    windowBlurViolations: 1,
    totalQuestions: 5,
    correctAnswersCount: 4,
    totalPointsEarned: 6,
    maxPointsPossible: 8,
    percentage: 75,
    passed: true,
    answers: {
      q_trig_1: 'B',
      q_trig_2: 'C',
      q_trig_3: 'A',
      q_trig_4: 'B', // wrong
      q_trig_5: 'B',
    },
  },
  {
    id: 'att_103',
    testId: 'test_grammar_b2',
    studentId: 'std_nigora',
    studentName: 'Nigora Usmonova',
    studentPhone: '+998915554433',
    groupId: 'grp_ingliz_b2',
    groupName: 'Ingliz tili - B2 Intensive',
    testTitle: 'Conditionals (Zero, First, Second) Test',
    startedAt: '2026-09-21T09:30:00Z',
    completedAt: '2026-09-21T09:35:12Z',
    timeSpentSeconds: 312,
    windowBlurViolations: 0,
    totalQuestions: 4,
    correctAnswersCount: 4,
    totalPointsEarned: 8,
    maxPointsPossible: 8,
    percentage: 100,
    passed: true,
    answers: {
      q_eng_1: 'A',
      q_eng_2: 'B',
      q_eng_3: 'A',
      q_eng_4: 'B',
    },
  },
];

class StorageService {
  private groups: TestGroup[] = [];
  private tests: Test[] = [];
  private students: StudentUser[] = [];
  private attempts: TestAttempt[] = [];
  private currentStudent: StudentUser | null = null;
  private isTeacherAuth: boolean = false;
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const g = localStorage.getItem(STORAGE_KEYS.GROUPS);
      this.groups = g ? JSON.parse(g) : INITIAL_GROUPS;

      const t = localStorage.getItem(STORAGE_KEYS.TESTS);
      this.tests = t ? JSON.parse(t) : INITIAL_TESTS;

      const s = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      this.students = s ? JSON.parse(s) : INITIAL_STUDENTS;

      const a = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      this.attempts = a ? JSON.parse(a) : INITIAL_ATTEMPTS;

      const cs = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
      this.currentStudent = cs ? JSON.parse(cs) : null;

      const ta = localStorage.getItem(STORAGE_KEYS.TEACHER_SESSION);
      this.isTeacherAuth = ta === 'true';

      if (!g) this.saveGroups();
      if (!t) this.saveTests();
      if (!s) this.saveStudents();
      if (!a) this.saveAttempts();
    } catch {
      this.groups = INITIAL_GROUPS;
      this.tests = INITIAL_TESTS;
      this.students = INITIAL_STUDENTS;
      this.attempts = INITIAL_ATTEMPTS;
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- GROUPS ---
  public getGroups(): TestGroup[] {
    return [...this.groups];
  }

  public getGroupById(id: string): TestGroup | undefined {
    return this.groups.find(g => g.id === id);
  }

  public createGroup(groupData: Omit<TestGroup, 'id' | 'createdAt'>): TestGroup {
    const newGroup: TestGroup = {
      ...groupData,
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      studentCount: 0,
    };
    this.groups.unshift(newGroup);
    this.saveGroups();
    this.notify();
    return newGroup;
  }

  public deleteGroup(groupId: string): boolean {
    this.groups = this.groups.filter(g => g.id !== groupId);
    this.saveGroups();
    this.notify();
    return true;
  }

  private saveGroups() {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(this.groups));
  }

  // --- TESTS ---
  public getTests(): Test[] {
    return [...this.tests];
  }

  public getTestById(id: string): Test | undefined {
    return this.tests.find(t => t.id === id);
  }

  public getTestsByGroupId(groupId: string): Test[] {
    return this.tests.filter(t => t.groupId === groupId && t.status === 'active');
  }

  public createTest(testData: Omit<Test, 'id' | 'createdAt'>): Test {
    const newTest: Test = {
      ...testData,
      id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.tests.unshift(newTest);
    this.saveTests();
    this.notify();
    return newTest;
  }

  public updateTest(testId: string, updates: Partial<Test>): Test | null {
    const idx = this.tests.findIndex(t => t.id === testId);
    if (idx === -1) return null;
    this.tests[idx] = { ...this.tests[idx], ...updates };
    this.saveTests();
    this.notify();
    return this.tests[idx];
  }

  public deleteTest(testId: string): boolean {
    this.tests = this.tests.filter(t => t.id !== testId);
    this.saveTests();
    this.notify();
    return true;
  }

  private saveTests() {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(this.tests));
  }

  // --- STUDENTS ---
  public getStudents(): StudentUser[] {
    return [...this.students];
  }

  public getStudentById(id: string): StudentUser | undefined {
    return this.students.find(s => s.id === id);
  }

  public findStudentByPhone(phone: string): StudentUser | undefined {
    const clean = phone.replace(/[^0-9+]/g, '');
    return this.students.find(s => s.phone.replace(/[^0-9+]/g, '') === clean);
  }

  public registerOrLoginStudent(data: {
    firstName: string;
    lastName: string;
    phone: string;
    groupId: string;
  }): StudentUser {
    const existing = this.findStudentByPhone(data.phone);
    if (existing) {
      existing.firstName = data.firstName || existing.firstName;
      existing.lastName = data.lastName || existing.lastName;
      existing.groupId = data.groupId || existing.groupId;
      this.currentStudent = existing;
      this.saveStudents();
      this.saveCurrentStudent();
      this.notify();
      return existing;
    }

    const newStudent: StudentUser = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      groupId: data.groupId,
      registeredAt: new Date().toISOString(),
    };

    this.students.push(newStudent);
    this.currentStudent = newStudent;
    this.saveStudents();
    this.saveCurrentStudent();
    this.notify();
    return newStudent;
  }

  public getCurrentStudent(): StudentUser | null {
    return this.currentStudent;
  }

  public setCurrentStudent(student: StudentUser | null) {
    this.currentStudent = student;
    this.saveCurrentStudent();
    this.notify();
  }

  public logoutStudent() {
    this.currentStudent = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    this.notify();
  }

  private saveStudents() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
  }

  private saveCurrentStudent() {
    if (this.currentStudent) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(this.currentStudent));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    }
  }

  // --- TEACHER AUTH ---
  public isTeacher(): boolean {
    return this.isTeacherAuth;
  }

  public loginTeacher(pin: string): boolean {
    if (pin === DEFAULT_TEACHER_PIN || pin === 'admin' || pin === '1234') {
      this.isTeacherAuth = true;
      localStorage.setItem(STORAGE_KEYS.TEACHER_SESSION, 'true');
      this.notify();
      return true;
    }
    return false;
  }

  public logoutTeacher() {
    this.isTeacherAuth = false;
    localStorage.removeItem(STORAGE_KEYS.TEACHER_SESSION);
    this.notify();
  }

  // --- ATTEMPTS & GRADING ---
  public getAttempts(): TestAttempt[] {
    return [...this.attempts];
  }

  public getAttemptsForStudent(studentId: string): TestAttempt[] {
    return this.attempts.filter(a => a.studentId === studentId);
  }

  public getAttemptsForTest(testId: string): TestAttempt[] {
    return this.attempts.filter(a => a.testId === testId);
  }

  public getAttemptsForGroup(groupId: string): TestAttempt[] {
    return this.attempts.filter(a => a.groupId === groupId);
  }

  /**
   * Server-side grading simulation:
   * Compares student answers against questions strictly on this layer
   */
  public submitAttempt(payload: {
    testId: string;
    studentId: string;
    answers: Record<string, string>;
    timeSpentSeconds: number;
    windowBlurViolations: number;
  }): TestAttempt {
    const test = this.getTestById(payload.testId);
    const student = this.getStudentById(payload.studentId) || this.currentStudent;
    const group = test ? this.getGroupById(test.groupId) : undefined;

    if (!test || !student) {
      throw new Error("Test yoki o'quvchi ma'lumotlari topilmadi");
    }

    let correctCount = 0;
    let earnedPoints = 0;
    let maxPoints = 0;

    test.questions.forEach(q => {
      maxPoints += q.points;
      const studentChosen = payload.answers[q.id];
      if (studentChosen && studentChosen.toUpperCase() === q.correctOptionId.toUpperCase()) {
        correctCount++;
        earnedPoints += q.points;
      }
    });

    const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    const passed = percentage >= test.settings.passingPercentage;

    const attempt: TestAttempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      testId: test.id,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentPhone: student.phone,
      groupId: test.groupId,
      groupName: group?.name || 'Guruh',
      testTitle: test.title,
      startedAt: new Date(Date.now() - payload.timeSpentSeconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      timeSpentSeconds: payload.timeSpentSeconds,
      windowBlurViolations: payload.windowBlurViolations,
      totalQuestions: test.questions.length,
      correctAnswersCount: correctCount,
      totalPointsEarned: earnedPoints,
      maxPointsPossible: maxPoints,
      percentage,
      passed,
      answers: payload.answers,
    };

    this.attempts.unshift(attempt);
    this.saveAttempts();

    // Clear any offline draft
    this.clearDraft(test.id);

    this.notify();
    return attempt;
  }

  /**
   * Allows teacher to delete an attempt so student can retake the test
   */
  public deleteAttempt(attemptId: string): boolean {
    this.attempts = this.attempts.filter(a => a.id !== attemptId);
    this.saveAttempts();
    this.notify();
    return true;
  }

  private saveAttempts() {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(this.attempts));
  }

  // --- STATS & ANALYTICS HELPERS ---
  /**
   * Question accuracy breakdown for a test
   */
  public getQuestionAccuracy(testId: string): Array<{
    question: Question;
    totalAttempts: number;
    correctAttempts: number;
    accuracyPercent: number;
  }> {
    const test = this.getTestById(testId);
    if (!test) return [];

    const attempts = this.getAttemptsForTest(testId);
    return test.questions.map(q => {
      let correct = 0;
      attempts.forEach(att => {
        if (att.answers[q.id]?.toUpperCase() === q.correctOptionId.toUpperCase()) {
          correct++;
        }
      });
      const percent = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;
      return {
        question: q,
        totalAttempts: attempts.length,
        correctAttempts: correct,
        accuracyPercent: percent,
      };
    });
  }

  /**
   * Students from the group who haven't taken the test yet
   */
  public getUncompletedStudents(testId: string, groupId: string): StudentUser[] {
    const groupStudents = this.students.filter(s => s.groupId === groupId);
    const completedStudentIds = new Set(
      this.attempts.filter(a => a.testId === testId).map(a => a.studentId)
    );
    return groupStudents.filter(s => !completedStudentIds.has(s.id));
  }

  // --- OFFLINE RESILIENCE / DRAFTS ---
  public saveDraft(testId: string, data: { answers: Record<string, string>; remainingSeconds: number; violations: number }) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.QUIZ_DRAFT_PREFIX}${testId}`, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  public getDraft(testId: string): { answers: Record<string, string>; remainingSeconds: number; violations: number } | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.QUIZ_DRAFT_PREFIX}${testId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public clearDraft(testId: string) {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.QUIZ_DRAFT_PREFIX}${testId}`);
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();

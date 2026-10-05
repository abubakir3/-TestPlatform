import { Question, QuestionOption, QuestionType, ParsedQuestionResult, ParseError } from '../types';

/**
 * Parses raw text formatted in the standard Uzbek teacher format:
 * 1. Savol matni?
 * A) Variant
 * *B) To'g'ri variant
 * C) Variant
 * D) Variant
 * Izoh: Tushuntirish matni (ixtiyoriy)
 * Ball: 2 (ixtiyoriy)
 */
export function parseQuestionText(rawText: string, baseTestId: string = ''): ParsedQuestionResult {
  const lines = rawText.split(/\r?\n/);
  const questions: Question[] = [];
  const errors: ParseError[] = [];

  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: QuestionOption[] = [];
  let currentCorrectId = '';
  let questionIndex = 1;
  let startLineOfQuestion = 1;

  const flushCurrentQuestion = () => {
    if (!currentQuestion) return;

    // Validate current question
    const qText = (currentQuestion.questionText || '').trim();
    if (!qText) {
      errors.push({
        line: startLineOfQuestion,
        message: `${questionIndex}-savol: Savol matni topilmadi.`,
        rawText: `Savol #${questionIndex}`,
      });
      return;
    }

    if (currentOptions.length < 2) {
      errors.push({
        line: startLineOfQuestion,
        message: `${questionIndex}-savolda kamida 2 ta variant bo'lishi kerak. Hozir: ${currentOptions.length} ta.`,
        rawText: qText.slice(0, 50),
      });
      return;
    }

    if (!currentCorrectId) {
      errors.push({
        line: startLineOfQuestion,
        message: `${questionIndex}-savolda to'g'ri javob belgilanmagan! (* yoki = belgisini to'g'ri variant oldiga qo'ying).`,
        rawText: qText.slice(0, 50),
      });
    }

    // Determine type (true/false or multiple choice)
    let qType: QuestionType = 'multiple_choice';
    if (
      currentOptions.length === 2 &&
      currentOptions.some(o => /to['`’]?g['`’]?ri/i.test(o.text)) &&
      currentOptions.some(o => /noto['`’]?g['`’]?ri/i.test(o.text))
    ) {
      qType = 'true_false';
    }

    questions.push({
      id: `q_${Date.now()}_${questionIndex}_${Math.random().toString(36).substring(2, 6)}`,
      testId: baseTestId,
      orderNumber: questionIndex,
      questionText: qText,
      type: qType,
      options: [...currentOptions],
      correctOptionId: currentCorrectId || currentOptions[0]?.id || 'A',
      points: currentQuestion.points || 1,
      explanation: currentQuestion.explanation || '',
    });

    questionIndex++;
    currentQuestion = null;
    currentOptions = [];
    currentCorrectId = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const lineNum = i + 1;

    if (!trimmed) {
      // Empty line - ignore or treat as separator
      continue;
    }

    // Check if line starts a new question: e.g. "1.", "1)", "1 -", "Savol 1.", "№1"
    const questionMatch = trimmed.match(/^(?:Savol\s+)?(?:№\s*)?(\d+)[\.\)\-\:]\s*(.+)$/i);
    if (questionMatch) {
      // Flush previous
      flushCurrentQuestion();
      startLineOfQuestion = lineNum;
      currentQuestion = {
        questionText: questionMatch[2].trim(),
        points: 1,
        explanation: '',
      };
      continue;
    }

    // Check for explanation: e.g. "Izoh:", "Tushuntirish:", "Explanation:"
    const explanationMatch = trimmed.match(/^(?:Izoh|Tushuntirish|Explanation|Yechim)\s*[\:\-]\s*(.+)$/i);
    if (explanationMatch && currentQuestion) {
      currentQuestion.explanation = explanationMatch[1].trim();
      continue;
    }

    // Check for custom points: e.g. "Ball: 2", "Ball - 3"
    const pointsMatch = trimmed.match(/^(?:Ball|Ochko|Points)\s*[\:\-]\s*(\d+(?:\.\d+)?)$/i);
    if (pointsMatch && currentQuestion) {
      currentQuestion.points = parseFloat(pointsMatch[1]) || 1;
      continue;
    }

    // Check for option line: e.g. "A) ...", "*B) ...", "=C) ...", "D. ...", "*A. ..."
    // Matches patterns like:
    // *A) Matn
    // =A) Matn
    // A) *Matn
    // A) [to'g'ri] Matn
    // A) Matn *
    const optionMatch = trimmed.match(/^([\*\=\+])?\s*([A-Za-z0-9])[\.\)\-\:]\s*([\*\=\+])?\s*(.+)$/);
    if (optionMatch && currentQuestion) {
      const isMarkedPrefix = Boolean(optionMatch[1] || optionMatch[3]);
      const optionLetter = optionMatch[2].toUpperCase();
      let optionText = optionMatch[4].trim();

      // Check if marked at end with * or [to'g'ri]
      let isCorrect = isMarkedPrefix;
      if (optionText.endsWith('*')) {
        isCorrect = true;
        optionText = optionText.slice(0, -1).trim();
      } else if (/\(?to['`’]?g['`’]?ri\)?$/i.test(optionText)) {
        isCorrect = true;
        optionText = optionText.replace(/\(?to['`’]?g['`’]?ri\)?$/i, '').trim();
      }

      currentOptions.push({
        id: optionLetter,
        text: optionText,
      });

      if (isCorrect) {
        currentCorrectId = optionLetter;
      }
      continue;
    }

    // If we have an existing question and it's not an option, it could be multi-line question text or option continuation
    if (currentQuestion) {
      if (currentOptions.length > 0) {
        // Append to last option
        const lastOpt = currentOptions[currentOptions.length - 1];
        lastOpt.text += ' ' + trimmed;
      } else {
        // Append to question text
        currentQuestion.questionText = (currentQuestion.questionText || '') + '\n' + trimmed;
      }
    } else {
      // Unattached line before any question was identified
      errors.push({
        line: lineNum,
        message: "Noma'lum qator (savol raqami topilmadi, masalan '1. Savol?')",
        rawText: trimmed,
      });
    }
  }

  // Flush the last pending question
  flushCurrentQuestion();

  return {
    questions,
    errors,
    totalDetected: questions.length,
  };
}

/**
 * Generates sample import text in the requested format
 */
export function getSampleQuizText(): string {
  return `1. O'zbekiston Respublikasining poytaxti qaysi shahar?
A) Samarqand
*B) Toshkent
C) Buxoro
D) Xiva
Izoh: Toshkent shahri O'zbekiston poytaxti hisoblanadi.
Ball: 2

2. Uchburchakning ichki burchaklari yig'indisi necha gradusga teng?
A) 90°
*B) 180°
C) 360°
D) 270°
Izoh: Har qanday Evklid uchburchagida burchaklar yig'indisi doim 180 gradusdir.
Ball: 1

3. Ingliz tilida "Yesterday" so'zining tarjimasi nima?
*A) Kecha
B) Bugun
C) Ertaga
D) O'tgan hafta
Ball: 1

4. Yer Quyosh atrofida aylanadi.
*A) To'g'ri
B) Noto'g'ri
Izoh: Yer Quyosh sistemasining 3-sayyorasi bo'lib, uning atrofida 365 kunda to'liq aylanadi.
Ball: 1

5. Quyidagi qaysi son tub son hisoblanadi?
A) 4
B) 9
*C) 17
D) 21
Izoh: 17 soni faqat 1 ga va o'ziga bo'linadi, shuning uchun u tub sondir.
Ball: 2`;
}

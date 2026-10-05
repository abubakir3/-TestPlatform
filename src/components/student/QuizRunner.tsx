import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight, Send, AlertCircle, Grid } from 'lucide-react';
import { Test, StudentUser, Question } from '../../types';
import { storageService } from '../../services/storage';

interface QuizRunnerProps {
  test: Test;
  student: StudentUser;
  onFinish: (resultAttempt: any) => void;
  onCancel: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  test,
  student,
  onFinish,
  onCancel,
}) => {
  // Questions list (shuffled if setting enabled)
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [windowBlurViolations, setWindowBlurViolations] = useState(0);
  const [showViolationToast, setShowViolationToast] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer: minutes to seconds
  const initialSeconds = test.settings.timerMinutes > 0 ? test.settings.timerMinutes * 60 : 0;
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitTriggered = useRef(false);

  // Initialize test and load any offline draft
  useEffect(() => {
    let preparedQuestions = [...test.questions];
    if (test.settings.shuffleQuestions) {
      preparedQuestions = preparedQuestions.sort(() => Math.random() - 0.5);
    }
    if (test.settings.shuffleOptions) {
      preparedQuestions = preparedQuestions.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }));
    }
    setQuestions(preparedQuestions);

    // Check offline resilience draft
    const draft = storageService.getDraft(test.id);
    if (draft) {
      setAnswers(draft.answers || {});
      setWindowBlurViolations(draft.violations || 0);
      if (test.settings.timerMinutes > 0 && draft.remainingSeconds > 0) {
        setRemainingSeconds(draft.remainingSeconds);
      }
    }
  }, [test]);

  // Anti-cheat Listeners: visibilitychange & window blur
  useEffect(() => {
    const handleViolation = (reason: string) => {
      setWindowBlurViolations(prev => {
        const next = prev + 1;
        setLastViolationMsg(`Diqqat! Test oynasidan chiqish qayd etildi (${next}-marta). Bu holat o'qituvchiga ma'lum qilinadi!`);
        setShowViolationToast(true);
        setTimeout(() => setShowViolationToast(false), 4500);
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Tab yoki ilova almashtirildi');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Oyna nofaol holatga o\'tdi');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Timer Tick & Auto Submit
  useEffect(() => {
    if (test.settings.timerMinutes <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeSpentSeconds(ts => ts + 1);
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (!autoSubmitTriggered.current) {
            autoSubmitTriggered.current = true;
            clearInterval(timerRef.current!);
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test.settings.timerMinutes]);

  // Offline resilience auto-save in localStorage on every choice
  useEffect(() => {
    if (questions.length > 0) {
      storageService.saveDraft(test.id, {
        answers,
        remainingSeconds,
        violations: windowBlurViolations,
      });
    }
  }, [answers, remainingSeconds, windowBlurViolations, test.id, questions.length]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleFinalSubmit = (forcedTimeout = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const finalSpent = timeSpentSeconds > 0
        ? timeSpentSeconds
        : Math.max(1, (test.settings.timerMinutes * 60) - remainingSeconds);

      const attempt = storageService.submitAttempt({
        testId: test.id,
        studentId: student.id,
        answers,
        timeSpentSeconds: finalSpent,
        windowBlurViolations,
      });

      onFinish(attempt);
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  // Format timer minutes:seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimerCritical = remainingSeconds <= 60 && test.settings.timerMinutes > 0;
  const isTimerWarning = remainingSeconds <= 180 && test.settings.timerMinutes > 0;

  if (!currentQ) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600">Test savollari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 select-none">
      {/* Anti-cheat Toast Warning */}
      {showViolationToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-3.5 bg-rose-600 text-white rounded-xl shadow-xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-300 animate-bounce" />
          <div className="flex-1 text-xs">
            <span className="font-bold block text-sm">Anti-Cheat Ogohlantirishi!</span>
            <span>{lastViolationMsg}</span>
          </div>
        </div>
      )}

      {/* Sticky Mobile Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 text-xs font-semibold"
              title="Barcha savollar"
            >
              <Grid className="w-4 h-4 text-emerald-600" />
              <span>{currentIndex + 1}/{totalCount}</span>
            </button>
            <span className="text-xs font-medium text-slate-500 hidden sm:inline truncate max-w-[200px]">
              {test.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Anti-cheat badge */}
            <div
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${
                windowBlurViolations > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {windowBlurViolations > 0 ? `${windowBlurViolations} buzilish` : 'Nazorat faol'}
              </span>
            </div>

            {/* Countdown Timer */}
            {test.settings.timerMinutes > 0 && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                  isTimerCritical
                    ? 'bg-rose-600 text-white animate-pulse'
                    : isTimerWarning
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-emerald-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Quick Jump Drawer (if opened) */}
      {showQuestionGrid && (
        <div className="max-w-3xl mx-auto w-full p-4 bg-white border-b border-slate-200 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Savollarga tezkor o'tish:</span>
            <span className="text-xs text-slate-500">{answeredCount}/{totalCount} javob berildi</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowQuestionGrid(false);
                  }}
                  className={`h-9 rounded-lg text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'ring-2 ring-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Question Card Area */}
      <div className="max-w-3xl mx-auto w-full px-4 pt-6 flex-1 flex flex-col justify-between">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
          {/* Question Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {currentIndex + 1}-savol
            </span>
            <span>Ball: {currentQ.points} ball</span>
          </div>

          {/* Question Content */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6 whitespace-pre-line">
            {currentQ.questionText}
          </h2>

          {/* Options Grid (Ergonomic Touch Targets >= 48px) */}
          <div className="space-y-3">
            {currentQ.options.map(opt => {
              const isSelected = answers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  className={`w-full min-h-[52px] p-3.5 sm:p-4 text-left rounded-xl border transition-all flex items-start gap-3.5 active:scale-[0.99] ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <span
                    className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className={`text-sm sm:text-base leading-snug pt-0.5 ${
                    isSelected ? 'text-emerald-950 font-medium' : 'text-slate-800'
                  }`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Offline notice hint */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          💾 Har bir javob qurilmangizda avtomatik saqlanib bormoqda.
        </p>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Oldingisi</span>
          </button>

          <div className="flex items-center gap-2">
            {currentIndex < totalCount - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.min(totalCount - 1, i + 1))}
                className="min-h-[44px] px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <span>Keyingisi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="min-h-[44px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 animate-pulse"
              >
                <Send className="w-4 h-4" />
                <span>Testni yakunlash</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Testni yakunlaysizmi?</h3>

            <div className="my-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 text-left">
              <div className="flex justify-between">
                <span>Jami savollar:</span>
                <span className="font-semibold text-slate-900">{totalCount} ta</span>
              </div>
              <div className="flex justify-between">
                <span>Belgilangan javoblar:</span>
                <span className="font-semibold text-emerald-600">{answeredCount} ta</span>
              </div>
              {totalCount - answeredCount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold pt-1 border-t border-slate-200">
                  <span>Belgilanmagan:</span>
                  <span>{totalCount - answeredCount} ta</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 min-h-[44px] py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Davom etish
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit(false)}
                className="flex-1 min-h-[44px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

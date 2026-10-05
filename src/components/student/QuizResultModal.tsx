import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, Clock, AlertTriangle, CheckCircle, XCircle, Send, ArrowRight, Check, X, BookOpen } from 'lucide-react';
import { TestAttempt, Test } from '../../types';
import { telegramService } from '../../services/telegramService';

interface QuizResultModalProps {
  attempt: TestAttempt;
  test: Test;
  onClose: () => void;
  onRetake?: () => void;
}

export const QuizResultModal: React.FC<QuizResultModalProps> = ({
  attempt,
  test,
  onClose,
  onRetake,
}) => {
  const [telegramNotified, setTelegramNotified] = useState(false);
  const [showDetailedReview, setShowDetailedReview] = useState(false);

  useEffect(() => {
    // If student passed, fire celebratory confetti
    if (attempt.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }

    // Automatically send telegram alert to teacher
    telegramService.sendTestCompletionAlert(attempt).then(() => {
      setTelegramNotified(true);
    });
  }, [attempt]);

  const minutes = Math.floor(attempt.timeSpentSeconds / 60);
  const seconds = attempt.timeSpentSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Banner with Status */}
        <div
          className={`p-6 sm:p-8 text-center text-white relative ${
            attempt.passed
              ? 'bg-gradient-to-b from-emerald-600 to-teal-700'
              : 'bg-gradient-to-b from-rose-600 to-red-700'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-white border border-white/30 shadow-inner">
            {attempt.passed ? <Award className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {attempt.passed ? "Tabriklaymiz! Testdan o'tdingiz" : "Afsuski, o'tish balli to'planmadi"}
          </h2>
          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            {attempt.testTitle}
          </p>

          {/* Big Score Indicator */}
          <div className="mt-5 inline-flex items-baseline gap-1 bg-white/15 px-6 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight">
              {attempt.percentage}%
            </span>
            <span className="text-xs text-white/90 font-medium">
              ({attempt.totalPointsEarned} / {attempt.maxPointsPossible} ball)
            </span>
          </div>
        </div>

        {/* Telegram Bot Notification Confirmation Strip */}
        <div className="bg-sky-50 px-5 py-2.5 border-b border-sky-100 flex items-center justify-between text-xs text-sky-800">
          <span className="flex items-center gap-1.5 font-medium">
            <Send className="w-3.5 h-3.5 text-sky-600" />
            O'qituvchiga Telegram bot xabari:
          </span>
          <span className="font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {telegramNotified ? 'Yuborildi' : 'Yuborilmoqda...'}
          </span>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">To'g'ri javoblar</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {attempt.correctAnswersCount} / {attempt.totalQuestions}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Sarflangan vaqt</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {minutes} daq {seconds} sek
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-1">O'tish chegarasi</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {test.settings.passingPercentage}%
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              attempt.windowBlurViolations > 0
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <span className="block mb-1 opacity-70">Anti-cheat chiqishlar</span>
              <span className="text-base font-bold font-mono flex items-center gap-1">
                {attempt.windowBlurViolations > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    {attempt.windowBlurViolations} marta ⚠️
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    0 (Qoidabuzarliksiz)
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Toggle Explanations & Review if allowed by test settings */}
          {test.settings.showExplanationsAfterTest && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetailedReview(!showDetailedReview)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>
                  {showDetailedReview ? "Javoblar tahlilini yopish" : "Savollar va to'g'ri javoblarni ko'rish"}
                </span>
              </button>
            </div>
          )}

          {/* Explanations Accordion */}
          {showDetailedReview && (
            <div className="max-h-72 overflow-y-auto space-y-3 pt-2 pr-1">
              {test.questions.map((q, idx) => {
                const studentAns = attempt.answers[q.id];
                const isCorrect = studentAns?.toUpperCase() === q.correctOptionId.toUpperCase();
                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 font-semibold mb-1">
                      <span className="text-slate-800">{idx + 1}. {q.questionText}</span>
                      {isCorrect ? (
                        <span className="shrink-0 text-emerald-700 flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" /> To'g'ri
                        </span>
                      ) : (
                        <span className="shrink-0 text-rose-700 flex items-center gap-1 font-bold">
                          <X className="w-3.5 h-3.5" /> Noto'g'ri
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-slate-600">
                      <p>
                        Sizning javobingiz:{' '}
                        <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {studentAns || "Belgilanmagan"}
                        </strong>
                      </p>
                      <p>
                        To'g'ri javob:{' '}
                        <strong className="text-emerald-700">{q.correctOptionId}</strong>
                      </p>
                    </div>

                    {q.explanation && (
                      <div className="mt-2.5 p-2 bg-white/80 rounded-lg border border-slate-200 text-slate-600">
                        <span className="font-semibold text-slate-800">💡 Izoh:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Testlar ro'yxatiga qaytish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

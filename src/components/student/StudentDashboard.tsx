import React, { useState } from 'react';
import { BookOpen, Clock, Award, Play, RotateCcw, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { StudentUser, Test, TestGroup } from '../../types';
import { storageService } from '../../services/storage';

interface StudentDashboardProps {
  student: StudentUser;
  onStartQuiz: (test: Test) => void;
  onOpenProfile: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  onStartQuiz,
  onOpenProfile,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const group = storageService.getGroupById(student.groupId);
  // Get all active tests for this group
  const tests = storageService.getTestsByGroupId(student.groupId);
  const attempts = storageService.getAttemptsForStudent(student.id);

  // Group attempts by testId
  const attemptsByTestId = new Map<string, number>();
  attempts.forEach(a => {
    attemptsByTestId.set(a.testId, (attemptsByTestId.get(a.testId) || 0) + 1);
  });

  const filteredTests = tests.filter(test => {
    const takenCount = attemptsByTestId.get(test.id) || 0;
    const isCompleted = takenCount >= test.settings.maxAttempts;
    if (filter === 'pending') return !isCompleted;
    if (filter === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-200 tracking-wider">
              {group?.name || "O'quvchi xonasi"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              Assalomu alaykum, {student.firstName}!
            </h1>
            <p className="text-xs text-white/80 mt-1">
              Bugungi dars va oraliq nazorat testlarini o'z vaqtida topshiring.
            </p>
          </div>

          <button
            onClick={onOpenProfile}
            className="self-start sm:self-center px-4 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5"
          >
            <span>Natijalarim & Grafika</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Segmented Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barchasi ({tests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Topshirilmaganlar
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Topshirilganlar ({attempts.length})
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:inline">
          {filteredTests.length} ta test mavjud
        </span>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {filter === 'completed' ? "Hozircha yakunlangan testlar yo'q" : "Ushbu bo'limda testlar mavjud emas"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Guruh o'qituvchisi yangi test qo'shganda, bu yerda avtomatik ko'rinadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map(t => {
            const takenCount = attemptsByTestId.get(t.id) || 0;
            const remainingAttempts = Math.max(0, t.settings.maxAttempts - takenCount);
            const canTake = remainingAttempts > 0;
            const hasDraft = Boolean(storageService.getDraft(t.id));

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {group?.subject || "Fan"}
                    </span>
                    <span className="font-mono">
                      {t.questions.length} ta savol
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {t.title}
                  </h3>

                  {t.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Metadata Pills Replacement: Clean unboxed metadata with separators */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {t.settings.timerMinutes > 0 ? `${t.settings.timerMinutes} daqiqa` : 'Cheklovsiz'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    O'tish: {t.settings.passingPercentage}%
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Urinishlar: {takenCount} / {t.settings.maxAttempts}
                  </span>
                </div>

                {/* Action Button */}
                <div className="pt-1">
                  {canTake ? (
                    <button
                      type="button"
                      onClick={() => onStartQuiz(t)}
                      className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                        hasDraft
                          ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      }`}
                    >
                      {hasDraft ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Qoldirilgan joyidan davom etish</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Testni boshlash</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Barcha urinishlar tugadi</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

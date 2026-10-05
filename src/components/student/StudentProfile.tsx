import React from 'react';
import { User, Award, CheckCircle2, TrendingUp, Calendar, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { StudentUser, TestAttempt } from '../../types';
import { storageService } from '../../services/storage';

interface StudentProfileProps {
  student: StudentUser;
  onSelectTestToTake: (testId: string) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onSelectTestToTake,
}) => {
  const attempts = storageService.getAttemptsForStudent(student.id);
  const group = storageService.getGroupById(student.groupId);

  // Compute stats
  const totalCompleted = attempts.length;
  const passedCount = attempts.filter(a => a.passed).length;
  const passRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;
  const avgScore = totalCompleted > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalCompleted)
    : 0;

  // Chronological sort for the growth curve
  const chronologicalAttempts = [...attempts].reverse();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Student Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {student.firstName} {student.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-mono text-slate-700">{student.phone}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-semibold">{group?.name || "Guruh biriktirilmagan"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
            30 kunlik sessiya faol
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block mb-1">Topshirilgan testlar</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{totalCompleted} ta</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block mb-1">O'rtacha natija</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">{avgScore}%</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block mb-1">Muvaffaqiyatli o'tish</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{passRate}%</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 block mb-1">Maksimal ko'rsatkich</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalCompleted > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0}%
          </span>
        </div>
      </div>

      {/* Growth Trend Graph (SVG Visualizer) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Natijalar o'sish grafigi</h2>
          </div>
          <span className="text-xs text-slate-400">Dinamika foizda (0 - 100%)</span>
        </div>

        {chronologicalAttempts.length > 1 ? (
          <div className="pt-2">
            {/* SVG Line / Bar Chart */}
            <div className="h-44 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-200">
              {chronologicalAttempts.map((att, idx) => {
                const heightPercent = Math.max(10, att.percentage);
                return (
                  <div key={att.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                      {att.testTitle}: {att.percentage}%
                    </div>

                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      {att.percentage}%
                    </span>

                    <div
                      className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${
                        att.passed ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-rose-400 group-hover:bg-rose-500'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    <span className="text-[10px] text-slate-400 truncate max-w-[60px]">
                      №{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>Boshlang'ich testlar</span>
              <span>So'nggi testlar</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            O'sish dinamikasini ko'rish uchun kamida 2 ta test topshiring.
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Ishlangan testlar tarixi</h2>
          <span className="text-xs text-slate-500">{attempts.length} ta urinish</span>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            Hozircha hech qanday test topshirmagansiz.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.map(att => {
              const minutes = Math.floor(att.timeSpentSeconds / 60);
              const seconds = att.timeSpentSeconds % 60;
              return (
                <div key={att.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{att.testTitle}</h3>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {att.passed ? "O'tdi" : "O'tmadi"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(att.completedAt).toLocaleDateString('uz-UZ')}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {minutes} daq {seconds} sek
                      </span>
                      {att.windowBlurViolations > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {att.windowBlurViolations} ta chiqish
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-lg font-extrabold font-mono text-slate-900 block">
                        {att.percentage}%
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {att.totalPointsEarned} / {att.maxPointsPossible} ball
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

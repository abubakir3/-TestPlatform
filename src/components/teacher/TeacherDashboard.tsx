import React, { useState } from 'react';
import {
  Users,
  FileCheck2,
  Download,
  Trash2,
  RotateCcw,
  Plus,
  Send,
  HelpCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  BookOpen,
  Settings,
  Filter,
  BarChart3,
  UserX,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { telegramService } from '../../services/telegramService';
import { exportAttemptsToExcel, exportAttemptsToCSV } from '../../services/excelExport';
import { TestGroup, Test, TestAttempt } from '../../types';
import { TestCreatorModal } from './TestCreatorModal';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'groups' | 'tests' | 'telegram'>('analytics');

  // Filters
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedTestId, setSelectedTestId] = useState<string>('all');

  // Modals
  const [isTestCreatorOpen, setIsTestCreatorOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupBook, setNewGroupBook] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Telegram Config state
  const tgConfig = telegramService.getConfig();
  const [botToken, setBotToken] = useState(tgConfig.botToken);
  const [teacherChatId, setTeacherChatId] = useState(tgConfig.teacherChatId);
  const [savedTgNotice, setSavedTgNotice] = useState(false);

  const groups = storageService.getGroups();
  const tests = storageService.getTests();
  const allAttempts = storageService.getAttempts();

  // Filtered attempts
  const filteredAttempts = allAttempts.filter(att => {
    if (selectedGroupId !== 'all' && att.groupId !== selectedGroupId) return false;
    if (selectedTestId !== 'all' && att.testId !== selectedTestId) return false;
    return true;
  });

  // Calculate summary metrics
  const totalAttemptsCount = filteredAttempts.length;
  const passedAttemptsCount = filteredAttempts.filter(a => a.passed).length;
  const avgPercentage = totalAttemptsCount > 0
    ? Math.round(filteredAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttemptsCount)
    : 0;
  const totalViolations = filteredAttempts.reduce((acc, a) => acc + a.windowBlurViolations, 0);

  // Uncompleted students for selected test
  const activeSelectedTest = tests.find(t => t.id === selectedTestId);
  const uncompletedStudents = activeSelectedTest
    ? storageService.getUncompletedStudents(activeSelectedTest.id, activeSelectedTest.groupId)
    : [];

  // Question accuracy stats
  const questionAccuracyStats = activeSelectedTest
    ? storageService.getQuestionAccuracy(activeSelectedTest.id)
    : [];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupSubject.trim()) {
      alert("Guruh nomi va fanini kiriting!");
      return;
    }
    storageService.createGroup({
      name: newGroupName.trim(),
      subject: newGroupSubject.trim(),
      bookOrModule: newGroupBook.trim() || "Standart dastur",
      description: "Yangi dars guruhi",
    });
    setNewGroupName('');
    setNewGroupSubject('');
    setNewGroupBook('');
    setShowAddGroup(false);
  };

  const handleDeleteAttempt = (attemptId: string, studentName: string) => {
    if (window.confirm(`${studentName}ning natijasini o'chirib, unga qayta topshirishga ruxsat berasizmi?`)) {
      storageService.deleteAttempt(attemptId);
    }
  };

  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    telegramService.updateConfig({
      botToken: botToken.trim(),
      teacherChatId: teacherChatId.trim(),
    });
    setSavedTgNotice(true);
    setTimeout(() => setSavedTgNotice(false), 3000);
  };

  const handleSendTestTgMessage = async () => {
    if (!teacherChatId) {
      alert("Avval o'qituvchi Telegram Chat ID sini kiriting!");
      return;
    }
    await telegramService.sendTestCompletionAlert({
      id: 'demo_test',
      testId: 'demo',
      studentId: 'demo',
      studentName: 'Sinov O\'quvchi',
      studentPhone: '+998901234567',
      groupId: 'demo',
      groupName: '10-A Matematika',
      testTitle: 'Sinov Nazorati',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      timeSpentSeconds: 320,
      windowBlurViolations: 1,
      totalQuestions: 10,
      correctAnswersCount: 9,
      totalPointsEarned: 18,
      maxPointsPossible: 20,
      percentage: 90,
      passed: true,
      answers: {},
    });
    alert("Sinov xabari yuborildi! (Telegram Bot logs bo'limida ko'rishingiz mumkin)");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Boshqaruv markazi
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            O'qituvchi Kabineti
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guruhlar, testlar, 500 tagacha o'quvchi natijalari va anti-cheat nazorati.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Natijalar & Tahlil
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'groups' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Guruhlar ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Testlar ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === 'telegram' ? 'bg-white text-sky-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-sky-600" />
            <span>Telegram Bot</span>
          </button>
        </div>
      </div>

      {/* 1. ANALYTICS & RESULTS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-400 block mb-1">Jami urinishlar</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {totalAttemptsCount} ta
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-400 block mb-1">O'rtacha ko'rsatkich</span>
              <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
                {avgPercentage}%
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-400 block mb-1">Muvaffaqiyatli o'tganlar</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {passedAttemptsCount} ta
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-400 block mb-1">Anti-cheat qoidabuzarliklar</span>
              <span className={`text-2xl font-bold font-mono tabular-nums ${totalViolations > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {totalViolations} marta
              </span>
            </div>
          </div>

          {/* Filters and Actions Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-semibold">Filtr:</span>
              </div>

              {/* Group filter */}
              <select
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">Barcha guruhlar</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              {/* Test filter */}
              <select
                value={selectedTestId}
                onChange={e => setSelectedTestId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">Barcha testlar</option>
                {tests.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportAttemptsToExcel(filteredAttempts)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                title="Excel fayl (.xlsx) ko'rinishida yuklab olish"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => exportAttemptsToCSV(filteredAttempts)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Question Accuracy Analysis (if specific test is selected) */}
          {selectedTestId !== 'all' && questionAccuracyStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Savollar bo'yicha to'g'ri topish foizi (Qiyinlik tahlili)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Jami: {activeSelectedTest?.questions.length} ta savol
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {questionAccuracyStats.map((item, idx) => (
                  <div key={item.question.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {item.question.questionText}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.accuracyPercent}% to'g'ri ({item.correctAttempts}/{item.totalAttempts})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.accuracyPercent >= 70
                            ? 'bg-emerald-500'
                            : item.accuracyPercent >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.accuracyPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncompleted Students List (Hali topshirmaganlar) */}
          {selectedTestId !== 'all' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Testni hali topshirmagan o'quvchilar ro'yxati
                  </h3>
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {uncompletedStudents.length} nafar o'quvchi
                </span>
              </div>

              {uncompletedStudents.length === 0 ? (
                <p className="text-xs text-emerald-700 py-2">
                  🎉 Guruhdagi barcha o'quvchilar ushbu testni topshirib bo'lgan!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {uncompletedStudents.map(std => (
                    <div key={std.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {std.firstName} {std.lastName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {std.phone}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 bg-amber-100/70 font-semibold px-2 py-0.5 rounded">
                        Kutilmoqda
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Topshirilgan testlar natijalari ({filteredAttempts.length})
              </h3>
            </div>

            {filteredAttempts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Natijalar topilmadi. Filtrni o'zgartiring yoki o'quvchilar test topshirishini kuting.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3 px-4">O'quvchi</th>
                      <th className="py-3 px-3">Guruh & Test</th>
                      <th className="py-3 px-3">Ball & Foiz</th>
                      <th className="py-3 px-3">Sarflangan vaqt</th>
                      <th className="py-3 px-3">Anti-cheat</th>
                      <th className="py-3 px-3">Sana</th>
                      <th className="py-3 px-4 text-right">Qayta topshirish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttempts.map(att => {
                      const minutes = Math.floor(att.timeSpentSeconds / 60);
                      const seconds = att.timeSpentSeconds % 60;

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">
                              {att.studentName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {att.studentPhone}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-medium text-slate-800 block">
                              {att.testTitle}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {att.groupName}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {att.percentage}%
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {att.passed ? "O'tdi" : "O'tmadi"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {att.totalPointsEarned} / {att.maxPointsPossible} ball
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono">
                            {minutes}d {seconds}s
                          </td>

                          <td className="py-3.5 px-3">
                            {att.windowBlurViolations > 0 ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" />
                                {att.windowBlurViolations} marta
                              </span>
                            ) : (
                              <span className="text-emerald-700">0 (Toza)</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                            {new Date(att.completedAt).toLocaleString('uz-UZ')}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteAttempt(att.id, att.studentName)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                              title="Natijani o'chirib qayta ruxsat berish"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Qayta ruxsat</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. GROUPS TAB */}
      {activeTab === 'groups' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Mavjud Guruhlar va Fanlar
            </h2>
            <button
              type="button"
              onClick={() => setShowAddGroup(!showAddGroup)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi guruh ochish</span>
            </button>
          </div>

          {/* New Group Drawer */}
          {showAddGroup && (
            <form onSubmit={handleCreateGroup} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-800">Yangi guruh ma'lumotlari</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Guruh nomi</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Masalan: 11-B Fizika"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Fan</label>
                  <input
                    type="text"
                    required
                    value={newGroupSubject}
                    onChange={e => setNewGroupSubject(e.target.value)}
                    placeholder="Fizika (Kvant mexanikasi)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Kitob / Modul</label>
                  <input
                    type="text"
                    value={newGroupBook}
                    onChange={e => setNewGroupBook(e.target.value)}
                    placeholder="11-sinf darslik"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddGroup(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                >
                  Saqlash
                </button>
              </div>
            </form>
          )}

          {/* Groups Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {groups.map(g => {
              const groupTests = tests.filter(t => t.groupId === g.id);
              const groupStudents = storageService.getStudents().filter(s => s.groupId === g.id);

              return (
                <div key={g.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {g.subject}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {g.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      📚 {g.bookOrModule}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>{groupTests.length} ta test</span>
                    <span>·</span>
                    <span>{groupStudents.length} nafar o'quvchi</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setIsTestCreatorOpen(true);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Test biriktirish</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TESTS TAB */}
      {activeTab === 'tests' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Yaratilgan Testlar Ro'yxati
            </h2>
            <button
              type="button"
              onClick={() => setIsTestCreatorOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi test yaratish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map(t => {
              const grp = groups.find(g => g.id === t.groupId);
              const testAttempts = allAttempts.filter(a => a.testId === t.id);

              return (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {grp?.name || "Guruh"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {t.title}
                      </h3>
                      {t.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`"${t.title}" testini o'chirasizmi?`)) {
                          storageService.deleteTest(t.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Testni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span className="font-mono">{t.questions.length} ta savol</span>
                    <span>·</span>
                    <span>{t.settings.timerMinutes > 0 ? `${t.settings.timerMinutes} daqiqa` : 'Cheklovsiz'}</span>
                    <span>·</span>
                    <span>O'tish: {t.settings.passingPercentage}%</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-700">{testAttempts.length} marta topshirilgan</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TELEGRAM BOT SETTINGS TAB */}
      {activeTab === 'telegram' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2 text-sky-800 font-bold text-base mb-1">
              <Send className="w-5 h-5 text-sky-600" />
              <span>Telegram Bot Integratsiyasi</span>
            </div>
            <p className="text-xs text-slate-500">
              O'quvchilar OTP kodini botdan olishi va har bir test natijasi o'qituvchining Telegramiga yetib borishi uchun sozlang.
            </p>
          </div>

          {savedTgNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
            </div>
          )}

          <form onSubmit={handleSaveTelegramConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telegram Bot Token (BotFather dan olingan)
              </label>
              <input
                type="text"
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Agar kiritilmasa, platforma avtomatik simulyatsiya rejimida ishlaydi (barcha kod va xabarlar ekranda ko'rinadi).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                O'qituvchining Telegram Chat ID raqami
              </label>
              <input
                type="text"
                value={teacherChatId}
                onChange={e => setTeacherChatId(e.target.value)}
                placeholder="Masalan: 987654321 (@userinfobot orqali bilish mumkin)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                O'quvchi testni tugatgan zahoti barcha natijalar aynan shu Chat ID ga yuboriladi.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Sozlamalarni saqlash
              </button>

              <button
                type="button"
                onClick={handleSendTestTgMessage}
                className="px-4 py-2.5 border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Sinov xabari yuborish</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Test Creator Modal */}
      <TestCreatorModal
        isOpen={isTestCreatorOpen}
        initialGroupId={selectedGroupId !== 'all' ? selectedGroupId : undefined}
        onClose={() => setIsTestCreatorOpen(false)}
        onTestCreated={() => {
          setActiveTab('tests');
        }}
      />
    </div>
  );
};

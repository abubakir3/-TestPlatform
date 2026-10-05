import React, { useState, useEffect } from 'react';
import { BookOpen, User, FileCode2, Users, Send, ShieldAlert, Award, Plus } from 'lucide-react';
import { storageService } from './services/storage';
import { telegramService } from './services/telegramService';
import { StudentUser, Test, TestAttempt } from './types';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfile } from './components/student/StudentProfile';
import { QuizRunner } from './components/student/QuizRunner';
import { QuizResultModal } from './components/student/QuizResultModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ArchitectureDocs } from './components/docs/ArchitectureDocs';
import { TelegramSimulatorDrawer } from './components/TelegramSimulatorDrawer';

export default function App() {
  const [currentStudent, setCurrentStudent] = useState<StudentUser | null>(storageService.getCurrentStudent());
  const [isTeacher, setIsTeacher] = useState<boolean>(storageService.isTeacher());
  const [activeTab, setActiveTab] = useState<'tests' | 'teacher' | 'docs' | 'profile'>('tests');

  // Active quiz state
  const [activeQuizTest, setActiveQuizTest] = useState<Test | null>(null);
  const [activeQuizResult, setActiveQuizResult] = useState<TestAttempt | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<'student' | 'teacher'>('student');
  const [isTelegramDrawerOpen, setIsTelegramDrawerOpen] = useState(false);
  const [tgLogCount, setTgLogCount] = useState(telegramService.getHistory().length);

  useEffect(() => {
    // Subscribe to storage changes
    const unsubStorage = storageService.subscribe(() => {
      setCurrentStudent(storageService.getCurrentStudent());
      setIsTeacher(storageService.isTeacher());
    });

    // Subscribe to Telegram service changes
    const unsubTg = telegramService.subscribe(() => {
      setTgLogCount(telegramService.getHistory().length);
    });

    return () => {
      unsubStorage();
      unsubTg();
    };
  }, []);

  const handleOpenAuth = (role: 'student' | 'teacher' = 'student') => {
    setAuthInitialRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    if (isTeacher) {
      storageService.logoutTeacher();
    } else {
      storageService.logoutStudent();
    }
    setActiveTab('tests');
  };

  const handleStartQuiz = (test: Test) => {
    if (!currentStudent) {
      handleOpenAuth('student');
      return;
    }
    setActiveQuizTest(test);
  };

  const handleQuizFinish = (attempt: TestAttempt) => {
    setActiveQuizTest(null);
    setActiveQuizResult(attempt);
  };

  // If a student is currently actively taking a quiz, show the distraction-free QuizRunner
  if (activeQuizTest && currentStudent) {
    return (
      <QuizRunner
        test={activeQuizTest}
        student={currentStudent}
        onFinish={handleQuizFinish}
        onCancel={() => setActiveQuizTest(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-8">
      {/* Top Bar adhering to Top Bar Contract */}
      <Header
        currentStudent={currentStudent}
        isTeacher={isTeacher}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenTelegramSimulator={() => setIsTelegramDrawerOpen(true)}
        unreadTelegramCount={tgLogCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'tests' && (
          currentStudent ? (
            <StudentDashboard
              student={currentStudent}
              onStartQuiz={handleStartQuiz}
              onOpenProfile={() => setActiveTab('profile')}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {/* Hero Banner for guests */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="max-w-2xl space-y-4 relative z-10">
                  <span className="text-xs font-bold text-emerald-300 tracking-wider">
                    Telegram Bot & OTP Integratsiyali Test Tizimi
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    Onlayn Test Platformasi & Anti-Cheat Nazorati
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    SMS kutmaysiz! O'quvchilar Telegram bot orqali 6 xonali kod bilan kirishadi. Test paytida oynadan chiqishlar aniqlanadi va natija o'qituvchining Telegramiga yetib boradi.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleOpenAuth('student')}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>O'quvchi sifatida kirish</span>
                    </button>
                    <button
                      onClick={() => handleOpenAuth('teacher')}
                      className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-sm transition-all"
                    >
                      O'qituvchi paneli (PIN)
                    </button>
                    <button
                      onClick={() => setActiveTab('docs')}
                      className="px-4 py-3 text-xs font-medium text-emerald-300 hover:text-white underline"
                    >
                      Supabase SQL & Bot kodi
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample Available Tests Preview for Guests */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Mavjud Test Namunalari
                  </h2>
                  <span className="text-xs text-slate-500">
                    Test ishlash uchun tizimga kiring
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {storageService.getTests().map(t => {
                    const grp = storageService.getGroupById(t.groupId);
                    return (
                      <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {grp?.name || "Fan"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {t.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {t.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                          <span>{t.questions.length} ta savol</span>
                          <span>{t.settings.timerMinutes} daqiqa</span>
                          <button
                            onClick={() => handleOpenAuth('student')}
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            Boshlash →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'profile' && currentStudent && (
          <StudentProfile
            student={currentStudent}
            onSelectTestToTake={testId => {
              const t = storageService.getTestById(testId);
              if (t) handleStartQuiz(t);
            }}
          />
        )}

        {activeTab === 'teacher' && (
          isTeacher ? (
            <TeacherDashboard />
          ) : (
            <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">O'qituvchi Kabinetiga Kirish</h2>
              <p className="text-xs text-slate-500">
                Guruhlar yaratish, Word parserdan foydalanish va Excel eksport qilish uchun PIN kodni kiriting.
              </p>
              <button
                onClick={() => handleOpenAuth('teacher')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Ustoz PIN kodini kiritish
              </button>
            </div>
          )
        )}

        {activeTab === 'docs' && (
          <ArchitectureDocs />
        )}
      </main>

      {/* Mobile Ergonomic Fixed Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="grid grid-cols-4 items-center h-14">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex flex-col items-center justify-center h-full ${
              activeTab === 'tests' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] mt-1">Testlar</span>
          </button>

          {currentStudent ? (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center h-full ${
                activeTab === 'profile' ? 'text-emerald-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Award className="w-4 h-4" />
              <span className="text-[10px] mt-1">Natijalarim</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenAuth('student')}
              className="flex flex-col items-center justify-center h-full text-slate-500"
            >
              <User className="w-4 h-4" />
              <span className="text-[10px] mt-1">Kirish</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isTeacher) {
                setActiveTab('teacher');
              } else {
                handleOpenAuth('teacher');
              }
            }}
            className={`flex flex-col items-center justify-center h-full ${
              activeTab === 'teacher' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] mt-1">O'qituvchi</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex flex-col items-center justify-center h-full ${
              activeTab === 'docs' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span className="text-[10px] mt-1">SQL / Bot</span>
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authInitialRole}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          if (authInitialRole === 'teacher') {
            setActiveTab('teacher');
          } else {
            setActiveTab('tests');
          }
        }}
      />

      {/* Quiz Result Modal */}
      {activeQuizResult && (
        <QuizResultModal
          attempt={activeQuizResult}
          test={storageService.getTestById(activeQuizResult.testId)!}
          onClose={() => {
            setActiveQuizResult(null);
            setActiveTab('profile');
          }}
        />
      )}

      {/* Telegram Live Simulator Drawer */}
      <TelegramSimulatorDrawer
        isOpen={isTelegramDrawerOpen}
        onClose={() => setIsTelegramDrawerOpen(false)}
      />
    </div>
  );
}

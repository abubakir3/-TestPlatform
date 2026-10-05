import React from 'react';
import { BookOpen, User, LogOut, ShieldAlert, FileCode2, Send } from 'lucide-react';
import { StudentUser } from '../types';

interface HeaderProps {
  currentStudent: StudentUser | null;
  isTeacher: boolean;
  activeTab: 'tests' | 'teacher' | 'docs' | 'profile';
  setActiveTab: (tab: 'tests' | 'teacher' | 'docs' | 'profile') => void;
  onOpenAuth: (role?: 'student' | 'teacher') => void;
  onLogout: () => void;
  onOpenTelegramSimulator: () => void;
  unreadTelegramCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  isTeacher,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenTelegramSimulator,
  unreadTelegramCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(isTeacher ? 'teacher' : 'tests')}
            className="flex items-center gap-2 text-left font-bold text-lg text-slate-900 tracking-tight hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>TestPlatform</span>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('tests')}
            className={`transition-colors hover:text-slate-900 ${
              activeTab === 'tests' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            Testlar
          </button>

          {currentStudent && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`transition-colors hover:text-slate-900 ${
                activeTab === 'profile' ? 'text-emerald-600 font-semibold' : ''
              }`}
            >
              Mening natijalarim
            </button>
          )}

          <button
            onClick={() => {
              if (isTeacher) {
                setActiveTab('teacher');
              } else {
                onOpenAuth('teacher');
              }
            }}
            className={`transition-colors hover:text-slate-900 ${
              activeTab === 'teacher' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            O'qituvchi paneli
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 transition-colors hover:text-slate-900 ${
              activeTab === 'docs' ? 'text-emerald-600 font-semibold' : ''
            }`}
          >
            <FileCode2 className="w-4 h-4 text-slate-500" />
            <span>Arxitektura & SQL</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Telegram Simulator Quick Trigger */}
          <button
            onClick={onOpenTelegramSimulator}
            title="Telegram Bot bildirishnomalari"
            className="relative px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden sm:inline">Bot xabarlari</span>
            {unreadTelegramCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {isTeacher ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md hidden sm:inline">
                O'qituvchi
              </span>
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : currentStudent ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-emerald-600 transition-colors bg-slate-100 px-2.5 py-1.5 rounded-lg"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span className="max-w-[120px] truncate">{currentStudent.firstName}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('student')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all rounded-lg shadow-sm"
              >
                Kirish (Telegram)
              </button>
              <button
                onClick={() => onOpenAuth('teacher')}
                className="hidden sm:inline-flex px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Ustoz PIN
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

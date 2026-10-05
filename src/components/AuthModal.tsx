import React, { useState, useEffect } from 'react';
import { X, Send, Lock, Phone, User, CheckCircle2, AlertCircle, Copy, Check, ArrowRight } from 'lucide-react';
import { storageService, DEFAULT_TEACHER_PIN } from '../services/storage';
import { telegramService } from '../services/telegramService';
import { TestGroup } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialRole?: 'student' | 'teacher';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialRole = 'student',
  onClose,
  onSuccess,
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>(initialRole);
  const [groups, setGroups] = useState<TestGroup[]>([]);

  // Student form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [groupId, setGroupId] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedDemoOtp, setGeneratedDemoOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Teacher form state
  const [teacherPin, setTeacherPin] = useState('');

  // Status & Error
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setGroups(storageService.getGroups());
      if (storageService.getGroups().length > 0 && !groupId) {
        setGroupId(storageService.getGroups()[0].id);
      }
      setErrorMsg('');
      setOtpStep(false);
      setOtpCode('');
      setGeneratedDemoOtp(null);
    }
  }, [isOpen, initialRole]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    let raw = val.replace(/[^\d+]/g, '');
    if (!raw.startsWith('+998')) {
      raw = '+998';
    }
    // Limit to +998 + 9 digits
    if (raw.length <= 13) {
      setPhone(raw);
    }
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Iltimos, ism va familiyangizni to\'liq kiriting');
      return;
    }

    if (phone.length < 13) {
      setErrorMsg('Telefon raqamingizni to\'liq kiriting (+998 90 123 45 67)');
      return;
    }

    if (!groupId) {
      setErrorMsg('Iltimos, guruhni tanlang');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const code = telegramService.generateOtp(phone);
      setGeneratedDemoOtp(code);
      setOtpStep(true);
      setCountdown(60);
      setIsLoading(false);
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (otpCode.length < 6) {
      setErrorMsg('6 xonali tasdiqlash kodini to\'liq kiriting');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = telegramService.verifyOtp(phone, otpCode);
      if (result.success) {
        storageService.registerOrLoginStudent({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          groupId,
        });
        setIsLoading(false);
        onSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg(result.message);
      }
    }, 400);
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!teacherPin) {
      setErrorMsg('O\'qituvchi parolini kiriting');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = storageService.loginTeacher(teacherPin);
      setIsLoading(false);
      if (success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(`Noto'g'ri parol! Sinash uchun: "${DEFAULT_TEACHER_PIN}"`);
      }
    }, 300);
  };

  const copyDemoCode = () => {
    if (generatedDemoOtp) {
      navigator.clipboard.writeText(generatedDemoOtp);
      setOtpCode(generatedDemoOtp);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'student'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            O'quvchi (Telegram OTP)
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'teacher'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            O'qituvchi (PIN)
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {role === 'student' ? (
            !otpStep ? (
              /* Step 1: Student details + Phone */
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-slate-900">Platformaga kirish</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    SMS kutmaysiz! Tasdiqlash kodi Telegram botimiz orqali yuboriladi.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Ism</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Ali"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Familiya</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Valiyev"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Guruhni tanlang</label>
                  <select
                    value={groupId}
                    onChange={e => setGroupId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Telefon raqam (+998)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="+998901234567"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Misol: +998 90 123 45 67
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Kod yuborilmoqda..." : "Telegram botdan kod olish"}</span>
                </button>
              </form>
            ) : (
              /* Step 2: Enter 6-digit OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-base font-bold text-slate-900">Tasdiqlash kodini kiriting</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kod <span className="font-semibold text-slate-700">{phone}</span> uchun Telegram botimizga yuborildi.
                  </p>
                </div>

                {/* Simulated Telegram Message Notification Card */}
                {generatedDemoOtp && (
                  <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl">
                    <div className="flex items-center justify-between text-xs text-sky-800 font-semibold mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-sky-600" />
                        Telegram Bot bildirishnomasi:
                      </span>
                      <button
                        type="button"
                        onClick={copyDemoCode}
                        className="text-[11px] text-sky-700 hover:text-sky-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-sky-200 shadow-2xs"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Nusxa olindi
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Kodni qo'yish
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600">Tasdiqlash kodi:</p>
                      <span className="font-mono text-base font-bold tracking-widest text-sky-950 bg-white px-3 py-1 rounded-md border border-sky-200 shadow-inner">
                        {generatedDemoOtp}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5 text-center">
                    6 xonali OTP kod
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] font-mono font-bold text-xl py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 text-center block mt-1">
                    (Sinov uchun 777777 kodi ham o'tadi)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash va tizimga kirish'}</span>
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    Raqamni o'zgartirish
                  </button>
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={() => {
                      const code = telegramService.generateOtp(phone);
                      setGeneratedDemoOtp(code);
                      setCountdown(60);
                    }}
                    className={`text-emerald-700 ${countdown > 0 ? 'opacity-40' : 'hover:underline font-medium'}`}
                  >
                    {countdown > 0 ? `Qayta yuborish (${countdown}s)` : 'Qayta kod yuborish'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Teacher PIN Login */
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-700">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">O'qituvchi paneli</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Test yaratish va natijalarni nazorat qilish uchun maxsus PIN parolni kiriting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  O'qituvchi PIN paroli
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={teacherPin}
                  onChange={e => setTeacherPin(e.target.value)}
                  placeholder="PIN kiriting (masalan: ustoz2026)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Standart PIN parol: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono font-semibold">ustoz2026</code>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Tekshirilmoqda...' : 'Panelga kirish'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

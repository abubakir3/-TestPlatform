import React, { useState, useEffect } from 'react';
import { X, Send, Bot, Trash2, CheckCircle2, AlertTriangle, ArrowRight, MessageSquare, Phone } from 'lucide-react';
import { telegramService, TelegramMessageLog } from '../services/telegramService';

interface TelegramSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramSimulatorDrawer: React.FC<TelegramSimulatorDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<TelegramMessageLog[]>([]);
  const [testPhone, setTestPhone] = useState('+998901234567');

  useEffect(() => {
    setLogs(telegramService.getHistory());
    const unsub = telegramService.subscribe(() => {
      setLogs(telegramService.getHistory());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSimulateOtp = () => {
    telegramService.generateOtp(testPhone);
  };

  const handleClear = () => {
    telegramService.clearHistory();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-sky-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Telegram Bot Simulyatori</h3>
              <p className="text-[11px] text-white/80">
                Jonli bot xabarlari (OTP va o'qituvchi bildirishnomalari)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Trigger Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
          <input
            type="text"
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
            placeholder="+998901234567"
          />
          <button
            type="button"
            onClick={handleSimulateOtp}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1 shadow-2xs"
          >
            <Send className="w-3 h-3" />
            <span>OTP olish</span>
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <p className="text-xs">Hozircha xabarlar yo'q.</p>
              <p className="text-[11px] text-slate-400">
                O'quvchi tizimga kirganda yoki test topshirganda xabarlar shu yerda aks etadi.
              </p>
            </div>
          ) : (
            logs.map(log => {
              const isTeacherAlert = log.type === 'teacher_alert';

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl shadow-2xs border text-xs space-y-1.5 ${
                    isTeacherAlert
                      ? 'bg-emerald-50/90 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-700">
                      {isTeacherAlert ? "🎓 O'qituvchiga Hisobot" : "🔐 O'quvchi OTP Kodi"}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString('uz-UZ')}</span>
                  </div>

                  <div className="whitespace-pre-line text-slate-800 font-sans text-xs leading-relaxed">
                    {log.message}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                    <span>Qabul qiluvchi: <strong className="font-mono text-slate-600">{log.recipient}</strong></span>
                    <span className="text-emerald-700 font-semibold">Yetkazildi ✓</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            {logs.length} ta xabar
          </span>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tarixni tozalash</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

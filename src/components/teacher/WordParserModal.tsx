import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Copy, FileUp } from 'lucide-react';
import { parseQuestionText, getSampleQuizText } from '../../services/docxParser';
import { Question } from '../../types';

interface WordParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsParsed: (questions: Question[]) => void;
}

export const WordParserModal: React.FC<WordParserModalProps> = ({
  isOpen,
  onClose,
  onQuestionsParsed,
}) => {
  const [rawText, setRawText] = useState(getSampleQuizText());
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  if (!isOpen) return null;

  const parsed = parseQuestionText(rawText);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        setActiveTab('preview');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyQuestions = () => {
    if (parsed.questions.length === 0) {
      alert("Hech qanday savol aniqlanmadi. Matn formatini tekshiring.");
      return;
    }
    onQuestionsParsed(parsed.questions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Word (.docx) va Matnli Test Parseri
              </h2>
              <p className="text-xs text-slate-500">
                Savollarni avtomatik ajratuvchi va sintaksis tekshiruvchi modul
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Format Guide */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'editor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matn kiritish
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Ko'rib chiqish</span>
              <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {parsed.questions.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
              <FileUp className="w-3.5 h-3.5 text-slate-500" />
              <span>Fayl yuklash (.txt)</span>
              <input type="file" accept=".txt,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => setRawText(getSampleQuizText())}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Namunani yuklash</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'editor' ? (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Qabul qilinuvchi format:</span>
                <p>1. Savol matni?</p>
                <p>A) Variant</p>
                <p><strong className="text-emerald-700">*B) To'g'ri variant</strong> (To'g'ri javob oldiga <code className="bg-amber-100 px-1 rounded">*</code> yoki <code className="bg-amber-100 px-1 rounded">=</code> qo'ying)</p>
                <p>C) Variant</p>
                <p>Izoh: Tushuntirish matni (ixtiyoriy)</p>
              </div>

              <div>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={14}
                  placeholder="Savollarni bu yerga kiriting yoki Word dan nusxalab qo'ying..."
                  className="w-full p-4 font-mono text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Real-time parsing error detector */}
              {parsed.errors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Formatda {parsed.errors.length} ta xatolik aniqlandi:</span>
                  </div>
                  <ul className="text-xs text-rose-700 list-disc list-inside space-y-1">
                    {parsed.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{err.line}-qator:</span> {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Preview of parsed questions */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Topilgan savollar: <strong className="text-emerald-700">{parsed.questions.length} ta</strong></span>
                {parsed.errors.length > 0 && (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {parsed.errors.length} ta xato bor
                  </span>
                )}
              </div>

              {parsed.questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {idx + 1}. {q.questionText}
                    </h4>
                    <span className="shrink-0 bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[11px]">
                      {q.points} ball
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map(opt => {
                      const isCorrect = opt.id === q.correctOptionId;
                      return (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {opt.id}
                          </span>
                          <span className="truncate">{opt.text}</span>
                          {isCorrect && (
                            <span className="ml-auto text-emerald-700 font-bold text-[10px]">
                              ✓ To'g'ri
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-2 text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                      <strong>Izoh:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            disabled={parsed.questions.length === 0}
            onClick={handleApplyQuestions}
            className="min-h-[44px] px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Testga biriktirish ({parsed.questions.length} ta savol)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

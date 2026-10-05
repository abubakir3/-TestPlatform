import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, Check, Settings2, Clock, HelpCircle, Shuffle, Eye, Calendar, Award } from 'lucide-react';
import { Test, TestGroup, Question, QuestionType, QuestionOption } from '../../types';
import { storageService } from '../../services/storage';
import { WordParserModal } from './WordParserModal';

interface TestCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: (test: Test) => void;
  initialGroupId?: string;
}

export const TestCreatorModal: React.FC<TestCreatorModalProps> = ({
  isOpen,
  onClose,
  onTestCreated,
  initialGroupId,
}) => {
  const groups = storageService.getGroups();

  const [groupId, setGroupId] = useState(initialGroupId || (groups[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Settings
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showExplanationsAfterTest, setShowExplanationsAfterTest] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isParserOpen, setIsParserOpen] = useState(false);

  // Manual Question state
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qPoints, setQPoints] = useState(1);
  const [qExplanation, setQExplanation] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isOpen) return null;

  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      alert("Savol matnini kiriting!");
      return;
    }

    let options: QuestionOption[] = [];
    if (qType === 'multiple_choice') {
      if (!optA.trim() || !optB.trim()) {
        alert("A va B variantlari kiritilishi shart!");
        return;
      }
      options = [
        { id: 'A', text: optA.trim() },
        { id: 'B', text: optB.trim() },
      ];
      if (optC.trim()) options.push({ id: 'C', text: optC.trim() });
      if (optD.trim()) options.push({ id: 'D', text: optD.trim() });
    } else {
      options = [
        { id: 'A', text: "To'g'ri" },
        { id: 'B', text: "Noto'g'ri" },
      ];
    }

    const newQuestion: Question = {
      id: `q_${Date.now()}_${questions.length + 1}`,
      orderNumber: questions.length + 1,
      questionText: qText.trim(),
      type: qType,
      options,
      correctOptionId: correctOpt,
      points: Number(qPoints) || 1,
      explanation: qExplanation.trim(),
    };

    setQuestions([...questions, newQuestion]);

    // Reset manual form
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setQExplanation('');
    setShowManualForm(false);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveTest = () => {
    if (!groupId) {
      alert("Guruhni tanlang!");
      return;
    }
    if (!title.trim()) {
      alert("Test nomini kiriting!");
      return;
    }
    if (questions.length === 0) {
      alert("Kamida bitta savol qo'shing yoki Word fayldan import qiling!");
      return;
    }

    const newTest = storageService.createTest({
      groupId,
      title: title.trim(),
      description: description.trim(),
      status: 'active',
      settings: {
        timerMinutes: Number(timerMinutes) || 0,
        maxAttempts: Number(maxAttempts) || 1,
        passingPercentage: Number(passingPercentage) || 60,
        shuffleQuestions,
        shuffleOptions,
        showExplanationsAfterTest,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      questions,
    });

    onTestCreated(newTest);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Yangi Test Yaratish</h2>
              <p className="text-xs text-slate-500">
                Guruhni tanlang, sozlamalarni o'rnating va savollarni biriktiring.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guruh / Kitob
                </label>
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test nomi
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Masalan: 1-oraliq nazorat (Trigonometriya)"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tavsif (Ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Test haqida qisqacha ma'lumot va ko'rsatmalar..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Test Settings Grid */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Settings2 className="w-4 h-4 text-emerald-600" />
                <span>Test Sozlamalari</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Taymer (daqiqa)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={timerMinutes}
                    onChange={e => setTimerMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">0 = Cheklovsiz</span>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Urinishlar soni</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxAttempts}
                    onChange={e => setMaxAttempts(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Default: 1 marta</span>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">O'tish foizi (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={passingPercentage}
                    onChange={e => setPassingPercentage(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Default: 60%</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={e => setShuffleQuestions(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700">Savollarni aralashtirish</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={e => setShuffleOptions(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700">Variantlarni aralashtirish</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showExplanationsAfterTest}
                    onChange={e => setShowExplanationsAfterTest(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700">Javoblarni ko'rsatish</span>
                </label>
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Test Savollari ({questions.length} ta)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsParserOpen(true)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word / Matn Parseri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Qo'lda savol qo'shish</span>
                  </button>
                </div>
              </div>

              {/* Manual Question Form */}
              {showManualForm && (
                <form onSubmit={handleAddManualQuestion} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Yangi savol kiritish</span>
                    <select
                      value={qType}
                      onChange={e => setQType(e.target.value as QuestionType)}
                      className="px-2 py-1 rounded border border-slate-300 bg-white"
                    >
                      <option value="multiple_choice">4 ta variantli (A,B,C,D)</option>
                      <option value="true_false">To'g'ri / Noto'g'ri</option>
                    </select>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      required
                      value={qText}
                      onChange={e => setQText(e.target.value)}
                      placeholder="Savol matnini yozing..."
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  {qType === 'multiple_choice' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-slate-500">A variant</label>
                        <input
                          type="text"
                          required
                          value={optA}
                          onChange={e => setOptA(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500">B variant</label>
                        <input
                          type="text"
                          required
                          value={optB}
                          onChange={e => setOptB(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500">C variant (ixtiyoriy)</label>
                        <input
                          type="text"
                          value={optC}
                          onChange={e => setOptC(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500">D variant (ixtiyoriy)</label>
                        <input
                          type="text"
                          value={optD}
                          onChange={e => setOptD(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 p-2 bg-white rounded-lg border">
                      Variantlar: A) To'g'ri, B) Noto'g'ri
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold text-emerald-800">
                        To'g'ri javob
                      </label>
                      <select
                        value={correctOpt}
                        onChange={e => setCorrectOpt(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 font-bold"
                      >
                        <option value="A">A variant</option>
                        <option value="B">B variant</option>
                        {qType === 'multiple_choice' && <option value="C">C variant</option>}
                        {qType === 'multiple_choice' && <option value="D">D variant</option>}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Ball</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={qPoints}
                        onChange={e => setQPoints(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-600 mb-1">Izoh / Tushuntirish</label>
                      <input
                        type="text"
                        value={qExplanation}
                        onChange={e => setQExplanation(e.target.value)}
                        placeholder="Nega to'g'riligi..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Savolni saqlash
                    </button>
                  </div>
                </form>
              )}

              {/* Questions List */}
              {questions.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Savollar hali qo'shilmadi. "Word / Matn Parseri" tugmasi orqali o'nlab savollarni 1 soniyada yuklashingiz mumkin.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">
                          {idx + 1}. {q.questionText}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <span>{q.options.length} ta variant</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">
                            To'g'ri: {q.correctOptionId}
                          </span>
                          <span>·</span>
                          <span>{q.points} ball</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Jami savollar: <strong className="text-slate-900">{questions.length} ta</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveTest}
                className="min-h-[44px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20"
              >
                Testni chop etish (Saqlash)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Word / Text Parser Modal */}
      <WordParserModal
        isOpen={isParserOpen}
        onClose={() => setIsParserOpen(false)}
        onQuestionsParsed={parsedQs => {
          setQuestions([...questions, ...parsedQs]);
        }}
      />
    </>
  );
};

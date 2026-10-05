import React, { useState } from 'react';
import { Database, Bot, Server, Rocket, Copy, Check, ShieldCheck, Zap, Terminal, FileCode2 } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'sql' | 'bot' | 'server' | 'deploy'>('sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sqlSchemaSnippet = `-- 1. Supabase PostgreSQL Schema for 500+ Concurrent Students
-- Composite Indexes, Connection Pooling & Secure Server-Side Grading

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Groups (Fanlar va sinflar)
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    book_or_module VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_groups_subject ON public.groups(subject);

-- Students (O'quvchilar ro'yxati)
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    telegram_chat_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_students_phone ON public.students(phone);
CREATE INDEX idx_students_group ON public.students(group_id);

-- Telegram OTP Codes (5 daqiqalik bir martalik kodlar)
CREATE TABLE public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_otp_fast_lookup ON public.otp_codes(phone, code) WHERE is_used = FALSE;

-- Tests (Test sozlamalari)
CREATE TABLE public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{"timerMinutes": 15, "passingPercentage": 60, "maxAttempts": 1}'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tests_group_id ON public.tests(group_id);

-- Questions (Savollar va to'g'ri javoblar - to'g'ri javob serverda saqlanadi!)
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    order_number INT NOT NULL,
    question_text TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'multiple_choice',
    options JSONB NOT NULL,
    correct_option_id VARCHAR(10) NOT NULL,
    points NUMERIC(5,2) DEFAULT 1.0,
    explanation TEXT
);
CREATE INDEX idx_questions_test_id ON public.questions(test_id, order_number ASC);

-- Test Attempts (Natijalar, anti-cheat va sarflangan vaqt)
CREATE TABLE public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_spent_seconds INT NOT NULL,
    window_blur_violations INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL,
    correct_answers_count INT NOT NULL,
    total_points_earned NUMERIC(6,2) NOT NULL,
    max_points_possible NUMERIC(6,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_attempts_composite ON public.test_attempts(test_id, student_id);
CREATE INDEX idx_attempts_completed_at ON public.test_attempts(completed_at DESC);`;

  const botSnippet = `// telegram-bot.js - Node.js Telegram Bot OTP & Teacher Alerts
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. /start komandasi - Telefon raqam so'rash
bot.onText(/\\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Assalomu alaykum! Platformaga kirish uchun telefon raqamingizni yuboring:", {
    reply_markup: {
      keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// 2. Telefon kelganda 6 xonali OTP generatsiya qilish
bot.on('contact', async (msg) => {
  const phone = msg.contact.phone_number.startsWith('+') ? msg.contact.phone_number : '+' + msg.contact.phone_number;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Supabase'ga yozish
  await supabase.from('otp_codes').insert({ phone, code: otp, expires_at: expiresAt });

  bot.sendMessage(msg.chat.id, \`🔐 Sizning bir martalik kodingiz: *\${otp}*\\n⏱ Amal qilish muddati: 5 daqiqa.\`, { parse_mode: 'Markdown' });
});

// 3. Test tugaganda o'qituvchiga bildirishnoma yuborish funksiyasi
async function notifyTeacher(result) {
  const text = \`🎓 *YANGI TEST NATIJASI!*\\n\\n\` +
    \`👤 *O'quvchi:* \${result.studentName} (\${result.studentPhone})\\n\` +
    \`🏷 *Guruh:* \${result.groupName}\\n\` +
    \`📝 *Test:* \${result.testTitle}\\n\` +
    \`🎯 *Ball:* \${result.totalPointsEarned}/\${result.maxPointsPossible} (\${result.percentage}%)\\n\` +
    \`🛡 *Anti-cheat chiqishlar:* \${result.windowBlurViolations} marta\\n\` +
    \`⏱ *Sarflangan vaqt:* \${Math.floor(result.timeSpentSeconds / 60)} daq\\n\` +
    \`📅 *Sana:* \${new Date().toLocaleString('uz-UZ')}\`;

  await bot.sendMessage(process.env.TEACHER_CHAT_ID, text, { parse_mode: 'Markdown' });
}

module.exports = { notifyTeacher };`;

  const serverSnippet = `// server.ts - Xavfsiz hisoblash va tekshirish (Server-side grading)
app.post('/api/test/submit', async (req, res) => {
  const { testId, studentId, answers, timeSpentSeconds, windowBlurViolations } = req.body;

  // TO'G'RI JAVOBLAR FAQAT SERVERDA SOLISHTIRILADI
  const { data: questions } = await supabase.from('questions').select('*').eq('test_id', testId);
  const { data: test } = await supabase.from('tests').select('*, groups(name)').eq('id', testId).single();
  const { data: student } = await supabase.from('students').select('*').eq('id', studentId).single();

  let correctCount = 0;
  let earnedPoints = 0;
  let maxPoints = 0;

  questions.forEach(q => {
    maxPoints += Number(q.points) || 1;
    if (answers[q.id]?.toUpperCase() === q.correct_option_id.toUpperCase()) {
      correctCount++;
      earnedPoints += Number(q.points) || 1;
    }
  });

  const percentage = Math.round((earnedPoints / maxPoints) * 100);
  const passed = percentage >= test.settings.passingPercentage;

  // Natijani bazaga saqlash
  await supabase.from('test_attempts').insert({
    test_id: testId,
    student_id: studentId,
    time_spent_seconds: timeSpentSeconds,
    window_blur_violations: windowBlurViolations,
    total_questions: questions.length,
    correct_answers_count: correctCount,
    total_points_earned: earnedPoints,
    max_points_possible: maxPoints,
    percentage,
    passed,
    answers
  });

  // Telegram orqali o'qituvchiga darhol xabar yuborish
  await notifyTeacher({
    studentName: \`\${student.first_name} \${student.last_name}\`,
    studentPhone: student.phone,
    groupName: test.groups.name,
    testTitle: test.title,
    totalPointsEarned: earnedPoints,
    maxPointsPossible: maxPoints,
    percentage,
    windowBlurViolations,
    timeSpentSeconds
  });

  res.json({ success: true, percentage, passed, earnedPoints, maxPoints });
});`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          Dasturchi Hujjatlari & Arxitektura
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
          500 O'quvchiga Moslashtirilgan Arxitektura & Baza
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Supabase (PostgreSQL) indekslari, Telegram bot orqali bepul OTP tizimi, Anti-cheat va Vercel/Netlify'ga tekin deploy qilish bo'yicha to'liq qo'llanma.
        </p>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveSection('sql')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeSection === 'sql'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Supabase SQL Schema (500 user)</span>
          </button>

          <button
            onClick={() => setActiveSection('bot')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeSection === 'bot'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>2. Telegram Bot Kodi (OTP & Xabar)</span>
          </button>

          <button
            onClick={() => setActiveSection('server')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeSection === 'server'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>3. Xavfsiz Server Hisoblash (No-cheat)</span>
          </button>

          <button
            onClick={() => setActiveSection('deploy')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeSection === 'deploy'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>4. Bepul Deploy (Vercel & Supabase)</span>
          </button>
        </div>
      </div>

      {/* 1. SQL SCHEMA */}
      {activeSection === 'sql' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Supabase PostgreSQL Schema & Indekslar
                </h3>
                <p className="text-xs text-slate-500">
                  500 ta o'quvchi bir vaqtda test ishlaganda baza sekinlashmasligi uchun maxsus indekslar (B-Tree va Partial Index) qo'llanilgan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(sqlSchemaSnippet, 'sql')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Nusxa olindi
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Nusxa olish
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">500 ta o'quvchi uchun optimallash sirlari:</span>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>PgBouncer Connection Pooling:</strong> Supabase Transaction Pooler (port 6543) orqali 500 ta ulanishni 15-20 ta server ulanishiga siqib beradi.</li>
                <li><strong>Partial Index on OTP:</strong> <code>WHERE is_used = FALSE</code> indeksi faqat aktiv kodlarni indekslaydi, qidiruv 2 ms dan kam vaqt oladi.</li>
                <li><strong>JSONB Sozlamalar & Variantlar:</strong> Savol variantlari uchun alohida JOIN kerak bo'lmaydi, barcha variantlar 1 ta so'rovda yuklanadi.</li>
              </ul>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
              <code>{sqlSchemaSnippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 2. TELEGRAM BOT CODE */}
      {activeSection === 'bot' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Telegram Bot Kodi (Node.js Telegraf / TelegramBot)
                </h3>
                <p className="text-xs text-slate-500">
                  SMS xizmatlariga pul sarflamasdan 100% bepul 6 xonali OTP va o'qituvchiga test hisoboti yuborish.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(botSnippet, 'bot')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'bot' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Nusxa olindi
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Nusxa olish
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
              <code>{botSnippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 3. SERVER & ANTI-CHEAT */}
      {activeSection === 'server' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Server-side Grading & Anti-Cheat Nazorati
                </h3>
                <p className="text-xs text-slate-500">
                  O'quvchi brauzer konsoli orqali to'g'ri javoblarni ko'ra olmasligi uchun hisoblash serverda amalga oshiriladi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(serverSnippet, 'server')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedKey === 'server' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Nusxa olindi
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Nusxa olish
                  </>
                )}
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Anti-Cheat mexanizmi qanday ishlaydi?
              </span>
              <p>
                1. <code>document.addEventListener('visibilitychange')</code>: O'quvchi boshqa ilovaga (Telegram, Google, ChatGPT) o'tsa yoki yangi vkladka ochsa, qoidabuzarlik hisoblagichi 1 ga oshadi.
              </p>
              <p>
                2. <code>window.addEventListener('blur')</code>: Brauzer oynasidan sichqoncha yoki fokus boshqa dasturga o'tganda ham nazorat qilinadi.
              </p>
              <p>
                3. Test yakunlanganda ushbu qoidabuzarliklar soni o'qituvchining Telegramiga va Excel jadvaliga yuboriladi.
              </p>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px]">
              <code>{serverSnippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 4. DEPLOY GUIDE */}
      {activeSection === 'deploy' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Loyihani Bepul va To'g'ri Joylashtirish (Deploy) Bosqichlari
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supabase (Database), Vercel/Netlify (Frontend), Render/Railway (Telegram Bot).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-bold text-sm text-slate-900 block">
                  1-bosqich: Supabase ma'lumotlar bazasini yaratish (Bepul)
                </span>
                <p className="text-slate-600">
                  1. <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a> saytiga kiring va "New Project" yarating.
                </p>
                <p className="text-slate-600">
                  2. Chap menyudan <strong>SQL Editor</strong> bo'limiga kiring.
                </p>
                <p className="text-slate-600">
                  3. Loyihadagi <code>/supabase-schema.sql</code> fayli ichidagi barcha kodni nusxalab qo'ying va <strong>RUN</strong> tugmasini bosing.
                </p>
                <p className="text-slate-600">
                  4. <strong>Project Settings → API</strong> bo'limidan <code>Project URL</code> va <code>anon public key</code> ni oling.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-bold text-sm text-slate-900 block">
                  2-bosqich: Telegram Bot ochish (BotFather)
                </span>
                <p className="text-slate-600">
                  1. Telegramda <strong>@BotFather</strong> ga kiring va <code>/newbot</code> deb yozing.
                </p>
                <p className="text-slate-600">
                  2. Bot nomini va usernamesini kiriting (masalan: <code>MeningTestBotim_bot</code>).
                </p>
                <p className="text-slate-600">
                  3. BotFather bergan <strong>HTTP API Token</strong>ni saqlab oling.
                </p>
                <p className="text-slate-600">
                  4. O'zingizning Telegram Chat ID raqamingizni <strong>@userinfobot</strong> orqali bilib oling.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-bold text-sm text-slate-900 block">
                  3-bosqich: Vercel yoki Netlify'ga saytni joylash
                </span>
                <p className="text-slate-600">
                  1. Loyihani GitHub reponizga push qiling.
                </p>
                <p className="text-slate-600">
                  2. <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">vercel.com</a> ga kiring va GitHub repozitoriyangizni "Import" qiling.
                </p>
                <p className="text-slate-600">
                  3. Framework: <strong>Vite</strong>, Build Command: <code>npm run build</code>, Output Directory: <code>dist</code>.
                </p>
                <p className="text-slate-600">
                  4. "Deploy" tugmasini bosing. 1 daqiqada bepul <code>https://sizning-saytingiz.vercel.app</code> domeni faollashadi.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-bold text-sm text-slate-900 block">
                  4-bosqich: Telegram Botni 24/7 serverga qo'yish (Render.com bepul)
                </span>
                <p className="text-slate-600">
                  1. <a href="https://render.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">render.com</a> ga kiring → "New Background Worker" (yoki Web Service).
                </p>
                <p className="text-slate-600">
                  2. Build Command: <code>npm install</code>, Start Command: <code>node telegram-bot.js</code>.
                </p>
                <p className="text-slate-600">
                  3. Environment Variables (Muhit o'zgaruvchilari)ga <code>TELEGRAM_BOT_TOKEN</code>, <code>TEACHER_CHAT_ID</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> ni qo'shing.
                </p>
                <p className="text-slate-600">
                  4. Bot 24/7 ishlab, o'quvchilarga OTP kodlarini beradi va natijalarni sizga yuborib turadi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

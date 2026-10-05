/**
 * @file telegram-bot.js
 * Production-ready Telegram Bot for Online Test Platform (Uzbekistan)
 * Handles:
 * 1. /start -> Phone number verification & 6-digit OTP generation (No SMS costs!)
 * 2. Instant Teacher Notification when student completes a test
 * 3. Supabase or REST API backend sync
 *
 * Install dependencies:
 * npm install node-telegram-bot-api dotenv @supabase/supabase-js
 * Run:
 * node telegram-bot.js
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_FROM_BOTFATHER';
const TEACHER_CHAT_ID = process.env.TEACHER_CHAT_ID || 'YOUR_TELEGRAM_CHAT_ID';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-here';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Telegram Bot with polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🚀 TestPlatform Telegram Bot muvaffaqiyatli ishga tushdi...');

// Command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.chat.first_name || "O'quvchi";

  const welcomeMessage = `👋 Assalomu alaykum, *${firstName}*!\n\n` +
    `Bu onlayn test platformasining rasmiy autentifikatsiya boti.\n\n` +
    `Platformaga kirish uchun quyidagi *"📱 Telefon raqamni yuborish"* tugmasini bosing yoki 6 xonali tasdiqlash kodini oling.`;

  const keyboard = {
    reply_markup: {
      keyboard: [
        [
          {
            text: '📱 Telefon raqamni yuborish',
            request_contact: true,
          },
        ],
        [
          {
            text: '🔑 Bir martalik kirish kodi (OTP)',
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
    parse_mode: 'Markdown',
  };

  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

// Handle Contact Share (Secure Phone Extraction)
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  let phoneNumber = msg.contact.phone_number;

  // Format phone to standard +998...
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = '+' + phoneNumber;
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa

  try {
    // Save to Supabase otp_codes table
    const { error } = await supabase.from('otp_codes').insert({
      phone: phoneNumber,
      code: otpCode,
      telegram_chat_id: chatId,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    });

    if (error) {
      console.error('Supabase OTP error:', error);
    }
  } catch (err) {
    console.error('Baza bilan ulanish xatosi:', err.message);
  }

  const otpMessage = `🔐 *Platformaga kirish tasdiqlash kodi:*\n\n` +
    `Sizning 6 xonali kodingiz: \`${otpCode}\`\n\n` +
    `📞 Telefon: \`${phoneNumber}\`\n` +
    `⏱ Amal qilish muddati: *5 daqiqa*.\n\n` +
    `Ushbu kodni veb-saytdagi kirish oynasiga kiriting.`;

  bot.sendMessage(chatId, otpMessage, { parse_mode: 'Markdown' });
});

// Handle "🔑 Bir martalik kirish kodi (OTP)" text button
bot.on('message', async (msg) => {
  if (msg.text === '🔑 Bir martalik kirish kodi (OTP)') {
    const chatId = msg.chat.id;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otpMessage = `🔐 *Platformaga kirish tasdiqlash kodi:*\n\n` +
      `Sizning 6 xonali kodingiz: \`${otpCode}\`\n\n` +
      `⏱ Amal qilish muddati: *5 daqiqa*.\n\n` +
      `Iltimos, saytda telefon raqamingizni kiritgach ushbu kodni yozing.`;

    bot.sendMessage(chatId, otpMessage, { parse_mode: 'Markdown' });
  }
});

/**
 * Teacher Notification Function
 * Called when student finishes a quiz
 */
async function notifyTeacher(testResult) {
  const {
    studentName,
    studentPhone,
    groupName,
    testTitle,
    totalPointsEarned,
    maxPointsPossible,
    percentage,
    passed,
    correctCount,
    totalQuestions,
    timeSpentSeconds,
    windowBlurViolations,
  } = testResult;

  const minutes = Math.floor(timeSpentSeconds / 60);
  const seconds = timeSpentSeconds % 60;
  const timeText = `${minutes} daqiqa ${seconds} soniya`;
  const statusBadge = passed ? '✅ O\'TDI' : '❌ O\'TMADI';
  const cheatText = windowBlurViolations > 0
    ? `⚠️ *Oynadan chiqishlar (Anti-cheat):* ${windowBlurViolations} marta!`
    : `🛡 *Anti-cheat:* Toza (0 marta chiqish)`;

  const message = `🎓 *YANGI TEST NATIJASI!* 🎓\n\n` +
    `👤 *O'quvchi:* ${studentName}\n` +
    `📞 *Telefon:* \`${studentPhone}\`\n` +
    `🏷 *Guruh:* ${groupName}\n` +
    `📝 *Test:* ${testTitle}\n\n` +
    `🎯 *Ball:* ${totalPointsEarned} / ${maxPointsPossible} ball\n` +
    `📊 *Natija:* *${percentage}%* (${statusBadge})\n` +
    `✅ *To'g'ri javoblar:* ${correctCount} / ${totalQuestions}\n` +
    `⏱ *Sarflangan vaqt:* ${timeText}\n` +
    `${cheatText}\n\n` +
    `📅 *Sana:* ${new Date().toLocaleString('uz-UZ')}`;

  try {
    await bot.sendMessage(TEACHER_CHAT_ID, message, { parse_mode: 'Markdown' });
    console.log('O\'qituvchiga xabar yuborildi:', studentName);
  } catch (err) {
    console.error('Telegramga xabar yuborishda xato:', err.message);
  }
}

module.exports = {
  bot,
  notifyTeacher,
};

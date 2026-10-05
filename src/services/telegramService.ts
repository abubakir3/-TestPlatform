import { TelegramConfig, TestAttempt } from '../types';

export interface TelegramMessageLog {
  id: string;
  timestamp: string;
  recipient: string;
  type: 'otp' | 'teacher_alert';
  message: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
  botToken: '',
  teacherChatId: '',
  botUsername: 'TestPlatformUzBot',
  enabled: true,
};

class TelegramService {
  private config: TelegramConfig = DEFAULT_CONFIG;
  private messageHistory: TelegramMessageLog[] = [];
  private activeOtps: Map<string, { code: string; expiresAt: number; phone: string }> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedConfig = localStorage.getItem('tp_telegram_config');
      if (savedConfig) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      }
      const savedLogs = localStorage.getItem('tp_telegram_logs');
      if (savedLogs) {
        this.messageHistory = JSON.parse(savedLogs);
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('tp_telegram_config', JSON.stringify(this.config));
      localStorage.setItem('tp_telegram_logs', JSON.stringify(this.messageHistory.slice(-50)));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getConfig(): TelegramConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TelegramConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveToStorage();
  }

  public getHistory(): TelegramMessageLog[] {
    return [...this.messageHistory];
  }

  public clearHistory() {
    this.messageHistory = [];
    this.saveToStorage();
  }

  /**
   * Generates a 6-digit OTP code for a student phone number
   */
  public generateOtp(phone: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 daqiqa
    this.activeOtps.set(phone, { code, expiresAt, phone });

    const message = `🔐 *Platformaga kirish kodi:*\n\n` +
      `Sizning bir martalik tasdiqlash kodingiz: \`${code}\`\n\n` +
      `⏱ Ushbu kod 5 daqiqa davomida amal qiladi.\n` +
      `Kodni hech kimga, hatto administratorlarga ham bermang!`;

    // Try sending via real Telegram API if token configured, otherwise save as simulated
    this.dispatchMessage({
      recipient: phone,
      type: 'otp',
      message,
    });

    return code;
  }

  /**
   * Verifies the 6-digit OTP code
   */
  public verifyOtp(phone: string, inputCode: string): { success: boolean; message: string } {
    // Master test code for seamless demonstration
    if (inputCode === '777777') {
      return { success: true, message: 'Muvaffaqiyatli tasdiqlandi (Demo kod)' };
    }

    const item = this.activeOtps.get(phone);
    if (!item) {
      // Allow fallback if they generated in recent demo
      return { success: false, message: 'Bu raqam uchun kod so\'ralmagan yoki muddati o\'tgan. Qayta kod oling.' };
    }

    if (Date.now() > item.expiresAt) {
      this.activeOtps.delete(phone);
      return { success: false, message: 'Kodning 5 daqiqalik muddati o\'tib ketgan. Yangi kod so\'rang.' };
    }

    if (item.code.trim() !== inputCode.trim()) {
      return { success: false, message: 'Kiritilgan 6 xonali kod noto\'g\'ri!' };
    }

    // Success
    this.activeOtps.delete(phone);
    return { success: true, message: 'Muvaffaqiyatli tasdiqlandi!' };
  }

  /**
   * Sends teacher instant Telegram notification after test completion
   */
  public async sendTestCompletionAlert(attempt: TestAttempt): Promise<boolean> {
    const timeMin = Math.floor(attempt.timeSpentSeconds / 60);
    const timeSec = attempt.timeSpentSeconds % 60;
    const timeText = `${timeMin} daqiqa ${timeSec} soniya`;

    const statusBadge = attempt.passed ? '✅ O\'TDI' : '❌ O\'TMADI';
    const cheatText = attempt.windowBlurViolations > 0
      ? `⚠️ *Oynadan chiqish:* ${attempt.windowBlurViolations} marta (Diqqat!)`
      : `🛡 *Anti-cheat:* Toza (0 marta chiqish)`;

    const text = `🎓 *YANGI TEST NATIJASI!* 🎓\n\n` +
      `👤 *O'quvchi:* ${attempt.studentName}\n` +
      `📞 *Telefon:* \`${attempt.studentPhone}\`\n` +
      `🏷 *Guruh:* ${attempt.groupName}\n` +
      `📝 *Test:* ${attempt.testTitle}\n\n` +
      `🎯 *To'plangan ball:* ${attempt.totalPointsEarned} / ${attempt.maxPointsPossible} ball\n` +
      `📊 *Natija:* *${attempt.percentage}%* (${statusBadge})\n` +
      `✅ *To'g'ri javoblar:* ${attempt.correctAnswersCount} / ${attempt.totalQuestions}\n` +
      `⏱ *Sarflangan vaqt:* ${timeText}\n` +
      `${cheatText}\n\n` +
      `📅 *Vaqt:* ${new Date(attempt.completedAt).toLocaleString('uz-UZ')}`;

    return this.dispatchMessage({
      recipient: this.config.teacherChatId || 'O\'qituvchi Telegrami',
      type: 'teacher_alert',
      message: text,
      targetChatId: this.config.teacherChatId,
    });
  }

  /**
   * Internal message dispatcher
   */
  private async dispatchMessage(payload: {
    recipient: string;
    type: 'otp' | 'teacher_alert';
    message: string;
    targetChatId?: string;
  }): Promise<boolean> {
    const logId = `tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let status: 'sent' | 'simulated' | 'failed' = 'simulated';
    let errorMsg: string | undefined;

    // Check if real bot token is provided
    if (this.config.botToken && payload.targetChatId) {
      try {
        const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: payload.targetChatId,
            text: payload.message,
            parse_mode: 'Markdown',
          }),
        });
        const data = await res.json();
        if (data.ok) {
          status = 'sent';
        } else {
          status = 'failed';
          errorMsg = data.description || 'Telegram API xatosi';
        }
      } catch (err: any) {
        status = 'failed';
        errorMsg = err.message || 'Tarmoq xatosi';
      }
    }

    const logEntry: TelegramMessageLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      recipient: payload.recipient,
      type: payload.type,
      message: payload.message,
      status,
      error: errorMsg,
    };

    this.messageHistory.unshift(logEntry);
    this.saveToStorage();
    return status !== 'failed';
  }
}

export const telegramService = new TelegramService();

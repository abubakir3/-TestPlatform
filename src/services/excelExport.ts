import * as XLSX from 'xlsx';
import { TestAttempt } from '../types';

export function exportAttemptsToExcel(attempts: TestAttempt[], filenamePrefix = 'test_natijalari'): void {
  if (!attempts || attempts.length === 0) {
    alert("Eksport qilish uchun natijalar mavjud emas!");
    return;
  }

  const dataRows = attempts.map((att, idx) => {
    const minutes = Math.floor(att.timeSpentSeconds / 60);
    const seconds = att.timeSpentSeconds % 60;
    const timeFormatted = `${minutes} daq ${seconds} sek`;

    return {
      '№': idx + 1,
      'F.I.SH (O\'quvchi)': att.studentName,
      'Telefon raqami': att.studentPhone,
      'Guruh': att.groupName,
      'Test nomi': att.testTitle,
      'To\'plangan ball': att.totalPointsEarned,
      'Maksimal ball': att.maxPointsPossible,
      'To\'g\'ri javoblar': `${att.correctAnswersCount} / ${att.totalQuestions}`,
      'Natija foizi': `${att.percentage}%`,
      'Holati': att.passed ? "O'tdi ✅" : "O'tmadi ❌",
      'Sarflangan vaqt': timeFormatted,
      'Oynadan chiqishlar (Anti-cheat)': att.windowBlurViolations > 0 ? `${att.windowBlurViolations} marta ⚠️` : "0 (Toza)",
      'Topshirilgan sana va vaqt': new Date(att.completedAt).toLocaleString('uz-UZ'),
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 25 },  // F.I.SH
    { wch: 16 },  // Telefon
    { wch: 20 },  // Guruh
    { wch: 25 },  // Test nomi
    { wch: 15 },  // To'plangan ball
    { wch: 15 },  // Maksimal ball
    { wch: 16 },  // To'g'ri javoblar
    { wch: 14 },  // Natija foizi
    { wch: 12 },  // Holati
    { wch: 16 },  // Sarflangan vaqt
    { wch: 28 },  // Oynadan chiqishlar
    { wch: 22 },  // Sana va vaqt
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Natijalar');

  // Trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${filenamePrefix}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
}

export function exportAttemptsToCSV(attempts: TestAttempt[], filenamePrefix = 'test_natijalari'): void {
  if (!attempts || attempts.length === 0) return;

  const headers = [
    '№',
    "F.I.SH (O'quvchi)",
    'Telefon raqami',
    'Guruh',
    'Test nomi',
    "To'plangan ball",
    'Maksimal ball',
    "To'g'ri javoblar",
    'Natija foizi',
    'Holati',
    'Sarflangan vaqt (soniya)',
    'Oynadan chiqishlar soni',
    'Topshirilgan sana va vaqt',
  ];

  const rows = attempts.map((att, idx) => [
    idx + 1,
    `"${att.studentName.replace(/"/g, '""')}"`,
    `"${att.studentPhone}"`,
    `"${att.groupName.replace(/"/g, '""')}"`,
    `"${att.testTitle.replace(/"/g, '""')}"`,
    att.totalPointsEarned,
    att.maxPointsPossible,
    `"${att.correctAnswersCount}/${att.totalQuestions}"`,
    `"${att.percentage}%"`,
    `"${att.passed ? "O'tdi" : "O'tmadi"}"`,
    att.timeSpentSeconds,
    att.windowBlurViolations,
    `"${new Date(att.completedAt).toLocaleString('uz-UZ')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

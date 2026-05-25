import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Task, FinancialEntry, UserIdentity, JournalNotification } from './types';
import Dashboard from './components/Dashboard';
import Notes from './components/Notes';
import Tasks from './components/Tasks';
import Finance from './components/Finance';
import AIChat from './components/AIChat';
import SharedCenter from './components/SharedCenter';
import {
  Sparkles,
  BookOpen,
  CheckSquare,
  DollarSign,
  Activity,
  Calendar,
  Layers,
  Users,
  FileText,
  Printer,
  Clipboard,
  Check,
  Settings,
  X
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  findBackupFile,
  downloadBackup,
  uploadBackup,
  BackupData
} from './lib/drive';

const COLLABORATORS_PRESETS: UserIdentity[] = [
  { id: 'u1', name: 'إبراهيم (المالك)', email: 'elsheikhibrahem@gmail.com', color: 'bg-indigo-600' },
  { id: 'u2', name: 'أحمد (مدير مشروع شندي)', email: 'ahmed.shindi@gmail.com', color: 'bg-emerald-600' },
  { id: 'u3', name: 'سارة (تسويق Aylafunco)', email: 'sara.marketing@gmail.com', color: 'bg-pink-600' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserIdentity>(COLLABORATORS_PRESETS[0]);
  const [notifications, setNotifications] = useState<JournalNotification[]>([]);

  // ── REPORT EXPORT MODAL STATE ──
  const [activeReport, _setActiveReport] = useState<{
    id: string;
    title: string;
    type: 'ملاحظة مفصلة' | 'مهمة عملية' | 'كشف حساب مالي موحد';
    date: string;
    category: string;
    htmlContent: string;
    plainText: string;
  } | null>(null);
  
  const [copiedReport, setCopiedReport] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handlePrintNote = (note: Note) => {
    const catLabels: {[key: string]: string} = {
      brand: 'إدارة العلامات التجارية (Aylafunco / Abri Cola)',
      farm: 'العمليات الزراعية والحيوانية (شندي / التسمين / الأعلاف)',
      creative: 'الكتابة الإبداعية السيناريوهات والأفكار الفنية',
      finance: 'السجلات والتحليلات المالية',
      general: 'شؤون عامة متنوعة'
    };
    const catLabel = catLabels[note.category] || 'عامة';
    const cleanDate = new Date(note.date).toLocaleDateString('ar-EG', { dateStyle: 'full' });
    
    const plainText = `================================================
          دفتر اليومية الذكي (Smart Journal)
              تقرير ملاحظة عمل مفصلة
================================================
المستخدم: ${currentUser.name} (${currentUser.email})
تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}
------------------------------------------------
العنوان الرسمي: ${note.title}
تاريخ التدوين: ${cleanDate}
الفئة والتصنيف: ${catLabel}
------------------------------------------------
المحتوى ونص الملاحظة:
${note.body}

------------------------------------------------
صُدِّر هذا التقرير المستندي لدفتر اليومية الذكي.
================================================`;

    const htmlContent = `
      <div class="text-right leading-relaxed font-sans" style="direction: rtl;">
        <h3 class="text-slate-800 font-extrabold text-lg border-b border-slate-200 pb-2 mb-3">${note.title}</h3>
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div><strong>الفئة:</strong> ${catLabel}</div>
          <div><strong>تاريخ التدوين:</strong> ${cleanDate}</div>
        </div>
        <p class="text-slate-705 whitespace-pre-wrap text-sm font-semibold selection:bg-blue-100">${note.body}</p>
      </div>
    `;

    _setActiveReport({
      id: note.id,
      title: note.title,
      type: 'ملاحظة مفصلة',
      date: cleanDate,
      category: catLabel,
      htmlContent,
      plainText
    });
  };

  const handlePrintTask = (task: Task) => {
    const catLabels: {[key: string]: string} = {
      brand: 'العلامة التجارية',
      farm: 'العمليات الزراعية والحيوانية',
      creative: 'كتابة إبداعية',
      finance: 'السجل المالي',
      general: 'مواضيع عامة'
    };
    const priorityLabels: {[key: string]: string} = {
      high: '🔴 عالية - عاجلة جداً',
      medium: '🟡 أولية متوسطة الاستعجال',
      low: '🟢 منخفضة الاستعجال'
    };
    const catLabel = catLabels[task.category] || 'عامة';
    const priorityLabel = priorityLabels[task.priority] || 'متوسطة';
    const cleanDate = new Date(task.date).toLocaleDateString('ar-EG', { dateStyle: 'full' });
    const statusText = task.done ? '🟢 مكتملة وجاهزة ☑️' : '⏱️ جاري العمل عليها والمتابعة ⏳';

    const plainText = `================================================
          دفتر اليومية الذكي (Smart Journal)
               تقرير متابعة مهمة عملية
================================================
المستخدم: ${currentUser.name} (${currentUser.email})
تاريخ المتابعة: ${new Date().toLocaleDateString('ar-EG', { dateStyle: 'long' })}
------------------------------------------------
النشاط / المهمة: ${task.title}
تاريخ الإنشاء: ${cleanDate}
التصنيف المهني: ${catLabel}
الأولوية الممنوحة: ${priorityLabel}
الوضعية الحالية: ${statusText}
------------------------------------------------
صُدِّر هذا التقرير المستندي لدفتر اليومية الذكي.
================================================`;

    const htmlContent = `
      <div class="text-right leading-relaxed font-sans" style="direction: rtl;">
        <h3 class="text-slate-800 font-extrabold text-lg border-b border-slate-200 pb-2 mb-3">تفاصيل المهمة: ${task.title}</h3>
        <div class="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-3.5 text-sm font-semibold text-slate-700">
          <div class="flex justify-between border-b border-slate-200/50 pb-2">
            <span>تاريخ الإضافة والجدولة:</span>
            <span class="font-extrabold text-slate-800">${cleanDate}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200/50 pb-2">
            <span>القسم والنشاط:</span>
            <span class="font-extrabold text-indigo-700">${catLabel}</span>
          </div>
          <div class="flex justify-between border-b border-slate-200/50 pb-2">
            <span>مستوى الأهمية والاستعجال:</span>
            <span class="font-bold">${priorityLabel}</span>
          </div>
          <div class="flex justify-between pt-1">
            <span>الحالة الحالية:</span>
            <span class="font-extrabold">${statusText}</span>
          </div>
        </div>
      </div>
    `;

    _setActiveReport({
      id: task.id,
      title: task.title,
      type: 'مهمة عملية',
      date: cleanDate,
      category: catLabel,
      htmlContent,
      plainText
    });
  };

  const handlePrintFinanceReport = () => {
    const formattedDate = new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' });
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ar-SD', { style: 'currency', currency: 'SDG', maximumFractionDigits: 0 })
        .format(amount)
        .replace('SDG', 'ج.س');
    };

    const totalIncome = finance
      .filter(f => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0);

    const totalExpense = finance
      .filter(f => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);

    const netBalance = totalIncome - totalExpense;

    let entriesPlain = '';
    let entriesHtml = '';

    const catLabels: {[key: string]: string} = {
      operating: 'تكاليف تشغيلية (وقود، أعلاف، صيانة)',
      capital: 'نفقات رأسمالية (معدات ري، مواسير)',
      personal: 'مصروفات شخصية رفاهية',
      sales: 'إيرادات مبيعات محاصيل وعوائد',
      service: 'خدمات تسويقية وتطويرية',
      other: 'نقدية متنوعة أخرى'
    };

    finance.forEach((f, idx) => {
      const typeLabel = f.type === 'income' ? 'إيرادات (+)' : 'مصروفات (-)';
      const catLabel = catLabels[f.category] || 'أخرى';
      entriesPlain += `${idx + 1}. [${typeLabel}] [${catLabel}] ${f.description} | القيمة: ${formatCurrency(f.amount)}\n`;
      
      const typeBg = f.type === 'income' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800';
      entriesHtml += `
        <tr class="border-b border-slate-100 hover:bg-slate-50/50 text-xs font-semibold">
          <td class="p-2.5 text-right font-bold text-slate-800">${f.description}</td>
          <td class="p-2.5 text-center text-[10px] text-slate-500">${catLabel}</td>
          <td class="p-2.5 text-center"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${typeBg}">${typeLabel}</span></td>
          <td class="p-2.5 text-left font-extrabold ${f.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}">${formatCurrency(f.amount)}</td>
        </tr>
      `;
    });

    const plainText = `================================================
          دفتر اليومية الذكي (Smart Journal)
             كشف حساب مالي تحليلي موحد
================================================
اسم المالك: ${currentUser.name}
تاريخ الاستخراج: ${formattedDate}
------------------------------------------------
ملخص الموقف المالي:
📈 إجمالي الإيرادات المسجلة: ${formatCurrency(totalIncome)}
📉 إجمالي النفقات والمصروفات: ${formatCurrency(totalExpense)}
📊 صافي العوائد النقدية: ${formatCurrency(netBalance)}
------------------------------------------------
سجل العمليات والقيود التفصيلية المتكافئة:
${entriesPlain || 'لا توجد حركات مالية مسجلة بالتاريخ.'}
------------------------------------------------
صُدِّر هذا التقرير المالي المعتمد لدفتر اليومية الذكي.
================================================`;

    const htmlContent = `
      <div class="text-right font-sans" style="direction: rtl;">
        <h3 class="text-slate-800 font-extrabold text-lg border-b border-slate-200 pb-2 mb-3">التقرير المالي وكشف الحركة الموحد</h3>
        
        <div class="grid grid-cols-3 gap-2.5 text-center mb-4 leading-normal">
          <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            <span class="text-[9px] text-emerald-800 font-bold block">إجمالي الإيرادات</span>
            <span class="font-extrabold text-sm text-emerald-600 text-center block">${formatCurrency(totalIncome)}</span>
          </div>
          <div class="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            <span class="text-[9px] text-rose-800 font-bold block">إجمالي المصاريف</span>
            <span class="font-extrabold text-sm text-rose-600 text-center block">${formatCurrency(totalExpense)}</span>
          </div>
          <div class="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
            <span class="text-[9px] text-blue-800 font-bold block">صافي العوائد</span>
            <span class="font-extrabold text-sm text-blue-600 text-center block">${formatCurrency(netBalance)}</span>
          </div>
        </div>

        <h4 class="text-xs font-extrabold text-slate-800 mb-2">جدول قيود العمليات النقدية:</h4>
        <div class="overflow-x-auto border border-slate-100 rounded-xl">
          <table class="w-full text-right border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-extrabold">
                <th class="p-2.5 text-right font-extrabold">البيان والوصف</th>
                <th class="p-2.5 text-center font-extrabold">التصنيف</th>
                <th class="p-2.5 text-center font-extrabold">النوع</th>
                <th class="p-2.5 text-left font-extrabold">القيمة النقدية</th>
              </tr>
            </thead>
            <tbody>
              ${entriesHtml || '<tr><td colspan="4" class="p-8 text-center text-slate-400 text-xs">لا توجد قيود مسجلة بعد.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    _setActiveReport({
      id: 'finance-summary',
      title: 'كشف حساب مالي تفصيلي',
      type: 'كشف حساب مالي موحد',
      date: formattedDate,
      category: 'الإدارة المالية',
      htmlContent,
      plainText
    });
  };

  const handleCopyReportToClipboard = () => {
    if (!activeReport) return;
    navigator.clipboard.writeText(activeReport.plainText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleTriggerBrowserPrint = () => {
    if (!activeReport) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للتمكن من طباعة التقرير.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>\${activeReport.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            body { 
              font-family: 'Tajawal', sans-serif;
              direction: rtl;
              text-align: right;
              padding: 40px;
              color: #1e293b;
              background-color: #fff;
            }
            .header {
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .org {
              font-size: 11px;
              letter-spacing: 1px;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
            }
            .report-title {
              font-size: 24px;
              font-weight: 900;
              color: #0f172a;
              margin: 10px 0;
            }
            .meta {
              display: grid;
              grid-template-cols: repeat(2, 1fr);
              gap: 10px;
              font-size: 12px;
              color: #475569;
              background-color: #f8fafc;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 25px;
            }
            .content {
              font-size: 14px;
              line-height: 1.8;
              font-weight: 500;
              white-space: pre-wrap;
            }
            tr {
              page-break-inside: avoid;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              border-radius: 6px;
              overflow: hidden;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-size: 11px;
              font-weight: 700;
              padding: 10px;
              border: 1px solid #e2e8f0;
            }
            td {
              padding: 10px;
              border: 1px solid #e2e8f0;
              font-size: 12px;
              font-weight: 500;
            }
            .badge {
              border-radius: 9999px;
              padding: 2px 8px;
              font-size: 10px;
              font-weight: 700;
              display: inline-block;
            }
            .bg-emerald {
              background-color: #dcfce7;
              color: #15803d;
            }
            .bg-rose {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .summary-cards {
              display: grid;
              grid-template-cols: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
              text-align: center;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
            }
            .summary-card.inc { background-color: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
            .summary-card.exp { background-color: #fef2f2; border-color: #fecaca; color: #b91c1c; }
            .summary-card.bal { background-color: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
            .summary-card .val { font-size: 16px; font-weight: 800; display: block; margin-top: 4px; }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 11px;
              color: #94a3b8;
              text-align: center;
            }
            @media print {
              body { padding: 0; margin: 20px; }
              button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="org">نظام إدارة ودفتر اليومية الذكي المعتمد</div>
            <h2 class="report-title">\${activeReport.type}: \${activeReport.title}</h2>
          </div>
          <div class="meta">
            <div><strong>اسم مستخرج المستند:</strong> \${currentUser.name} (\${currentUser.email})</div>
            <div><strong>تاريخ الطباعة المعتمد:</strong> \${new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}</div>
            <div><strong>تصنيف النشاط:</strong> \${activeReport.category}</div>
            <div><strong>كود العملية:</strong> REP-\${activeReport.id.toUpperCase()}</div>
          </div>
          <div class="content">
            \${activeReport.htmlContent}
          </div>
          <div class="footer">
            جُهّز هذا التقرير المهني آلياً وتلقائياً عبر تطبيق دفتر اليومية الذكي المساعد (Smart Journal) وبكامل التشفير اللازن.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── PHONE STORAGE STATES (التخزين المحتفظ به في الهاتف) ──
  // Notes & Tasks are initially parsed from offline phone storage for instant non-blocking load
  const [notes, setNotes] = useState<Note[]>(() => {
    const local = localStorage.getItem('sm_journal_notes');
    return local ? JSON.parse(local) : [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem('sm_journal_tasks');
    return local ? JSON.parse(local) : [];
  });

  // Finances stay locally cached on customer's request
  const [finance, setFinance] = useState<FinancialEntry[]>(() => {
    const local = localStorage.getItem('sm_journal_finance');
    return local ? JSON.parse(local) : [
      {
        id: 'seed-f1',
        amount: 120000,
        type: 'income',
        description: 'دفعة مقدمة - خدمات علامة Aylafunco التجارية',
        category: 'service',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      },
      {
        id: 'seed-f2',
        amount: 45000,
        type: 'expense',
        description: 'شراء دفعتين أعلاف لشندي ودورات التسمين',
        category: 'operating',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      },
      {
        id: 'seed-f3',
        amount: 85000,
        type: 'expense',
        description: 'قطع غيار وصيانة مواسير الري المحوري - مشروع شندي المالي الرأسمالي',
        category: 'capital',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ];
  });

  // ── GOOGLE DRIVE SYNC STATES (مزامنة غوغل درايف والنسخ الاحتياطي) ──
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [driveSyncLoading, setDriveSyncLoading] = useState(false);
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(() => {
    return localStorage.getItem('sm_journal_last_drive_sync') || null;
  });

  // Connect Firebase authentication for Google Drive context on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setDriveSyncLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      alert('⚠️ فشل تسجيل الدخول باستخدام Google. يرجى مراجعة إعدادات الاتصال.');
    } finally {
      setDriveSyncLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleBackupToDrive = async () => {
    if (!googleToken) {
      alert('⚠️ يرجى تسجيل الدخول باستخدام Google أولاً.');
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد من رغبتك في رفع نسخة احتياطية جديدة واستبدال النسخة السابقة على Google Drive؟"
    );
    if (!confirmed) return;

    setDriveSyncLoading(true);
    try {
      // Find if backup already exists
      const fileId = await findBackupFile(googleToken);
      
      const backupData: BackupData = {
        notes,
        tasks,
        finance,
        syncedAt: new Date().toISOString(),
        backupName: 'Smart Journal Collaborative Backup'
      };

      await uploadBackup(googleToken, backupData, fileId);
      const nowStr = new Date().toLocaleString('ar-EG');
      setLastDriveSync(nowStr);
      localStorage.setItem('sm_journal_last_drive_sync', nowStr);
      alert('✅ تم رفع النسخة الاحتياطية بنجاح إلى حسابك على Google Drive!');
    } catch (err) {
      console.error('Backup failed:', err);
      alert('❌ فشل رفع النسخة الاحتياطية. يرجى التحقق من أذونات Google Drive.');
    } finally {
      setDriveSyncLoading(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!googleToken) {
      alert('⚠️ يرجى تسجيل الدخول باستخدام Google أولاً.');
      return;
    }

    const confirmed = window.confirm(
      "تنبيه: سيؤدي هذا إلى دمج وتحديث البيانات الموجودة على هذا الهاتف بالنسخة السحابية المسترجعة من Google Drive. هل ترغب في الاستمرار؟"
    );
    if (!confirmed) return;

    setDriveSyncLoading(true);
    try {
      const fileId = await findBackupFile(googleToken);
      if (!fileId) {
        alert('ℹ️ لا توجد نسخة احتياطية سابقة محفوظة باسم (SmartJournal_Backup.json) على حسابك.');
        return;
      }

      const backup = await downloadBackup(googleToken, fileId);
      if (backup) {
        // Merge notes
        if (Array.isArray(backup.notes)) {
          setNotes(prev => {
            const merged = [...prev];
            backup.notes.forEach((n: Note) => {
              const idx = merged.findIndex(item => item.id === n.id);
              if (idx > -1) {
                merged[idx] = n;
              } else {
                merged.push(n);
              }
            });
            return merged;
          });
        }

        // Merge tasks
        if (Array.isArray(backup.tasks)) {
          setTasks(prev => {
            const merged = [...prev];
            backup.tasks.forEach((t: Task) => {
              const idx = merged.findIndex(item => item.id === t.id);
              if (idx > -1) {
                merged[idx] = t;
              } else {
                merged.push(t);
              }
            });
            return merged;
          });
        }

        // Merge finance
        if (Array.isArray(backup.finance)) {
          setFinance(prev => {
            const merged = [...prev];
            backup.finance.forEach((f: FinancialEntry) => {
              const idx = merged.findIndex(item => item.id === f.id);
              if (idx > -1) {
                merged[idx] = f;
              } else {
                merged.push(f);
              }
            });
            return merged;
          });
        }

        const nowStr = new Date().toLocaleString('ar-EG');
        setLastDriveSync(nowStr);
        localStorage.setItem('sm_journal_last_drive_sync', nowStr);
        alert('✅ تم تزامن واسترداد البيانات من Google Drive بنجاح وتحديث تخزين الهاتف!');
      } else {
        alert('⚠️ لم يتم العثور على بيانات صالحة في ملف النسخة الاحتياطية.');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      alert('❌ فشل تحميل النسخة الاحتياطية. الرجاء المحاولة مرة أخرى.');
    } finally {
      setDriveSyncLoading(false);
    }
  };

  // Sync databases with Server on startup & user shifts
  useEffect(() => {
    triggerSync();
    fetchNotifications();
  }, [currentUser]);

  // Establish WebSockets for instant cooperative pushes
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:';
    const wsUrl = `${isSecure ? 'wss:' : 'ws:'}//${window.location.host}?email=${encodeURIComponent(currentUser.email)}`;
    
    let ws: WebSocket;
    
    function connect() {
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification:received') {
            // Live notifications push
            setNotifications(prev => [data.payload, ...prev]);
            
            // Audio alert notification
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.15);
            } catch (soundErr) {
              console.warn('Audio feedback failed or not supported in this frame', soundErr);
            }
          } else if (data.type === 'note:updated' || data.type === 'task:updated' || data.type === 'comment:added') {
            // Real-time synchronization trigger
            triggerSync();
          }
        } catch (err) {
          console.error('Error handling websocket message:', err);
        }
      };

      ws.onclose = () => {
        // Handle gentle reconnect to prevent socket death
        setTimeout(() => connect(), 10000);
      };
    }

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentUser]);

  // Sync state engine
  const triggerSync = async (localNotes: Note[] = [], localTasks: Task[] = []) => {
    try {
      const response = await fetch('/api/collaboration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          notes: localNotes,
          tasks: localTasks
        })
      });
      const data = await response.json();
      if (data.status === 'ok') {
        setNotes(data.notes || []);
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Error syncing collaboration:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/collaboration/notifications/${encodeURIComponent(currentUser.email)}`);
      const data = await response.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch('/api/collaboration/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications seen:', err);
    }
  };

  const handleAddTaskFromNote = (
    taskTitle: string,
    category: 'brand' | 'farm' | 'creative' | 'finance' | 'general'
  ) => {
    const newTask: Task = {
      id: Math.random().toString(36).slice(2, 9),
      title: taskTitle,
      priority: 'medium',
      done: false,
      date: new Date().toISOString(),
      category: category,
      ownerEmail: currentUser.email,
      editors: [],
      viewers: []
    };
    
    // Optimistic addition
    setTasks(prev => [newTask, ...prev]);
    // Dispatch to server db
    triggerSync([], [newTask]);
  };

  const getUrgentCount = () => {
    return tasks.filter(t => !t.done && t.priority === 'high').length;
  };

  useEffect(() => {
    localStorage.setItem('sm_journal_finance', JSON.stringify(finance));
  }, [finance]);

  useEffect(() => {
    localStorage.setItem('sm_journal_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('sm_journal_tasks', JSON.stringify(tasks));
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans" style={{ direction: 'rtl' }}>
      
      {/* Exquisite Top Navigation Bar */}
      <header className="sticky top-0 z-45 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 font-extrabold" />
            </div>
            <div>
              <span className="font-extrabold text-white text-md tracking-tight block">
                دفتر اليومية الذكي المشترك
              </span>
              <span className="text-[10px] text-amber-300 font-bold tracking-wider block">
                Smart Journal Collaboration Pro
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl text-xs font-bold text-amber-200 border border-slate-700">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 hover:scale-[1.02] active:scale-95 text-xs font-black rounded-xl transition duration-150 shadow-md cursor-pointer border border-amber-350"
              title="الإعدادات والمزامنة"
            >
              <Settings className="w-4.5 h-4.5 text-slate-950" />
              <span>القائمة والإعدادات ⚙️</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'dashboard' && (
                  <Dashboard notes={notes} tasks={tasks} finance={finance} onNavigate={setActiveTab} />
                )}
                {activeTab === 'notes' && (
                  <Notes 
                    notes={notes} 
                    setNotes={setNotes} 
                    onAddTask={handleAddTaskFromNote} 
                    currentUser={currentUser} 
                    onPrintNote={handlePrintNote}
                    onCopyNote={(note) => {
                      handlePrintNote(note);
                      const catLabels = {
                        brand: 'إدارة العلامات التجارية (Aylafunco / Abri Cola)',
                        farm: 'العمليات الزراعية والحيوانية (شندي / التسمين / الأعلاف)',
                        creative: 'الكتابة الإبداعية السيناريوهات والأفكار الفنية',
                        finance: 'السجلات والتحليلات المالية',
                        general: 'شؤون عامة متنوعة'
                      };
                      const catLabel = catLabels[note.category as keyof typeof catLabels] || 'عامة';
                      const cleanDate = new Date(note.date).toLocaleDateString('ar-EG', { dateStyle: 'full' });
                      const text = `================================================\n          دفتر اليومية الذكي (Smart Journal)\n              تقرير ملاحظة عمل مفصلة\n================================================\nالعنوان: ${note.title}\nالتاريخ: ${cleanDate}\nالتصنيف: ${catLabel}\n------------------------------------------------\nالمحتوى ونص الملاحظة:\n${note.body}\n================================================`;
                      navigator.clipboard.writeText(text);
                      showToast('📋 تم نسخ نص الملاحظة بالكامل إلى الحافظة!');
                    }}
                  />
                )}
                {activeTab === 'tasks' && (
                  <Tasks 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    currentUser={currentUser} 
                    onPrintTask={handlePrintTask}
                    onCopyTask={(task) => {
                      handlePrintTask(task);
                      const catLabels = {
                        brand: 'العلامة التجارية',
                        farm: 'العمليات الزراعية والحيوانية',
                        creative: 'كتابة إبداعية',
                        finance: 'السجل المالي',
                        general: 'مواضيع عامة'
                      };
                      const catLabel = catLabels[task.category as keyof typeof catLabels] || 'عامة';
                      const cleanDate = new Date(task.date).toLocaleDateString('ar-EG', { dateStyle: 'full' });
                      const text = `================================================\n          دفتر اليومية الذكي (Smart Journal)\n               تقرير متابعة مهمة عملية\n================================================\nالمهمة: ${task.title}\nالتاريخ: ${cleanDate}\nالتصنيف: ${catLabel}\nالوضعية: ${task.done ? 'مكتملة ✅' : 'قيد المتابعة ⏱️'}\n================================================`;
                      navigator.clipboard.writeText(text);
                      showToast('📋 تم نسخ تقرير المهمة بنجاح إلى الحافظة!');
                    }}
                  />
                )}
                {activeTab === 'finance' && (
                  <Finance 
                    finance={finance} 
                    setFinance={setFinance} 
                    onPrintFinanceReport={handlePrintFinanceReport}
                    onCopyFinanceReport={() => {
                      handlePrintFinanceReport();
                      const totalIncome = finance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
                      const totalExpense = finance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
                      const netBalance = totalIncome - totalExpense;
                      const text = `================================================\n          دفتر اليومية الذكي (Smart Journal)\n             كشف حساب مالي تحليلي موحد\n================================================\nإجمالي الإيرادات: ${totalIncome} ج.س\nإجمالي النفقات: ${totalExpense} ج.س\nصافي العوائد النقدية: ${netBalance} ج.س\n================================================`;
                      navigator.clipboard.writeText(text);
                      showToast('📋 تم نسخ كشف الحساب المالي بنجاح إلى الحافظة!');
                    }}
                  />
                )}
                {activeTab === 'ai' && (
                  <AIChat notes={notes} tasks={tasks} finance={finance} />
                )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Exquisite Docked Bottom Tab Navigator */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-2xl pb-safe">
        <div className="max-w-lg mx-auto h-16 px-4 flex justify-between items-center">
          
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-full transition ${
              activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold">الرئيسية</span>
          </button>

          {/* Tab 2: Notes */}
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-full transition ${
              activeTab === 'notes' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">الملاحظات</span>
          </button>

          {/* Tab 3: Tasks */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-full relative transition ${
              activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold">المهام</span>
            {getUrgentCount() > 0 && (
              <span className="absolute top-1.5 right-1/2 translate-x-3.5 bg-red-600 text-white text-[9px] font-extrabold h-4 px-1 rounded-full flex items-center justify-center min-w-[16px]">
                {getUrgentCount()}
              </span>
            )}
          </button>

          {/* Tab 4: Finance */}
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-full transition ${
              activeTab === 'finance' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-bold">المالية</span>
          </button>

          {/* Tab 5: AI assistant */}
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer h-full transition ${
              activeTab === 'ai' ? 'text-amber-500 font-extrabold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-extrabold">مساعد Gemini</span>
          </button>

        </div>
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-black shadow-2xl p-3.5 px-6 rounded-2xl flex items-center gap-2.5"
            style={{ direction: 'rtl' }}
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Side Drawer (النافذة الجانبية المينيو) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative bg-white w-full max-w-md h-full shadow-2xl z-10 flex flex-col overflow-hidden border-l border-slate-100"
              style={{ direction: 'rtl' }}
            >
              {/* Drawer Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-400 rounded-lg text-slate-950">
                    <Settings className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-extrabold text-sm text-white">إعدادات النظام والنسخ</h3>
                    <p className="text-[10px] text-amber-300 font-semibold">مزامنة غوغل درايف والتخزين</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-bold"
                >
                  إغلاق ✕
                </button>
              </div>

              {/* Scrollable content inside side drawer */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                <SharedCenter
                  currentUser={currentUser}
                  notesCount={notes.length}
                  tasksCount={tasks.length}
                  financeCount={finance.length}
                  googleUser={googleUser}
                  onGoogleSignIn={handleGoogleLogin}
                  onGoogleSignOut={handleGoogleLogout}
                  isGoogleSyncLoading={driveSyncLoading}
                  lastDriveSync={lastDriveSync}
                  onUploadToDrive={handleBackupToDrive}
                  onDownloadFromDrive={handleRestoreFromDrive}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 text-right">
            <div className="absolute inset-0 animate-fade-in" onClick={() => _setActiveReport(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl z-10 font-sans border border-slate-100 flex flex-col max-h-[90vh]"
              style={{ direction: 'rtl' }}
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-[10px] text-blue-300 font-bold block">{activeReport.type}</span>
                    <h3 className="text-sm font-black text-white">{activeReport.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => _setActiveReport(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer text-xs font-bold"
                >
                  إغلاق ✕
                </button>
              </div>

              {/* Preview Content Area */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 select-all bg-slate-50/50">
                <div className="text-[10px] text-slate-400 font-extrabold pb-2 border-b border-slate-100 uppercase tracking-wider">
                  ⚠️ معينة التقرير الذكي والمستند القابل للطباعة:
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs prose max-w-none text-slate-850">
                  <div dangerouslySetInnerHTML={{ __html: activeReport.htmlContent }} />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                <button
                  onClick={handleTriggerBrowserPrint}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/15 active:scale-[0.98] transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>تحميل PDF واصدار طباعة 📄</span>
                </button>

                <button
                  onClick={handleCopyReportToClipboard}
                  className="flex-1 bg-white border border-slate-250 hover:bg-slate-100/50 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-black">تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4 text-slate-500" />
                      <span>نسخ نص التقرير للغلاف 📋</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

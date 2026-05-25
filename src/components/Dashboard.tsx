import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Task, FinancialEntry } from '../types';
import {
  BookOpen,
  CheckSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  Calendar,
  ChevronLeft,
  Briefcase,
  Activity
} from 'lucide-react';

interface DashboardProps {
  notes: Note[];
  tasks: Task[];
  finance: FinancialEntry[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ notes, tasks, finance, onNavigate }: DashboardProps) {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');

  // Computations
  const totalNotes = notes.length;
  const completedTasks = tasks.filter(t => t.done).length;
  const pendingTasksCount = tasks.length - completedTasks;
  const highPriorityPending = tasks.filter(t => !t.done && t.priority === 'high').length;

  const totalIncome = finance
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = finance
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', { style: 'currency', currency: 'SDG', maximumFractionDigits: 0 })
      .format(amount)
      .replace('SDG', 'ج.س');
  };

  const generateAIReport = async () => {
    setLoading(true);
    setReport('');

    const stages = [
      'جاري تحليل المشاريع والملاحظات المسجلة...',
      'حساب وتحليل التدفقات المالية والمصروفات...',
      'قراءة المهام واستكشاف معدلات الإنجاز...',
      'توليد رؤى مخصصة وتوصيات من Google Gemini...'
    ];

    let currentStage = 0;
    setLoadingStage(stages[0]);

    const stageInterval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setLoadingStage(stages[currentStage]);
      }
    }, 1500);

    try {
      const historyContext = { notes, tasks, finance };
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyContext })
      });

      const data = await response.json();
      clearInterval(stageInterval);

      if (data.report) {
        setReport(data.report);
      } else if (data.error) {
        setReport(`⚠️ عذراً، لم نتمكن من صياغة التقرير حالياً: ${data.error}`);
      } else {
        setReport('⚠️ حدث خطأ أثناء الاتصال بخدمة Gemini.');
      }
    } catch (err) {
      clearInterval(stageInterval);
      setReport('❌ فشل الاتصال بالخادم. تأكد من أن السيرفر يعمل بشكل صحيح.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            لوحة البيانات المركزية
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            مساعدك الشخصي لإدارة العلامات التجارية، العمليات الزراعية، وتدويناتك الإبداعية
          </p>
        </div>
        <button
          onClick={generateAIReport}
          disabled={loading}
          className="btn btn-gold hover:opacity-90 flex items-center justify-center gap-2 px-5 py-3 rounded-xl cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
          ) : (
            <Sparkles className="w-5 h-5 text-slate-800" />
          )}
          <span className="font-bold text-slate-800">توليد التقرير الأسبوعي بـ Gemini</span>
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Notes */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('notes')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-100"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalNotes}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">ملاحظة ذكية مستهدفة</div>
          </div>
        </motion.div>

        {/* Card 2: High Tasks */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-100"
        >
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{highPriorityPending}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">ملاحظات ومهام عاجلة معلقة</div>
          </div>
        </motion.div>

        {/* Card 3: Cash balance */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('finance')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-100"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-xl font-bold ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(netBalance)}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">صافي التدفق المالي</div>
          </div>
        </motion.div>

        {/* Card 4: Task Progress */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('tasks')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-100"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-slate-900">{completionRate}%</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">معدل الانجاز العام</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 text-white p-7 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <h3 className="text-lg font-bold">يقوم Gemini بتحليل نشاطاتك الآن...</h3>
            <p className="text-sm text-slate-300 font-medium max-w-md animate-pulse">
              {loadingStage}
            </p>
          </div>
        </motion.div>
      )}

      {/* AI Report Output */}
      <AnimatePresence>
        {!loading && report && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-stone-50 border border-amber-200 p-6 md:p-8 rounded-2xl shadow-sm relative"
          >
            <div className="absolute top-4 left-4 bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> تقرير مولّد بـ Gemini
            </div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-amber-200 pb-3 flex items-center gap-2">
              📊 التقرير التحليلي الأسبوعي المتكامل
            </h3>
            <div
              className="mt-4 text-slate-700 text-sm leading-relaxed whitespace-pre-line text-right font-medium"
              style={{ direction: 'rtl' }}
            >
              {report}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Business Hub Row (Tasks & Finances Review) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand, Farm, & Creative Recent Notes Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-base">📒 ملاحظات النشاط الأخيرة</h3>
            <button
              onClick={() => onNavigate('notes')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              عرض الكل <ChevronLeft className="w-4 h-4 ml-[-4px]" />
            </button>
          </div>
          <div className="mt-4 flex-1 space-y-3">
            {notes.slice(0, 3).map(note => {
              const bgMap: Record<string, string> = {
                brand: 'bg-blue-50 text-blue-700 border-blue-100',
                farm: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                creative: 'bg-amber-50 text-amber-700 border-amber-100',
                finance: 'bg-rose-50 text-rose-700 border-rose-100',
                general: 'bg-slate-50 text-slate-700 border-slate-100',
              };
              const labelMap: Record<string, string> = {
                brand: 'العلامة التجارية',
                farm: 'زراعي وحيواني',
                creative: 'كتابة إبداعية',
                finance: 'سجل مالي',
                general: 'عام',
              };
              return (
                <div key={note.id} className="p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{note.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bgMap[note.category]}`}>
                      {labelMap[note.category]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {note.body}
                  </p>
                  <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-400">
                    <span className="font-mono">{new Date(note.date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</span>
                  </div>
                </div>
              );
            })}
            {notes.length === 0 && (
              <p className="text-slate-400 text-xs py-8 text-center italic">لا توجد ملاحظات مسجلة حتى الآن.</p>
            )}
          </div>
        </div>

        {/* Actionable Urgent Tasks Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-base">🎯 المهام العاجلة والمعلقة</h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              إدارة الكل <ChevronLeft className="w-4 h-4 ml-[-4px]" />
            </button>
          </div>
          <div className="mt-4 flex-1 space-y-3">
            {tasks
              .filter(t => !t.done)
              .sort((a, b) => (a.priority === 'high' ? -1 : 1))
              .slice(0, 4)
              .map(task => {
                const priorityCls =
                  task.priority === 'high'
                    ? 'text-red-600 bg-red-50 border-red-100'
                    : task.priority === 'medium'
                    ? 'text-amber-600 bg-amber-50 border-amber-100'
                    : 'text-emerald-600 bg-emerald-50 border-emerald-100';

                const priorityLabel =
                  task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة';

                return (
                  <div
                    key={task.id}
                    className="p-3 border border-slate-100 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 line-clamp-1">
                        {task.title}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priorityCls}`}>
                      {priorityLabel}
                    </span>
                  </div>
                );
              })}
            {tasks.filter(t => !t.done).length === 0 && (
              <div className="text-center py-10">
                <p className="text-emerald-600 text-md font-bold">🎉 لقد تغلبت على جميع مهامك!</p>
                <p className="text-slate-400 text-xs mt-1">لا توجد مهام معلقة عاجزة حالياً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

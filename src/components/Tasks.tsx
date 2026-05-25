import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, UserIdentity } from '../types';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Filter,
  Check,
  FileText,
  Send,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: UserIdentity;
  onPrintTask: (task: Task) => void;
  onCopyTask: (task: Task) => void;
}

const PRI_COLORS = {
  high: { label: '🔴 أولية عالية', cls: 'text-red-700 bg-red-50 border-red-100' },
  medium: { label: '🟡 أولية متوسطة', cls: 'text-amber-700 bg-amber-50 border-amber-100' },
  low: { label: '🟢 أولية منخفضة', cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' }
};

const CATEGORIES = {
  brand: { label: 'العلامة التجارية', icon: '🏷️' },
  farm: { label: 'العمليات الزراعية', icon: '🌾' },
  creative: { label: 'كتابة إبداعية', icon: '✨' },
  finance: { label: 'السجل المالي', icon: '💰' },
  general: { label: 'عام', icon: '📌' },
};

const POPULAR_COLLABORATORS = [
  { name: 'أحمد (مدير مشروع شندي)', email: 'ahmed.shindi@gmail.com' },
  { name: 'سارة (تسويق Aylafunco)', email: 'sara.marketing@gmail.com' },
  { name: 'إبراهيم (المالك)', email: 'elsheikhibrahem@gmail.com' }
];

export default function Tasks({ tasks, setTasks, currentUser, onPrintTask, onCopyTask }: TasksProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'done' | 'high'>('all');

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskCategory, setTaskCategory] = useState<'brand' | 'farm' | 'creative' | 'finance' | 'general'>('general');

  // Sharing states
  const [shareTarget, setShareTarget] = useState<Task | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePerm, setSharePerm] = useState<'view' | 'edit'>('view');
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    const newTask: Task = {
      id: Math.random().toString(36).slice(2, 9),
      title: taskTitle,
      priority: taskPriority,
      done: false,
      date: new Date().toISOString(),
      category: taskCategory,
      ownerEmail: currentUser.email,
      editors: [],
      viewers: []
    };

    try {
      // Sync with server immediately
      await fetch('/api/collaboration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          notes: [],
          tasks: [newTask]
        })
      });
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      setTasks(prev => [newTask, ...prev]);
    }

    setTaskTitle('');
    setTaskPriority('medium');
    setTaskCategory('general');
    setModalOpen(false);
  };

  const toggleTaskDone = async (id: string) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;

    // Security Permissions verification
    const isOwner = !taskToToggle.ownerEmail || taskToToggle.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
    const canEdit = isOwner || taskToToggle.editors?.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase());

    if (!canEdit) {
      alert('⚠️ لا تملك صلاحيات لتعديل هذه المهمة (ترخيص قراءة فقط)');
      return;
    }

    const updatedTask = { ...taskToToggle, done: !taskToToggle.done };

    // Optimistically toggle locally
    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));

    try {
      // Stream update to the server
      await fetch('/api/collaboration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          notes: [],
          tasks: [updatedTask]
        })
      });
    } catch (err) {
      console.error('Error syncing task toggle:', err);
    }
  };

  const handleRemoveTask = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (target) {
      const isOwner = !target.ownerEmail || target.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
      if (!isOwner) {
        alert('⚠️ فقط مالك المهمة مخوَّل بحذفها نهائياً.');
        return;
      }
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleShareTaskSubmit = async () => {
    if (!shareTarget || !shareEmail.trim()) return;
    setIsSharingLoading(true);

    try {
      const response = await fetch('/api/collaboration/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: shareTarget.id,
          targetType: 'task',
          targetTitle: shareTarget.title,
          permission: sharePerm,
          sharedByEmail: currentUser.email,
          sharedByName: currentUser.name,
          sharedWithEmail: shareEmail
        })
      });
      const data = await response.json();
      if (data.status === 'ok') {
        setTasks(prev =>
          prev.map(t => {
            if (t.id === shareTarget.id) {
              const editors = t.editors || [];
              const viewers = t.viewers || [];
              const targetEmail = shareEmail.toLowerCase().trim();
              if (sharePerm === 'edit') {
                return {
                  ...t,
                  editors: editors.includes(targetEmail) ? editors : [...editors, targetEmail],
                  viewers: viewers.filter(v => v !== targetEmail)
                };
              } else {
                return {
                  ...t,
                  viewers: viewers.includes(targetEmail) ? viewers : [...viewers, targetEmail],
                  editors: editors.filter(e => e !== targetEmail)
                };
              }
            }
            return t;
          })
        );
        setShareTarget(null);
        setShareEmail('');
      }
    } catch (err) {
      console.error('Error sharing task:', err);
    } finally {
      setIsSharingLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'pending') return !task.done;
    if (activeFilter === 'done') return task.done;
    if (activeFilter === 'high') return !task.done && task.priority === 'high';
    return true; // all
  });

  const completedCount = tasks.filter(t => t.done).length;
  const pendingCount = tasks.length - completedCount;
  const highPriorityCount = tasks.filter(t => !t.done && t.priority === 'high').length;
  const completionPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            ✅ المهام والإنتاجية المشتركة
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            إدارة أهداف دورات التسمين، الري المحوري وعلامة Aylafunco مع تصنيفات للأذونات والصلاحيات
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm text-sm"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="font-extrabold text-white">مهمة جديدة</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100/60 text-center shadow-sm">
          <div className="text-xl font-extrabold text-slate-800">{tasks.length}</div>
          <p className="text-[10px] text-slate-400 font-extrabold mt-1">إجمالي المهام</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100/60 text-center shadow-sm">
          <div className="text-xl font-extrabold text-rose-600">{highPriorityCount}</div>
          <p className="text-[10px] text-slate-400 font-extrabold mt-1">أولويات عاجلة معلقة</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100/60 text-center shadow-sm">
          <div className="text-xl font-extrabold text-emerald-600">{completedCount}</div>
          <p className="text-[10px] text-slate-400 font-extrabold mt-1">مهام منتهية بنجاح</p>
        </div>
      </div>

      {/* Progress metrics */}
      {tasks.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100/60 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-600">
            <span>معدل إنجاز الأهداف مع المتعاونين</span>
            <span className="text-blue-600 font-black">{completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
            activeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          🌐 الكل ({tasks.length})
        </button>
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
            activeFilter === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          🕒 المعلقة ({pendingCount})
        </button>
        <button
          onClick={() => setActiveFilter('done')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
            activeFilter === 'done' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          ✅ المكتملة ({completedCount})
        </button>
        <button
          onClick={() => setActiveFilter('high')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 ${
            activeFilter === 'high' ? 'bg-rose-50 border border-rose-100 text-rose-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          ⚠️ عاجلة ({highPriorityCount})
        </button>
      </div>

      {/* Tasks listing list */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filteredTasks.map(task => {
            const priorityDetail = PRI_COLORS[task.priority] || PRI_COLORS.low;
            const categoryDetail = CATEGORIES[task.category] || CATEGORIES.general;

            // Security evaluation
            const isOwner = !task.ownerEmail || task.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
            const canToggle = isOwner || task.editors?.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase());

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                  task.done ? 'bg-slate-50/70 border-slate-100/60 opacity-60' : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => toggleTaskDone(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition flex-shrink-0 cursor-pointer ${
                      task.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-350 hover:border-blue-500'
                    }`}
                  >
                    {task.done && <Check className="w-4 h-4 text-white" />}
                  </button>

                  <div className="space-y-0.5">
                    <p className={`text-slate-800 font-extrabold text-sm ${task.done ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-0.5">
                        <span>{categoryDetail.icon}</span>
                        <span>{categoryDetail.label}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(task.date).toLocaleDateString('ar-EG', { dateStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityDetail.cls}`}>
                    {priorityDetail.label}
                  </span>

                  {/* Print as PDF Report button */}
                  <button
                    onClick={() => onPrintTask(task)}
                    className="p-1 px-2 border border-blue-200 text-blue-600 rounded-lg text-xs font-black flex items-center gap-1 hover:bg-blue-50 cursor-pointer"
                    title="تصدير كتقرير PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>تقرير PDF</span>
                  </button>

                  {/* Copy Report text button */}
                  <button
                    onClick={() => onCopyTask(task)}
                    className="p-1 px-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-black flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                    title="نسخ تقرير النص"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </button>

                  {/* Remove option */}
                  <button
                    onClick={() => handleRemoveTask(task.id)}
                    className="text-slate-400 hover:text-rose-600 transition p-1 rounded-lg cursor-pointer"
                    title="إزالة المهمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="py-12 bg-white text-center rounded-2xl border border-slate-100 text-slate-400">
            <CheckSquare className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
            <p className="text-sm mt-2 italic font-bold">لا توجد مهام مدرجة في هذه الفئة حالياً.</p>
          </div>
        )}
      </div>



      {/* CREATE TASK MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 font-semibold text-right">
            <div className="absolute inset-0" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[24px] p-6 z-10 space-y-4 shadow-2xl"
              style={{ direction: 'rtl' }}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
              <h3 className="text-lg font-black text-slate-900 block">➕ إضافة مهمة جديدة للمساحة</h3>

              <div className="space-y-1.5 font-bold">
                <label className="text-xs text-slate-500 block">موضوع المهمة العملي</label>
                <input
                  type="text"
                  placeholder="مثال: مراجعة دكتور بيطري شندي، دفعة أعلاف..."
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block">الأولوية</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-bold cursor-pointer block"
                  >
                    <option value="high">🔴 عالية - عاجلة</option>
                    <option value="medium">🟡 متوسطة</option>
                    <option value="low">🟢 منخفضة</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block">القسم / النشاط</label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-bold cursor-pointer block"
                  >
                    <option value="brand">🏷️ العلامات التجارية</option>
                    <option value="farm">🌾 العمليات الزراعية</option>
                    <option value="creative">✨ كتابة إبداعية</option>
                    <option value="finance">💰 سجل مالي</option>
                    <option value="general">📌 عام ومسطحات أخرى</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-center font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!taskTitle.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold cursor-pointer disabled:opacity-50"
                >
                  حفظ وإدراج
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

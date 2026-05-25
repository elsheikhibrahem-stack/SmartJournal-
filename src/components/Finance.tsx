import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FinancialEntry } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  PieChart,
  Tag,
  FileText,
  Send
} from 'lucide-react';

interface FinanceProps {
  finance: FinancialEntry[];
  setFinance: React.Dispatch<React.SetStateAction<FinancialEntry[]>>;
  onPrintFinanceReport: () => void;
  onCopyFinanceReport: () => void;
}

const CATEGORIES_AR = {
  operating: 'تكاليف تشغيلية (علف، وقود، صيانة)',
  capital: 'نفقات رأسمالية (أصول، معدات ري مواسير)',
  personal: 'مصروفات شخصية',
  sales: 'إيرادات مبيعات (مبيعات محاصيل، عوائد)',
  service: 'إيرادات خدمات تسويقية وغيرها',
  other: 'أخرى متنوعة'
};

const CATEGORIES_COLORS = {
  operating: 'from-amber-500 to-amber-600',
  capital: 'from-blue-500 to-blue-600',
  personal: 'from-rose-500 to-rose-600',
  sales: 'from-emerald-500 to-emerald-600',
  service: 'from-indigo-500 to-indigo-600',
  other: 'from-slate-500 to-slate-600'
};

export default function Finance({ finance, setFinance, onPrintFinanceReport, onCopyFinanceReport }: FinanceProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Form states
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryCategory, setEntryCategory] = useState<keyof typeof CATEGORIES_AR>('operating');

  const handleCreateEntry = () => {
    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0 || !entryDesc.trim()) return;

    const newEntry: FinancialEntry = {
      id: Math.random().toString(36).slice(2, 9),
      amount: amt,
      type: entryType,
      description: entryDesc,
      category: entryCategory,
      date: new Date().toISOString()
    };

    setFinance(prev => [newEntry, ...prev]);

    // Reset Form
    setEntryAmount('');
    setEntryDesc('');
    setEntryType('expense');
    setEntryCategory('operating');
    setModalOpen(false);
  };

  const handleRemoveEntry = (id: string) => {
    setFinance(prev => prev.filter(f => f.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', { style: 'currency', currency: 'SDG', maximumFractionDigits: 0 })
      .format(amount)
      .replace('SDG', 'ج.س');
  };

  // Math
  const totalIncome = finance
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpense = finance
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Expense categories breakdown
  const expenseBreakdown = finance
    .filter(f => f.type === 'expense')
    .reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + f.amount;
      return acc;
    }, {} as Record<string, number>);

  const filteredEntries = finance.filter(f => {
    if (activeFilter === 'income') return f.type === 'income';
    if (activeFilter === 'expense') return f.type === 'expense';
    return true; // all
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            💰 السجل المالي المبسط
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            سجّل مصروفاتك التشغيلية للمشاريع الزراعية وإيرادات العلامات التجارية لدقة متطورة
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Print PDF */}
          <button
            onClick={onPrintFinanceReport}
            className="border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-black shadow-xs-soft"
            title="تصدير كشف حساب PDF"
          >
            <FileText className="w-4 h-4" />
            <span>كشف حساب PDF</span>
          </button>

          {/* Copy report */}
          <button
            onClick={onCopyFinanceReport}
            className="border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-black"
            title="نسخ كشف الحساب كتقرير للنص"
          >
            <Send className="w-4 h-4" />
            <span>نسخ الكشف</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm text-xs font-black"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>تسجيل حركة نقدية</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">📈 إجمالي الإيرادات</span>
            <div className="text-xl font-extrabold text-emerald-600">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">📉 إجمالي النفقات والمصروفات</span>
            <div className="text-xl font-extrabold text-rose-600">
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">📊 صافي العوائد النقدية</span>
            <div className={`text-xl font-extrabold ${netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatCurrency(netBalance)}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expense Allocation visual bars */}
      {totalExpense > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50">
            <PieChart className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">توزيع المصروفات وهياكل النفقات</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(expenseBreakdown).map(([category, amount]) => {
              const percent = Math.round((amount / totalExpense) * 100);
              const colorCls = CATEGORIES_COLORS[category as keyof typeof CATEGORIES_COLORS] || 'from-slate-500 to-slate-600';
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>{CATEGORIES_AR[category as keyof typeof CATEGORIES_AR] || category}</span>
                    <span className="font-mono">{formatCurrency(amount)} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${colorCls}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Tabs Row */}
      <div className="flex gap-2 border-b border-slate-100 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          📂 الكل ({finance.length})
        </button>
        <button
          onClick={() => setActiveFilter('income')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-emerald-700 bg-emerald-50 border border-emerald-100 ${
            activeFilter === 'income' ? 'ring-2 ring-emerald-500/10' : ''
          }`}
        >
          📈 المقبوضات والإيرادات
        </button>
        <button
          onClick={() => setActiveFilter('expense')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-rose-700 bg-rose-50 border border-rose-100 ${
            activeFilter === 'expense' ? 'ring-2 ring-rose-500/10' : ''
          }`}
        >
          📉 السحوبات والمصروفات
        </button>
      </div>

      {/* Data items table/list */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filteredEntries.map(entry => (
            <motion.div
              layout
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between gap-4 hover:border-slate-200 transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                  entry.type === 'income'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-500'
                }`}>
                  {entry.type === 'income' ? '+' : '-'}
                </div>

                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">
                    {entry.description}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-0.5">
                      <Tag className="w-3 h-3 text-slate-300" />
                      <span>{CATEGORIES_AR[entry.category] || entry.category}</span>
                    </span>
                    <span>•</span>
                    <span className="font-mono">{new Date(entry.date).toLocaleDateString('ar-EG', { dateStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-extrabold font-mono ${entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                </span>
                <button
                  onClick={() => handleRemoveEntry(entry.id)}
                  className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                  title="مسح القيد"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="py-12 bg-white text-center rounded-2xl border border-slate-100 text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm mt-3 italic">لا توجد عمليات مسجلة في هذا الفلتر حالياً.</p>
          </div>
        )}
      </div>

      {/* Create Financial action modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="absolute inset-0" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[24px] p-6 z-10 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">💵 تسجيل حركة نقدية</h3>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-bold block">نوع المعاملة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setEntryType('expense'); setEntryCategory('operating'); }}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                      entryType === 'expense'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/10'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    📉 مصروف / مخرج نقدي
                  </button>
                  <button
                    onClick={() => { setEntryType('income'); setEntryCategory('sales'); }}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                      entryType === 'income'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/10'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    📈 إيراد / مدخل نقدي
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block">المبلغ (ج.س)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={entryAmount}
                    onChange={e => setEntryAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-extrabold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold block">التصنيف الوظيفي</label>
                  <select
                    value={entryCategory}
                    onChange={e => setEntryCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold cursor-pointer block"
                  >
                    {entryType === 'expense' ? (
                      <>
                        <option value="operating">أجور وتكاليف تشغيل عمالة وأعلاف</option>
                        <option value="capital">أصول وتحديثات رأسمالية ري وأجهزة</option>
                        <option value="personal">مصروفات واحتياجات شخصية</option>
                        <option value="other">مصاريف أخرى</option>
                      </>
                    ) : (
                      <>
                        <option value="sales">عوائد مبيعات محاصيل أو ثروة حيوانية</option>
                        <option value="service">إيرادات خدمات Aylafunco / Abri Cola</option>
                        <option value="other">إيرادات وأنشطة أخرى</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold block">بيان الحركة (وصف مقتضب)</label>
                <input
                  type="text"
                  placeholder="مثال: شراء أعلاف تسمين عجول من تاجر شندي..."
                  value={entryDesc}
                  onChange={e => setEntryDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 btn btn-outline rounded-xl py-2.5 border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer text-center"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateEntry}
                  disabled={!entryAmount || !entryDesc.trim()}
                  className="flex-1 btn btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold cursor-pointer disabled:opacity-50 text-center"
                >
                  تسجيل المعاملة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

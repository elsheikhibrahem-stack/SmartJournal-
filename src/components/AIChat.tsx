import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Task, FinancialEntry, ChatMessage } from '../types';
import {
  Sparkles,
  Send,
  Loader2,
  ChevronLeft,
  Volume2,
  Bookmark
} from 'lucide-react';

interface AIChatProps {
  notes: Note[];
  tasks: Task[];
  finance: FinancialEntry[];
}

const CONVERSATION_SUGGESTIONS = [
  'ما هي آخر تطورات مشروع شندي الري المحوري؟',
  'لخص لي التكاليف المالية التشغيلية في المزرعة',
  'ما هي حالة مهام التسويق لبراند Abri Cola؟',
  'اقترح حبكة درامية لقصة قصيرة حول الانتماء'
];

export default function AIChat({ notes, tasks, finance }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'مرحباً بك! 👋\n\nأنا مساعدك الشخصي الذكي المدعوم بنموذج **Google Gemini 3.5-flash**.\n\nلقد قمت بقراءة وتكثيف قاعدة بيانات يوميتك بالكامل. يمكنني الآن الإجابة على استفساراتك المعقدة، مثل تلخيص النفقات أو تقييم وضع المزرعة والمهام.\n\nاصنع سؤالاً أو اضغط على أحد الاقتراحات الجاهزة أدناه البدء في الحوار!',
      date: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    const queryText = textToSend.trim();
    if (!queryText || loading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2, 9),
      sender: 'user',
      text: queryText,
      date: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Serialize database context to send as helper history to Gemini
      const databaseContext = {
        notes: notes.map(n => ({ title: n.title, body: n.body, category: n.category, date: n.date })),
        tasks: tasks.map(t => ({ title: t.title, priority: t.priority, done: t.done, category: t.category })),
        finance: finance.map(f => ({ description: f.description, amount: f.amount, type: f.type, category: f.category }))
      };

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          history: databaseContext
        })
      });

      const data = await response.json();

      let aiResponseText = '⚠️ عذراً، لم نتمكن من الاتصال بـ Gemini بنجاح.';
      if (data.answer) {
        aiResponseText = data.answer;
      } else if (data.error) {
        aiResponseText = `⚠️ حدث خطأ في النظام: ${data.error}`;
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2, 9),
        sender: 'ai',
        text: aiResponseText,
        date: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2, 9),
        sender: 'ai',
        text: '❌ فشل الاتصال بخادم دفتر اليومية. يرجى التأكد من تشغيل البيئة بالشكل السليم.',
        date: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
      {/* Title bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">المساعد الذكي (Gemini Copilot)</h3>
            <p className="text-[10px] text-amber-300 font-bold">متصل ومستعد للأسئلة المعقدة</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-right">
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isUser ? 'justify-start mr-10' : 'justify-end ml-10'}`}
              >
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap font-semibold  ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none shadow-sm'
                  }`}
                  style={{ direction: 'rtl' }}
                >
                  {!isUser && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-600 font-extrabold tracking-wider uppercase mb-1.5 border-b border-slate-100 pb-1">
                      <Sparkles className="w-3.5 h-3.5" /> فحص الأنظمة بـ Gemini
                    </div>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-end ml-10">
            <div className="p-4 bg-white text-slate-800 border border-slate-200/60 rounded-2xl rounded-tl-none space-y-2 max-w-[85%] shadow-sm">
              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-extrabold tracking-wider uppercase border-b border-indigo-50 pb-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> معالجة استدلالية نشطة...
              </div>
              <div className="flex items-center gap-2.5 text-slate-500 font-semibold text-xs py-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>جاري قراءة البيانات وصياغة إجابة تحليلية دقيقة...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Row */}
      {messages.length === 1 && !loading && (
        <div className="px-4 py-2 bg-slate-100/40 border-t border-slate-200/50 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {CONVERSATION_SUGGESTIONS.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sugg)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-pointer transition"
            >
              {sugg}
            </button>
          ))}
        </div>
      )}

      {/* Input controls */}
      <div className="p-3 bg-white border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="مثال: لخص نفقات الأسبوع الماضي، أو ما تطور شندي؟..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            className="w-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-md transition cursor-pointer"
          >
            <Send className="w-5 h-5 text-white transform rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}

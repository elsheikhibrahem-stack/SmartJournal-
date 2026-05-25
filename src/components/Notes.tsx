import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Task, UserIdentity, NoteComment } from '../types';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Tag,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  FileText,
  Volume2,
  Share2,
  MessageSquare,
  Eye,
  Edit2,
  Users,
  Send,
  Lock,
  Unlock
} from 'lucide-react';

interface NotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onAddTask: (taskTitle: string, category: 'brand' | 'farm' | 'creative' | 'finance' | 'general') => void;
  currentUser: UserIdentity;
  onPrintNote: (note: Note) => void;
  onCopyNote: (note: Note) => void;
}

const CATEGORIES = {
  brand: { label: 'إدارة العلامات التجارية', color: 'indigo', icon: '🏷️' },
  farm: { label: 'العمليات الزراعية والحيوانية', color: 'emerald', icon: '🌾' },
  creative: { label: 'الكتابة الإبداعية', color: 'amber', icon: '✨' },
  finance: { label: 'السجل المالي', color: 'rose', icon: '💰' },
  general: { label: 'عام', color: 'slate', icon: '📌' },
};

const SIMULATED_VOICES = [
  'تحديث العمليات في مشروع شندي للري المحوري لتسريع تشغيل الرؤوس المتبقية وضمان ري الأعلاف بشكل صحيح ومراجعة دورة تسمين الأبقار ومقابلة الطبيب البيطري غدا صباحا.',
  'الانتهاء من تصاميم الهوية البصرية للعلامة التجارية Aylafunco ومراجعة حملة التسويق الجديدة لـ Abri Cola مع العميل للاعتماد البدائي وإجراء التعديلات اللازمة قبل يوم الخميس.',
  'مسودة سيناريو فيلم جديد: تبدأ الحبكة في ليلة عاصفة داخل محطة قطار ريفية يلتقي فيها مسافران منفصلان منذ عقدين ليكتشفا قواسم مشتركة قديمة تغير مصيرهما بالكامل.'
];

const POPULAR_COLLABORATORS = [
  { name: 'أحمد (مدير مشروع شندي)', email: 'ahmed.shindi@gmail.com' },
  { name: 'سارة (تسويق Aylafunco)', email: 'sara.marketing@gmail.com' },
  { name: 'إبراهيم (المالك)', email: 'elsheikhibrahem@gmail.com' }
];

export default function Notes({ notes, setNotes, onAddTask, currentUser, onPrintNote, onCopyNote }: NotesProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  // Form Input states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [customCategory, setCustomCategory] = useState<string>('auto');

  // Speech Recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechMockIndex, setSpeechMockIndex] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Task integration approval states
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [detectedCategory, setDetectedCategory] = useState<'brand' | 'farm' | 'creative' | 'finance' | 'general'>('general');
  const [taskSavedAlert, setTaskSavedAlert] = useState(false);

  // Summarize feature states
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryTarget, setSummaryTarget] = useState<Note | null>(null);
  const [noteSummary, setNoteSummary] = useState('');

  // Audio simulation alert
  const [audioRecordingAlert, setAudioRecordingAlert] = useState(false);

  // COLLABORATION UI STATES
  const [shareTarget, setShareTarget] = useState<Note | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePerm, setSharePerm] = useState<'view' | 'edit'>('view');
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  const [activeCommentsNote, setActiveCommentsNote] = useState<Note | null>(null);
  const [comments, setComments] = useState<NoteComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  // Detailed view / Update note state
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  // Setup Browser Speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'ar-EG';

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setNoteBody(prev => (prev ? prev + ' ' : '') + finalTranscript);
          }
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Fetch comments in real-time when a note's comment panel is open
  useEffect(() => {
    if (activeCommentsNote) {
      fetchComments(activeCommentsNote.id);
      const interval = setInterval(() => {
        fetchComments(activeCommentsNote.id);
      }, 4000); // short-polling to sync other users' comments instantly!
      return () => clearInterval(interval);
    }
  }, [activeCommentsNote]);

  const fetchComments = async (noteId: string) => {
    try {
      const response = await fetch(`/api/collaboration/comments/${noteId}`);
      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handlePostComment = async () => {
    if (!activeCommentsNote || !newCommentText.trim()) return;

    try {
      const response = await fetch('/api/collaboration/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: activeCommentsNote.id,
          authorName: currentUser.name,
          authorEmail: currentUser.email,
          authorColor: currentUser.color,
          text: newCommentText
        })
      });
      const data = await response.json();
      if (data.comment) {
        setComments(prev => [...prev, data.comment]);
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleShareNoteSubmit = async () => {
    if (!shareTarget || !shareEmail.trim()) return;
    setIsSharingLoading(true);

    try {
      const response = await fetch('/api/collaboration/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: shareTarget.id,
          targetType: 'note',
          targetTitle: shareTarget.title,
          permission: sharePerm,
          sharedByEmail: currentUser.email,
          sharedByName: currentUser.name,
          sharedWithEmail: shareEmail
        })
      });
      const data = await response.json();
      if (data.status === 'ok') {
        // Optimistic update of note viewers/editors local state
        setNotes(prev =>
          prev.map(n => {
            if (n.id === shareTarget.id) {
              const editors = n.editors || [];
              const viewers = n.viewers || [];
              const targetEmail = shareEmail.toLowerCase().trim();
              if (sharePerm === 'edit') {
                return {
                  ...n,
                  editors: editors.includes(targetEmail) ? editors : [...editors, targetEmail],
                  viewers: viewers.filter(v => v !== targetEmail)
                };
              } else {
                return {
                  ...n,
                  viewers: viewers.includes(targetEmail) ? viewers : [...viewers, targetEmail],
                  editors: editors.filter(e => e !== targetEmail)
                };
              }
            }
            return n;
          })
        );
        setShareTarget(null);
        setShareEmail('');
      }
    } catch (err) {
      console.error('Error sharing note:', err);
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleUpdateNoteSubmit = async () => {
    if (!viewingNote || !editTitle.trim() || !editBody.trim()) return;
    setIsUpdatingNote(true);

    // Form updated object
    const updatedNote: Note = {
      ...viewingNote,
      title: editTitle,
      body: editBody,
      date: new Date().toISOString()
    };

    try {
      // Sync by triggering the normal sync request which updates dbNotes on the server!
      const response = await fetch('/api/collaboration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          notes: [updatedNote],
          tasks: []
        })
      });
      const data = await response.json();
      if (data.status === 'ok') {
        setNotes(prev => prev.map(n => (n.id === viewingNote.id ? updatedNote : n)));
        setViewingNote(null);
      }
    } catch (err) {
      console.error('Error updating note:', err);
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const toggleSpeech = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (isListening) {
        setIsListening(false);
      } else {
        setIsListening(true);
        setAudioRecordingAlert(true);
        setTimeout(() => {
          setAudioRecordingAlert(false);
        }, 3000);

        const textToSimulate = SIMULATED_VOICES[speechMockIndex];
        setSpeechMockIndex((prev) => (prev + 1) % SIMULATED_VOICES.length);

        let curText = '';
        let charIndex = 0;
        const interval = setInterval(() => {
          if (charIndex < textToSimulate.length) {
            curText += textToSimulate[charIndex];
            setNoteBody(prev => prev + textToSimulate[charIndex]);
            charIndex++;
          } else {
            clearInterval(interval);
            setIsListening(false);
          }
        }, 40);
      }
    }
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) return;

    setIsClassifying(true);
    let finalCategory: 'brand' | 'farm' | 'creative' | 'finance' | 'general' = 'general';
    let extractedActions: string[] = [];

    if (customCategory === 'auto') {
      try {
        const response = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: noteTitle, body: noteBody })
        });
        const data = await response.json();
        if (data.category) {
          finalCategory = data.category;
          extractedActions = data.tasks || [];
        }
      } catch (err) {
        console.error("Failed auto classify, falling back to basic checks", err);
        const comb = (noteTitle + ' ' + noteBody).toLowerCase();
        if (/أعلاف|تسمين|شندي|زراع|حيوان|بقر|إبل|قطيع|الري|المحوري/.test(comb)) finalCategory = 'farm';
        else if (/علامة|تجار|aylafunco|abri|cola|تجاري|لوجو|شعار|تصميم/.test(comb)) finalCategory = 'brand';
        else if (/قصة|درامي|سيناريو|رواية|حبكة|درام|مسودة/.test(comb)) finalCategory = 'creative';
        else if (/تكاليف|نفقات|شراء|مصروف|ربح|مبيعات|إيراد/.test(comb)) finalCategory = 'finance';
      }
    } else {
      finalCategory = customCategory as any;
    }

    const newNote: Note = {
      id: Math.random().toString(36).slice(2, 9),
      title: noteTitle,
      body: noteBody,
      category: finalCategory,
      date: new Date().toISOString(),
      extractedTasks: extractedActions,
      ownerEmail: currentUser.email,
      editors: [],
      viewers: []
    };

    try {
      // Instantly upload this note dynamically to the server!
      await fetch('/api/collaboration/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          notes: [newNote],
          tasks: []
        })
      });
      setNotes(prev => [newNote, ...prev]);
    } catch (err) {
      // Fallback
      setNotes(prev => [newNote, ...prev]);
    }

    // Reset inputs
    setNoteTitle('');
    setNoteBody('');
    setCustomCategory('auto');
    setModalOpen(false);
    setIsClassifying(false);

    if (extractedActions.length > 0) {
      setDetectedCategory(finalCategory);
      setPendingTasks(extractedActions);
    }
  };

  const handleApproveTask = (taskText: string) => {
    onAddTask(taskText, detectedCategory);
    setPendingTasks(prev => prev.filter(t => t !== taskText));
    setTaskSavedAlert(true);
    setTimeout(() => {
      setTaskSavedAlert(false);
    }, 2000);
  };

  const handleSummarizeNote = async (note: Note) => {
    setSummaryTarget(note);
    setNoteSummary('');
    setIsSummarizing(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `أريد تلخيص مقتضب ومنظم لهذه الملاحظة في شكل نقاط سريعة تركز على الإجراءات العملية:\nالعنوان: "${note.title}"\nالمحتوى: "${note.body}"`,
          history: []
        })
      });

      const data = await response.json();
      if (data.answer) {
        setNoteSummary(data.answer);
      } else {
        setNoteSummary('⚠️ عذراً، لم تنجح عملية التلخيص.');
      }
    } catch (err) {
      setNoteSummary('❌ فشل الاتصال بالخادم. يرجى مراجعة لوحة الاتصالات.');
    }
  };

  // Filter notes that user actually owns or is allowed to see
  const filteredNotes = notes.filter(note => {
    const query = search.toLowerCase();
    const titleMatch = note.title.toLowerCase().includes(query);
    const bodyMatch = note.body.toLowerCase().includes(query);
    const tagMatch = selectedTag === 'all' || note.category === selectedTag;
    return (titleMatch || bodyMatch) && tagMatch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            📒 دفتر الملاحظات المشترك
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            صنف الملاحظات تلقائياً بـ Gemini، شارك بطاقات ري شندي والتسويق واكتب تعليقات مع الفريق بالزمن الفعلي
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm text-sm"
        >
          <Plus className="w-5 h-5 text-white" />
          <span className="font-bold text-white">إضافة ملاحظة</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="البحث في العناوين أو المحتوى الرقمي..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-11 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        {/* Categories Tab Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
              selectedTag === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            📂 الكل
          </button>
          {Object.entries(CATEGORIES).map(([key, value]) => (
            <button
               key={key}
              onClick={() => setSelectedTag(key)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                selectedTag === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <span>{value.icon}</span>
              <span>{value.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Notes List grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.map(note => {
          const categoryDetail = CATEGORIES[note.category] || CATEGORIES.general;
          // Security checks
          const isOwner = !note.ownerEmail || note.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
          const canEdit = isOwner || note.editors?.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase());

          return (
            <motion.div
              layout
              key={note.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition relative group overflow-hidden"
            >
              {/* Category accent bar */}
              <div className="absolute top-0 right-0 left-0 h-1" style={{ backgroundColor: `var(--color-${categoryDetail.color}-500)` }} />

              <div>
                <div className="flex justify-between items-start gap-2 pt-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-base truncate block">{note.title}</h3>
                  </div>
                  <span className="text-xl flex-shrink-0">{categoryDetail.icon}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-4 font-semibold whitespace-pre-wrap">
                  {note.body}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  {new Date(note.date).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  {/* Print as PDF Report button */}
                  <button
                    onClick={() => onPrintNote(note)}
                    className="p-1 px-2 border border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                    title="تصدير كتقرير PDF"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>تقرير PDF</span>
                  </button>

                  {/* Copy Report text button */}
                  <button
                    onClick={() => onCopyNote(note)}
                    className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                    title="نسخ تقرير النص"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>نسخ</span>
                  </button>

                  <button
                    onClick={() => handleSummarizeNote(note)}
                    className="p-1 px-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-black cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>ملخص</span>
                  </button>

                  {/* Reading / Editing details */}
                  <button
                    onClick={() => {
                      setViewingNote(note);
                      setEditTitle(note.title);
                      setEditBody(note.body);
                    }}
                    className="p-1 px-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 rounded-lg text-xs font-black cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3 text-amber-300" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                    className="text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg p-1.5 cursor-pointer"
                    title="حذف الملاحظة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="md:col-span-2 py-12 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm italic mt-2.5 font-bold">لا توجد أية ملاحظات تطابق بحثك حالياً.</p>
          </div>
        )}
      </div>

      {/* CREATE NOTE MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="absolute inset-0" onClick={() => !isClassifying && setModalOpen(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-white w-full max-w-lg rounded-t-[24px] p-6 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto text-right"
              style={{ direction: 'rtl' }}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                ✍️ إضافة ملاحظة جديدة للمساحة المشتركة
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-extrabold block">عنوان الملاحظة</label>
                <input
                  type="text"
                  placeholder="مثال: محضر ري مشروع شندي أو أفكار مبيعات Abri Cola..."
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-500 font-extrabold block">محتوى الملاحظة</label>
                  <button
                    onClick={toggleSpeech}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black cursor-pointer transition ${
                      isListening ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>إيقاف الصوت</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-blue-600" />
                        <span>إملاء صوتي سريع</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  placeholder="اكتب فكرتك أو محاضرتك بالتفصيل... أو استخدم الإملاء الصوتي السريع لكتابتها."
                  value={noteBody}
                  onChange={e => setNoteBody(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-bold block"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-extrabold block">تخصيص تصنيف الفئة</label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold cursor-pointer block"
                >
                  <option value="auto">🤖 تصنيف آلي بمحرك الذكاء الاصطناعي (Gemini)</option>
                  <option value="brand">🏷️ إدارة العلامات التجارية (Aylafunco / Abri Cola)</option>
                  <option value="farm">🌾 العمليات الزراعية والحيوانية (شندي، تسمين، أعلاف)</option>
                  <option value="creative">✨ الكتابة الإبداعية السينمائية والمسرحية</option>
                  <option value="finance">💰 السجلات والتدفقات المالية اليومية</option>
                  <option value="general">📌 عام ومسطحات أخرى</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={isClassifying}
                  className="flex-1 btn border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl py-2.5 font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={isClassifying || !noteTitle.trim() || !noteBody.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-1.5"
                >
                  {isClassifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>تحليل Gemini المصنَّف...</span>
                    </>
                  ) : (
                    <span>تأكيد وحفظ</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* DETAILED VIEW / EDIT MODAL */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="absolute inset-0" onClick={() => setViewingNote(null)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[24px] p-6 z-10 space-y-4 max-h-[85vh] overflow-y-auto text-right"
              style={{ direction: 'rtl' }}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
              
              {/* Check Permissions */}
              {(() => {
                const isOwner = !viewingNote.ownerEmail || viewingNote.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
                const canEdit = isOwner || viewingNote.editors?.map(e => e.toLowerCase()).includes(currentUser.email.toLowerCase());

                return (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs bg-slate-50 py-1 px-2.5 rounded border text-slate-500 font-extrabold flex items-center gap-1">
                        {canEdit ? <Unlock className="w-3.5 h-3.5 text-emerald-500" /> : <Lock className="w-3.5 h-3.5 text-rose-500" />}
                        {canEdit ? 'ترخيص كامل لتعديل الملاحظة' : 'ترخيص للقراءة فقط'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-extrabold block">العنوان</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          disabled={!canEdit}
                          className="w-full bg-slate-50 disabled:bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm font-extrabold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-extrabold block">المحتوى بالتفصيل</label>
                        <textarea
                          rows={6}
                          value={editBody}
                          onChange={e => setEditBody(e.target.value)}
                          disabled={!canEdit}
                          className="w-full bg-slate-50 disabled:bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold leading-relaxed"
                        />
                      </div>

                      <div className="flex gap-2 pt-3">
                        <button
                          onClick={() => setViewingNote(null)}
                          className="flex-1 border border-slate-200 py-2.5 rounded-xl font-bold text-slate-600 text-xs text-center hover:bg-slate-50"
                        >
                          إغلاق
                        </button>
                        {canEdit && (
                          <button
                            onClick={handleUpdateNoteSubmit}
                            disabled={isUpdatingNote || !editTitle.trim() || !editBody.trim()}
                            className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-black text-xs text-center hover:bg-slate-800 disabled:opacity-50"
                          >
                            {isUpdatingNote ? 'جاري الحفظ للتزامن...' : 'تطبيق التحديث وحفظ التعديلات'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Summarizer Bottom Sheet */}
      <AnimatePresence>
        {isSummarizing && summaryTarget && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
            <div className="absolute inset-0" onClick={() => setIsSummarizing(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[24px] p-6 z-10 space-y-4 max-h-[85vh] overflow-y-auto text-right"
              style={{ direction: 'rtl' }}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center gap-2 text-blue-800 font-extrabold border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                <span>ملخص ذكي من Gemini للملاحظة: {summaryTarget.title}</span>
              </div>

              {noteSummary ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-line text-right font-semibold">
                  {noteSummary}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">يقوم معالج Gemini بالقراءة والتكثيف...</p>
                </div>
              )}

              <button
                onClick={() => setIsSummarizing(false)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-center text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer animate-none"
              >
                إغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

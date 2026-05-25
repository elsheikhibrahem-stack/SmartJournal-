import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment.");
}

// ── PERSISTENCE ENGINE FOR MULTI-USER DATA ──
const NOTES_FILE = path.join(process.cwd(), '.journal-data-notes.json');
const TASKS_FILE = path.join(process.cwd(), '.journal-data-tasks.json');
const COMMENTS_FILE = path.join(process.cwd(), '.journal-data-comments.json');
const NOTIFICATIONS_FILE = path.join(process.cwd(), '.journal-data-notifications.json');
const SHARES_FILE = path.join(process.cwd(), '.journal-data-shares.json');

function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Local shared collections
let dbNotes = readJSON<any[]>(NOTES_FILE, []);
let dbTasks = readJSON<any[]>(TASKS_FILE, []);
let dbComments = readJSON<any[]>(COMMENTS_FILE, []);
let dbNotifications = readJSON<any[]>(NOTIFICATIONS_FILE, []);
let dbShares = readJSON<any[]>(SHARES_FILE, []);

// Seed records if empty
if (dbNotes.length === 0) {
  dbNotes = [
    {
      id: 'seed-n1',
      title: 'تطورات مشروع شندي للري المحوري والأعلاف',
      body: 'وصل مهندس التركيبات اليوم لتثبيت رؤوس الرش المتبقية في جهاز الري المحوري الثاني بمشروع شندي. كفاءة ضغط المياه ممتازة. كمية أعلاف التسمين المتبقية تكفي دورة التسمين الحالية لمدة 12 يوماً إضافياً. نحتاج الترتيب لتوريد الشحنة القادمة لتجنب أي توقف للقطيع.',
      category: 'farm',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      ownerEmail: 'elsheikhibrahem@gmail.com',
      editors: ['ahmed.shindi@gmail.com'],
      viewers: []
    },
    {
      id: 'seed-n2',
      title: 'تحديثات علامة Aylafunco وحملة Abri Cola',
      body: 'تم الانتهاء من مراجعة المسودة الأولى لتصاميم الهوية التجارية المحدثة لاستوديو Aylafunco. تم التعديل على توزيع الألوان والرسائل الإعلانية. أما بالنسبة لبراند Abri Cola، يجب الاستعداد لتسليم الشحنة الثالثة للوكيل الرئيسي يوم الخميس ومراجعة خطة التسويق للمكتب الإقليمي للاتفاق المالي النهائي.',
      category: 'brand',
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      ownerEmail: 'elsheikhibrahem@gmail.com',
      editors: [],
      viewers: ['sara.marketing@gmail.com']
    }
  ];
  writeJSON(NOTES_FILE, dbNotes);
}

if (dbTasks.length === 0) {
  dbTasks = [
    {
      id: 'seed-t1',
      title: 'زيارة الطبيب البيطري لمعاينة قطيع عجول التسمين',
      priority: 'high',
      done: false,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      category: 'farm',
      ownerEmail: 'elsheikhibrahem@gmail.com',
      editors: ['ahmed.shindi@gmail.com'],
      viewers: []
    },
    {
      id: 'seed-t2',
      title: 'تسليم الهوية البصرية المعتمدة لعميل Aylafunco',
      priority: 'high',
      done: false,
      date: new Date().toISOString(),
      category: 'brand',
      ownerEmail: 'elsheikhibrahem@gmail.com',
      editors: ['sara.marketing@gmail.com'],
      viewers: []
    }
  ];
  writeJSON(TASKS_FILE, dbTasks);
}

// ── WEBSOCKET REAL-TIME DISPATCHER ──
// Maps user email strings to active WebSockets
const clients = new Map<string, WebSocket>();

function broadcastToCollaborators(targetId: string, targetType: 'note' | 'task', eventType: string, payload: any) {
  let target: any = null;
  if (targetType === 'note') {
    target = dbNotes.find(n => n.id === targetId);
  } else {
    target = dbTasks.find(t => t.id === targetId);
  }

  if (!target) return;

  // People involved
  const recipientEmails = new Set<string>();
  if (target.ownerEmail) recipientEmails.add(target.ownerEmail);
  if (target.editors) target.editors.forEach((e: string) => recipientEmails.add(e));
  if (target.viewers) target.viewers.forEach((e: string) => recipientEmails.add(e));

  const messageStr = JSON.stringify({ type: eventType, payload });

  recipientEmails.forEach(email => {
    const ws = clients.get(email);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

function broadcastNotification(recipientEmail: string, notification: any) {
  const ws = clients.get(recipientEmail);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'notification:received', payload: notification }));
  }
}

// ── REST COLLABORATION ENDPOINTS ──

// Collaboration Sync Endpoint
app.post('/api/collaboration/sync', (req: Request, res: Response): void => {
  const { email, notes, tasks } = req.body;
  if (!email) {
    res.status(400).json({ error: 'User email is required' });
    return;
  }

  // 1. Sync or add incoming notes owned by this user
  let changed = false;
  if (Array.isArray(notes)) {
    notes.forEach((incomingNote: any) => {
      const idx = dbNotes.findIndex(n => n.id === incomingNote.id);
      const noteOwner = incomingNote.ownerEmail || email;
      if (idx > -1) {
        // Only update if incoming is owned or user has edit permission
        const existing = dbNotes[idx];
        const isOwner = existing.ownerEmail === email || !existing.ownerEmail;
        const isEditor = existing.editors?.includes(email);
        if (isOwner || isEditor) {
          dbNotes[idx] = {
            ...existing,
            ...incomingNote,
            ownerEmail: existing.ownerEmail || noteOwner,
            editors: existing.editors || incomingNote.editors || [],
            viewers: existing.viewers || incomingNote.viewers || []
          };
          changed = true;
        }
      } else {
        dbNotes.push({
          ...incomingNote,
          ownerEmail: noteOwner,
          editors: incomingNote.editors || [],
          viewers: incomingNote.viewers || []
        });
        changed = true;
      }
    });
  }

  // 2. Sync or add incoming tasks owned by this user
  if (Array.isArray(tasks)) {
    tasks.forEach((incomingTask: any) => {
      const idx = dbTasks.findIndex(t => t.id === incomingTask.id);
      const taskOwner = incomingTask.ownerEmail || email;
      if (idx > -1) {
        const existing = dbTasks[idx];
        const isOwner = existing.ownerEmail === email || !existing.ownerEmail;
        const isEditor = existing.editors?.includes(email);
        if (isOwner || isEditor) {
          dbTasks[idx] = {
            ...existing,
            ...incomingTask,
            ownerEmail: existing.ownerEmail || taskOwner,
            editors: existing.editors || incomingTask.editors || [],
            viewers: existing.viewers || incomingTask.viewers || []
          };
          changed = true;
        }
      } else {
        dbTasks.push({
          ...incomingTask,
          ownerEmail: taskOwner,
          editors: incomingTask.editors || [],
          viewers: incomingTask.viewers || []
        });
        changed = true;
      }
    });
  }

  if (changed) {
    writeJSON(NOTES_FILE, dbNotes);
    writeJSON(TASKS_FILE, dbTasks);
  }

  // Filter notes/tasks authorized for this user
  const userNotes = dbNotes.filter(n =>
    n.ownerEmail === email ||
    n.editors?.includes(email) ||
    n.viewers?.includes(email)
  );

  const userTasks = dbTasks.filter(t =>
    t.ownerEmail === email ||
    t.editors?.includes(email) ||
    t.viewers?.includes(email)
  );

  res.json({
    status: 'ok',
    notes: userNotes,
    tasks: userTasks
  });
});

// Securely Share Note or Task
app.post('/api/collaboration/share', (req: Request, res: Response): void => {
  const { targetId, targetType, targetTitle, permission, sharedByEmail, sharedByName, sharedWithEmail } = req.body;

  if (!targetId || !targetType || !permission || !sharedByEmail || !sharedWithEmail) {
    res.status(400).json({ error: 'Missing sharing parameters' });
    return;
  }

  const normalizedWithEmail = sharedWithEmail.trim().toLowerCase();

  // Find the resource
  if (targetType === 'note') {
    const note = dbNotes.find(n => n.id === targetId);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    // Set permission lists
    if (!note.editors) note.editors = [];
    if (!note.viewers) note.viewers = [];

    if (permission === 'edit') {
      if (!note.editors.includes(normalizedWithEmail)) note.editors.push(normalizedWithEmail);
      note.viewers = note.viewers.filter((e: string) => e !== normalizedWithEmail);
    } else {
      if (!note.viewers.includes(normalizedWithEmail)) note.viewers.push(normalizedWithEmail);
      note.editors = note.editors.filter((e: string) => e !== normalizedWithEmail);
    }
    writeJSON(NOTES_FILE, dbNotes);
  } else {
    const task = dbTasks.find(t => t.id === targetId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (!task.editors) task.editors = [];
    if (!task.viewers) task.viewers = [];

    if (permission === 'edit') {
      if (!task.editors.includes(normalizedWithEmail)) task.editors.push(normalizedWithEmail);
      task.viewers = task.viewers.filter((e: string) => e !== normalizedWithEmail);
    } else {
      if (!task.viewers.includes(normalizedWithEmail)) task.viewers.push(normalizedWithEmail);
      task.editors = task.editors.filter((e: string) => e !== normalizedWithEmail);
    }
    writeJSON(TASKS_FILE, dbTasks);
  }

  // Save historical Share Link
  const shareRecord = {
    id: Math.random().toString(36).slice(2, 9),
    targetId,
    targetType,
    targetTitle,
    permission,
    sharedByEmail,
    sharedByName,
    sharedWithEmail: normalizedWithEmail,
    date: new Date().toISOString()
  };
  dbShares.push(shareRecord);
  writeJSON(SHARES_FILE, dbShares);

  // Create Notification for recipient
  const permArabic = permission === 'edit' ? 'تعديل كامل ✍️' : 'عرض فقط 👁️';
  const typeArabic = targetType === 'note' ? 'الملاحظة' : 'المهمة';
  const notification = {
    id: Math.random().toString(36).slice(2, 9),
    title: '👥 تمت مشاركة عنصر جديد معك',
    body: `قام ${sharedByName} بمشاركة ${typeArabic} "${targetTitle}" معك بصلاحية (${permArabic}).`,
    date: new Date().toISOString(),
    read: false,
    targetId,
    targetType,
    recipientEmail: normalizedWithEmail
  };

  dbNotifications.push(notification);
  writeJSON(NOTIFICATIONS_FILE, dbNotifications);

  // Broadcast Notification & Resource Update over socket
  broadcastNotification(normalizedWithEmail, notification);
  broadcastToCollaborators(targetId, targetType, `${targetType}:updated`, { targetId });

  res.json({ status: 'ok', share: shareRecord });
});

// Fetch comments of a note
app.get('/api/collaboration/comments/:noteId', (req: Request, res: Response): void => {
  const { noteId } = req.params;
  const noteComments = dbComments.filter(c => c.noteId === noteId);
  res.json({ comments: noteComments });
});

// Add a comment to a note
app.post('/api/collaboration/comment', (req: Request, res: Response): void => {
  const { noteId, authorName, authorEmail, authorColor, text } = req.body;

  if (!noteId || !authorName || !authorEmail || !text) {
    res.status(400).json({ error: 'Missing comment parameters' });
    return;
  }

  const newComment = {
    id: Math.random().toString(36).slice(2, 9),
    noteId,
    authorName,
    authorEmail,
    authorColor: authorColor || 'indigo',
    text,
    date: new Date().toISOString()
  };

  dbComments.push(newComment);
  writeJSON(COMMENTS_FILE, dbComments);

  // Find note to notify other editors or owner
  const note = dbNotes.find(n => n.id === noteId);
  if (note) {
    const recipients = new Set<string>();
    if (note.ownerEmail) recipients.add(note.ownerEmail);
    if (note.editors) note.editors.forEach((e: string) => recipients.add(e));
    if (note.viewers) note.viewers.forEach((e: string) => recipients.add(e));

    // Don't send notification to author themselves
    recipients.delete(authorEmail);

    recipients.forEach(email => {
      const notification = {
        id: Math.random().toString(36).slice(2, 9),
        title: `💬 تعليق جديد على ملاحظة: ${note.title}`,
        body: `أضاف ${authorName}: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
        date: new Date().toISOString(),
        read: false,
        targetId: noteId,
        targetType: 'note',
        recipientEmail: email
      };
      dbNotifications.push(notification);
      broadcastNotification(email, notification);
    });
    writeJSON(NOTIFICATIONS_FILE, dbNotifications);
  }

  // Push realtime update to note chatters
  broadcastToCollaborators(noteId, 'note', 'comment:added', newComment);

  res.json({ status: 'ok', comment: newComment });
});

// Fetch Notifications
app.get('/api/collaboration/notifications/:email', (req: Request, res: Response): void => {
  const { email } = req.params;
  const userNotifications = dbNotifications.filter(n => n.recipientEmail.toLowerCase() === email.toLowerCase());
  res.json({ notifications: userNotifications });
});

// Clear/Read Notifications
app.post('/api/collaboration/notifications/read', (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  dbNotifications = dbNotifications.map(n =>
    n.recipientEmail.toLowerCase() === email.toLowerCase() ? { ...n, read: true } : n
  );
  writeJSON(NOTIFICATIONS_FILE, dbNotifications);
  res.json({ status: 'ok' });
});


// ── GEMINI STANDARD HANDLERS ──

// API: Classify note and extract actionable tasks
app.post('/api/ai/classify', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.json({
        category: 'general',
        tasks: [],
        warning: 'Gemini API status: Unconfigured'
      });
      return;
    }

    const { title, body } = req.body;
    if (!title && !body) {
      res.status(400).json({ error: 'Title or body is required' });
      return;
    }

    const prompt = `Analyze this note and classify its category and extract up to 3 actionable tasks.
Note Title: "${title || ''}"
Note Content: "${body || ''}"

Categories definitions:
- "brand": Brand management (updates of Aylafunco or Abri Cola, marketing, logo, clients etc.)
- "farm": Agricultural & animal operations (Shendi project "مشروع شندي", fattening cycles "دورات التسمين", feeds "الأعلاف", pivot irrigation "الري المحوري", cows, sheep, etc.)
- "creative": Creative writing (scripts "سيناريوهات", plots "حبكة درامية", movies, stories etc.)
- "finance": Cash flow, budget, expenses, revenue (if purely monetary).
- "general": Anything else.

Return a JSON object with this exact structure:
{
  "category": "brand" | "farm" | "creative" | "finance" | "general",
  "tasks": ["Action task 1", "Action task 2"]
}
Only write actionable, clear and concise tasks in Arabic. If no tasks found, return empty array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['category', 'tasks'],
          properties: {
            category: {
              type: Type.STRING,
              enum: ['brand', 'farm', 'creative', 'finance', 'general'],
              description: 'The classified category of the note content.'
            },
            tasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of actionable tasks extracted from the notes in Arabic.'
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText.trim());
      res.json(parsed);
    } else {
      res.json({ category: 'general', tasks: [] });
    }
  } catch (error: any) {
    console.error("AI Classify error:", error);
    res.status(500).json({ error: error.message || 'Error processing AI classification' });
  }
});

// API: Search & Query historical data
app.post('/api/ai/query', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.json({
        answer: 'مرحباً! نظام الذكاء الاصطناعي (Gemini) غير متاح حالياً لعدم تكوين مفتاح API. يرجى توفير GEMINI_API_KEY في الإعدادات.'
      });
      return;
    }

    const { query, history } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const systemInstruction = `You are "المساعد الذكي (Smart Journal AI Helper)" built for a business owner with activities in:
1. Brand Management (Aylafunco / Abri Cola).
2. Agriculture & Animal Farms (Shendi Project "مشروع شندي", pivot irrigation, cattle fattening, feeds).
3. Creative Writing (Writing scripts/scenarios, dramatic plots).
4. Financial calculations (operating cost, capital cost, personal spending).

Your job is to answer the user's question precisely using the provided history.
Always respond in elegant Arabic.
Make your answers clear, professional, and well-structured, formatted in simple Markdown (using bullets, numbers, and bold headers where appropriate).`;

    const prompt = `User Question: "${query}"

Here is the user's Smart Journal history database:
${JSON.stringify(history, null, 2)}

Provide a very professional, factual Arabic answer using the history logs.
If the history contains the answer, explain it detailedly (e.g. status of project, costs).
If the history does not contain information to answer, mention that politely and offer business recommendations related to the topic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    res.json({ answer: response.text || 'لم يتم استرجاع إجابة من Gemini.' });
  } catch (error: any) {
    console.error("AI Query error:", error);
    res.status(500).json({ error: error.message || 'Error processing AI query' });
  }
});

// API: Generate Weekly report / dashboard analysis
app.post('/api/ai/report', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ai) {
      res.json({
        report: 'مفتاح Gemini API غير متاح لإنشاء التقارير.'
      });
      return;
    }

    const { history } = req.body;

    const systemInstruction = `You are the Business Intelligence system of "دفتر اليومية الذكي (Smart Journal)".
Your job is to generate a comprehensive, visually rich, and professional Weekly Report (تقرير أسبوعي متكامل) based on their notes, tasks, and finances.
You must respond in Arabic only. Use beautiful structure, paragraphs, bullet points, and clean headers.`;

    const prompt = `Please generate an interactive, detailed business and productivity report for the user's activities based on the following journal history:
${JSON.stringify(history, null, 2)}

The report should include:
1. **الملخص التنفيذي (Executive Summary)**: A high-level view of major developments across brand management, Shendi agricultural project, and writing.
2. **الإنتاجية والمهام (Tasks & Productivity)**: Analysis of task completion rates (done vs pending, high priorities).
3. **التقرير المالي (Financial Report)**:
   - Total Income and Total Expenses.
   - Net Profit or Loss.
   - Breakdown of expenditures (Operating, Capital, Personal) with insights.
4. **أهم التوصيات (Key Recommendations)**: Actionable, smart suggestions to optimize expenses, accelerate Shendi project development, marketing for Aylafunco/Abri Cola, and keep the creative momentum high.

Use clean formatting in Arabic. Make the owner feel confident, informed, and in absolute control of their complex activities.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    res.json({ report: response.text || 'خطأ في إنشاء التقرير.' });
  } catch (error: any) {
    console.error("AI Report error:", error);
    res.status(500).json({ error: error.message || 'Error generating AI report' });
  }
});

// Vite middleware development setup
async function startServer() {
  const server = http.createServer(app);

  // Initialize WebSockets attached to host server
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const email = url.searchParams.get('email')?.trim().toLowerCase();

    if (email) {
      clients.set(email, ws);
      console.log(`🔌 Collaborative user connected: ${email}`);
    }

    ws.on('close', () => {
      if (email) {
        clients.delete(email);
        console.log(`🔌 User disconnected: ${email}`);
      }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

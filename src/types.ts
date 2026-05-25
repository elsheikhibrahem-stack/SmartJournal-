export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  category: 'brand' | 'farm' | 'creative' | 'finance' | 'general';
  date: string;
  extractedTasks?: string[];
  audioUrl?: string; // simulation placeholder
  ownerEmail?: string; // email of creator
  editors?: string[]; // emails of editors
  viewers?: string[]; // emails of viewers
}

export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
  date: string;
  category: 'brand' | 'farm' | 'creative' | 'finance' | 'general';
  ownerEmail?: string; // email of creator
  editors?: string[]; // users allowed to toggle or modify
  viewers?: string[]; // users allowed to view only
}

export interface ShareLink {
  id: string;
  targetId: string;
  targetType: 'note' | 'task';
  targetTitle: string;
  permission: 'view' | 'edit';
  sharedByEmail: string;
  sharedByName: string;
  sharedWithEmail: string;
  date: string;
}

export interface NoteComment {
  id: string;
  noteId: string;
  authorName: string;
  authorEmail: string;
  authorColor: string;
  text: string;
  date: string;
}

export interface JournalNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  targetId?: string;
  targetType?: 'note' | 'task';
  recipientEmail: string;
}

export interface FinancialEntry {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  category: 'operating' | 'capital' | 'personal' | 'sales' | 'service' | 'other';
  date: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  date: string;
}

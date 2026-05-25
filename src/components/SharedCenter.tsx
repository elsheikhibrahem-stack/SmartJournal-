import React from 'react';
import { motion } from 'motion/react';
import { UserIdentity } from '../types';
import {
  CloudUpload,
  CloudDownload,
  Database,
  Smartphone,
  LogOut,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface SharedCenterProps {
  currentUser: UserIdentity;
  notesCount: number;
  tasksCount: number;
  financeCount: number;
  // Google Auth props
  googleUser: any;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  isGoogleSyncLoading: boolean;
  lastDriveSync: string | null;
  onUploadToDrive: () => Promise<void>;
  onDownloadFromDrive: () => Promise<void>;
}

export default function SharedCenter({
  currentUser,
  notesCount,
  tasksCount,
  financeCount,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isGoogleSyncLoading,
  lastDriveSync,
  onUploadToDrive,
  onDownloadFromDrive
}: SharedCenterProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="collaboration-center">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Database className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm">مزامنة البيانات والنسخ الاحتياطي</h3>
            <p className="text-[10px] text-slate-300">مزامنة Google Drive وأمان التخزين المحلي للهاتف</p>
          </div>
        </div>

        {/* Current Identity View */}
        <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-right" style={{ direction: 'rtl' }}>
          <div>
            <span className="text-[10px] text-blue-300 font-bold block">المستخدم النشط حالياً:</span>
            <span className="text-xs font-black text-white block mt-0.5">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400 block">{currentUser.email}</span>
          </div>
          <div className={`w-3.5 h-3.5 rounded-full ${currentUser.color} ring-4 ring-slate-900 border border-white`} />
        </div>
      </div>

      <div className="p-4 space-y-4 text-right" style={{ direction: 'rtl' }}>
        {/* Phone local storage card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs mb-1.5 border-b border-slate-200/50 pb-1.5">
            <Smartphone className="w-4 h-4 text-slate-700" />
            <span>التخزين المحلي بالهاتف</span>
            <span className="mr-auto text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              مخزن محلياً بالهاتف
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mb-3">
            يتم حفظ وتحديث جميع قيودك ومذكراتك بشكل فوري في ذاكرة هاتفك الداخلية؛ ليعمل التطبيق بكفاءة وبسرعة فائقة حتى دون الاتصال بالإنترنت.
          </p>
          
          {/* Statistics of Phone storage */}
          <div className="grid grid-cols-3 gap-2 text-center" style={{ direction: 'rtl' }}>
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">مذكرات</span>
              <span className="font-extrabold text-sm text-indigo-700">{notesCount}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">مهام فعلية</span>
              <span className="font-extrabold text-sm text-emerald-700">{tasksCount}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">سجلات مالية</span>
              <span className="font-extrabold text-sm text-blue-700">{financeCount}</span>
            </div>
          </div>
        </div>

        {/* Google Drive setup card */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
            <CloudUpload className="w-4 h-4 text-blue-600" />
            <span>مزامنة سحابية عبر Google Drive</span>
          </div>

          {!googleUser ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                اربط بوابتك السحابية لتمكين المزامنة التلقائية والنسخ الاحتياطي عبر ملف سري آمن على حسابك الشخصي في غوغل درايف لتأمين ملفات دفتر اليومية.
              </p>
              
              <button
                onClick={onGoogleSignIn}
                disabled={isGoogleSyncLoading}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-slate-250 hover:bg-slate-50 py-2.5 px-3 rounded-xl transition shadow-xs text-xs font-black text-slate-700 cursor-pointer disabled:opacity-60"
              >
                {isGoogleSyncLoading ? (
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>تسجيل الدخول وربط Google Drive</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt="Google Avatar"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-blue-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {googleUser.displayName ? googleUser.displayName[0] : 'G'}
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-[11px] font-black text-slate-800 block leading-tight">{googleUser.displayName}</span>
                    <span className="text-[9px] font-semibold text-slate-500 block leading-tight mt-0.5">{googleUser.email}</span>
                  </div>
                </div>
                
                <button
                  onClick={onGoogleSignOut}
                  title="تسجيل الخروج"
                  className="p-1 px-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-450 transition flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  خروج
                </button>
              </div>

              {/* Sync actions block */}
              <div className="space-y-2">
                <button
                  onClick={onUploadToDrive}
                  disabled={isGoogleSyncLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer hover:shadow-md disabled:opacity-50"
                >
                  {isGoogleSyncLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <CloudUpload className="w-4 h-4 text-blue-100" />
                  )}
                  <span>حفظ نسخة احتياطية سحابية الآن</span>
                </button>

                <button
                  onClick={onDownloadFromDrive}
                  disabled={isGoogleSyncLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isGoogleSyncLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <CloudDownload className="w-4 h-4 text-slate-500" />
                  )}
                  <span>استرداد ودمج النسخة السحابية</span>
                </button>
              </div>

              {/* Footer last sync status */}
              <div className="text-[10px] text-slate-400 font-semibold text-center border-t border-slate-100 pt-2 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-350" />
                <span>آخر مزامنة للتخزين السحابي:</span>
                <span className="font-bold text-slate-600">{lastDriveSync || 'لم تتم المزامنة بعد'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 flex justify-between items-center">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            تشفير كامل للبيانات وتزامن معتمد
          </span>
          <span className="text-[9.5px] text-emerald-650 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">
            آمن 🔒
          </span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Trash2, Send, X, Users, AlertCircle, CheckCircle2, User as UserIcon
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  sender: 'Manager' | 'System';
}

const initialNotices: Notice[] = [
  { id: '1', title: 'আগামীকালের বাজার', content: 'আগামীকাল সকাল ৬ টায় বাজার করতে হবে। সবাই বাজারে যাওয়ার জন্য প্রস্তুত থাকবেন।', date: 'May 10, 2024 - 08:30 PM', isRead: false, sender: 'Manager' },
  { id: '2', title: 'নতুন মেম্বার যুক্ত হয়েছে', content: 'আমাদের মেসে নতুন মেম্বার "Zayed Khan" যুক্ত হয়েছে। সবাইকে স্বাগত জানানোর অনুরোধ করা হলো।', date: 'May 08, 2024 - 10:15 AM', isRead: true, sender: 'System' },
  { id: '3', title: 'বিদ্যুৎ বিল জমা', content: 'আগামী ১৫ তারিখের মধ্যে সবাইকে বিদ্যুৎ বিল জমা দেওয়ার জন্য অনুরোধ করা হলো।', date: 'May 05, 2024 - 09:00 AM', isRead: true, sender: 'Manager' }
];

const mockMembers = [
  { id: 'all', name: 'সবাইকে পাঠান (All Members)' },
  { id: '1', name: 'James Doe' },
  { id: '2', name: 'Rahim Uddin' },
  { id: '3', name: 'Karim Hasan' }
];

export default function NoticeView({ isManager }: { isManager: boolean }) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('all');

  const handleDelete = (id: string) => {
    setNotices(notices.filter(n => n.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    if (isManager) return; // Manager doesn't mark own sent notices as read in this simple demo
    setNotices(notices.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleSendNotice = () => {
    if (!noticeTitle || !noticeContent) return;
    const newNotice: Notice = {
      id: Math.random().toString(),
      title: noticeTitle,
      content: noticeContent,
      date: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      sender: 'Manager'
    };
    setNotices([newNotice, ...notices]);
    setIsModalOpen(false);
    setNoticeTitle('');
    setNoticeContent('');
  };

  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">নোটিশ বোর্ড</h1>
            <p className="text-sm font-semibold text-slate-500">মেসের সকল আপডেট ও রিমাইন্ডার</p>
          </div>
        </div>
        
        {isManager && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex px-6 py-3 bg-[#1e1b4b] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#1e1b4b]/20 hover:bg-[#312e81] transition-all items-center gap-2"
          >
            <Plus className="w-5 h-5" /> ক্রিয়েট নোটিশ
          </button>
        )}
      </div>

      {/* Notices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {notices.map((notice) => (
            <motion.div 
              key={notice.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => handleMarkAsRead(notice.id)}
              className={`relative overflow-hidden bg-white/80 backdrop-blur-md shadow-xl rounded-[2rem] p-6 border transition-all ${!notice.isRead && !isManager ? 'border-rose-300 shadow-rose-100 cursor-pointer' : 'border-slate-100'}`}
            >
              {!notice.isRead && !isManager && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full flex items-start justify-end p-3">
                  <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notice.sender === 'System' ? 'bg-indigo-50 text-indigo-500' : 'bg-rose-50 text-rose-500'}`}>
                  {notice.sender === 'System' ? <AlertCircle className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">{notice.sender === 'System' ? 'সিস্টেম জেনারেটেড' : 'ম্যানেজার'}</p>
                  <p className="text-[10px] font-bold text-slate-400">{notice.date}</p>
                </div>
              </div>

              <h3 className={`text-lg font-black mb-2 ${!notice.isRead && !isManager ? 'text-rose-600' : 'text-slate-800'}`}>{notice.title}</h3>
              <p className="text-sm font-semibold text-slate-600 leading-relaxed mb-6">{notice.content}</p>

              {/* Action Buttons */}
              <div className="flex justify-end border-t border-slate-100 pt-4">
                {(isManager || notice.isRead) ? (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : (
                  <span className="text-xs font-bold text-rose-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> পড়ার জন্য ক্লিক করুন</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {notices.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <Bell className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold">কোনো নোটিশ নেই</h3>
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      {isManager && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#1e1b4b] text-white rounded-full shadow-[0_10px_30px_rgba(30,27,75,0.4)] flex items-center justify-center z-40 hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* CREATE NOTICE MODAL */}
      <AnimatePresence>
        {isModalOpen && isManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className="bg-[#1e1b4b] p-6 flex justify-between items-center text-white shrink-0">
                <h2 className="text-xl font-black">নতুন নোটিশ তৈরি করুন</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">নোটিশের শিরোনাম</label>
                  <input type="text" placeholder="যেমন: আগামীকালের বাজার..." value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30" />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">বিস্তারিত বিবরণ</label>
                  <textarea rows={4} placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন..." value={noticeContent} onChange={e => setNoticeContent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">কাকে পাঠাবেন?</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none">
                      {mockMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-100 p-6 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors">বাতিল</button>
                <button 
                  disabled={!noticeTitle || !noticeContent}
                  onClick={handleSendNotice} 
                  className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors hover:bg-rose-600"
                >
                  <Send className="w-5 h-5" /> সেন্ড করুন
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

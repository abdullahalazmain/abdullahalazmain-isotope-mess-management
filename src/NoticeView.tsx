import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Trash2, Send, X, Users, AlertCircle, CheckCircle2, User as UserIcon,
  Megaphone, Clock, Eye, EyeOff
} from 'lucide-react';
import { db, collection, query, where, onSnapshot, doc, addDoc, deleteDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from './firebase';

interface Notice {
  id: string;
  title: string;
  description: string;
  createdAt: any;
  isUrgent: boolean;
  recipients: string[] | 'all';
  creatorUid: string;
  readBy: string[];
  hiddenBy: string[];
}

export default function NoticeView({ isManager, messId, userId }: { isManager: boolean, messId?: string, userId?: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDescription, setNoticeDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['all']);

  useEffect(() => {
    if (!messId) return;

    // 1. Listen to Members
    const membersQuery = query(collection(db, 'users'), where('messId', '==', messId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(membersList);
    });

    // 2. Listen to Notices
    const noticesQuery = query(collection(db, 'notices'), where('messId', '==', messId));
    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      const noticesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notice[];
      
      // Sort by date (desc)
      noticesList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      // Filter for members
      if (!isManager && userId) {
        setNotices(noticesList.filter(n => 
          !n.hiddenBy?.includes(userId) && 
          (n.recipients === 'all' || (Array.isArray(n.recipients) && n.recipients.includes(userId)))
        ));
      } else {
        setNotices(noticesList);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeNotices();
    };
  }, [messId, isManager, userId]);

  const handleDelete = async (id: string) => {
    if (isManager) {
      // Manager deletes for everyone
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (error) {
        console.error("Error deleting notice:", error);
      }
    } else if (userId) {
      // Member hides for themselves
      try {
        await updateDoc(doc(db, 'notices', id), {
          hiddenBy: arrayUnion(userId)
        });
      } catch (error) {
        console.error("Error hiding notice:", error);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (isManager || !userId) return;
    try {
      await updateDoc(doc(db, 'notices', id), {
        readBy: arrayUnion(userId)
      });
    } catch (error) {
      console.error("Error marking notice as read:", error);
    }
  };

  const handleSendNotice = async () => {
    if (!noticeTitle || !noticeDescription || !messId || !userId) return;
    
    try {
      await addDoc(collection(db, 'notices'), {
        messId,
        title: noticeTitle,
        description: noticeDescription,
        isUrgent,
        recipients: selectedRecipients.includes('all') ? 'all' : selectedRecipients,
        creatorUid: userId,
        createdAt: serverTimestamp(),
        readBy: [],
        hiddenBy: []
      });
      
      setIsModalOpen(false);
      setNoticeTitle('');
      setNoticeDescription('');
      setIsUrgent(false);
      setSelectedRecipients(['all']);
    } catch (error) {
      console.error("Error sending notice:", error);
    }
  };

  const toggleRecipient = (id: string) => {
    if (id === 'all') {
      setSelectedRecipients(['all']);
    } else {
      let next = selectedRecipients.filter(r => r !== 'all');
      if (next.includes(id)) {
        next = next.filter(r => r !== id);
      } else {
        next.push(id);
      }
      if (next.length === 0) next = ['all'];
      setSelectedRecipients(next);
    }
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
        <AnimatePresence mode="popLayout">
          {notices.map((notice) => {
            const isRead = userId ? notice.readBy?.includes(userId) : false;
            const timeStr = notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleString('bn-BD', {
              month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
            }) : 'এখনই...';

            return (
              <motion.div 
                key={notice.id}
                layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`relative overflow-hidden bg-white/80 backdrop-blur-md shadow-xl rounded-[2.5rem] p-6 border-2 transition-all ${
                  notice.isUrgent ? 'border-rose-200 bg-rose-50/30' : 'border-slate-50'
                } ${!isRead && !isManager ? 'ring-2 ring-indigo-500/20' : ''}`}
              >
                {/* Urgent Tag */}
                {notice.isUrgent && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5 shadow-lg">
                    <AlertCircle className="w-3 h-3" /> Urgent
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${notice.isUrgent ? 'bg-rose-100 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeStr}
                    </p>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-tight">ম্যানেজার থেকে</p>
                  </div>
                </div>

                <h3 className={`text-xl font-black mb-3 leading-tight ${notice.isUrgent ? 'text-rose-700' : 'text-slate-800'}`}>
                  {notice.title}
                </h3>
                <p className="text-sm font-semibold text-slate-600 leading-relaxed mb-8">
                  {notice.description}
                </p>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {isManager ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <Eye className="w-3.5 h-3.5" /> {notice.readBy?.length || 0} পঠিত
                      </div>
                    ) : (
                      !isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notice.id)}
                          className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> মার্ক এজ রিড
                        </button>
                      )
                    )}
                  </div>
                  
                  {(isManager || isRead) && (
                    <button 
                      onClick={() => handleDelete(notice.id)}
                      className={`p-2.5 rounded-xl transition-all ${
                        isManager ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {!loading && notices.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-2xl font-black text-slate-300">কোনো নোটিশ নেই</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">সবকিছু শান্ত আছে!</p>
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

              <div className="p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 block">নোটিশের শিরোনাম</label>
                  <input type="text" placeholder="যেমন: আগামীকালের বাজার..." value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold px-5 py-4 rounded-[1.5rem] focus:outline-none focus:border-indigo-500/50 transition-all" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 block">বিস্তারিত বিবরণ</label>
                  <textarea rows={4} placeholder="নোটিশের বিস্তারিত বিবরণ লিখুন..." value={noticeDescription} onChange={e => setNoticeDescription(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 font-semibold px-5 py-4 rounded-[1.5rem] focus:outline-none focus:border-indigo-500/50 transition-all resize-none" />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`w-5 h-5 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`} />
                    <span className="text-sm font-bold text-slate-700">Urgent নোটিশ?</span>
                  </div>
                  <button 
                    onClick={() => setIsUrgent(!isUrgent)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isUrgent ? 'bg-rose-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isUrgent ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1 block">মেম্বার সিলেক্ট করুন</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => toggleRecipient('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${selectedRecipients.includes('all') ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                    >
                      সবাইকে পাঠান
                    </button>
                    {members.filter(m => m.id !== userId).map(m => (
                      <button 
                        key={m.id}
                        onClick={() => toggleRecipient(m.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${selectedRecipients.includes(m.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3 mt-auto">
                <button 
                  disabled={!noticeTitle || !noticeDescription}
                  onClick={handleSendNotice} 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Send className="w-5 h-5" /> সেন্ড নোটিশ
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Trash2, Send, X, Users, AlertCircle, CheckCircle2, User as UserIcon,
  Megaphone, Clock, Eye, EyeOff, ShieldAlert, Check
} from 'lucide-react';
import { db, collection, query, where, onSnapshot } from './firebase';
import { 
  listenToNotices, createNotice, deleteNotice, markNoticeAsRead, hideNoticeForUser 
} from './services/noticeService';
import { Notice, UserProfile } from './types';

export default function NoticeView({ isManager, messId, userId }: { isManager: boolean, messId?: string, userId?: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
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
      const membersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
      setMembers(membersList);
    });

    // 2. Listen to Notices
    const unsubscribeNotices = listenToNotices(messId, (noticesList) => {
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
      try { await deleteNotice(id); } catch (err) { console.error(err); }
    } else if (userId) {
      try { await hideNoticeForUser(id, userId); } catch (err) { console.error(err); }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (isManager || !userId) return;
    try { await markNoticeAsRead(id, userId); } catch (err) { console.error(err); }
  };

  const handleSendNotice = async () => {
    if (!noticeTitle || !noticeDescription || !messId || !userId) return;
    
    try {
      await createNotice(
        messId, 
        noticeTitle, 
        noticeDescription, 
        isUrgent, 
        selectedRecipients.includes('all') ? 'all' : selectedRecipients,
        userId
      );
      
      setIsModalOpen(false);
      setNoticeTitle('');
      setNoticeDescription('');
      setIsUrgent(false);
      setSelectedRecipients(['all']);
    } catch (err) { console.error(err); }
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">নোটিশ বোর্ড</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">মেসের যোগাযোগের সেন্ট্রাল হাব</p>
          </div>
        </div>
        
        {isManager && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex px-8 py-4 bg-[#1e1b4b] text-white rounded-[1.5rem] text-sm font-black shadow-2xl shadow-indigo-900/20 hover:bg-[#312e81] hover:scale-105 transition-all items-center gap-3 w-fit"
          >
            <Plus className="w-5 h-5" /> নোটিশ ক্রিয়েট করুন
          </button>
        )}
      </div>

      {/* Notices List - Beautiful List Layout */}
      <div className="flex flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {notices.map((notice) => {
            const isRead = userId ? notice.readBy?.includes(userId) : false;
            const timeStr = notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleString('bn-BD', {
              month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
            }) : 'লোডিং...';

            return (
              <motion.div 
                key={notice.id}
                layout
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative overflow-hidden bg-white/70 backdrop-blur-md shadow-xl rounded-[2rem] p-6 md:p-8 border-2 transition-all hover:shadow-2xl ${
                  notice.isUrgent ? 'border-rose-400/30 bg-rose-50/20 shadow-rose-100' : 'border-white/40'
                } ${!isRead && !isManager ? 'border-indigo-400/30' : ''}`}
              >
                {/* Urgent Indicator Bar */}
                {notice.isUrgent && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${notice.isUrgent ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-200' : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200'}`}>
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                             <Clock className="w-3.5 h-3.5 text-indigo-400" /> {timeStr}
                           </p>
                           {notice.isUrgent && (
                             <span className="px-3 py-1 bg-rose-500 text-white text-[9px] font-black uppercase rounded-full shadow-lg shadow-rose-200 animate-pulse">URGENT</span>
                           )}
                        </div>
                        <p className="text-sm font-black text-slate-800">ম্যানেজার থেকে <span className="text-indigo-500 ml-1">#বার্তা</span></p>
                      </div>
                    </div>

                    <h3 className={`text-2xl font-black mb-3 tracking-tight ${notice.isUrgent ? 'text-rose-700' : 'text-slate-800'}`}>
                      {notice.title}
                    </h3>
                    <p className="text-base font-semibold text-slate-600 leading-relaxed max-w-4xl bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      {notice.description}
                    </p>

                    {/* Member Action Buttons (Below Content) */}
                    {!isManager && (
                      <div className="mt-6 flex items-center gap-4">
                        {!isRead ? (
                          <button 
                            onClick={() => handleMarkAsRead(notice.id)}
                            className="px-8 py-3 bg-indigo-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" /> পড়া হয়েছে
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleDelete(notice.id)}
                            className="px-8 py-3 bg-white text-rose-500 border-2 border-rose-100 text-xs font-black rounded-2xl hover:bg-rose-50 hover:border-rose-500 transition-all flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> নোটিশ মুছে দিন
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side Info/Actions */}
                  <div className="flex flex-row md:flex-col items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-10 shrink-0">
                    {isManager ? (
                      <>
                        <div className="flex flex-col items-center bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100/50 w-24">
                          <div className="text-3xl font-black text-indigo-600 leading-none">{notice.readBy?.length || 0}</div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">পঠিত</p>
                        </div>
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-100 hover:rotate-6 active:scale-90"
                          title="Delete for Everyone"
                        >
                          <Trash2 className="w-7 h-7" />
                        </button>
                      </>
                    ) : (
                      isRead && (
                        <div className="hidden md:flex flex-col items-center text-emerald-500 bg-emerald-50 p-5 rounded-[2rem] border-2 border-emerald-100 shadow-lg shadow-emerald-50">
                          <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg shadow-emerald-200">
                             <Check className="w-6 h-6" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest">পড়া হয়েছে</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {!loading && notices.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Megaphone className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">এখনো কোনো নোটিশ নেই</h3>
            <p className="text-sm font-bold text-slate-500 mt-2">সবাই আপডেট পেতে এখানে নজর রাখুন</p>
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      {isManager && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-[#1e1b4b] text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* CREATE NOTICE MODAL */}
      <AnimatePresence>
        {isModalOpen && isManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-[#1e1b4b] p-8 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center"><Send className="w-5 h-5 text-white" /></div>
                   <h2 className="text-2xl font-black tracking-tight">নতুন নোটিশ পাঠান</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                {/* Urgent Switch */}
                <div 
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${isUrgent ? 'bg-rose-50 border-rose-500 shadow-lg shadow-rose-100' : 'bg-slate-50 border-slate-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isUrgent ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-black ${isUrgent ? 'text-rose-700' : 'text-slate-700'}`}>অত্যন্ত জরুরী (Urgent)?</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">এটি নোটিশকে হাইলাইট করবে</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative ${isUrgent ? 'bg-rose-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isUrgent ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 block">নোটিশের শিরোনাম (Title)</label>
                  <input type="text" placeholder="যেমন: ডিনার সংক্রান্ত জরুরি নোটিশ" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold px-6 py-4 rounded-2xl focus:outline-none focus:border-indigo-500/50 transition-all" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 block">বিস্তারিত বিবরণ (Description)</label>
                  <textarea rows={4} placeholder="বিস্তারিত এখানে লিখুন..." value={noticeDescription} onChange={e => setNoticeDescription(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 font-semibold px-6 py-4 rounded-2xl focus:outline-none focus:border-indigo-500/50 transition-all resize-none" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 block">কাদেরকে পাঠাতে চান? (Recipients)</label>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => toggleRecipient('all')}
                      className={`px-5 py-3 rounded-2xl text-xs font-black transition-all border-2 flex items-center gap-2 ${selectedRecipients.includes('all') ? 'bg-[#1e1b4b] border-[#1e1b4b] text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                    >
                      <Users className="w-4 h-4" /> সবাইকে পাঠান
                    </button>
                    {members.filter(m => m.uid !== userId).map(m => (
                      <button 
                        key={m.uid}
                        onClick={() => toggleRecipient(m.uid)}
                        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all border-2 flex items-center gap-2 ${selectedRecipients.includes(m.uid) ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                      >
                        <UserIcon className="w-4 h-4" /> {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <button 
                  disabled={!noticeTitle || !noticeDescription}
                  onClick={handleSendNotice} 
                  className="w-full py-5 bg-[#1e1b4b] text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Send className="w-5 h-5" /> এখনই নোটিশ পাঠান
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

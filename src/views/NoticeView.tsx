import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Plus, Trash2, Send, X, Users, AlertCircle, CheckCircle2, User as UserIcon,
  Megaphone, Clock, Eye, EyeOff, ShieldAlert, Check
} from 'lucide-react';
import { db, collection, query, where, onSnapshot } from '../firebase';
import { 
  listenToNotices, createNotice, deleteNotice, markNoticeAsRead, hideNoticeForUser 
} from '../services/noticeService';
import { Notice, UserProfile } from '../types';

export default function NoticeView({ isManager, messId, userId, openNoticeId }: { isManager: boolean, messId?: string, userId?: string, openNoticeId?: string | null }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
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

  useEffect(() => {
    if (openNoticeId && notices.length > 0) {
      const notice = notices.find(n => n.id === openNoticeId);
      if (notice) setSelectedNotice(notice);
    }
  }, [openNoticeId, notices]);

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
                onClick={() => setSelectedNotice(notice)}
                className={`group relative overflow-hidden bg-white shadow-md rounded-2xl p-4 border transition-all hover:shadow-lg cursor-pointer ${
                  notice.isUrgent ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'
                } ${!isRead && !isManager ? 'border-indigo-200 bg-indigo-50/5' : ''}`}
              >
                {/* Urgent Indicator Bar */}
                {notice.isUrgent && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${notice.isUrgent ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'}`}>
                        <Megaphone className="w-5 h-5" />
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
                         <p className="text-[11px] font-bold text-slate-800">ম্যানেজার <span className="text-indigo-500">#নোটিশ</span></p>
                      </div>
                    </div>

                    <h3 className={`text-base font-black mb-1 tracking-tight ${notice.isUrgent ? 'text-rose-700' : 'text-slate-800'}`}>
                      {notice.title}
                    </h3>

                    {/* Member Action Buttons (Below Content) */}
                    {!isRead && !isManager && (
                      <div className="mt-4 flex items-center gap-3">
                        <button 
                          onClick={() => handleMarkAsRead(notice.id)}
                          className="px-6 py-2 bg-indigo-600 text-white text-[11px] font-black rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> পড়া হয়েছে
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Side Info/Actions */}
                  <div className="flex flex-row md:flex-col items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                    {isManager ? (
                      <>
                        <div className="flex flex-col items-center bg-indigo-50 p-2 rounded-xl border border-indigo-100 w-16">
                          <div className="text-xl font-black text-indigo-600 leading-none">{notice.readBy?.length || 0}</div>
                          <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5 tracking-widest">পঠিত</p>
                        </div>
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Delete for Everyone"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      isRead && (
                        <button 
                          onClick={() => handleDelete(notice.id)}
                          className="px-4 py-2 bg-white text-rose-400 border border-rose-100 text-[10px] font-bold rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> মুছে দিন
                        </button>
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

      {/* NOTICE DETAIL POPUP */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedNotice(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className={`p-8 ${selectedNotice.isUrgent ? 'bg-rose-600' : 'bg-indigo-600'} text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="flex justify-between items-start relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                        <Megaphone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black leading-tight">{selectedNotice.title}</h2>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">ম্যানেজার থেকে বিশেষ নোটিশ</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedNotice(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
                </div>
              </div>

              <div className="p-8">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8 shadow-inner">
                  <p className="text-slate-700 font-semibold leading-relaxed text-base whitespace-pre-wrap">
                    {selectedNotice.description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">
                      {selectedNotice.createdAt ? new Date(selectedNotice.createdAt.seconds * 1000).toLocaleString('bn-BD', { month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  
                  {selectedNotice.isUrgent && (
                    <span className="px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-rose-200">URGENT</span>
                  )}
                </div>

                {!isManager && userId && !selectedNotice.readBy?.includes(userId) && (
                  <button 
                    onClick={() => {
                      handleMarkAsRead(selectedNotice.id);
                      setSelectedNotice(null);
                    }}
                    className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Check className="w-5 h-5" /> নোটিশটি পড়া হয়েছে
                  </button>
                )}
                
                {(!userId || isManager || (userId && selectedNotice.readBy?.includes(userId))) && (
                   <button 
                    onClick={() => setSelectedNotice(null)}
                    className="w-full mt-8 py-4 bg-slate-800 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2"
                  >
                    বন্ধ করুন
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

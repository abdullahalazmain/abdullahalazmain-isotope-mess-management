import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Calendar as CalendarIcon, TrendingUp, Trophy, AlertCircle, 
  Plus, Check, X, Camera, FileText, ChevronRight, Image as ImageIcon, Trash2, Clock, Info, Bell, Edit3, User, Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { 
  listenToBazarRecords, submitBazar, approveBazar, rejectBazar, 
  listenToMarketRequests, addMarketRequest, deleteMarketRequest,
  updateMarketRequestStatus, voteMarketRequest
} from '../services/bazarService';
import type { BazarRecord, BazarItem } from '../types';

const mockBudgetChart = [
  { name: 'James (You)', budget: 5000, spent: 4200 },
  { name: 'Rahim', budget: 3000, spent: 3100 },
  { name: 'Karim', budget: 4000, spent: 2500 }
];

const initialRecords: BazarRecord[] = [
  {
    id: '1', messId: 'm1', submittedBy: 'u1', date: 'May 12, 2024 - 10:30 AM', month: '2024-05', submitterName: 'James Doe', totalAmount: 1250, status: 'Pending', hasReceipt: true,
    items: [
      { id: 'i1', name: 'চাল', rate: '70', qty: '5 kg', total: '350' },
      { id: 'i2', name: 'মুরগি', rate: '220', qty: '2 kg', total: '440' },
      { id: 'i3', name: 'সবজি', rate: '', qty: '', total: '460' }
    ]
  },
  {
    id: '2', messId: 'm1', submittedBy: 'u2', date: 'May 10, 2024 - 09:15 AM', month: '2024-05', submitterName: 'Rahim Uddin', totalAmount: 850, status: 'Approved', hasReceipt: false,
    items: [
      { id: 'i4', name: 'ডিম', rate: '12', qty: '30 pcs', total: '360' },
      { id: 'i5', name: 'মাছ', rate: '250', qty: '1.5 kg', total: '375' },
      { id: 'i6', name: 'পেঁয়াজ', rate: '60', qty: '2 kg', total: '115' }
    ]
  }
];

export default function BazarView({ isManager, messId, userId, userName, messData, members = [] }: { 
  isManager?: boolean, 
  messId?: string, 
  userId?: string, 
  userName?: string,
  messData?: any,
  members?: any[]
}) {
  const [isMarketDuty, setIsMarketDuty] = useState(true); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [records, setRecords] = useState<BazarRecord[]>([]);
  const [marketRequests, setMarketRequests] = useState<any[]>([]);
  const [reqInput, setReqInput] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BazarRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestFilter, setRequestFilter] = useState<'Pending' | 'Accepted'>('Pending');
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!messId) return;
    const unsub = listenToBazarRecords(messId, currentMonth, (recs) => {
      setRecords(recs);
      setLoading(false);
    });
    const unsubReq = listenToMarketRequests(messId, setMarketRequests);
    return () => { unsub(); unsubReq(); };
  }, [messId, currentMonth]);

  const [bazarDate, setBazarDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  const [bazarTime, setBazarTime] = useState(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  
  const [items, setItems] = useState<BazarItem[]>([{ id: '1', name: '', rate: '', qty: '', total: '' }]);
  const [receipt, setReceipt] = useState<string | null>(null);

  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeMember, setNoticeMember] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  const handleAddItem = () => setItems([...items, { id: Math.random().toString(), name: '', rate: '', qty: '', total: '' }]);
  const handleItemChange = (id: string, field: keyof BazarItem, value: string) => setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  const handleRemoveItem = (id: string) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };
  const calculateTotal = () => items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  const handleCloseModal = (force = false) => {
    const hasData = items.some(i => i.name || i.total) || receipt;
    if (hasData && !force) setShowCancelConfirm(true);
    else { setIsModalOpen(false); setShowCancelConfirm(false); setItems([{ id: '1', name: '', rate: '', qty: '', total: '' }]); setReceipt(null); }
  };

  const handleSave = async () => {
    const invalidItem = items.find(i => (i.name && !i.total) || (!i.name && i.total));
    if (invalidItem) { alert('Validation Error: নাম দিলে দাম দিতে হবে।'); return; }
    if (!messId || !userId) { alert('মেস কানেকশন নেই।'); return; }

    try {
      const totalAmount = calculateTotal();
      await submitBazar(
        messId, userId, userName || 'Unknown',
        `${bazarDate} ${bazarTime}`,
        items.filter(i => i.name), totalAmount, !!receipt
      );
      handleCloseModal(true);
    } catch (err) {
      console.error('Bazar submit error:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    try {
      await approveBazar(selectedRecord.id);
      setSelectedRecord(null);
    } catch (err) { console.error(err); }
  };

  const handleDecline = async () => {
    if (!selectedRecord || !declineReason) return;
    try {
      await rejectBazar(selectedRecord.id, declineReason);
      setIsDeclineModalOpen(false);
      setSelectedRecord(null);
      setDeclineReason('');
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) handleCloseModal();
    };
    if (isModalOpen && !showCancelConfirm) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen, showCancelConfirm, items, receipt]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-xl p-3 text-xs font-bold">
          <p className="text-slate-800 mb-1">{label}</p>
          <p className="text-[#6366f1]">Assigned Budget: ৳ {payload[0].value}</p>
          <p className="text-emerald-500">Actual Spent: ৳ {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  const getMemberData = (id: string) => members.find((m: any) => m.id === id || m.uid === id || m.name === id);
  const assignedDuties = messData?.assignedDuties || {};

  const handleAddRequest = async () => {
    if (!reqInput || !messId || !userId) return;
    try {
      await addMarketRequest(messId, userId, userName || 'Unknown', reqInput);
      setReqInput('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await deleteMarketRequest(id);
    } catch (e) { console.error(e); }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await updateMarketRequestStatus(id, 'Accepted');
    } catch (e) { console.error(e); }
  };

  const handleVoteRequest = async (id: string) => {
    if (!userId) return;
    try {
      await voteMarketRequest(id, userId);
    } catch (e) { console.error(e); }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const shopperId = messData?.assignedDuties?.[todayStr];
  const isShopperToday = shopperId === userId;

  const chartData = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: 0
    }));

    records.filter(r => r.status === 'Approved').forEach(r => {
      const day = parseInt(r.date.split('-')[2]);
      if (day && data[day - 1]) {
        data[day - 1].amount += r.totalAmount;
      }
    });

    return data;
  }, [records]);

  const stats = useMemo(() => {
    const totalSpent = records.filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0);
    const pendingAmount = records.filter(r => r.status === 'Pending').reduce((s, r) => s + r.totalAmount, 0);
    const approvedCount = records.filter(r => r.status === 'Approved').length;
    const avgSpend = approvedCount > 0 ? totalSpent / approvedCount : 0;
    
    return { totalSpent, pendingAmount, approvedCount, avgSpend };
  }, [records]);


  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">বাজার খরচ</h1>
            <p className="text-sm font-semibold text-slate-500">মেসের বাজার ও বাজেট ট্র্যাকিং</p>
          </div>
        </div>

        {(isMarketDuty || isManager) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:flex px-6 py-3 bg-[#1e1b4b] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#1e1b4b]/20 hover:bg-[#312e81] transition-all items-center gap-2"
          >
            <Plus className="w-5 h-5" /> বাজার যুক্ত করুন
          </button>
        )}
      </div>

      {/* Top Section: Overview Cards & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left: Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-gradient-to-r from-[#1e1b4b] to-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/30 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">মেসের মোট বাজার (Mess Total)</p>
              <h3 className="text-3xl font-black">৳ {records.filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><ShoppingCart className="w-6 h-6" /></div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200/50 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">আমার মোট বাজার (My Total)</p>
              <h3 className="text-3xl font-black">৳ {records.filter(r => r.submittedBy === userId && r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><ShoppingCart className="w-6 h-6" /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">দৈনিক বাজার খরচ বিশ্লেষণ</p>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-lg p-2 text-[10px] font-bold">
                              <p className="text-slate-500 mb-1">তারিখ: {payload[0].payload.day}</p>
                              <p className="text-[#6366f1]">খরচ: ৳ {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                 <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">গড় খরচ</p>
                   <p className="text-sm font-black text-slate-800">৳ {Math.round(stats.avgSpend)}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] font-bold text-slate-400 uppercase">পেন্ডিং এমাউন্ট</p>
                   <p className="text-sm font-black text-rose-500">৳ {stats.pendingAmount}</p>
                 </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">পেন্ডিং এপ্রুভাল</p>
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">{records.filter(r => r.status === 'Pending').length} টি</h3>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">সক্রিয় রিকোয়েস্ট</p>
                <Bell className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">{marketRequests.length} টি</h3>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">আজকের ডিউটি</p>
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const dutyUid = messData?.assignedDuties?.[todayStr];
                  const member = getMemberData(dutyUid);
                  return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">{member ? member.name : 'কেউ নেই'}</span>;
                })()}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">কালকের ডিউটি</p>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split('T')[0];
                  const dutyUid = messData?.assignedDuties?.[tomorrowStr];
                  const member = getMemberData(dutyUid);
                  return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-100">{member ? member.name : 'কেউ নেই'}</span>;
                })()}
              </div>
            </div>

          </div>
        </div>

        {/* Right: Market Requests / Shopping List */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2.5rem] p-6 h-full flex flex-col min-h-[450px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" /> বাজার রিকোয়েস্ট
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setRequestFilter('Pending')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${requestFilter === 'Pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  পেন্ডিং
                </button>
                <button 
                  onClick={() => setRequestFilter('Accepted')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${requestFilter === 'Accepted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  অ্যাকসেপ্টেড
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={reqInput}
                onChange={e => setReqInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRequest()}
                placeholder="কি কেনা লাগবে লিখুন (যেমন: ১ কেজি ডাল)..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
              />
              <button 
                onClick={handleAddRequest}
                className="p-3 bg-[#6366f1] text-white rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[300px] pr-2 flex flex-col gap-2">
              <AnimatePresence>
                {marketRequests.filter(req => (req.status || 'Pending') === requestFilter).map((req) => {
                  const voteCount = Object.keys(req.votes || {}).length;
                  const hasVoted = req.votes?.[userId || ''];
                  const isCreator = req.userId === userId;
                  const canAccept = isManager || isShopperToday;
                  
                  return (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${requestFilter === 'Pending' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        <div>
                          <p className="text-sm font-black text-slate-700">{req.itemName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">রিকোয়েস্ট করেছেন: {req.userName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {requestFilter === 'Pending' && (
                          <>
                            {!canAccept && (
                              <button 
                                onClick={() => handleVoteRequest(req.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all ${hasVoted ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">{voteCount}</span>
                              </button>
                            )}
                            
                            {canAccept && (
                              <button 
                                onClick={() => handleAcceptRequest(req.id)}
                                className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                title="Accept Request"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        
                        {(isManager || isCreator) && (
                          <button 
                            onClick={() => handleDeleteRequest(req.id)}
                            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {marketRequests.filter(req => (req.status || 'Pending') === requestFilter).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 opacity-30">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-xs font-black">কোনো রিকোয়েস্ট নেই</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side next to shopping list: Price Guide & Total Bought */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           {/* PRICE GUIDE */}
          <div className="bg-indigo-900 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden h-[210px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <h3 className="font-black text-sm mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-300" /> বাজার দর গাইড
            </h3>
            <div className="flex flex-col gap-3 relative z-10">
              {[
                { n: 'চাল (কেজি)', p: '৳ ৭০-৮৫' },
                { n: 'ডিম (ডজন)', p: '৳ ১৪৫-১৫৫' },
                { n: 'মুরগি (কেজি)', p: '৳ ২৩০-২৫০' }
              ].map(item => (
                <div key={item.n} className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-bold text-indigo-100">{item.n}</span>
                  <span className="text-xs font-black">{item.p}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] font-bold text-indigo-200/50 mt-4 italic text-center">বাজার দরের সাম্প্রতিক ধারণা</p>
          </div>

          {/* MESS STATS QUICK LOOK */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between h-[210px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">মোট আইটেম কেনা (এ মাসে)</p>
                <h3 className="text-2xl font-black text-slate-800">
                  {records.filter(r => r.status === 'Approved').reduce((s, r) => s + (r.items?.length || 0), 0)} টি
                </h3>
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><FileText className="w-5 h-5" /></div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-500">বাজার খরচ স্থিতিশীল আছে</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Left Column: Duty & Notice */}
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-slate-800 mb-4">বাজারের ডিউটি ও নোটিশ</h2>
          <div className="bg-white/70 backdrop-blur-md shadow-lg border border-slate-100 rounded-3xl p-6 flex-1">
            <div className="flex flex-col gap-4">
              {(() => {
                const colors = [
                  'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100', 
                  'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100', 
                  'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100', 
                  'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100', 
                  'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100', 
                  'bg-sky-50 border-sky-100 text-sky-700 hover:bg-sky-100',
                  'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100',
                  'bg-teal-50 border-teal-100 text-teal-700 hover:bg-teal-100'
                ];
                const nameToColorMap: { [key: string]: string } = {};
                let colorIdx = 0;

                const dutiesByMember: { [key: string]: string[] } = {};
                Object.entries(assignedDuties)
                  .filter(([dateStr]) => dateStr.startsWith(currentMonth))
                  .forEach(([dateStr, member]) => {
                    const memberIdOrName = String(member);
                    if (!dutiesByMember[memberIdOrName]) dutiesByMember[memberIdOrName] = [];
                    dutiesByMember[memberIdOrName].push(dateStr);
                  });

                const memberDutyEntries = Object.entries(dutiesByMember);

                if (memberDutyEntries.length === 0) {
                  return (
                    <div className="py-12 flex flex-col items-center justify-center opacity-30 text-center h-full">
                      <ShoppingCart className="w-12 h-12 mb-3" />
                      <p className="text-sm font-black">এ মাসের কোনো ডিউটি অ্যাসাইন করা হয়নি</p>
                    </div>
                  );
                }

                return memberDutyEntries.map(([memberIdOrName, dates]) => {
                    const memberObj = getMemberData(memberIdOrName);
                    const displayName = memberObj?.name || memberIdOrName;
                    
                    if (!nameToColorMap[displayName]) {
                      nameToColorMap[displayName] = colors[colorIdx % colors.length];
                      colorIdx++;
                    }
                    
                    return (
                      <div key={memberIdOrName} className={`flex justify-between items-center p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md ${nameToColorMap[displayName]}`}>
                        <div className="flex items-center gap-4">
                          {memberObj?.photoURL ? (
                            <img src={memberObj.photoURL} alt={displayName} className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center shadow-sm">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">মেম্বার</p>
                            <h4 className="text-base font-black">{displayName}</h4>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end max-w-[50%]">
                          {dates.sort().map(dateStr => {
                            const dayNum = parseInt(dateStr.split('-')[2]) || 0;
                            return (
                              <div key={dateStr} className="w-8 h-8 bg-white/60 rounded-xl flex items-center justify-center font-black text-xs shadow-sm" title={dateStr}>
                                {dayNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Bazar History */}
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-black text-slate-800">বাজারের হিস্ট্রি</h2>
            <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
              {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setHistoryFilter(status as any)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${historyFilter === status ? 'bg-[#1e1b4b] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {status === 'All' ? 'সবগুলো' : status === 'Pending' ? 'পেন্ডিং' : status === 'Approved' ? 'এপ্রুভড' : 'রিজেক্টেড'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md shadow-lg border border-slate-100 rounded-3xl p-6 flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col gap-4 flex-1">
              <AnimatePresence mode="popLayout">
                {records.filter(r => historyFilter === 'All' || r.status === historyFilter).length > 0 ? (
                  records
                    .filter(r => historyFilter === 'All' || r.status === historyFilter)
                    .map((record) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      key={record.id} 
                      className="bg-white/70 backdrop-blur-md border border-slate-100 shadow-md rounded-2xl overflow-hidden transition-all"
                    >
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                        onClick={() => setExpandedHistoryId(expandedHistoryId === record.id ? null : record.id)}
                      >
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 w-28 shrink-0">
                            <CalendarIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 truncate">{record.date.split(' - ')[0]}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 hidden sm:flex">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-black text-slate-800 truncate">{record.submitterName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 w-28 shrink-0 justify-end">
                            <span className="text-base sm:text-lg font-black text-[#6366f1]">৳ {record.totalAmount.toLocaleString()}</span>
                          </div>
                          
                          <div className="w-20 shrink-0 hidden sm:flex justify-end">
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
                              ${record.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : record.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' 
                              : 'bg-orange-50 text-orange-600 border-orange-100'}`}
                            >
                              {record.status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0">
                          <motion.div animate={{ rotate: expandedHistoryId === record.id ? 90 : 0 }}>
                            <ChevronRight className="w-5 h-5" />
                          </motion.div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedHistoryId === record.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-100 bg-slate-50/30"
                          >
                            <div className="p-4 overflow-x-auto">
                              <table className="w-full text-left min-w-[400px]">
                                <thead>
                                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-4 py-2">আইটেম</th>
                                    <th className="py-2 text-center">পরিমাণ</th>
                                    <th className="py-2 text-center">দর</th>
                                    <th className="px-4 py-2 text-right">মোট দাম</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.items.map((item, idx) => (
                                    <tr key={item.id} className={`${idx !== record.items.length - 1 ? 'border-b border-slate-100/50' : ''}`}>
                                      <td className="px-4 py-2.5 font-bold text-slate-700 text-xs">{item.name}</td>
                                      <td className="py-2.5 text-xs font-semibold text-slate-500 text-center">{item.qty || '-'}</td>
                                      <td className="py-2.5 text-xs font-semibold text-slate-500 text-center">{item.rate ? `৳ ${item.rate}` : '-'}</td>
                                      <td className="px-4 py-2.5 font-black text-slate-900 text-right text-xs">৳ {item.total}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              
                              <div className="mt-4 flex justify-between items-center px-4">
                                <button 
                                  onClick={() => setSelectedRecord(record)}
                                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                >
                                  <Info className="w-3.5 h-3.5" /> বিস্তারিত দেখুন (রসিদ/অ্যাকশন)
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center flex-1 py-12 opacity-40 text-center h-full min-h-[250px]"
                  >
                    <FileText className="w-16 h-16 mb-4 text-slate-400" />
                    <p className="text-base font-black text-slate-600">কোনো বাজারের হিস্ট্রি নেই</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">বর্তমানে এই ফিল্টারে দেখানোর মত কোনো রেকর্ড নেই।</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      {(isMarketDuty || isManager) && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#1e1b4b] text-white rounded-full shadow-[0_10px_30px_rgba(30,27,75,0.4)] flex items-center justify-center z-40 hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* RECORD DETAILS MODAL */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRecord(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="bg-slate-50 p-6 flex justify-between items-start border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-800">{selectedRecord.submitterName} - এর বাজার</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{selectedRecord.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shadow-sm"><X className="w-4 h-4" /></button>
                </div>
              </div>

              {selectedRecord.status === 'Rejected' && selectedRecord.rejectedReason && (
                 <div className="bg-rose-50 p-4 border-b border-rose-100 flex gap-3 text-rose-700">
                   <AlertCircle className="w-5 h-5 shrink-0" />
                   <div>
                     <p className="text-xs font-black uppercase tracking-wider mb-1">রিজেক্ট করার কারণ</p>
                     <p className="text-sm font-semibold">{selectedRecord.rejectedReason}</p>
                   </div>
                 </div>
              )}

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="bg-slate-50/50 rounded-3xl p-2 border border-slate-100 mb-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-4 py-3">আইটেম</th>
                        <th className="py-3 text-center">দর</th>
                        <th className="py-3 text-center">পরিমাণ</th>
                        <th className="px-4 py-3 text-right">টাকা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.items.map((item, idx) => (
                        <tr key={item.id} className={`group ${idx !== selectedRecord.items.length - 1 ? 'border-b border-slate-100/50' : ''}`}>
                          <td className="px-4 py-3.5 font-bold text-slate-700 text-sm">{item.name}</td>
                          <td className="py-3.5 text-xs font-semibold text-slate-500 text-center">{item.rate || '-'}</td>
                          <td className="py-3.5 text-xs font-semibold text-slate-500 text-center">{item.qty || '-'}</td>
                          <td className="px-4 py-3.5 font-black text-slate-900 text-right text-sm">৳ {item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {selectedRecord.hasReceipt && (
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[2rem] shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-indigo-600">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-50">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider">বাজারের রসিদ</span>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">View Full Image</button>
                    </div>
                    <div className="aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-indigo-100 flex items-center justify-center overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400" alt="Receipt Mock" className="w-full h-full object-cover opacity-50 grayscale" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-6 relative z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">সর্বমোট খরচ</p>
                    <span className="text-3xl font-black text-slate-900">৳ {selectedRecord.totalAmount.toLocaleString()}</span>
                  </div>
                  {selectedRecord.status === 'Approved' && (
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 animate-bounce-subtle">
                      <Check className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                {isManager && selectedRecord.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => setIsDeclineModalOpen(true)} className="py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-50 transition-all shadow-sm">Decline</button>
                     <button onClick={handleApprove} className="py-4 bg-[#1e1b4b] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#2e2b5b] shadow-xl shadow-indigo-100 transition-all">Approve Entry</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DECLINE REASON MODAL */}
      <AnimatePresence>
         {isDeclineModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeclineModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
               <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mb-4 mx-auto"><AlertCircle className="w-8 h-8" /></div>
               <h3 className="text-xl font-black text-slate-800 text-center mb-2">রিজেক্ট করার কারণ</h3>
               <p className="text-xs font-semibold text-slate-500 text-center mb-6">বাজার কেন বাতিল করা হচ্ছে সেটি বিস্তারিত লিখুন।</p>
               <textarea 
                 value={declineReason} onChange={e => setDeclineReason(e.target.value)} placeholder="যেমন: দাম বেশি লেখা হয়েছে..."
                 className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none h-24"
               />
               <div className="flex gap-3">
                 <button onClick={() => setIsDeclineModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">বাতিল</button>
                 <button onClick={handleDecline} disabled={!declineReason} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 disabled:opacity-50">রিজেক্ট করুন</button>
               </div>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* DUTY NOTICE MODAL */}
      <AnimatePresence>
         {isNoticeModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNoticeModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
               <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Bell className="w-8 h-8" /></div>
               <h3 className="text-xl font-black text-slate-800 text-center mb-2">নোটিশ পাঠান</h3>
               <p className="text-xs font-semibold text-slate-500 text-center mb-6"><strong className="text-slate-800">{noticeMember}</strong> কে {noticeDate} তারিখের ডিউটি রিমাইন্ডার পাঠানো হবে।</p>
               <div className="bg-orange-50 text-orange-800 font-semibold text-sm p-4 rounded-xl mb-6 border border-orange-100">
                 "কেন বাজার করনি কোন সমস্যা আছে থাকলে জানাও।"
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setIsNoticeModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">বাতিল</button>
                 <button onClick={() => { alert(`Notice sent to ${noticeMember}!`); setIsNoticeModalOpen(false); }} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200">নোটিশ সেন্ড</button>
               </div>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      {/* ADD BAZAR MODAL (Dynamic Form) - For Members Only */}
      <AnimatePresence>
         {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              
              {showCancelConfirm ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                  <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
                  <h3 className="text-2xl font-black text-slate-800 mb-2">আপনি কি নিশ্চিত?</h3>
                  <p className="text-sm font-semibold text-slate-500 mb-8 max-w-sm">আপনার লেখা তথ্যগুলো মুছে যাবে। আপনি কি সেভ না করেই বের হতে চান?</p>
                  <div className="flex gap-4 w-full max-w-xs">
                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200">না, ফিরে যাই</button>
                    <button onClick={() => handleCloseModal(true)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 shadow-lg shadow-rose-200">হ্যাঁ, বাতিল করুন</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-[#1e1b4b] p-4 md:p-6 flex justify-between items-center text-white">
                    <div className="flex gap-3 items-center">
                      <input type="date" value={bazarDate} onChange={e => setBazarDate(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold text-white focus:outline-none focus:bg-white/20 transition-colors" />
                      <input type="time" value={bazarTime} onChange={e => setBazarTime(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold text-white focus:outline-none focus:bg-white/20 transition-colors" />
                    </div>
                    <button onClick={handleSave} className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-emerald-500/30">
                      <Check className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 md:p-6 overflow-y-auto no-scrollbar flex-1 bg-slate-50/50">
                    <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-4">আইটেম *</div>
                      <div className="col-span-2 text-center">দর</div>
                      <div className="col-span-2 text-center">পরিমাণ</div>
                      <div className="col-span-3 text-right">টাকা *</div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="flex flex-col gap-3 mb-6">
                      <AnimatePresence>
                        {items.map((item) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm"
                          >
                            <input type="text" placeholder="যেমন: চাল" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} className="col-span-4 bg-transparent text-sm font-bold text-slate-700 focus:outline-none px-2" />
                            <input type="text" placeholder="-" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', e.target.value)} className="col-span-2 bg-transparent text-xs font-semibold text-slate-500 text-center focus:outline-none" />
                            <input type="text" placeholder="-" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', e.target.value)} className="col-span-2 bg-transparent text-xs font-semibold text-slate-500 text-center focus:outline-none" />
                            <div className="col-span-3 relative">
                              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">৳</span>
                              <input type="number" placeholder="0" value={item.total} onChange={e => handleItemChange(item.id, 'total', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg text-sm font-black text-[#6366f1] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 pl-4 pr-2 py-1.5 text-right" />
                            </div>
                            <button onClick={() => handleRemoveItem(item.id)} disabled={items.length === 1} className="col-span-1 flex justify-center text-slate-300 hover:text-rose-500 disabled:opacity-30 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <button onClick={handleAddItem} className="w-full py-3 border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-[#6366f1] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"><Plus className="w-4 h-4" /> অ্যাড আইটেম</button>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-700">রসিদ সংযুক্ত করুন <span className="text-xs font-medium text-slate-400">(অপশনাল)</span></h3>
                        {receipt && <button onClick={() => setReceipt(null)} className="text-xs font-bold text-rose-500">Remove</button>}
                      </div>
                      {!receipt ? (
                        <div onClick={() => setReceipt('mock_receipt_url')} className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors">
                          <Camera className="w-6 h-6 mb-2 text-slate-400" />
                          <span className="text-xs font-bold">ক্লিক করে ছবি তুলুন বা আপলোড করুন</span>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-indigo-50 rounded-2xl border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold gap-2"><Check className="w-5 h-5" /> রসিদ সংযুক্ত হয়েছে</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">সর্বমোট বাজার</span>
                    <span className="text-3xl font-black text-[#1e1b4b]">৳ {calculateTotal()}</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Calendar as CalendarIcon, TrendingUp, Trophy, AlertCircle, 
  Plus, Check, X, Camera, FileText, ChevronRight, Image as ImageIcon, Trash2, Clock, Info, Bell, Edit3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { listenToBazarRecords, submitBazar, approveBazar, rejectBazar } from './services/bazarService';
import type { BazarRecord, BazarItem } from './types';

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

export default function BazarView({ isManager, messId, userId, userName }: { isManager?: boolean, messId?: string, userId?: string, userName?: string }) {
  const [isMarketDuty, setIsMarketDuty] = useState(true); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [records, setRecords] = useState<BazarRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BazarRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().substring(0, 7);

  useEffect(() => {
    if (!messId) return;
    const unsub = listenToBazarRecords(messId, currentMonth, (recs) => {
      setRecords(recs);
      setLoading(false);
    });
    return unsub;
  }, [messId]);

  const [bazarDate, setBazarDate] = useState(new Date().toISOString().split('T')[0]);
  const [bazarTime, setBazarTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  
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

        {isMarketDuty && !isManager && (
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
        <div className="lg:col-span-5 flex flex-col gap-4">
          {!isManager ? (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200/50 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">আমার মোট বাজার</p>
                <h3 className="text-3xl font-black">৳ ৪,২০০</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><ShoppingCart className="w-6 h-6" /></div>
            </div>
          ) : (
             <div className="bg-gradient-to-r from-[#1e1b4b] to-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/30 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">মেসের মোট বাজার (চলতি মাস)</p>
                <h3 className="text-3xl font-black">৳ ২৫,৪০০</h3>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><ShoppingCart className="w-6 h-6" /></div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {!isManager ? (
               <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মেসের মোট বাজার</p>
                   <TrendingUp className="w-4 h-4 text-indigo-500" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800">৳ ২৫,৪০০</h3>
               </div>
            ) : (
               <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">পেন্ডিং এপ্রুভাল</p>
                   <AlertCircle className="w-4 h-4 text-orange-500" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800">২ টি</h3>
               </div>
            )}
            
            <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isManager ? 'আজকের ডিউটি' : 'আমার ডিউটি'}</p>
                <CalendarIcon className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex flex-wrap gap-1">
                {isManager ? (
                   <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">James Doe</span>
                ) : (
                   <>
                     <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">May 12</span>
                     <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold">May 25</span>
                   </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Charts & Leaderboard */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col relative group">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">বাজেট বনাম খরচ</h3>
            {isManager && (
              <button className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1 w-full min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockBudgetChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="spent" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20}>
                    {mockBudgetChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.spent > entry.budget ? '#f43f5e' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-50 to-white border border-indigo-100 shadow-lg rounded-3xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> লিডারবোর্ড</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">সর্বোচ্চ বাজার</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">J</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">James Doe</p>
                    <p className="text-[10px] font-bold text-emerald-600">৳ ৪,২০০</p>
                  </div>
                </div>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">সর্বনিম্ন বাজার</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">K</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Karim</p>
                    <p className="text-[10px] font-bold text-slate-500">৳ ২,৫০০</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isManager && (
         <div className="mb-8">
           <h2 className="text-lg font-black text-slate-800 mb-4">বাজারের ডিউটি ও নোটিশ</h2>
           <div className="bg-white/70 backdrop-blur-md shadow-lg border border-slate-100 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { date: 'May 14', member: 'Karim Hasan', missed: true },
                { date: 'May 15', member: 'James Doe', missed: false }
              ].map(duty => (
                 <div key={duty.date} className={`flex justify-between items-center p-4 rounded-2xl border ${duty.missed ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                   <div>
                     <p className="text-xs font-bold text-slate-500">{duty.date}</p>
                     <p className="text-sm font-black text-slate-800">{duty.member}</p>
                   </div>
                   {duty.missed && (
                     <button 
                       onClick={() => { setNoticeMember(duty.member); setNoticeDate(duty.date); setIsNoticeModalOpen(true); }}
                       className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                     >
                       <Bell className="w-4 h-4" />
                     </button>
                   )}
                 </div>
              ))}
           </div>
         </div>
      )}

      {/* List Section: Bazar Records */}
      <h2 className="text-lg font-black text-slate-800 mb-4">বাজারের হিস্ট্রি</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {records.map((record) => (
          <div 
            key={record.id} 
            className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-lg rounded-[2rem] p-5 hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => setSelectedRecord(record)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1"><CalendarIcon className="w-3 h-3" /> {record.date}</p>
                <h3 className="text-lg font-black text-slate-800">{record.submitterName}</h3>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 
                ${record.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : record.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : 'bg-orange-50 text-orange-600 border border-orange-100'}`}
              >
                {record.status === 'Approved' ? <Check className="w-3 h-3" /> : record.status === 'Rejected' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {record.status}
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-slate-100 pt-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">মোট খরচ</p>
                <p className="text-xl font-black text-[#6366f1]">৳ {record.totalAmount}</p>
              </div>
              <div className="flex items-center gap-2">
                {record.status === 'Rejected' && !isManager && (
                   <div 
                     onClick={(e) => { e.stopPropagation(); alert(`Manager Rejection Reason: ${record.rejectedReason}`); }}
                     className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors"
                   >
                     <Info className="w-4 h-4" />
                   </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors ${record.hasReceipt ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                >
                  <FileText className="w-3 h-3" /> রসিদ
                </button>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#6366f1] group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button (Mobile) */}
      {isMarketDuty && !isManager && (
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

              <div className="p-6 overflow-y-auto">
                <table className="w-full text-left mb-6">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">আইটেম</th>
                      <th className="pb-3 text-center">দর</th>
                      <th className="pb-3 text-center">পরিমাণ</th>
                      <th className="pb-3 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecord.items.map(item => (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 font-bold text-slate-700">{item.name}</td>
                        <td className="py-3 text-xs text-slate-500 text-center">{item.rate || '-'}</td>
                        <td className="py-3 text-xs text-slate-500 text-center">{item.qty || '-'}</td>
                        <td className="py-3 font-bold text-slate-800 text-right">৳ {item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {selectedRecord.hasReceipt && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm font-bold">রসিদ সংযুক্ত আছে</span>
                    </div>
                    <button className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-50">View Image</button>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">সর্বমোট</span>
                  <span className="text-2xl font-black text-[#6366f1]">৳ {selectedRecord.totalAmount}</span>
                </div>
                
                {isManager && selectedRecord.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                     <button onClick={() => setIsDeclineModalOpen(true)} className="py-3 bg-white border-2 border-rose-100 text-rose-500 rounded-xl font-bold hover:bg-rose-50 transition-colors">Decline</button>
                     <button onClick={handleApprove} className="py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors">Accept</button>
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
        {isModalOpen && !isManager && (
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

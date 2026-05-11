import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Home, Zap, MoreHorizontal, ChevronDown, Check, X, 
  Plus, Users, Calculator, AlertTriangle, ChevronRight, User as UserIcon, Minus, DollarSign
} from 'lucide-react';
import { listenToBills, createBill, markSplitAsPaid } from '../services/billService';
import { recordDeposit, listenToDeposits, Deposit } from '../services/depositService';
import type { Bill, BillCategory, BillSplit } from '../types';

interface MemberBill {
  id: string;
  name: string;
  rent: number;
  utility: number;
  others: number;
  isPaid: boolean;
}

const mockMembers: MemberBill[] = [
  { id: '1', name: 'James Doe', rent: 3000, utility: 1200, others: 500, isPaid: true },
  { id: '2', name: 'Rahim Uddin', rent: 3000, utility: 1200, others: 200, isPaid: false },
  { id: '3', name: 'Karim Hasan', rent: 3000, utility: 1200, others: 0, isPaid: false },
  { id: '4', name: 'Zayed Khan', rent: 3000, utility: 1200, others: 1500, isPaid: true }
];


export default function PaymentsView({ isManager, messId, userId, userName, members }: {
  isManager: boolean;
  messId?: string;
  userId?: string;
  userName?: string;
  members?: { id: string; name: string }[];
}) {
  const [viewMode, setViewMode] = useState<'global' | 'personal'>('global');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().substring(0, 7);

  useEffect(() => {
    if (!messId) return;
    const unsubBills = listenToBills(messId, currentMonth, (data) => {
      setBills(data);
      setLoading(false);
    });
    const unsubDeps = listenToDeposits(messId, currentMonth, (data) => {
      setDeposits(data);
    });
    return () => { unsubBills(); unsubDeps(); };
  }, [messId]);

  // Add Bill Modal States
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [billStep, setBillStep] = useState<1 | 2 | 3>(1);
  const [billName, setBillName] = useState('');
  const [billCategory, setBillCategory] = useState<BillCategory>('utility');
  const [billTotal, setBillTotal] = useState<number | ''>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [splitAmounts, setSplitAmounts] = useState<{ [key: string]: number }>({});

  const liveMembers = members || [];

  useEffect(() => {
    if (billStep === 3 && billTotal && selectedMemberIds.length > 0) {
      const splitVal = Math.floor((billTotal as number) / selectedMemberIds.length);
      const newSplits: { [key: string]: number } = {};
      selectedMemberIds.forEach(id => newSplits[id] = splitVal);
      setSplitAmounts(newSplits);
    }
  }, [billStep, billTotal, selectedMemberIds]);

  const handleSplitChange = (id: string, newAmount: number) => {
    if (newAmount < 0) return;
    setSplitAmounts({ ...splitAmounts, [id]: newAmount });
  };

  let currentAssignedTotal = 0;
  (Object.values(splitAmounts) as number[]).forEach(val => currentAssignedTotal += val);
  const remainder = (typeof billTotal === 'number' ? billTotal : 0) - currentAssignedTotal;
  const isPerfectSplit = remainder === 0 && typeof billTotal === 'number' && billTotal > 0;

  const handleCloseModal = () => {
    setIsAddBillModalOpen(false);
    setTimeout(() => {
      setBillStep(1); setBillName(''); setBillTotal(''); setBillCategory('utility');
      setSelectedMemberIds([]);
    }, 300);
  };

  const handleConfirmBill = async () => {
    if (!messId || !userId || !isPerfectSplit) return;
    const splits: BillSplit[] = selectedMemberIds.map(id => ({
      userId: id,
      userName: liveMembers.find(m => m.id === id)?.name || 'Unknown',
      amount: splitAmounts[id] || 0,
      isPaid: false
    }));
    try {
      await createBill(messId, userId, billName, billCategory, billTotal as number, currentMonth, splits);
      handleCloseModal();
    } catch (err) { console.error(err); }
  };

  const handleMarkPaid = async (billId: string, billSplits: BillSplit[]) => {
    if (!userId) return;
    try {
      await markSplitAsPaid(billId, userId, billSplits);
    } catch (err) { console.error(err); }
  };

  // Deposit Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | ''>('');
  const [selectedDepositMemberId, setSelectedDepositMemberId] = useState('');

  const handleRecordDeposit = async () => {
    if (!messId || !selectedDepositMemberId || !depositAmount) return;
    const m = liveMembers.find(m => m.id === selectedDepositMemberId);
    try {
      await recordDeposit(messId, selectedDepositMemberId, m?.name || 'Unknown', Number(depositAmount), currentMonth);
      setIsDepositModalOpen(false);
      setDepositAmount('');
      setSelectedDepositMemberId('');
    } catch (err) { console.error(err); }
  };

  // ── Derived stats ───────────────────────────────────────────────
  const rentBills   = bills.filter(b => b.category === 'rent');
  const utilityBills = bills.filter(b => b.category === 'utility');
  const otherBills  = bills.filter(b => b.category === 'other');

  const totalRent    = rentBills.reduce((s, b) => s + b.totalAmount, 0);
  const totalUtility = utilityBills.reduce((s, b) => s + b.totalAmount, 0);
  const totalOther   = otherBills.reduce((s, b) => s + b.totalAmount, 0);

  const myBills = bills.filter(b => b.splits.some(s => s.userId === userId));
  const myRent    = myBills.filter(b => b.category === 'rent').reduce((s, b) => s + (b.splits.find(sp => sp.userId === userId)?.amount || 0), 0);
  const myUtility = myBills.filter(b => b.category === 'utility').reduce((s, b) => s + (b.splits.find(sp => sp.userId === userId)?.amount || 0), 0);
  const myOther   = myBills.filter(b => b.category === 'other').reduce((s, b) => s + (b.splits.find(sp => sp.userId === userId)?.amount || 0), 0);
  const myTotal   = myRent + myUtility + myOther;


  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">পেমেন্টস ও বিল</h1>
            <p className="text-sm font-semibold text-slate-500">বাসা ভাড়া, ইউটিলিটি এবং অন্যান্য খরচ</p>
          </div>
        </div>
        
        {isManager && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsDepositModalOpen(true)}
              className="flex px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition-all items-center gap-2"
            >
              <DollarSign className="w-5 h-5" /> টাকা জমা নিন
            </button>
            <button 
              onClick={() => setIsAddBillModalOpen(true)}
              className="hidden md:flex px-6 py-3 bg-[#1e1b4b] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#1e1b4b]/20 hover:bg-[#312e81] transition-all items-center gap-2"
            >
              <Plus className="w-5 h-5" /> বিল যোগ করুন
            </button>
          </div>
        )}
      </div>

      {/* Toggle Global vs Personal */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-8 shadow-inner border border-slate-200/60">
        <button 
          onClick={() => setViewMode('global')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'global' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >মেসের ওভারভিউ</button>
        <button 
          onClick={() => setViewMode('personal')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'personal' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >আমার ওভারভিউ</button>
      </div>

      {/* TOP OVERVIEW CARDS */}
      {viewMode === 'global' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Rent Card */}
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Home className="w-5 h-5"/></div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">মোট বাসা ভাড়া</p>
                    <h3 className="text-xl font-black text-slate-800">৳ {totalRent.toLocaleString()}</h3>
                 </div>
               </div>
               <button onClick={() => setExpandedCard(expandedCard === 'rent' ? null : 'rent')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                 <ChevronDown className={`w-4 h-4 transition-transform ${expandedCard === 'rent' ? 'rotate-180' : ''}`} />
               </button>
            </div>
            <AnimatePresence>
              {expandedCard === 'rent' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 pt-3">
                   {rentBills.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">এই মাসে কোনো ভাড়া নেই</p>
                  ) : rentBills.map(b => b.splits.map(sp => (
                    <div key={`${b.id}-${sp.userId}`} className="flex justify-between items-center py-2 text-xs">
                      <span className="font-bold text-slate-600">{sp.userName}</span>
                      <span className={`font-bold px-2 py-1 rounded-md ${sp.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{sp.isPaid ? 'Paid' : 'Unpaid'}</span>
                    </div>
                  )))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Utility Card */}
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Zap className="w-5 h-5"/></div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ইউটিলিটি বিল</p>
                    <h3 className="text-xl font-black text-slate-800">৳ {totalUtility.toLocaleString()}</h3>
                 </div>
               </div>
               <button onClick={() => setExpandedCard(expandedCard === 'utility' ? null : 'utility')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 transition-colors">
                 <ChevronDown className={`w-4 h-4 transition-transform ${expandedCard === 'utility' ? 'rotate-180' : ''}`} />
               </button>
            </div>
            <AnimatePresence>
              {expandedCard === 'utility' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 pt-3">
                  {utilityBills.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">কোনো ইউটিলিটি বিল নেই</p>
                  ) : utilityBills.map(b => (
                    <div key={b.id} className="flex justify-between text-xs py-2"><span className="font-bold text-slate-600">{b.name}</span><span className="font-black text-slate-800">৳ {b.totalAmount.toLocaleString()}</span></div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Others Card */}
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><MoreHorizontal className="w-5 h-5"/></div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">অন্যান্য</p>
                   <h3 className="text-xl font-black text-slate-800">৳ {totalOther.toLocaleString()}</h3>
                 </div>
               </div>
               <button onClick={() => setExpandedCard(expandedCard === 'others' ? null : 'others')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-200 transition-colors">
                 <ChevronDown className={`w-4 h-4 transition-transform ${expandedCard === 'others' ? 'rotate-180' : ''}`} />
               </button>
            </div>
            <AnimatePresence>
              {expandedCard === 'others' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 pt-3">
                  {otherBills.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">অন্যান্য কোনো বিল নেই</p>
                  ) : otherBills.map(b => (
                    <div key={b.id} className="flex justify-between text-xs py-2"><span className="font-bold text-slate-600">{b.name}</span><span className="font-black text-slate-800">৳ {b.totalAmount.toLocaleString()}</span></div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">বাসা ভাড়া</p>
             <h3 className="text-2xl font-black text-slate-800">৳ {myRent.toLocaleString()}</h3>
           </div>
           <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ইউটিলিটি</p>
             <h3 className="text-2xl font-black text-slate-800">৳ {myUtility.toLocaleString()}</h3>
           </div>
           <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">অন্যান্য</p>
             <h3 className="text-2xl font-black text-slate-800">৳ {myOther.toLocaleString()}</h3>
           </div>
           <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-3xl p-5 flex flex-col justify-between text-white shadow-xl shadow-rose-200">
             <div className="flex justify-between items-start">
               <p className="text-[10px] font-bold text-rose-100 uppercase tracking-wider mb-1">সর্বমোট বকেয়া</p>
               <button className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"><ChevronRight className="w-3 h-3" /></button>
             </div>
             <h3 className="text-3xl font-black">৳ {myTotal.toLocaleString()}</h3>
           </div>
        </div>
      )}

      {/* BILL LIST */}
      <h2 className="text-lg font-black text-slate-800 mb-4">বিল সমূহ</h2>
      {loading ? (
        <p className="text-sm text-slate-400 font-bold py-8 text-center">লোড হচ্ছে...</p>
      ) : bills.length === 0 ? (
        <p className="text-sm text-slate-400 font-bold py-8 text-center">এই মাসে কোনো বিল নেই</p>
      ) : (
        <div className="bg-white/70 backdrop-blur-md shadow-xl border border-white/40 rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-5">বিলের নাম</th>
                  <th className="p-5">ক্যাটাগরি</th>
                  <th className="p-5">মোট</th>
                  <th className="p-5">আমার অংশ</th>
                  <th className="p-5">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const mySplit = bill.splits.find(s => s.userId === userId);
                  return (
                    <tr key={bill.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold text-slate-800">{bill.name}</td>
                      <td className="p-5">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          bill.category === 'rent' ? 'bg-indigo-50 text-indigo-600' :
                          bill.category === 'utility' ? 'bg-orange-50 text-orange-600' :
                          'bg-slate-50 text-slate-600'
                        }`}>{bill.category === 'rent' ? 'ভাড়া' : bill.category === 'utility' ? 'ইউটিলিটি' : 'অন্য'}</span>
                      </td>
                      <td className="p-5 font-bold text-slate-600">৳ {bill.totalAmount.toLocaleString()}</td>
                      <td className="p-5 font-bold text-[#6366f1]">{mySplit ? `৳ ${mySplit.amount.toLocaleString()}` : '-'}</td>
                      <td className="p-5">
                        {mySplit ? (
                          mySplit.isPaid ? (
                            <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <Check className="w-3 h-3" /> Paid
                            </span>
                          ) : (
                            <button onClick={() => handleMarkPaid(bill.id, bill.splits)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors">
                              <AlertTriangle className="w-3 h-3" /> Pay Now
                            </button>
                          )
                        ) : <span className="text-xs text-slate-400">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      {isManager && (
        <button 
          onClick={() => setIsAddBillModalOpen(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#1e1b4b] text-white rounded-full shadow-[0_10px_30px_rgba(30,27,75,0.4)] flex items-center justify-center z-40 hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ADD BILL MULTI-STEP MODAL */}
      <AnimatePresence>
        {isAddBillModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
               
               {/* Header */}
               <div className="bg-[#1e1b4b] p-6 flex justify-between items-center text-white shrink-0">
                 <div>
                   <h2 className="text-xl font-black">নতুন বিল যুক্ত করুন</h2>
                   <p className="text-xs font-semibold text-indigo-200 mt-1">স্টেপ {billStep} / 3</p>
                 </div>
                 <button onClick={handleCloseModal} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
               </div>

               {/* Progress Bar */}
               <div className="h-1 bg-slate-100 w-full shrink-0">
                 <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(billStep / 3) * 100}%` }} />
               </div>

               {/* Body Content */}
               <div className="p-6 overflow-y-auto flex-1">
                 {/* STEP 1: Details */}
                 {billStep === 1 && (
                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">বিলের নাম</label>
                       <input type="text" placeholder="যেমন: বিদ্যুৎ বিল (এপ্রিল)" value={billName} onChange={e => setBillName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">ক্যাটাগরি</label>
                       <div className="grid grid-cols-3 gap-2">
                         {(['rent', 'utility', 'other'] as BillCategory[]).map(cat => (
                           <button key={cat} onClick={() => setBillCategory(cat)} className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${billCategory === cat ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'}`}>{cat === 'rent' ? 'ভাড়া' : cat === 'utility' ? 'ইউটিলিটি' : 'অন্যান্য'}</button>
                         ))}
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">মোট টাকার পরিমাণ</label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">৳</span>
                         <input type="number" placeholder="0" value={billTotal} onChange={e => setBillTotal(e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 text-[#6366f1] text-2xl font-black px-10 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                       </div>
                     </div>
                   </motion.div>
                 )}

                 {/* STEP 2: Select Members */}
                 {billStep === 2 && (
                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                     <div className="flex justify-between items-center mb-4">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">কাদের জন্য বিল?</label>
                       <button onClick={() => setSelectedMemberIds(liveMembers.map(m => m.id))} className="text-xs font-bold text-indigo-500">সবাইকে সিলেক্ট করুন</button>
                     </div>
                     <div className="flex flex-col gap-2">
                       {liveMembers.map(member => {
                         const isSelected = selectedMemberIds.includes(member.id);
                         return (
                           <div key={member.id} onClick={() => isSelected ? setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id)) : setSelectedMemberIds([...selectedMemberIds, member.id])} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/50 border-indigo-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                             <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200'}`}>
                               {isSelected && <Check className="w-3 h-3" />}
                             </div>
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><UserIcon className="w-4 h-4"/></div>
                             <span className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{member.name}</span>
                           </div>
                         );
                       })}
                       {liveMembers.length === 0 && <p className="text-sm text-slate-400 text-center py-4">লোড হচ্ছে...</p>}
                     </div>
                   </motion.div>
                 )}

                 {/* STEP 3: Split Logic */}
                 {billStep === 3 && (
                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                     <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center mb-6">
                       <div className="flex items-center gap-2 text-slate-600"><Calculator className="w-5 h-5" /> <span className="text-sm font-bold">মোট বিল</span></div>
                       <span className="text-xl font-black text-[#1e1b4b]">৳ {billTotal}</span>
                     </div>

                     <div className="flex flex-col gap-3 pb-24">
                       {selectedMemberIds.map(id => {
                         const member = liveMembers.find(m => m.id === id);
                         return (
                           <div key={id} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                             <span className="font-bold text-sm text-slate-700 ml-2 truncate w-24">{member?.name}</span>
                             <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100">
                                <button onClick={() => handleSplitChange(id, (splitAmounts[id] || 0) - 100)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-rose-500 hover:bg-rose-50"><Minus className="w-4 h-4" /></button>
                                <div className="relative w-20">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">৳</span>
                                  <input type="number" value={splitAmounts[id] || 0} onChange={e => handleSplitChange(id, parseInt(e.target.value) || 0)} className="w-full text-center font-black text-[#6366f1] bg-transparent focus:outline-none pl-4 pr-1" />
                                </div>
                                <button onClick={() => handleSplitChange(id, (splitAmounts[id] || 0) + 100)} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500 hover:bg-emerald-50"><Plus className="w-4 h-4" /></button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </motion.div>
                 )}
               </div>

               {/* Footer Action */}
               <div className="bg-white border-t border-slate-100 p-6 flex flex-col gap-4 shrink-0 relative z-10">
                 {billStep === 3 && (
                   <div className={`p-4 rounded-xl flex justify-between items-center border-2 transition-colors ${isPerfectSplit ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'}`}>
                     <span className="text-xs font-bold uppercase tracking-wider">{isPerfectSplit ? 'হিসাব সঠিক' : 'অবশিষ্ট আছে'}</span>
                     <span className="text-xl font-black flex items-center gap-2">
                       {!isPerfectSplit && <AlertTriangle className="w-5 h-5" />}
                       ৳ {remainder}
                     </span>
                   </div>
                 )}

                 <div className="flex gap-3">
                   {billStep > 1 && <button onClick={() => setBillStep(s => s - 1 as 1|2|3)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">আগের স্টেপ</button>}
                   
                   {billStep < 3 ? (
                     <button 
                       disabled={(billStep === 1 && (!billName || !billTotal)) || (billStep === 2 && selectedMemberIds.length === 0)}
                       onClick={() => setBillStep(s => s + 1 as 1|2|3)} 
                       className="flex-1 py-4 bg-[#6366f1] text-white rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                       পরবর্তী স্টেপ <ChevronRight className="w-4 h-4" />
                     </button>
                   ) : (
                     <button 
                       disabled={!isPerfectSplit}
                       onClick={handleConfirmBill} 
                       className="flex-1 py-4 bg-[#1e1b4b] text-white rounded-xl font-bold shadow-xl shadow-[#1e1b4b]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                       <Check className="w-5 h-5" /> কনফার্ম ও সেন্ড করুন
                     </button>
                   )}
                 </div>
               </div>

             </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* RECORD DEPOSIT MODAL */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
               <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                 <h2 className="text-xl font-black">টাকা জমা নিন (Deposit)</h2>
                 <button onClick={() => setIsDepositModalOpen(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
               </div>
               <div className="p-6 space-y-6">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">মেম্বার সিলেক্ট করুন</label>
                   <select 
                     value={selectedDepositMemberId} 
                     onChange={e => setSelectedDepositMemberId(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                   >
                     <option value="">সিলেক্ট করুন...</option>
                     {liveMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">টাকার পরিমাণ</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">৳</span>
                     <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full bg-slate-50 border border-slate-200 text-emerald-600 text-2xl font-black px-10 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                   </div>
                 </div>
                 <button 
                   onClick={handleRecordDeposit}
                   disabled={!selectedDepositMemberId || !depositAmount}
                   className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-xl shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   <Check className="w-5 h-5" /> জমা কনফার্ম করুন
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

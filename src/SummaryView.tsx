import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Download, ChevronLeft, ChevronRight, 
  PieChart as PieChartIcon, TrendingUp, DollarSign, Utensils
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface MemberSummary {
  id: string;
  name: string;
  totalDeposit: number;
  totalMeals: number;
  mealCost: number;
  otherCost: number;
  totalExpense: number;
  balance: number;
}

const mockSummary: MemberSummary[] = [
  { id: '1', name: 'James Doe', totalDeposit: 5000, totalMeals: 45, mealCost: 2538, otherCost: 1500, totalExpense: 4038, balance: 962 },
  { id: '2', name: 'Rahim Uddin', totalDeposit: 4000, totalMeals: 40, mealCost: 2256, otherCost: 1500, totalExpense: 3756, balance: 244 },
  { id: '3', name: 'Karim Hasan', totalDeposit: 3000, totalMeals: 50, mealCost: 2820, otherCost: 1500, totalExpense: 4320, balance: -1320 },
  { id: '4', name: 'Zayed Khan', totalDeposit: 4500, totalMeals: 35, mealCost: 1974, otherCost: 1500, totalExpense: 3474, balance: 1026 },
];

const pieData = [
  { name: 'বাজার খরচ', value: 9588, color: '#6366f1' },
  { name: 'বাসা ভাড়া', value: 12000, color: '#f43f5e' },
  { name: 'ইউটিলিটি', value: 4800, color: '#f59e0b' },
  { name: 'অন্যান্য', value: 1200, color: '#10b981' }
];

export default function SummaryView({ isManager }: { isManager: boolean }) {
  const [currentMonth, setCurrentMonth] = useState(new Date('2024-05-01'));

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const monthName = currentMonth.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">ফাইনাল সামারি</h1>
            <p className="text-sm font-semibold text-slate-500">মাসিক পূর্ণাঙ্গ হিসাব ও রিপোর্ট</p>
          </div>
        </div>
        
        <button className="flex px-6 py-3 bg-[#1e1b4b] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#1e1b4b]/20 hover:bg-[#312e81] transition-all items-center justify-center gap-2">
          <Download className="w-5 h-5" /> এক্সপোর্ট PDF
        </button>
      </div>

      {/* Month Navigator */}
      <div className="flex justify-center items-center gap-6 mb-8 bg-white/50 backdrop-blur-sm py-4 rounded-3xl border border-white">
        <button onClick={handlePrevMonth} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#6366f1] hover:shadow-md transition-all"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-2xl font-black text-slate-800 min-w-[200px] text-center">{monthName}</h2>
        <button onClick={handleNextMonth} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#6366f1] hover:shadow-md transition-all"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
           <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3"><DollarSign className="w-5 h-5"/></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট কালেকশন</p>
           <h3 className="text-2xl font-black text-slate-800">৳ ১৬,৫০০</h3>
        </div>
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
           <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3"><TrendingUp className="w-5 h-5"/></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট খরচ</p>
           <h3 className="text-2xl font-black text-slate-800">৳ ২৭,৫৮৮</h3>
        </div>
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
           <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3"><Utensils className="w-5 h-5"/></div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট মিল সংখ্যা</p>
           <h3 className="text-2xl font-black text-slate-800">১৭০</h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200 rounded-3xl p-5 flex flex-col justify-between">
           <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-3"><PieChartIcon className="w-5 h-5"/></div>
           <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1">চূড়ান্ত মিল রেট</p>
           <h3 className="text-2xl font-black">৳ ৫৬.৪০</h3>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-5 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-6 flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-6">খরচের বিভাজন</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `৳ ${value}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-6">সংক্ষিপ্ত সারমর্ম</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div><p className="text-sm font-bold text-slate-600">সবচেয়ে বেশি বাজার করেছেন</p></div>
               <div className="text-right"><p className="text-sm font-black text-[#6366f1]">James Doe</p><p className="text-xs font-bold text-slate-400">৳ ৪,২০০</p></div>
             </div>
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div><p className="text-sm font-bold text-slate-600">সবচেয়ে বেশি মিল খেয়েছেন</p></div>
               <div className="text-right"><p className="text-sm font-black text-rose-500">Karim Hasan</p><p className="text-xs font-bold text-slate-400">৫০ মিল</p></div>
             </div>
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div><p className="text-sm font-bold text-slate-600">অব্যবহৃত মেস ফান্ড</p></div>
               <div className="text-right"><p className="text-sm font-black text-emerald-500">৳ ২,৪০০</p><p className="text-xs font-bold text-slate-400">পরবর্তী মাসে যুক্ত হবে</p></div>
             </div>
          </div>
        </div>
      </div>

      {/* The Final Ledger Table */}
      <h2 className="text-lg font-black text-slate-800 mb-4">মেম্বারদের চূড়ান্ত হিসাব (Ledger)</h2>
      <div className="bg-white/70 backdrop-blur-md shadow-xl border border-white/40 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e1b4b] text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                <th className="p-4">মেম্বার</th>
                <th className="p-4 text-center">জমা</th>
                <th className="p-4 text-center">মোট মিল</th>
                <th className="p-4 text-center">মিল খরচ</th>
                <th className="p-4 text-center">অন্যান্য খরচ</th>
                <th className="p-4 text-center">মোট খরচ</th>
                <th className="p-4 text-right">ব্যালেন্স</th>
              </tr>
            </thead>
            <tbody>
              {mockSummary.map((member) => (
                <tr key={member.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-700 whitespace-nowrap">{member.name}</td>
                  <td className="p-4 text-center font-bold text-emerald-600">৳ {member.totalDeposit}</td>
                  <td className="p-4 text-center font-bold text-slate-500">{member.totalMeals}</td>
                  <td className="p-4 text-center font-bold text-slate-500">৳ {member.mealCost}</td>
                  <td className="p-4 text-center font-bold text-slate-500">৳ {member.otherCost}</td>
                  <td className="p-4 text-center font-bold text-rose-500">৳ {member.totalExpense}</td>
                  <td className="p-4 text-right">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap ${member.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {member.balance >= 0 ? `পাবেন ৳ ${member.balance}` : `দিবেন ৳ ${Math.abs(member.balance)}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

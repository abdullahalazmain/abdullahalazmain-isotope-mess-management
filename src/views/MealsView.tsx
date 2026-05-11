import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc } from '../firebase';
import { listenToUserMeals, listenToAllMessMeals, saveMeal } from '../services/mealService';
import type { MealRecord, BazarRecord } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, ShoppingCart, Calculator, Calendar as CalendarIcon, 
  Plus, Check, X, AlertTriangle, Clock, Edit2, Minus, BellRing, MousePointer2, ChevronRight, ChevronLeft, Star, User
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
export default function MealsView({ isManager, messId, userId, userName, messData }: { isManager?: boolean, messId?: string, userId?: string, userName?: string, messData?: any }) {
  const [userMeals, setUserMeals] = useState<MealRecord[]>([]);
  const [allMessMeals, setAllMessMeals] = useState<MealRecord[]>([]);
  
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bazarRecords, setBazarRecords] = useState<BazarRecord[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  const todayStr = new Date().toISOString().split('T')[0];

  const assignedDuties = messData?.assignedDuties || {};
  const specialDays = messData?.specialDays || {};
  const isMarketDuty = assignedDuties[todayStr] === userId;

  useEffect(() => {
    if (!messId || !userId) return;

    const unsub1 = listenToUserMeals(messId, userId, currentMonth, setUserMeals);
    const unsub2 = listenToAllMessMeals(messId, currentMonth, setAllMessMeals);

    // Listen to Bazar status for locking
    const unsubBazar = onSnapshot(
      query(collection(db, 'bazar'), where('messId', '==', messId), where('month', '==', currentMonth)),
      (snap) => setBazarRecords(snap.docs.map(d => d.data()))
    );

    return () => { unsub1(); unsub2(); unsubBazar(); };
  }, [messId, userId]);

  const handleSaveMeals = async (userName: string = 'User') => {
    if (!messId || !userId || editingDays.length === 0) return;
    const year = currentMonth.split('-')[0];
    const month = currentMonth.split('-')[1];

    try {
      for (const day of editingDays) {
        const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
        
        // Check if day is locked by market
        const isDayLocked = bazarRecords.some(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done'));
        if (isDayLocked) {
          alert(`মে ${day} তারিখের বাজার সম্পন্ন হয়েছে। মিল পরিবর্তন করা সম্ভব নয়।`);
          continue;
        }

        await saveMeal(
          messId, userId, userName, dateStr,
          selfMeals, guestMeals
        );
      }
      closeModal();
    } catch (error) {
      console.error('Error saving meals:', error);
    }
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDays, setEditingDays] = useState<number[]>([]);

  // Meal states for the modal
  const [selfMeals, setSelfMeals] = useState({ morning: false, lunch: true, dinner: true });
  const [guestMeals, setGuestMeals] = useState({ morning: 0, lunch: 0, dinner: 0 });
  const [showGuestMeals, setShowGuestMeals] = useState(false);

  // Manager Actions State
  const [managerActionDay, setManagerActionDay] = useState<number | null>(null);
  const [isSpecialDayModalOpen, setIsSpecialDayModalOpen] = useState(false);
  const [isAssignDutyModalOpen, setIsAssignDutyModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const yearNum = parseInt(currentMonth.split('-')[0]);
  const monthNum = parseInt(currentMonth.split('-')[1]);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date().getDate();
  const isCurrentMonth = currentMonth === new Date().toISOString().substring(0, 7);

  const handlePrevMonth = () => {
    let y = yearNum;
    let m = monthNum - 1;
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(`${y}-${m.toString().padStart(2, '0')}`);
    setSelectedDays([]);
    setMultiSelectMode(false);
  };

  const handleNextMonth = () => {
    let y = yearNum;
    let m = monthNum + 1;
    if (m > 12) { m = 1; y++; }
    setCurrentMonth(`${y}-${m.toString().padStart(2, '0')}`);
    setSelectedDays([]);
    setMultiSelectMode(false);
  };

  const formatMonthYear = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
  };

  const handleDayClick = (day: number) => {
    if (day < today && isCurrentMonth && !multiSelectMode) return;
    
    if (multiSelectMode) {
      if (day < today && isCurrentMonth) return;
      toggleDaySelection(day);
    } else {
      if (isManager && (day >= today || !isCurrentMonth)) {
        setManagerActionDay(day);
      } else {
        setEditingDays([day]);
        setIsModalOpen(true);
      }
    }
  };

  const toggleDaySelection = (day: number) => {
    if (day < today && isCurrentMonth) return;
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleMouseDown = (day: number) => {
    if (!multiSelectMode || (day < today && isCurrentMonth)) return;
    setIsDragging(true);
    toggleDaySelection(day);
  };

  const handleMouseEnter = (day: number) => {
    if (!isDragging || (day < today && isCurrentMonth) || selectedDays.includes(day)) return;
    toggleDaySelection(day);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMultiEditSubmit = () => {
    if (selectedDays.length === 0) return;
    setEditingDays(selectedDays);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDays([]);
    setSelfMeals({ morning: false, lunch: true, dinner: true });
    setGuestMeals({ morning: 0, lunch: 0, dinner: 0 });
    if (multiSelectMode) {
      setMultiSelectMode(false);
      setSelectedDays([]);
    }
  };

  const isLocked = (day: number) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, '0')}`;
    return bazarRecords.some(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done'));
  };

  const updateGuestMeal = (type: 'morning' | 'lunch' | 'dinner', delta: number) => {
    if (isLocked) return;
    const current = guestMeals[type];
    if (current + delta >= 0) {
      setGuestMeals({ ...guestMeals, [type]: current + delta });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-xl p-3 text-xs font-bold">
          <p className="text-slate-800 mb-1">মে {label}</p>
          <p className="text-emerald-500">মিল রেট: ৳ {data.rate}</p>
          <p className="text-indigo-500">মোট বাজার: ৳ {data.market}</p>
          <p className="text-rose-500">মোট মিল: {data.meals}</p>
        </div>
      );
    }
    return null;
  };

  const { totalMeals, totalMarket, mealRate, chartData } = useMemo(() => {
    let totalM = 0;
    allMessMeals.forEach(m => {
      if (m.selfMeals.morning) totalM += 0.5;
      if (m.selfMeals.lunch) totalM += 1;
      if (m.selfMeals.dinner) totalM += 1;
      totalM += (m.guestMeals?.morning || 0) * 0.5;
      totalM += (m.guestMeals?.lunch || 0);
      totalM += (m.guestMeals?.dinner || 0);
    });

    const totalMar = bazarRecords
      .filter(r => r.status === 'Approved' || r.status === 'Done')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const rate = totalM > 0 ? (totalMar / totalM) : 0;

    const cData = days.map(d => {
      const dateStr = `${currentMonth}-${d.toString().padStart(2, '0')}`;
      
      let dayMeals = 0;
      allMessMeals.filter(m => m.date === dateStr).forEach(m => {
        if (m.selfMeals.morning) dayMeals += 0.5;
        if (m.selfMeals.lunch) dayMeals += 1;
        if (m.selfMeals.dinner) dayMeals += 1;
        dayMeals += (m.guestMeals?.morning || 0) * 0.5;
        dayMeals += (m.guestMeals?.lunch || 0);
        dayMeals += (m.guestMeals?.dinner || 0);
      });

      const dayMarket = bazarRecords
        .filter(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done'))
        .reduce((sum, r) => sum + r.totalAmount, 0);

      return {
        day: d.toString(),
        meals: dayMeals,
        market: dayMarket,
        rate: dayMeals > 0 ? Math.round((dayMarket / dayMeals) * 10) / 10 : 0
      };
    });

    return { totalMeals: totalM, totalMarket: totalMar, mealRate: rate, chartData: cData };
  }, [allMessMeals, bazarRecords, currentMonth, days]);

  const handleAssignDuty = async () => {
    if (!messId || !selectedMember || !managerActionDay) return;
    try {
      const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
      const messRef = doc(db, 'messes', messId);
      await updateDoc(messRef, {
        [`assignedDuties.${dateStr}`]: selectedMember
      });
      setIsAssignDutyModalOpen(false);
      setSelectedMember('');
    } catch (err) { console.error(err); }
  };

  const handleSaveSpecialDay = async () => {
    if (!messId || !eventName || !managerActionDay) return;
    try {
      const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
      const messRef = doc(db, 'messes', messId);
      await updateDoc(messRef, {
        [`specialDays.${dateStr}`]: eventName
      });
      setIsSpecialDayModalOpen(false);
      setEventName('');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <Utensils className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">মিলের হিসাব</h1>
          <p className="text-sm font-semibold text-slate-500">ক্যালেন্ডার ও বাজার ট্র্যাকিং</p>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">সর্বমোট মিল (চলতি মাস)</p>
            <h3 className="text-3xl font-black text-slate-800">{totalMeals}</h3>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">সর্বমোট বাজার</p>
            <h3 className="text-3xl font-black text-slate-800">৳ {totalMarket.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400 shadow-xl shadow-emerald-200 rounded-3xl p-6 flex items-center gap-4 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-sm border border-white/20">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">বর্তমান মিল রেট</p>
            <h3 className="text-3xl font-black">৳ {mealRate.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Bazar Duty Banner (If it's your duty) */}
      {isMarketDuty && !isManager && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-6 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">আজকে আপনার বাজারের ডিউটি!</h3>
              <p className="text-sm font-semibold text-slate-500">অন্যান্য মেম্বারদের মিল এডিট করার জন্য বাজার স্ট্যাটাস আপডেট করুন।</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl shadow-sm border border-orange-50">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-700 text-center">আপনি কি বাজার করেছেন?</p>
              <div className="flex gap-2">
                <button onClick={() => alert('বাজার এড করার জন্য বাজার খরচ অপশনে যান')} className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors flex-1">বাজার যুক্ত করুন</button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Main Content Grid: Calendar + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendar Section */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-[#6366f1]" /> মিল ক্যালেন্ডার</h3>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button onClick={handlePrevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#6366f1] transition-all"><ChevronLeft className="w-5 h-5" /></button>
                <div className="relative flex items-center justify-center min-w-[120px]">
                  <input 
                    type="month" 
                    value={currentMonth} 
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCurrentMonth(e.target.value);
                        setSelectedDays([]);
                        setMultiSelectMode(false);
                      }
                    }} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <span className="font-black text-slate-700 text-sm whitespace-nowrap pointer-events-none">{formatMonthYear(currentMonth)}</span>
                </div>
                <button onClick={handleNextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#6366f1] transition-all"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            <button 
              onClick={() => { setMultiSelectMode(!multiSelectMode); setSelectedDays([]); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${multiSelectMode ? 'bg-[#6366f1] text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <MousePointer2 className="w-4 h-4" /> {multiSelectMode ? 'ক্যানসেল সিলেকশন' : 'মাল্টিপল এডিট'}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3 mb-4">
            {['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'].map(d => (
              <div key={d} className="text-xs font-bold text-slate-400 text-center pb-2 border-b border-slate-100">{d}</div>
            ))}
            
            {days.map((d) => {
              const isPast = d < today && isCurrentMonth;
              const isToday = d === today && isCurrentMonth;
              const isSelected = selectedDays.includes(d);
              
              const dateStr = `${currentMonth}-${d.toString().padStart(2, '0')}`;
              const isSpecial = specialDays[dateStr];

              return (
                <div 
                  key={d} 
                  onClick={() => handleDayClick(d)}
                  onMouseDown={() => handleMouseDown(d)}
                  onMouseEnter={() => handleMouseEnter(d)}
                  onMouseUp={handleMouseUp}
                  className={`
                    aspect-square rounded-2xl flex items-center justify-center font-bold text-lg transition-all cursor-pointer relative overflow-hidden group select-none
                    ${isPast ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
                    ${isToday && !isSpecial ? 'bg-[#6366f1] text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-2 ring-indigo-200 ring-offset-2' : ''}
                    ${!isPast && !isToday && !isSelected && !isSpecial ? 'bg-white border border-slate-100 text-slate-700 hover:bg-[#6366f1] hover:text-white hover:shadow-lg' : ''}
                    ${isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-2 ring-emerald-200 ring-offset-2 scale-95' : ''}
                    ${isSpecial ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.6)] ring-2 ring-amber-200 ring-offset-2 z-10' : ''}
                    ${isLocked(d) ? 'opacity-70 bg-slate-100' : ''}
                  `}
                >
                  <span className={`absolute top-2 left-2 text-[10px] ${isToday || isSpecial ? 'opacity-80' : 'opacity-40'}`}>{d}</span>
                  
                  {isLocked(d) && (
                    <div className="absolute top-2 right-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                  
                  {isSpecial ? (
                    <div className="flex flex-col items-center justify-center pt-2">
                      <Star className="w-5 h-5 fill-white text-white opacity-90 mb-1" />
                    </div>
                  ) : isPast ? (
                    <span>
                      {(() => {
                        const meal = userMeals.find(m => m.date === dateStr);
                        if (!meal) return '0';
                        let count = 0;
                        if (meal.selfMeals?.morning) count += 0.5;
                        if (meal.selfMeals?.lunch) count += 1;
                        if (meal.selfMeals?.dinner) count += 1;
                        const guestCount = (meal.guestMeals?.morning || 0) * 0.5 + (meal.guestMeals?.lunch || 0) + (meal.guestMeals?.dinner || 0);
                        return count + guestCount;
                      })()}
                    </span>
                  ) : (
                    <Plus className={`w-6 h-6 ${isToday || isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`} />
                  )}

                  {isSelected && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><Check className="w-8 h-8 text-white opacity-50" /></div>}
                  {isSpecial && <div className="absolute bottom-1 w-full text-center text-[8px] font-black uppercase tracking-widest opacity-90 px-1 truncate">{isSpecial}</div>}
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {multiSelectMode && selectedDays.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-6 bg-[#1e1b4b] rounded-2xl p-4 flex justify-between items-center shadow-xl">
                <span className="text-white font-bold text-sm">{selectedDays.length} টি দিন সিলেক্ট করা হয়েছে</span>
                <button onClick={handleMultiEditSubmit} className="px-6 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-500 flex items-center gap-2"><Edit2 className="w-4 h-4" /> এডিট করুন</button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Duty Roster & Special Days Info List */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">এই মাসের অ্যাসাইনমেন্ট</h4>
             {Object.entries(assignedDuties).filter(([dateStr]) => dateStr.startsWith(currentMonth)).length === 0 && (
               <p className="text-xs text-slate-400 font-semibold">কোনো ডিউটি অ্যাসাইন করা হয়নি।</p>
             )}
             {Object.entries(assignedDuties)
                .filter(([dateStr]) => dateStr.startsWith(currentMonth))
                .sort()
                .map(([dateStr, member]) => {
                  const day = dateStr.split('-')[2];
                  return (
                    <div key={dateStr} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">মে {parseInt(day)}</span>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-[#6366f1]"/> {String(member)}</span>
                    </div>
                  );
                })
             }
          </div>

        </div>

        {/* Charts Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-6 h-full min-h-[300px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg mb-6">দৈনন্দিন বাজার ও মিল গ্রাফ</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }} />
                  <Line yAxisId="left" type="monotone" dataKey="market" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
                  <Line yAxisId="right" type="monotone" dataKey="meals" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* MANAGER ACTION MENU MODAL */}
      <AnimatePresence>
        {managerActionDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setManagerActionDay(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">অ্যাডমিন কন্ট্রোল</h3>
                  <p className="text-xs font-bold text-slate-500">মে {managerActionDay} তারিখের জন্য</p>
                </div>
                <button onClick={() => setManagerActionDay(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-800"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <button 
                  onClick={() => { setEditingDays([managerActionDay]); setIsModalOpen(true); setManagerActionDay(null); }}
                  className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-[#6366f1]/10 hover:text-[#6366f1] text-slate-700 font-bold rounded-2xl transition-colors flex items-center gap-3"
                >
                  <Utensils className="w-5 h-5" /> নিজের মিল এডিট করুন
                </button>
                <button 
                  onClick={() => { setIsSpecialDayModalOpen(true); setManagerActionDay(null); }}
                  className="w-full text-left px-5 py-4 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold rounded-2xl transition-colors flex items-center gap-3"
                >
                  <Star className="w-5 h-5" /> বিশেষ দিন (Special Day) তৈরি করুন
                </button>
                <button 
                  onClick={() => { setIsAssignDutyModalOpen(true); setManagerActionDay(null); }}
                  className="w-full text-left px-5 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-2xl transition-colors flex items-center gap-3"
                >
                  <User className="w-5 h-5" /> বাজার ডিউটি অ্যাসাইন করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPECIAL DAY MODAL */}
      <AnimatePresence>
        {isSpecialDayModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSpecialDayModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
               <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Star className="w-8 h-8" /></div>
               <h3 className="text-xl font-black text-slate-800 text-center mb-2">বিশেষ দিন যোগ করুন</h3>
               <p className="text-xs font-semibold text-slate-500 text-center mb-6">উক্ত দিনে ক্যালেন্ডারে একটি স্পেশাল হাইলাইট দেখাবে।</p>
               <input 
                 type="text" placeholder="ইভেন্টের নাম (যেমন: পিকনিক)" value={eventName} onChange={e => setEventName(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
               />
                <button 
                  onClick={handleSaveSpecialDay}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200"
                >সেভ করুন</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN DUTY MODAL */}
      <AnimatePresence>
        {isAssignDutyModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAssignDutyModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 mx-auto"><User className="w-8 h-8" /></div>
               <h3 className="text-xl font-black text-slate-800 text-center mb-2">বাজার ডিউটি অ্যাসাইন</h3>
               <p className="text-xs font-semibold text-slate-500 text-center mb-6">মে {managerActionDay} তারিখের জন্য মেম্বার সিলেক্ট করুন।</p>
               <select 
                 value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl mb-6 focus:outline-none"
               >
                 <option value="" disabled>মেম্বার সিলেক্ট করুন</option>
                 <option value="James Doe">James Doe</option>
                 <option value="Rahim Uddin">Rahim Uddin</option>
                 <option value="Karim Hasan">Karim Hasan</option>
               </select>
                <button 
                  onClick={handleAssignDuty}
                  className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                >অ্যাসাইন করুন</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STANDARD MEAL EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-800">{editingDays.length > 1 ? `${editingDays.length} টি দিন আপডেট` : `মে ${editingDays[0]}`}</h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">মিল কনফার্মেশন</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 shadow-sm"><X className="w-4 h-4" /></button>
              </div>

              {editingDays.some(d => isLocked(d)) ? (
                 <div className="bg-rose-50 px-6 py-3 border-b border-rose-100 flex items-center gap-2 text-rose-600">
                   <AlertTriangle className="w-4 h-4" />
                   <p className="text-xs font-bold">বাজার হয়ে গিয়েছে। মিল এডিট করার সুযোগ নেই।</p>
                 </div>
              ) : (
                 <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex items-center gap-2 text-orange-600">
                   <Clock className="w-4 h-4" />
                   <p className="text-[10px] font-bold uppercase tracking-wider">বাজার সম্পন্ন হওয়ার আগেই কনফার্ম করুন</p>
                 </div>
              )}

              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">নিজের মিল</h3>
                <div className="flex justify-between gap-3 mb-6">
                  {([ { id: 'morning', label: 'সকাল', icon: '☀️' }, { id: 'lunch', label: 'দুপুর', icon: '🍲' }, { id: 'dinner', label: 'রাত', icon: '🌙' } ] as const).map(meal => {
                    const isActive = selfMeals[meal.id];
                    const currentLocked = editingDays.some(d => isLocked(d));
                    return (
                      <button 
                        key={meal.id} disabled={currentLocked} onClick={() => !currentLocked && setSelfMeals({ ...selfMeals, [meal.id]: !isActive })}
                        className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'} ${currentLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-2xl mb-1">{meal.icon}</span>
                        <span className="text-xs font-bold">{meal.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden mb-2">
                  <button onClick={() => setShowGuestMeals(!showGuestMeals)} className="w-full bg-slate-50 p-4 flex justify-between items-center hover:bg-slate-100">
                    <span className="font-bold text-slate-700 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> গেস্ট মিল যোগ করুন</span>
                    <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-200 ${showGuestMeals ? 'rotate-180' : ''}`}><ChevronRight className="w-3 h-3" /></div>
                  </button>
                  <AnimatePresence>
                    {showGuestMeals && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-white">
                        <div className="p-4 flex flex-col gap-4 border-t border-slate-100">
                          {([ { id: 'morning', label: 'সকাল' }, { id: 'lunch', label: 'দুপুর' }, { id: 'dinner', label: 'রাত' } ] as const).map(meal => {
                            const currentLocked = editingDays.some(d => isLocked(d));
                            return (
                              <div key={meal.id} className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">{meal.label}</span>
                                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                  <button disabled={currentLocked || guestMeals[meal.id] === 0} onClick={() => updateGuestMeal(meal.id, -1)} className="w-8 h-8 rounded-lg bg-white flex justify-center items-center shadow-sm text-slate-500 hover:text-rose-500 disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                                  <input type="number" value={guestMeals[meal.id]} disabled={currentLocked} onChange={e => { if(!currentLocked) setGuestMeals({ ...guestMeals, [meal.id]: parseInt(e.target.value) || 0 }) }} className="w-8 text-center font-black text-slate-800 bg-transparent focus:outline-none" />
                                  <button disabled={currentLocked} onClick={() => updateGuestMeal(meal.id, 1)} className="w-8 h-8 rounded-lg bg-white flex justify-center items-center shadow-sm text-slate-500 hover:text-emerald-500 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-6 pt-0 mt-2">
                {editingDays.some(d => isLocked(d)) ? <button onClick={closeModal} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold">ক্যানসেল</button> : <button onClick={() => handleSaveMeals(userName)} className="w-full py-4 bg-[#1e1b4b] text-white rounded-2xl text-sm font-bold shadow-xl flex items-center justify-center gap-2"><Check className="w-4 h-4" /> প্রসিড ও সেভ করুন</button>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

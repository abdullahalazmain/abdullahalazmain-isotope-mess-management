import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc, deleteField } from '../firebase';
import { listenToUserMeals, listenToAllMessMeals, saveMeal } from '../services/mealService';
import type { MealRecord, BazarRecord } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils, ShoppingCart, Calculator, Calendar as CalendarIcon,
  Plus, Check, X, AlertTriangle, Clock, Edit2, Minus, BellRing, MousePointer2, ChevronRight, ChevronLeft, Star, User
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
export default function MealsView({ isManager, messId, userId, userName, messData, members = [] }: { isManager?: boolean, messId?: string, userId?: string, userName?: string, messData?: any, members?: any[] }) {
  const [userMeals, setUserMeals] = useState<MealRecord[]>([]);
  const [allMessMeals, setAllMessMeals] = useState<MealRecord[]>([]);

  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bazarRecords, setBazarRecords] = useState<BazarRecord[]>([]);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  const todayStr = new Date().toISOString().split('T')[0];

  const assignedDuties = messData?.assignedDuties || {};
  const specialDays = messData?.specialDays || {};
  const isMarketDuty = assignedDuties[todayStr] === userName;
  const bazarTimers = messData?.bazarTimers || {};

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

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState<string | null>(null);

  const handleSaveMeals = async (userNameParam: string = 'User') => {
    const targetUserId = editingUserId || userId;
    const targetUserName = editingUserName || userNameParam;
    if (!messId || !targetUserId || editingDays.length === 0) return;
    const year = currentMonth.split('-')[0];
    const month = currentMonth.split('-')[1];

    try {
      for (const day of editingDays) {
        const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;

        // Check if day is locked by market
        const isBazarDone = bazarRecords.some(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done')) || bazarTimers[dateStr] === 'DONE';
        const expectedTimeMs = bazarTimers[dateStr];
        const hasTimeCrossed = typeof expectedTimeMs === 'number' && Date.now() > expectedTimeMs;
        const isBazarAssignedToMe = assignedDuties[dateStr] === userName;
        
        let isDayLocked = false;
        if (isMonthLocked) isDayLocked = true;
        else if (isManager && (monthDiff === 0 || monthDiff === 1)) isDayLocked = false;
        else if (isBazarAssignedToMe && monthDiff === 0) isDayLocked = false;
        else if (isBazarDone || hasTimeCrossed) isDayLocked = true;

        if (isDayLocked) {
          alert(`মে ${day} তারিখের বাজার সম্পন্ন হয়েছে বা সময় শেষ। মিল পরিবর্তন করা সম্ভব নয়।`);
          continue;
        }

        await saveMeal(
          messId, targetUserId, targetUserName, dateStr,
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
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(yearNum);
  const bengaliMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date().getDate();
  const realNow = new Date();
  const isCurrentMonth = currentMonth === realNow.toISOString().substring(0, 7);
  
  const monthDiff = (realNow.getFullYear() - yearNum) * 12 + ((realNow.getMonth() + 1) - monthNum);
  const clearedMonths: string[] = messData?.clearedMonths || [];
  const isMonthCleared = clearedMonths.includes(currentMonth);
  // Month is locked if it's explicitly cleared OR it's more than 1 month old
  const isMonthLocked = isMonthCleared || monthDiff > 1;
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

  const resetMealState = (dayArray: number[], targetUid?: string) => {
    const uidToUse = targetUid || editingUserId || userId;
    if (dayArray.length === 1 && dayArray[0]) {
      const dateStr = `${currentMonth}-${dayArray[0].toString().padStart(2, '0')}`;
      const existing = allMessMeals.find(m => m.date === dateStr && m.userId === uidToUse);
      if (existing) {
        setSelfMeals(existing.selfMeals || { morning: false, lunch: true, dinner: true });
        setGuestMeals(existing.guestMeals || { morning: 0, lunch: 0, dinner: 0 });
        return;
      }
    }
    setSelfMeals({ morning: false, lunch: true, dinner: true });
    setGuestMeals({ morning: 0, lunch: 0, dinner: 0 });
  };

  const handleResetMealsToZero = () => {
    setSelfMeals({ morning: false, lunch: false, dinner: false });
    setGuestMeals({ morning: 0, lunch: 0, dinner: 0 });
  };

  const handleClearMonth = async () => {
    if (!messId || !window.confirm(`${formatMonthYear(currentMonth)} এর হিসাব ক্লিয়ার করতে চান? এটি আর এডিট করা যাবে না।`)) return;
    try {
      const messRef = doc(db, 'messes', messId);
      const newCleared = [...clearedMonths, currentMonth];
      await updateDoc(messRef, { clearedMonths: newCleared });
    } catch (error) {
      console.error('Error clearing month:', error);
    }
  };

  const [bazarHrInput, setBazarHrInput] = useState('1');
  const [showTimerInput, setShowTimerInput] = useState(false);

  const handleBazarDoneConfirm = async () => {
    if (!messId) return;
    try {
      await updateDoc(doc(db, 'messes', messId), {
        [`bazarTimers.${todayStr}`]: 'DONE'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetBazarTimer = async () => {
    if (!messId) return;
    try {
      const hr = parseInt(bazarHrInput) || 1;
      const expectedTimeMs = Date.now() + (hr * 60 * 60 * 1000);
      await updateDoc(doc(db, 'messes', messId), {
        [`bazarTimers.${todayStr}`]: expectedTimeMs
      });
      setShowTimerInput(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentMonth}-${day.toString().padStart(2, '0')}`;
    const isBazarAssignedToMe = assignedDuties[dateStr] === userName;

    if (isMonthLocked) {
      alert('এই মাসের হিসাব ক্লিয়ার হয়ে গেছে বা অনেক পুরনো। আর এডিট করা সম্ভব নয়।');
      return;
    }

    if (isManager) {
      if (monthDiff === 0 || monthDiff === 1) {
        setManagerActionDay(day);
      } else {
        alert('ম্যানেজার হিসেবে আপনি শুধুমাত্র চলতি এবং গত মাসের মিল ম্যানেজ করতে পারবেন।');
      }
      return;
    }

    if (isBazarAssignedToMe && monthDiff === 0) {
      setManagerActionDay(day);
      return;
    }

    if (monthDiff !== 0) {
      alert('আপনি শুধু চলতি মাসের মিল এডিট করতে পারবেন।');
      return;
    }

    const isPastDay = day < today && monthDiff === 0;
    if (isPastDay && !multiSelectMode) {
      alert('অতীতের মিল এডিট করার সময় শেষ।');
      return;
    }

    if (multiSelectMode) {
      if (isPastDay) return;
      toggleDaySelection(day);
    } else {
      setEditingDays([day]);
      resetMealState([day]);
      setIsModalOpen(true);
    }
  };

  const toggleDaySelection = (day: number) => {
    const isPastDay = day < today && monthDiff === 0;
    if (isMonthLocked || monthDiff !== 0 || isPastDay) return;
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleMouseDown = (day: number) => {
    const isPastDay = day < today && monthDiff === 0;
    if (!multiSelectMode || isMonthLocked || monthDiff !== 0 || isPastDay) return;
    setIsDragging(true);
    toggleDaySelection(day);
  };

  const handleMouseEnter = (day: number) => {
    const isPastDay = day < today && monthDiff === 0;
    if (!isDragging || isMonthLocked || monthDiff !== 0 || isPastDay || selectedDays.includes(day)) return;
    toggleDaySelection(day);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMultiEditSubmit = () => {
    if (selectedDays.length === 0) return;
    setEditingDays(selectedDays);
    resetMealState(selectedDays);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDays([]);
    setSelfMeals({ morning: false, lunch: true, dinner: true });
    setGuestMeals({ morning: 0, lunch: 0, dinner: 0 });
    setEditingUserId(null);
    setEditingUserName(null);
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
    const isCurrentLocked = editingDays.some(d => isLocked(d));
    if (isCurrentLocked) return;
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
      if (m.selfMeals.morning) totalM += 1;
      if (m.selfMeals.lunch) totalM += 1;
      if (m.selfMeals.dinner) totalM += 1;
      totalM += (m.guestMeals?.morning || 0);
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
        if (m.selfMeals.morning) dayMeals += 1;
        if (m.selfMeals.lunch) dayMeals += 1;
        if (m.selfMeals.dinner) dayMeals += 1;
        dayMeals += (m.guestMeals?.morning || 0);
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
      setManagerActionDay(null);
    } catch (err) { console.error(err); }
  };

  const handleResetAssignDuty = async () => {
    if (!messId || !managerActionDay) return;
    try {
      const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
      const messRef = doc(db, 'messes', messId);
      await updateDoc(messRef, {
        [`assignedDuties.${dateStr}`]: deleteField()
      });
      setIsAssignDutyModalOpen(false);
      setSelectedMember('');
      setManagerActionDay(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveSpecialDay = async () => {
    if (!messId || !eventName || !managerActionDay) return;
    try {
      const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
      const messRef = doc(db, 'messes', messId);
      await updateDoc(messRef, {
        [`specialDays.${dateStr}`]: `${eventName} (${eventTime})`
      });
      setIsSpecialDayModalOpen(false);
      setEventName('');
      setEventTime('সারাদিন');
      setManagerActionDay(null);
    } catch (err) { console.error(err); }
  };

  const handleResetSpecialDay = async () => {
    if (!messId || !managerActionDay) return;
    try {
      const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
      const messRef = doc(db, 'messes', messId);
      await updateDoc(messRef, {
        [`specialDays.${dateStr}`]: deleteField()
      });
      setIsSpecialDayModalOpen(false);
      setEventName('');
      setEventTime('সারাদিন');
      setManagerActionDay(null);
    } catch (err) { console.error(err); }
  };

  const specialTimes = ['সারাদিন', 'সকাল', 'দুপুর', 'রাত'];
  const [eventTime, setEventTime] = useState('সারাদিন');

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

      {/* Bazar Warning Banner (For All Members if timer is set and not done) */}
      {(() => {
        const expectedMs = bazarTimers[todayStr];
        const isBazarDone = bazarRecords.some(r => r.date.startsWith(todayStr) && (r.status === 'Approved' || r.status === 'Done')) || expectedMs === 'DONE';
        if (!isBazarDone && typeof expectedMs === 'number') {
          const diffMs = expectedMs - Date.now();
          if (diffMs > 0) {
            const hrs = Math.ceil(diffMs / (1000 * 60 * 60));
            return (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <p className="text-rose-700 font-bold text-sm">
                  আর {hrs} hr পর বাজার হয়ে যাবে। তারাতারি আপনার মিল সেট করুন।
                </p>
              </div>
            );
          } else {
            return (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <p className="text-rose-700 font-bold text-sm">
                  বাজার করার সময় শেষ হয়ে গেছে। এখন আর মিল পরিবর্তন করা সম্ভব নয়।
                </p>
              </div>
            );
          }
        }
        return null;
      })()}

      {/* Bazar Duty Banner (If it's your duty and not done) */}
      {isMarketDuty && (() => {
        const isBazarDone = bazarRecords.some(r => r.date.startsWith(todayStr) && (r.status === 'Approved' || r.status === 'Done')) || bazarTimers[todayStr] === 'DONE';
        if (isBazarDone) return null;
        return (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-6 shadow-md mb-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">আজকে আপনার বাজারের ডিউটি!</h3>
                <p className="text-sm font-semibold text-slate-500">সবার মিল লক করার জন্য বাজার স্ট্যাটাস বা সময় আপডেট করুন।</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 w-full lg:w-auto min-w-[280px]">
              {!showTimerInput ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-bold text-slate-700 text-center">তুমি কি বাজার করেছ?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowTimerInput(true)} className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors flex-1 border border-rose-200 text-sm">না</button>
                    <button onClick={handleBazarDoneConfirm} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex-1 shadow-sm shadow-emerald-200 text-sm">হ্যাঁ</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-bold text-slate-700 text-center">কখন বাজার করবে?</p>
                  <div className="flex gap-2 items-center justify-center">
                    <input 
                      type="number" 
                      min="1" 
                      max="24" 
                      value={bazarHrInput} 
                      onChange={(e) => setBazarHrInput(e.target.value)}
                      className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-800"
                    />
                    <span className="text-sm font-bold text-slate-600">ঘন্টা পর</span>
                    <button onClick={handleSetBazarTimer} className="ml-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm text-sm">সেভ করুন</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Month Clear Banner (Only for Manager, only for Last Month if not cleared) */}
      {isManager && monthDiff === 1 && !isMonthCleared && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-3xl p-6 shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">হিসাব ক্লিয়ার হয়েছে?</h3>
              <p className="text-sm font-semibold text-slate-500">{formatMonthYear(currentMonth)} মাসের হিসাব সম্পন্ন হলে ক্লিয়ার করুন। ক্লিয়ার করলে এই মাসের কোনো তথ্য কেউ আর এডিট করতে পারবে না।</p>
            </div>
          </div>

          <div className="flex gap-3 shrink-0">
            <button onClick={handleClearMonth} className="px-6 py-3 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors shadow-sm">
              হ্যাঁ, ক্লিয়ার হয়েছে
            </button>
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
                  <button
                    onClick={() => { setPickerYear(yearNum); setIsMonthPickerOpen(!isMonthPickerOpen); }}
                    className="font-black text-slate-700 text-sm whitespace-nowrap hover:text-[#6366f1] transition-colors px-2 py-1 rounded-lg"
                  >
                    {formatMonthYear(currentMonth)}
                  </button>

                  <AnimatePresence>
                    {isMonthPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-4 z-50 w-[280px]"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <button onClick={() => setPickerYear(pickerYear - 1)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#6366f1] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                          <input
                            type="number"
                            value={pickerYear}
                            onChange={(e) => setPickerYear(parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-20 text-center font-black text-slate-800 bg-transparent focus:outline-none"
                          />
                          <button onClick={() => setPickerYear(pickerYear + 1)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#6366f1] transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {bengaliMonths.map((m, i) => {
                            const isSelected = pickerYear === yearNum && (i + 1) === monthNum;
                            return (
                              <button
                                key={m}
                                onClick={() => {
                                  setCurrentMonth(`${pickerYear}-${(i + 1).toString().padStart(2, '0')}`);
                                  setIsMonthPickerOpen(false);
                                  setSelectedDays([]);
                                  setMultiSelectMode(false);
                                }}
                                className={`py-2 rounded-xl text-[10px] font-bold transition-all ${isSelected ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-[#6366f1]'}`}
                              >
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        if (meal.selfMeals?.morning) count += 1;
                        if (meal.selfMeals?.lunch) count += 1;
                        if (meal.selfMeals?.dinner) count += 1;
                        const guestCount = (meal.guestMeals?.morning || 0) + (meal.guestMeals?.lunch || 0) + (meal.guestMeals?.dinner || 0);
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
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-[#6366f1]" /> {String(member)}</span>
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

              {/* OVERVIEW CARDS */}
              {managerActionDay && (() => {
                const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
                const special = specialDays[dateStr];
                const duty = assignedDuties[dateStr];
                const myMeal = userMeals.find(m => m.date === dateStr);
                const myMealCount = myMeal ? (
                  (myMeal.selfMeals?.morning ? 1 : 0) +
                  (myMeal.selfMeals?.lunch ? 1 : 0) +
                  (myMeal.selfMeals?.dinner ? 1 : 0) +
                  (myMeal.guestMeals?.morning || 0) +
                  (myMeal.guestMeals?.lunch || 0) +
                  (myMeal.guestMeals?.dinner || 0)
                ) : null;
                return (
                  <div className="px-5 pt-5 pb-2 flex flex-col gap-3">
                    <div className="flex gap-3">
                      {/* Own Meal Card */}
                      <div className="flex-1 bg-gradient-to-br from-[#6366f1]/5 to-[#818cf8]/10 border border-[#6366f1]/20 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                        <h4 className="font-bold text-[#4338ca] text-sm mb-1">মিল</h4>
                        <p className="text-3xl font-black text-[#6366f1]">{myMealCount !== null ? myMealCount : '—'}</p>
                      </div>

                      {/* Special Day Card */}
                      <div className={`flex-[1.5] rounded-2xl p-4 flex flex-col justify-center border ${special ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm shadow-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className={`w-4 h-4 ${special ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                          <h4 className={`font-black text-sm ${special ? 'text-amber-800' : 'text-slate-500'}`}>বিশেষ দিন</h4>
                        </div>
                        {special ? (() => {
                          const specialName = special.split(' (')[0];
                          const specialTimeMatch = special.match(/\((.*?)\)/);
                          const specialTime = specialTimeMatch ? specialTimeMatch[1] : 'সারাদিন';
                          return (
                            <div className="text-left ml-1 mt-1">
                              <p className="text-sm font-black text-amber-800 leading-tight mb-0.5">{specialName}</p>
                              <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider">{specialTime}</p>
                            </div>
                          );
                        })() : (
                          <p className="text-xs font-bold text-slate-400 ml-1">কোনো ইভেন্ট নেই</p>
                        )}
                      </div>
                    </div>

                    {/* Duty Bar */}
                    {duty ? (() => {
                      const dutyMember = members.find(m => m.name === duty);
                      return (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-200/50 mt-1">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 text-white/80" />
                            <div>
                              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider leading-none mb-1">আজকে বাজার করবেন</p>
                              <p className="text-white font-black text-sm leading-none">{String(duty)}</p>
                            </div>
                          </div>
                          {dutyMember?.photoURL ? (
                            <img src={dutyMember.photoURL} alt={String(duty)} className="w-8 h-8 rounded-full border-2 border-white/40 shadow-sm object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-center mt-1">
                        <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" /> বাজার দিন অ্যাসাইন করা হয়নি
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-4 flex flex-col gap-2">
                <button
                  onClick={() => { setEditingDays([managerActionDay]); resetMealState([managerActionDay]); setIsModalOpen(true); setManagerActionDay(null); }}
                  className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-[#6366f1]/10 hover:text-[#6366f1] text-slate-700 font-bold rounded-2xl transition-colors flex items-center gap-3"
                >
                  <Utensils className="w-5 h-5" /> নিজের মিল সেট করুন
                </button>
                <button
                  onClick={() => {
                    const dateStr = `${currentMonth}-${managerActionDay?.toString().padStart(2, '0')}`;
                    let existingSpecial = specialDays[dateStr] || '';
                    let foundTime = 'সারাদিন';
                    for (const t of specialTimes) {
                      if (existingSpecial.endsWith(` (${t})`)) {
                        foundTime = t;
                        existingSpecial = existingSpecial.replace(` (${t})`, '');
                        break;
                      }
                    }
                    setEventName(existingSpecial);
                    setEventTime(foundTime);
                    setIsSpecialDayModalOpen(true);
                  }}
                  className="w-full text-left px-5 py-4 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold rounded-2xl transition-colors flex items-center gap-3"
                >
                  <Star className="w-5 h-5" /> বিশেষ দিন (Special Day) তৈরি করুন
                </button>
                <button
                  onClick={() => {
                    const dateStr = `${currentMonth}-${managerActionDay?.toString().padStart(2, '0')}`;
                    setSelectedMember(assignedDuties[dateStr] || '');
                    setIsAssignDutyModalOpen(true);
                  }}
                  className="w-full text-left px-5 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-2xl transition-colors flex items-center gap-3"
                >
                  <User className="w-5 h-5" /> বাজার দিন অ্যাসাইন করুন
                </button>
              </div>

              {/* Day Overview Member List */}
              <div className="px-5 pb-5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">এই দিনের মিলের তালিকা</h4>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1.5 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {members.map(member => {
                    const dateStr = `${currentMonth}-${managerActionDay?.toString().padStart(2, '0')}`;
                    const memberMeal = allMessMeals.find(m => m.userId === member.uid && m.date === dateStr);
                    let memberTotal = 0;
                    if (memberMeal) {
                      if (memberMeal.selfMeals?.morning) memberTotal += 1;
                      if (memberMeal.selfMeals?.lunch) memberTotal += 1;
                      if (memberMeal.selfMeals?.dinner) memberTotal += 1;
                      memberTotal += (memberMeal.guestMeals?.morning || 0);
                      memberTotal += (memberMeal.guestMeals?.lunch || 0);
                      memberTotal += (memberMeal.guestMeals?.dinner || 0);
                    }
                    return (
                      <div 
                        key={member.uid} 
                        onClick={() => {
                          setEditingUserId(member.uid);
                          setEditingUserName(member.name);
                          setEditingDays([managerActionDay as number]);
                          resetMealState([managerActionDay as number], member.uid);
                          setIsModalOpen(true);
                          setManagerActionDay(null);
                        }}
                        className="flex items-center justify-between px-3 py-2 hover:bg-[#6366f1]/10 rounded-xl transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          {member.photoURL ? (
                            <img src={member.photoURL} alt={member.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-slate-500" />
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-700 group-hover:text-[#6366f1] transition-colors">{member.name}</span>
                        </div>
                        <span className={`text-sm font-black transition-colors ${memberTotal > 0 ? 'text-[#6366f1]' : 'text-slate-400 group-hover:text-[#6366f1]/50'}`}>{memberTotal > 0 ? memberTotal : '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SPECIAL DAY MODAL */}
      <AnimatePresence>
        {isSpecialDayModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsSpecialDayModalOpen(false); setManagerActionDay(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Star className="w-8 h-8" /></div>
              <h3 className="text-xl font-black text-slate-800 text-center mb-2">বিশেষ দিন যোগ করুন</h3>
              <p className="text-xs font-semibold text-slate-500 text-center mb-6">উক্ত দিনে ক্যালেন্ডারে একটি স্পেশাল হাইলাইট দেখাবে।</p>
              <input
                type="text" placeholder="ইভেন্টের নাম (যেমন: পিকনিক)" value={eventName} onChange={e => setEventName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              {/* Modern Custom Dropdown for time */}
              <div className="relative mb-6">
                <div
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl flex justify-between items-center cursor-pointer hover:border-amber-300 transition-colors"
                >
                  <span>{eventTime || "সময় সিলেক্ট করুন"}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isTimeDropdownOpen ? 'rotate-90' : ''}`} />
                </div>
                <AnimatePresence>
                  {isTimeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-xl z-10 overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {specialTimes.map(t => (
                          <div
                            key={t}
                            onClick={() => { setEventTime(t); setIsTimeDropdownOpen(false); }}
                            className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${eventTime === t ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50 hover:text-amber-500'}`}
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResetSpecialDay}
                  className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >রিসেট</button>
                <button
                  onClick={handleSaveSpecialDay}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200"
                >সেভ করুন</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN DUTY MODAL */}
      <AnimatePresence>
        {isAssignDutyModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAssignDutyModalOpen(false); setManagerActionDay(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 mx-auto"><User className="w-8 h-8" /></div>
              <h3 className="text-xl font-black text-slate-800 text-center mb-2">বাজার দিন অ্যাসাইন</h3>
              <p className="text-xs font-semibold text-slate-500 text-center mb-6">মে {managerActionDay} তারিখের জন্য মেম্বার সিলেক্ট করুন।</p>
              {/* Modern Custom Dropdown for member */}
              <div className="relative mb-6">
                <div
                  onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl flex justify-between items-center cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <span className="truncate">{selectedMember || "মেম্বার সিলেক্ট করুন"}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isMemberDropdownOpen ? 'rotate-90' : ''}`} />
                </div>
                <AnimatePresence>
                  {isMemberDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-xl z-10 overflow-hidden"
                    >
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {members.map(m => (
                          <div
                            key={m.uid}
                            onClick={() => { setSelectedMember(m.name); setIsMemberDropdownOpen(false); }}
                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedMember === m.name ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                          >
                            {m.photoURL ? (
                              <img src={m.photoURL} alt={m.name} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-emerald-600" />
                              </div>
                            )}
                            <span className={`text-sm font-bold ${selectedMember === m.name ? 'text-emerald-600' : 'text-slate-600'}`}>{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleResetAssignDuty}
                  className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >রিসেট</button>
                <button
                  onClick={handleAssignDuty}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200"
                >অ্যাসাইন করুন</button>
              </div>
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
                  {([{ id: 'morning', label: 'সকাল', icon: '☀️' }, { id: 'lunch', label: 'দুপুর', icon: '🍲' }, { id: 'dinner', label: 'রাত', icon: '🌙' }] as const).map(meal => {
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
                          {([{ id: 'morning', label: 'সকাল' }, { id: 'lunch', label: 'দুপুর' }, { id: 'dinner', label: 'রাত' }] as const).map(meal => {
                            const currentLocked = editingDays.some(d => isLocked(d));
                            return (
                              <div key={meal.id} className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600">{meal.label}</span>
                                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                  <button disabled={currentLocked || guestMeals[meal.id] === 0} onClick={() => updateGuestMeal(meal.id, -1)} className="w-8 h-8 rounded-lg bg-white flex justify-center items-center shadow-sm text-slate-500 hover:text-rose-500 disabled:opacity-50"><Minus className="w-4 h-4" /></button>
                                  <input type="number" value={guestMeals[meal.id]} disabled={currentLocked} onChange={e => { if (!currentLocked) setGuestMeals({ ...guestMeals, [meal.id]: parseInt(e.target.value) || 0 }) }} className="w-8 text-center font-black text-slate-800 bg-transparent focus:outline-none" />
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

              <div className="p-6 pt-0 mt-2 flex gap-3">
                {editingDays.some(d => isLocked(d)) ? (
                  <button onClick={closeModal} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold">ক্যানসেল</button>
                ) : (
                  <>
                    <button onClick={handleResetMealsToZero} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold shadow-sm hover:bg-slate-200">রিসেট</button>
                    <button onClick={() => handleSaveMeals(userName)} className="flex-1 py-4 bg-[#1e1b4b] text-white rounded-2xl text-sm font-bold shadow-xl flex items-center justify-center gap-2"><Check className="w-4 h-4" /> প্রসিড ও সেভ করুন</button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

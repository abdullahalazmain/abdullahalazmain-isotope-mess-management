import React, { useState, useEffect, useMemo } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc, deleteField } from '../firebase';
import { listenToUserMeals, listenToAllMessMeals, saveMeal } from '../services/mealService';
import type { MealRecord, BazarRecord } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils, ShoppingCart, Calculator, Calendar as CalendarIcon,
  Plus, Check, X, AlertTriangle, Clock, Edit2, Minus, BellRing, MousePointer2, ChevronRight, ChevronLeft, Star, User, Wallet
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
export default function MealsView({ 
  isManager, messId, userId, userName, messData, members = [], financials, messFinancials, fullLedger = [], fullMessStats 
}: { 
  isManager?: boolean, messId?: string, userId?: string, userName?: string, messData?: any, members?: any[], financials?: any, messFinancials?: any, fullLedger?: any[], fullMessStats?: any 
}) {
  const [userMeals, setUserMeals] = useState<MealRecord[]>([]);
  const [allMessMeals, setAllMessMeals] = useState<MealRecord[]>([]);

  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDay, setDragStartDay] = useState<number | null>(null);
  const longPressTimer = React.useRef<any>(null);
  const [bazarRecords, setBazarRecords] = useState<BazarRecord[]>([]);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [managerViewType, setManagerViewType] = useState<'own' | 'mess'>('own');

  const viewType = isManager ? managerViewType : 'own';

  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7)); // 'YYYY-MM'
  const todayStr = new Date().toISOString().split('T')[0];

  const assignedDuties = messData?.assignedDuties || {};
  const specialDays = messData?.specialDays || {};
  const isMarketDuty = assignedDuties[todayStr] === userId || assignedDuties[todayStr] === userName;
  const bazarTimers = messData?.bazarTimers || {};

  // Helper to find member reliably by UID or Name
  const getMemberData = (idOrName: string) => {
    if (!idOrName) return null;
    return members.find(m => m.uid === idOrName) || members.find(m => m.name === idOrName);
  };

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
  const todayDate = new Date();
  const today = todayDate.getDate();
  const realNow = todayDate;
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
    if (!messId) return;
    try {
      const messRef = doc(db, 'messes', messId);
      const newCleared = [...clearedMonths, currentMonth];
      await updateDoc(messRef, { clearedMonths: newCleared });
      alert(`${formatMonthYear(currentMonth)} এর হিসাব সফলভাবে ক্লিয়ার করা হয়েছে।`);
    } catch (error) {
      console.error('Error clearing month:', error);
      alert('হিসাব ক্লিয়ার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
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
    // If month is completely locked, no one can interact
    if (isMonthLocked) {
      setManagerActionDay(day);
      return;
    }

    if (multiSelectMode) {
      const isPastDay = day < today && monthDiff === 0;
      if (isPastDay && !isManager) return;
      if (monthDiff !== 0 && !isManager) return;
      toggleDaySelection(day);
      return;
    }

    // Always open the Day Overview Modal for everyone!
    setManagerActionDay(day);
  };

  const toggleDaySelection = (day: number) => {
    const isPastDay = day < today && monthDiff === 0;
    if (isMonthLocked || monthDiff !== 0 || isPastDay) return;
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleMouseDown = (day: number) => {
    if (!multiSelectMode || isMonthLocked || monthDiff !== 0) return;
    const isPastDay = day < today && monthDiff === 0;
    if (isPastDay && !isManager) return;

    setIsDragging(true);
    setDragStartDay(day);
    setSelectedDays([day]);
  };

  const handleMouseEnter = (day: number) => {
    if (!isDragging || dragStartDay === null) return;
    const isPastDay = day < today && monthDiff === 0;
    if (isPastDay && !isManager) return;

    const start = Math.min(dragStartDay, day);
    const end = Math.max(dragStartDay, day);
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    // For non-managers, filter out past days in the range
    const filteredRange = isManager ? range : range.filter(d => d >= today);
    setSelectedDays(filteredRange);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDay(null);
  };

  const handleTouchStart = (day: number) => {
    if (isMonthLocked || monthDiff !== 0) return;
    const isPastDay = day < today && monthDiff === 0;
    if (isPastDay && !isManager) return;

    // Mobile: Long press (1s) to enter multi-select and start dragging
    longPressTimer.current = setTimeout(() => {
      setMultiSelectMode(true);
      setIsDragging(true);
      setDragStartDay(day);
      setSelectedDays([day]);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 1000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartDay === null) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dayAttr = element?.closest('[data-day]')?.getAttribute('data-day');
    
    if (dayAttr) {
      const day = parseInt(dayAttr);
      const isPastDay = day < today && monthDiff === 0;
      if (isPastDay && !isManager) return;

      const start = Math.min(dragStartDay, day);
      const end = Math.max(dragStartDay, day);
      const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const filteredRange = isManager ? range : range.filter(d => d >= today);
      setSelectedDays(filteredRange);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isDragging) {
      // If we were dragging, keep the selection but stop dragging state
      setIsDragging(false);
      setDragStartDay(null);
    }
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
      const [y, m] = currentMonth.split('-');
      const monthName = bengaliMonths[parseInt(m) - 1];
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-xl p-3 text-xs font-bold">
          <p className="text-slate-800 mb-1">{monthName} {label}</p>
          <p className="text-emerald-500">মিল রেট: ৳ {data.rate}</p>
          <p className="text-indigo-500">মোট বাজার: ৳ {data.market}</p>
          <p className="text-rose-500">মোট মিল: {data.meals}</p>
        </div>
      );
    }
    return null;
  };

  const stats = useMemo(() => {
    let messTotalM = 0;
    let ownTotalM = 0;

    const filteredMeals = allMessMeals.filter(m => m.date.startsWith(currentMonth));

    filteredMeals.forEach(m => {
      let mMeals = 0;
      if (m.selfMeals.morning) mMeals += 1;
      if (m.selfMeals.lunch) mMeals += 1;
      if (m.selfMeals.dinner) mMeals += 1;
      mMeals += (m.guestMeals?.morning || 0);
      mMeals += (m.guestMeals?.lunch || 0);
      mMeals += (m.guestMeals?.dinner || 0);
      
      messTotalM += mMeals;
      if (m.userId === userId) {
        ownTotalM += mMeals;
      }
    });

    const filteredBazar = bazarRecords.filter(r => r.date.startsWith(currentMonth));

    const messTotalMar = filteredBazar
      .filter(r => r.status === 'Approved' || r.status === 'Done')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const ownTotalMar = filteredBazar
      .filter(r => (r.status === 'Approved' || r.status === 'Done') && r.submittedBy === userId)
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const rate = messTotalM > 0 ? (messTotalMar / messTotalM) : 0;

    const messChartData = days.map(d => {
      const dateStr = `${currentMonth}-${d.toString().padStart(2, '0')}`;

      let dayMeals = 0;
      let ownDayMeals = 0;

      allMessMeals.filter(m => m.date === dateStr).forEach(m => {
        let dm = 0;
        if (m.selfMeals.morning) dm += 1;
        if (m.selfMeals.lunch) dm += 1;
        if (m.selfMeals.dinner) dm += 1;
        dm += (m.guestMeals?.morning || 0) + (m.guestMeals?.lunch || 0) + (m.guestMeals?.dinner || 0);
        
        dayMeals += dm;
        if (m.userId === userId) ownDayMeals += dm;
      });

      const dayMarket = bazarRecords
        .filter(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done'))
        .reduce((sum, r) => sum + r.totalAmount, 0);
      
      const ownDayMarket = bazarRecords
        .filter(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done') && r.submittedBy === userId)
        .reduce((sum, r) => sum + r.totalAmount, 0);

      const dayRate = dayMeals > 0 ? Math.round((dayMarket / dayMeals) * 10) / 10 : 0;

      return {
        day: d.toString(),
        meals: dayMeals,
        market: dayMarket,
        ownMeals: ownDayMeals,
        ownMarket: ownDayMarket,
        rate: dayRate
      };
    });

    // Calculate a monthly ledger for the currently selected month
    const currentMonthLedger = members.map(m => {
      let memberMeals = 0;
      filteredMeals.filter(meal => meal.userId === m.uid).forEach(meal => {
        let count = 0;
        if (meal.selfMeals?.morning) count += 1;
        if (meal.selfMeals?.lunch) count += 1;
        if (meal.selfMeals?.dinner) count += 1;
        count += (meal.guestMeals?.morning || 0) + (meal.guestMeals?.lunch || 0) + (meal.guestMeals?.dinner || 0);
        memberMeals += count;
      });

      const memberBazar = filteredBazar
        .filter(r => r.submittedBy === m.uid && (r.status === 'Approved' || r.status === 'Done'))
        .reduce((sum, r) => sum + r.totalAmount, 0);

      const memberBalance = memberBazar - (memberMeals * rate);

      return { uid: m.uid, name: m.name, balance: memberBalance };
    });

    const messPositiveBalance = currentMonthLedger.reduce((sum, member) => sum + (member.balance > 0 ? member.balance : 0), 0);
    const messNegativeBalance = currentMonthLedger.reduce((sum, member) => sum + (member.balance < 0 ? Math.abs(member.balance) : 0), 0);
    const ownMonthBalance = currentMonthLedger.find(m => m.uid === userId)?.balance || 0;

    return { 
      totalMeals: viewType === 'own' ? ownTotalM : messTotalM, 
      totalMarket: viewType === 'own' ? ownTotalMar : messTotalMar, 
      mealRate: rate, 
      chartData: messChartData,
      messPositiveBalance,
      messNegativeBalance,
      ownMonthBalance
    };
  }, [allMessMeals, bazarRecords, currentMonth, days, viewType, userId, members]);

  const { totalMeals, totalMarket, mealRate, chartData, messPositiveBalance, messNegativeBalance, ownMonthBalance } = stats;

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
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">মিলের হিসাব</h1>
            <p className="text-sm font-semibold text-slate-500">ক্যালেন্ডার ও বাজার ট্র্যাকিং</p>
          </div>
        </div>
        
        {isManager && (
          <div className="flex bg-white/70 backdrop-blur-md border border-slate-200 p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => setManagerViewType('own')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${managerViewType === 'own' ? 'bg-[#6366f1] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              আমার ওভারভিউ
            </button>
            <button
              onClick={() => setManagerViewType('mess')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${managerViewType === 'mess' ? 'bg-[#6366f1] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              মেসের ওভারভিউ
            </button>
          </div>
        )}
      </div>

      {/* Top Overview Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${viewType === 'mess' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6 mb-8`}>
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">সর্বমোট মিল ({bengaliMonths[monthNum-1]})</p>
            <h3 className="text-3xl font-black text-slate-900">{totalMeals}</h3>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">সর্বমোট বাজার</p>
            <h3 className="text-3xl font-black text-slate-900">৳ {totalMarket.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-900 text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">বর্তমান মিল রেট</p>
            <h3 className="text-3xl font-black text-slate-900">৳ {mealRate.toFixed(2)}</h3>
          </div>
        </div>

        {viewType === 'mess' ? (
          <>
            <div className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400 shadow-xl shadow-emerald-200 rounded-3xl p-6 flex items-center gap-4 text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-sm border border-white/20">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">পাবে (Balance)</p>
                <h3 className="text-3xl font-black">৳ {Math.round(messPositiveBalance).toLocaleString()}</h3>
              </div>
            </div>
            <div className="bg-rose-500/90 backdrop-blur-md border border-rose-400 shadow-xl shadow-rose-200 rounded-3xl p-6 flex items-center gap-4 text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-sm border border-white/20">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">দিবে (Balance)</p>
                <h3 className="text-3xl font-black">৳ {Math.round(messNegativeBalance).toLocaleString()}</h3>
              </div>
            </div>
          </>
        ) : (
          (() => {
            // Always use our calculated month balance for past/future months
            const balanceAmount = ownMonthBalance;
            const isReceive = balanceAmount >= 0;
            const absBalance = Math.abs(Math.round(balanceAmount));
            
            return (
              <div className={`${isReceive ? 'bg-emerald-500/90' : 'bg-rose-500/90'} backdrop-blur-md border ${isReceive ? 'border-emerald-400 shadow-emerald-200' : 'border-rose-400 shadow-rose-200'} shadow-xl rounded-3xl p-6 flex items-center gap-4 text-white transition-colors`}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-sm border border-white/20">
                  <Wallet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">{isReceive ? 'পাবে (Balance)' : 'দিবে (Balance)'}</p>
                  <h3 className="text-3xl font-black">৳ {absBalance.toLocaleString()}</h3>
                </div>
              </div>
            );
          })()
        )}
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
              হ্যাঁ, ক্লিয়ার আছে
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid: Calendar + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">



        {/* Calendar Section */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-6 h-full">
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
              const isSelected = selectedDays.includes(d);
              const dateStr = `${currentMonth}-${d.toString().padStart(2, '0')}`;
              const isSpecial = specialDays[dateStr];
              
              const meal = userMeals.find(m => m.date === dateStr);
              let count = 0;
              let hasMeal = false;
              if (meal) {
                if (meal.selfMeals?.morning) { count += 1; hasMeal = true; }
                if (meal.selfMeals?.lunch) { count += 1; hasMeal = true; }
                if (meal.selfMeals?.dinner) { count += 1; hasMeal = true; }
                const guestCount = (meal.guestMeals?.morning || 0) + (meal.guestMeals?.lunch || 0) + (meal.guestMeals?.dinner || 0);
                if (guestCount > 0) hasMeal = true;
                count += guestCount;
              }

              const isPastDay = monthDiff > 0 || (monthDiff === 0 && d < today);
              const isUpcomingOrRunning = !isPastDay;
              const isToday = monthDiff === 0 && d === today;

              return (
                <div
                  key={d}
                  data-day={d}
                  onClick={() => !isDragging && handleDayClick(d)}
                  onMouseDown={() => handleMouseDown(d)}
                  onMouseEnter={() => handleMouseEnter(d)}
                  onMouseUp={handleMouseUp}
                  onTouchStart={() => handleTouchStart(d)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`
                    aspect-square rounded-2xl transition-all cursor-pointer relative overflow-hidden group border
                    ${isSelected ? 'bg-indigo-600 border-indigo-700 shadow-lg' : isToday ? 'bg-indigo-50 border-[#6366f1]' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'}
                  `}
                >
                  {/* Date in top left */}
                  <div className={`absolute top-2 left-3 text-[13px] font-black z-20 ${isSelected ? 'text-white/80' : isPastDay ? 'text-[#94a3b8]' : 'text-slate-900'}`}>
                    {d}
                  </div>

                  {/* Meal Value in middle */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className={`text-3xl font-black ${isSelected ? 'text-white' : 'text-[#6366f1]'}`}>
                      {hasMeal ? count : (isUpcomingOrRunning ? <Plus className="w-8 h-8" strokeWidth={4} /> : '0')}
                    </span>
                  </div>

                  {isSelected && <div className="absolute inset-0 bg-white/10 z-0"></div>}
                  {isSpecial && <div className={`absolute bottom-1.5 w-full text-center text-[7px] font-black uppercase tracking-widest px-1 truncate z-20 ${isSelected ? 'text-white/70' : 'text-amber-600'}`}>{isSpecial}</div>}
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
        </div>

        {/* Assignment Section */}
        <div className="lg:col-span-5 h-full">
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-6 flex flex-col h-full overflow-hidden">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-indigo-500" /> বাজারের দিন
            </h3>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(assignedDuties).filter(([dateStr]) => dateStr.startsWith(currentMonth)).length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-sm font-bold">কোনো ডিউটি অ্যাসাইন করা হয়নি</p>
                </div>
              )}
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

                const duties = Object.entries(assignedDuties)
                  .filter(([dateStr]) => dateStr.startsWith(currentMonth))
                  .sort();

                if (duties.length === 0) return null;

                return duties.map(([dateStr, member]) => {
                    const dayNum = parseInt(dateStr.split('-')[2]) || 0;
                    const memberIdOrName = String(member);
                    const memberObj = getMemberData(memberIdOrName);
                    const displayName = memberObj?.name || memberIdOrName;
                    
                    if (!nameToColorMap[displayName]) {
                      nameToColorMap[displayName] = colors[colorIdx % colors.length];
                      colorIdx++;
                    }
                    return (
                      <div key={dateStr} className={`flex justify-between items-center p-3 rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-pointer ${nameToColorMap[displayName]}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
                            {dayNum}
                          </div>
                          <div className="flex items-center gap-2">
                            {memberObj?.photoURL ? (
                              <img src={memberObj.photoURL} alt={displayName} className="w-7 h-7 rounded-full object-cover border border-white/40" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white/40 flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">বাজার ডিউটি</p>
                              <h4 className="text-sm font-black truncate max-w-[120px]">{displayName}</h4>
                            </div>
                          </div>
                        </div>
                        <CalendarIcon className="w-4 h-4 opacity-40" />
                      </div>
                    );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Full width Graph Section */}
        <div className="lg:col-span-12 mt-8">
          {/* Graph Card */}
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-[2rem] p-8 min-h-[450px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-xl mb-8 flex items-center gap-3">
              <Calculator className="w-6 h-6 text-indigo-500" /> খরচ বনাম মিল গ্রাফ
            </h3>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }} />
                  <Line yAxisId="left" type="monotone" dataKey="market" stroke="#6366f1" strokeWidth={5} dot={{ r: 6, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }} />
                  <Line yAxisId="right" type="monotone" dataKey="meals" stroke="#f43f5e" strokeWidth={5} dot={{ r: 6, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#f43f5e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></div>
                <span className="text-xs font-bold text-slate-500">মোট বাজার</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div>
                <span className="text-xs font-bold text-slate-500">মোট মিল</span>
              </div>
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
                  <p className="text-xs font-bold text-slate-500">{formatMonthYear(currentMonth)} {managerActionDay} তারিখের জন্য</p>
                </div>
                <button onClick={() => setManagerActionDay(null)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-800"><X className="w-4 h-4" /></button>
              </div>

              {/* OVERVIEW CARDS */}
              {managerActionDay && (() => {
                const dateStr = `${currentMonth}-${managerActionDay.toString().padStart(2, '0')}`;
                const special = specialDays[dateStr];
                const duty = assignedDuties[dateStr];
                const dutyMember = getMemberData(duty);
                const dutyName = dutyMember?.name || duty;
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
                    {duty ? (
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-200/50 mt-1">
                          <div className="flex items-center gap-3">
                            <ShoppingCart className="w-5 h-5 text-white/80" />
                            <div>
                              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider leading-none mb-1">আজকে বাজার করবেন</p>
                              <p className="text-white font-black text-sm leading-none">{dutyName}</p>
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
                    ) : (
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
                {(() => {
                  const day = managerActionDay as number;
                  const dateStr = `${currentMonth}-${day.toString().padStart(2, '0')}`;
                  const expectedTimeMs = bazarTimers[dateStr];
                  const isBazarDone = bazarRecords.some(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done')) || expectedTimeMs === 'DONE';
                  
                  const isBazarAssignedToMe = assignedDuties[dateStr] === userId || (userName && assignedDuties[dateStr] === userName);
                  
                  // Comprehensive lock logic for the current user
                  const isPastDayForMember = !isManager && !isBazarAssignedToMe && monthDiff === 0 && day < today;
                  const hasTimeCrossed = !isManager && !isBazarAssignedToMe && typeof expectedTimeMs === 'number' && Date.now() > expectedTimeMs;
                  const isWrongMonthForMember = !isManager && !isBazarAssignedToMe && monthDiff !== 0;

                  const isEffectivelyLocked = isMonthLocked || isBazarDone || isPastDayForMember || hasTimeCrossed || isWrongMonthForMember;

                  if (isEffectivelyLocked) return (
                    <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-1 text-center">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <p className="text-xs font-bold text-slate-500">এই দিনের হিসাব লক করা হয়েছে</p>
                      <p className="text-[10px] text-slate-400 mt-1">কোনো সমস্যা থাকলে ম্যানেজারের সাথে যোগাযোগ করুন।</p>
                    </div>
                  );

                  return (
                    <>
                      <button
                        onClick={() => {
                          setEditingDays([day]);
                          resetMealState([day]);
                          setIsModalOpen(true);
                          setManagerActionDay(null);
                        }}
                        className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-[#6366f1]/10 hover:text-[#6366f1] text-slate-700 font-bold rounded-2xl transition-colors flex items-center gap-3"
                      >
                        <Utensils className="w-5 h-5" /> নিজের মিল সেট করুন
                      </button>
                      
                      {(() => {
                        const isBazarAssignedToMe = assignedDuties[dateStr] === userId || (userName && assignedDuties[dateStr] === userName);
                        
                        if (isManager || isBazarAssignedToMe) {
                          return (
                            <>
                              <button
                                onClick={() => {
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
                                  setSelectedMember(assignedDuties[dateStr] || '');
                                  setIsAssignDutyModalOpen(true);
                                }}
                                className="w-full text-left px-5 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-2xl transition-colors flex items-center gap-3"
                              >
                                <User className="w-5 h-5" /> বাজার দিন অ্যাসাইন করুন
                              </button>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
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
                    const isBazarAssignedToMe = assignedDuties[dateStr] === userId || (userName && assignedDuties[dateStr] === userName);
                    const canEditOthers = isManager || isBazarAssignedToMe;
                    
                    return (
                      <div 
                        key={member.uid} 
                        onClick={() => {
                          if (!canEditOthers && member.uid !== userId) return;
                          
                          if (!canEditOthers && member.uid === userId) {
                            if (monthDiff !== 0) { alert('আপনি শুধু চলতি মাসের মিল এডিট করতে পারবেন।'); return; }
                            const day = managerActionDay as number;
                            if (day < today && monthDiff === 0) { alert('অতীতের মিল এডিট করার সময় শেষ।'); return; }
                            const expectedTimeMs = bazarTimers[dateStr];
                            const isBazarDone = bazarRecords.some(r => r.date.startsWith(dateStr) && (r.status === 'Approved' || r.status === 'Done')) || expectedTimeMs === 'DONE';
                            const hasTimeCrossed = typeof expectedTimeMs === 'number' && Date.now() > expectedTimeMs;
                            if (isBazarDone || hasTimeCrossed) { alert(`মে ${day} তারিখের বাজার সম্পন্ন হয়েছে বা সময় শেষ। মিল পরিবর্তন করা সম্ভব নয়।`); return; }
                          }

                          setEditingUserId(member.uid);
                          setEditingUserName(member.name);
                          setEditingDays([managerActionDay as number]);
                          resetMealState([managerActionDay as number], member.uid);
                          setIsModalOpen(true);
                          setManagerActionDay(null);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${canEditOthers || member.uid === userId ? 'hover:bg-[#6366f1]/10 cursor-pointer group' : ''}`}
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
                  <span className="truncate">{getMemberData(selectedMember)?.name || "মেম্বার সিলেক্ট করুন"}</span>
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
                            onClick={() => { setSelectedMember(m.uid); setIsMemberDropdownOpen(false); }}
                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedMember === m.uid ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                          >
                            {m.photoURL ? (
                              <img src={m.photoURL} alt={m.name} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-emerald-600" />
                              </div>
                            )}
                            <span className={`text-sm font-bold ${selectedMember === m.uid ? 'text-emerald-600' : 'text-slate-600'}`}>{m.name}</span>
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

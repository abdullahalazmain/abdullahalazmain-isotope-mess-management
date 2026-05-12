import React, { useState, useEffect } from 'react';
import { auth, db, doc, onSnapshot, collection, query, where, updateDoc } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Utensils, 
  ShoppingCart, 
  Bell, 
  Plus, 
  Target, 
  CheckSquare, 
  X,
  Droplet,
  Phone,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// Components
import Sidebar from '../components/dashboard/Sidebar';
import DashboardNavbar from '../components/dashboard/DashboardNavbar';

// Views
import MembersView from '../views/MembersView';
import MealsView from '../views/MealsView';
import BazarView from '../views/BazarView';
import PaymentsView from '../views/PaymentsView';
import SummaryView from '../views/SummaryView';
import NoticeView from '../views/NoticeView';
import SettingsView from '../views/SettingsView';

import { listenToMemberFinancials, MemberFinancials, listenToMessFinancials, MessFinancials } from '../services/financialService';

const expenseData = [
  { name: 'Jan', expense: 4000, market: 2400 },
  { name: 'Feb', expense: 3000, market: 1398 },
  { name: 'Mar', expense: 2000, market: 9800 },
  { name: 'Apr', expense: 2780, market: 3908 },
  { name: 'May', expense: 1890, market: 4800 },
];

const COLORS = ['#6366f1', '#10b981', '#f43f5e'];

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManager, setIsManager] = useState(() => localStorage.getItem('userRole') === 'Manager');
  const [userProfile, setUserProfile] = useState<any>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  const [activeView, setActiveView] = useState('dashboard');
  const [messData, setMessData] = useState<any>(null);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardNotices, setDashboardNotices] = useState<any[]>([]);
  const [financials, setFinancials] = useState<MemberFinancials | null>(null);
  const [messFinancials, setMessFinancials] = useState<MessFinancials | null>(null);

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name || '');
      setEditPhone(userProfile.phone || '');
      setEditBloodGroup(userProfile.bloodGroup || '');
      setEditEmergencyContact(userProfile.emergencyContact || '');
      setEditAddress(userProfile.address || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: editName,
        phone: editPhone,
        bloodGroup: editBloodGroup,
        emergencyContact: editEmergencyContact,
        address: editAddress
      });
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 1. Listen to user document
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data);
            setIsManager(data.role === 'Manager');
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userProfile', JSON.stringify(data));

            if (data.messId) {
              const messDocRef = doc(db, 'messes', data.messId);
              const unsubscribeMess = onSnapshot(messDocRef, (messSnap) => {
                if (messSnap.exists()) setMessData(messSnap.data());
              });

              const unsubscribeMembers = onSnapshot(query(collection(db, 'users'), where('messId', '==', data.messId)), (snap) => {
                setAllMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
              });

              // 3. Listen to Notices for Dashboard
              const noticesQuery = query(collection(db, 'notices'), where('messId', '==', data.messId));
              const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
                const noticesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                noticesList.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setDashboardNotices(noticesList.slice(0, 3));
              });

              // 4. Listen to Financials
              const currentMonth = new Date().toISOString().slice(0, 7);
              const unsubscribeFinancials = listenToMemberFinancials(
                data.messId,
                user.uid,
                currentMonth,
                (stats) => setFinancials(stats)
              );

              let unsubscribeMessStats = () => {};
              if (data.role === 'Manager') {
                unsubscribeMessStats = listenToMessFinancials(
                  data.messId,
                  currentMonth,
                  (stats) => setMessFinancials(stats)
                );
              }

              return () => {
                unsubscribeMess();
                unsubscribeMembers();
                unsubscribeNotices();
                unsubscribeFinancials();
                unsubscribeMessStats();
              };
            }
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans overflow-hidden flex relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        userProfile={userProfile} 
        onEditProfile={() => setIsEditProfileOpen(true)}
      />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-28' : 'ml-4'} pl-4 pr-10 py-8 h-screen overflow-y-auto no-scrollbar relative`}>
        <DashboardNavbar isSidebarOpen={isSidebarOpen} />

        {activeView === 'members' ? (
          <MembersView isManager={isManager} messId={userProfile?.messId} />
        ) : activeView === 'meals' ? (
          <MealsView isManager={isManager} messId={userProfile?.messId} userId={userProfile?.uid} userName={userProfile?.name} messData={messData} members={allMembers} />
        ) : activeView === 'bazar' ? (
          <BazarView isManager={isManager} messId={userProfile?.messId} userId={userProfile?.uid} userName={userProfile?.name} messData={messData} />
        ) : activeView === 'payments' ? (
          <PaymentsView isManager={isManager} messId={userProfile?.messId} userId={userProfile?.uid} userName={userProfile?.name} members={allMembers} />
        ) : activeView === 'summary' ? (
          <SummaryView isManager={isManager} messId={userProfile?.messId} />
        ) : activeView === 'notice' ? (
          <NoticeView isManager={isManager} messId={userProfile?.messId} userId={userProfile?.uid} />
        ) : activeView === 'settings' ? (
          <SettingsView isManager={isManager} messId={userProfile?.messId} userProfile={userProfile} onLogout={handleLogout} />
        ) : (
          <>
            {/* The Personal View */}
            <div className="flex flex-col gap-8 relative z-10">
              
              {/* Personal Finance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট পরিশোধ (Paid)</p>
                  <h3 className="text-2xl font-black text-slate-800">৳ {financials?.totalPaid.toLocaleString() || '০'}</h3>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">খাবার খরচ (Meal Cost)</p>
                  <h3 className="text-2xl font-black text-slate-800">৳ {Math.round(financials?.mealCost || 0).toLocaleString()}</h3>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">{financials?.totalMeals || 0} মিল × ৳{Math.round(financials?.mealRate || 0)}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">অন্যান্য বিল (Other Bills)</p>
                  <h3 className="text-2xl font-black text-slate-800">৳ {financials?.otherBills.toLocaleString() || '০'}</h3>
                </div>
                <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">বাজার ক্রেডিট (Market)</p>
                  <h3 className="text-2xl font-black text-[#6366f1]">৳ {financials?.totalBazar.toLocaleString() || '০'}</h3>
                </div>
                <div className={`${(financials?.balance || 0) >= 0 ? 'bg-[#1e1b4b]/90' : 'bg-rose-900/90'} backdrop-blur-xl shadow-2xl shadow-[#1e1b4b]/20 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden border border-white/10 transition-colors`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 ${(financials?.balance || 0) >= 0 ? 'bg-emerald-400/20' : 'bg-rose-400/20'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">কারেন্ট ব্যালেন্স</p>
                  <h3 className={`text-3xl font-black ${(financials?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>৳ {Math.abs(Math.round(financials?.balance || 0)).toLocaleString()}</h3>
                  <p className={`text-xs font-bold ${(financials?.balance || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'} mt-1`}>
                    {(financials?.balance || 0) >= 0 ? 'পাবেন' : 'বকেয়া'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Meal Tracker Grid */}
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Utensils className="w-5 h-5 text-[#6366f1]" /> মিল ট্র্যাকার</h3>
                    <span className="px-4 py-1.5 bg-indigo-50/80 text-[#6366f1] rounded-full text-xs font-bold shadow-sm">
                      {new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 md:gap-3 mb-6">
                    {['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'].map(d => (
                      <div key={d} className="text-[10px] font-bold text-slate-400 text-center">{d}</div>
                    ))}
                    {days.map((d) => {
                      const today = new Date().getDate();
                      const dateStr = `${new Date().toISOString().slice(0, 8)}${d.toString().padStart(2, '0')}`;
                      const mealRecord = financials?.userMealRecords?.find(m => m.date === dateStr);
                      
                      let dailyTotal = 0;
                      if (mealRecord) {
                        if (mealRecord.selfMeals.morning) dailyTotal += 0.5;
                        if (mealRecord.selfMeals.lunch) dailyTotal += 1;
                        if (mealRecord.selfMeals.dinner) dailyTotal += 1;
                        dailyTotal += (mealRecord.guestMeals?.morning || 0) * 0.5;
                        dailyTotal += (mealRecord.guestMeals?.lunch || 0);
                        dailyTotal += (mealRecord.guestMeals?.dinner || 0);
                      }

                      return (
                        <div 
                          key={d} 
                          onClick={() => setActiveView('meals')}
                          className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${d === today ? 'bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] ring-2 ring-indigo-100 ring-offset-2' : 'bg-white/50 text-slate-700 hover:bg-white shadow-sm border border-white/40'}`}
                        >
                          <div className="flex flex-col items-center">
                            <span className={`text-[9px] ${d === today ? 'text-white/60' : 'text-slate-400'}`}>{d}</span>
                            <span>{dailyTotal > 0 ? dailyTotal : '০'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-200/50 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-500">মোট মিল (Total Meals):</h4>
                    <h2 className="text-2xl font-black text-slate-800">{financials?.totalMeals || '০'}</h2>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Notifications */}
                  <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/80 backdrop-blur-md border border-orange-100/50 shadow-xl rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" /> নোটিফিকেশন</h3>
                      <button onClick={() => setActiveView('notices')} className="text-[10px] font-black text-orange-600 hover:underline uppercase tracking-widest">সব দেখুন</button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {dashboardNotices.map((notice) => (
                        <div key={notice.id} className={`bg-white/80 p-3 rounded-xl border shadow-sm ${notice.isUrgent ? 'border-rose-200' : 'border-white'}`}>
                          <p className={`text-xs font-bold ${notice.isUrgent ? 'text-rose-600' : 'text-slate-700'}`}>{notice.title}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            ম্যানেজার • {notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'এখনই'}
                          </p>
                        </div>
                      ))}
                      {dashboardNotices.length === 0 && (
                        <p className="text-xs font-bold text-slate-400 text-center py-4 italic">কোনো নতুন নোটিশ নেই</p>
                      )}
                    </div>
                  </div>

                  {/* Bazar Duty */}
                  <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 flex-1">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4"><ShoppingCart className="w-5 h-5 text-emerald-500" /> বাজারের দিন</h3>
                    {(() => {
                        const nextDuty = Object.entries(messData?.assignedDuties || {})
                          .filter(([date, uid]) => uid === userProfile?.uid && new Date(date) >= new Date())
                          .sort(([a], [b]) => a.localeCompare(b))[0];
                        
                        if (!nextDuty) return <p className="text-xs font-bold text-slate-400 text-center py-4 italic">কোনো বাজার অ্যাসাইন করা নেই</p>;

                        const dutyDate = new Date(nextDuty[0]);
                        return (
                          <div className="flex items-center gap-4 p-4 bg-emerald-50/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-lg font-black text-emerald-600">{dutyDate.getDate()}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">
                                {dutyDate.toLocaleDateString('bn-BD', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </h4>
                              <p className="text-xs font-semibold text-emerald-600">আপনার ডিউটি</p>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </div>

              {/* Data Visualization */}
              <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6 h-80">
                 <h3 className="font-bold text-slate-800 text-lg mb-6">খরচ বনাম বাজার (Insights)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="খরচ" />
                      <Bar dataKey="market" fill="#10b981" radius={[4, 4, 0, 0]} name="বাজার ক্রেডিট" />
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>

            {/* Admin Control View */}
            {isManager && (
              <div className="mt-12 flex flex-col gap-8 relative z-10">
                <div className="absolute -left-4 -right-10 top-0 bottom-0 bg-[#6366f1]/5 rounded-[3rem] -z-10 border border-[#6366f1]/10 backdrop-blur-sm" />
                
                <div className="flex items-center gap-3 pt-8 px-6">
                  <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">মেস কন্ট্রোল প্যানেল</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
                  {/* Mess Health Stats */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60 flex flex-col">
                    <h3 className="font-bold text-slate-800 text-lg mb-4">মেস হেলথ (Mess Health)</h3>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট বকেয়া (Total Due)</p>
                        <h3 className="text-3xl font-black text-rose-500">৳ {Math.round(messFinancials?.totalDue || 0).toLocaleString()}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">মোট মেম্বার</p>
                        <h3 className="text-xl font-black text-slate-800">{messFinancials?.totalMembers || 0} জন</h3>
                      </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">কালেকশন স্ট্যাটাস</p>
                        <span className="text-xs font-bold text-[#6366f1]">{Math.round(messFinancials?.collectionRate || 0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-[#6366f1] rounded-full transition-all duration-1000" style={{ width: `${messFinancials?.collectionRate || 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">শীর্ষ বকেয়া (Top Dues)</p>
                      <div className="flex flex-col gap-3">
                        {messFinancials?.topDues?.map((member, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                            <span className="text-xs font-bold text-slate-700">{member.name} <span className="text-rose-500 ml-1">(৳ {member.amount.toLocaleString()})</span></span>
                            <button className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-colors shadow-sm">Alert</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operational Checklist */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60">
                    <h3 className="font-bold text-slate-800 text-lg mb-6">অপারেশনাল চেকলিস্ট</h3>
                    <div className="flex flex-col gap-4 mb-8">
                      {['বাসা ভাড়া', 'বিদ্যুৎ বিল', 'পানির বিল'].map((bill, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-2xl shadow-sm border border-slate-50 transition-all hover:shadow-md">
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${i === 0 ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                            {i === 0 && <CheckSquare className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm font-bold ${i === 0 ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{bill}</span>
                        </label>
                      ))}
                    </div>
                    <div className="p-5 bg-indigo-50/80 backdrop-blur-sm rounded-3xl border border-indigo-100 flex justify-between items-center shadow-sm">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">পেন্ডিং ভাউচার</h4>
                        <p className="text-[10px] font-semibold text-slate-500">বাজারের রিকোয়েস্ট</p>
                      </div>
                      <div onClick={() => setActiveView('bazar')} className="w-10 h-10 bg-[#6366f1] text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-indigo-200 cursor-pointer hover:scale-110 transition-transform">{messFinancials?.pendingBazarCount || 0}</div>
                    </div>
                  </div>

                  {/* Admin Charts */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/60 flex flex-col">
                    <h3 className="font-bold text-slate-800 text-lg mb-2">ব্যয় বিভাজন (Expenses)</h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie data={messFinancials?.categorySplits || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {(messFinancials?.categorySplits || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                      {messFinancials?.categorySplits?.map((cat, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] font-bold text-slate-600">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pb-24"></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setActiveView(isManager ? 'bazar' : 'meals')}
        className="fixed bottom-8 right-8 px-6 py-4 bg-[#1e1b4b] text-white rounded-full font-bold shadow-[0_10px_40px_-10px_rgba(30,27,75,0.7)] hover:bg-[#312e81] hover:-translate-y-1 transition-all flex items-center gap-3 z-50 group border border-white/10 backdrop-blur-md"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform">
          <Plus className="w-5 h-5" />
        </div>
        {isManager ? 'Add Mess Expense' : 'Add Guest Meal'}
      </button>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">প্রোফাইল আপডেট</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">ব্যক্তিগত তথ্য পরিবর্তন করুন</p>
                  </div>
                  <button 
                    onClick={() => setIsEditProfileOpen(false)}
                    className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center mb-2">
                    <div className="relative group">
                      <img 
                        src={userProfile?.photoURL || "https://api.dicebear.com/7.x/adventurer/svg?seed=James"} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-indigo-50" 
                      />
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#6366f1] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                        <Camera size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">পূর্ণ নাম</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="আপনার নাম"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">মোবাইল নম্বর</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input 
                            type="text" 
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="01xxx..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all shadow-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">রক্তের গ্রুপ</label>
                        <div className="relative">
                          <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                          <input 
                            type="text" 
                            value={editBloodGroup}
                            onChange={(e) => setEditBloodGroup(e.target.value)}
                            placeholder="A+"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">জরুরি যোগাযোগ</label>
                      <input 
                        type="text" 
                        value={editEmergencyContact}
                        onChange={(e) => setEditEmergencyContact(e.target.value)}
                        placeholder="নাম - নম্বর"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">ঠিকানা (Address)</label>
                      <textarea 
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="আপনার বর্তমান ঠিকানা"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] transition-all shadow-sm resize-none h-24"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleUpdateProfile}
                    className="w-full bg-[#1e1b4b] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#1e1b4b]/20 hover:bg-[#312e81] transition-all mt-4 flex items-center justify-center gap-2"
                  >
                    তথ্য আপডেট করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

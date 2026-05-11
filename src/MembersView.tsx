import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, doc, updateDoc } from './firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserMinus, UserPlus, Shield, X, Phone, Droplet, 
  Calendar, Check, Copy, AlertTriangle, ChevronRight, UserCog, ShoppingCart, ChevronLeft
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: 'Manager' | 'Member';
  phone: string;
  joinDate: string;
  bloodGroup: string;
  emergencyContact: string;
  stats: {
    paid: number;
    due: number;
    market: number;
  };
  avatarSeed: string;
}

const mockMembers: Member[] = [
  {
    id: '1', name: 'James Doe', role: 'Manager', phone: '01711-000000', joinDate: '01 May, 2024',
    bloodGroup: 'O+', emergencyContact: '01811-000000', avatarSeed: 'James',
    stats: { paid: 5000, due: 0, market: 3000 }
  },
  {
    id: '2', name: 'Rahim Uddin', role: 'Member', phone: '01911-111111', joinDate: '15 May, 2024',
    bloodGroup: 'B+', emergencyContact: '01722-222222', avatarSeed: 'Rahim',
    stats: { paid: 3000, due: 500, market: 1200 }
  },
  {
    id: '3', name: 'Karim Hasan', role: 'Member', phone: '01611-333333', joinDate: '01 Jun, 2024',
    bloodGroup: 'A+', emergencyContact: '01533-333333', avatarSeed: 'Karim',
    stats: { paid: 2000, due: 1500, market: 0 }
  }
];

const mockFormerMembers = [
  { id: '4', name: 'Arif Hossain', leftDate: '30 Apr, 2024', dueAtLeave: 0, avatarSeed: 'Arif' }
];

const mockPendingRequests = [
  { id: '5', name: 'Sajid Ali', requestDate: 'Today, 10:30 AM', phone: '01844-444444', avatarSeed: 'Sajid' }
];

export default function MembersView({ isManager, messId }: { isManager: boolean, messId?: string }) {
  const [activeTab, setActiveTab] = useState<'active' | 'former' | 'pending'>('active');
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showManagerControls, setShowManagerControls] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  useEffect(() => {
    if (!messId) return;

    // 1. Listen to active members
    const membersQuery = query(collection(db, 'users'), where('messId', '==', messId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(membersList);
    });

    // 2. Listen to pending requests
    const requestsQuery = query(collection(db, 'messes', messId, 'requests'));
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requestsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingRequests(requestsList);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeRequests();
    };
  }, [messId]);

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const memberRef = doc(db, 'users', memberId);
      await updateDoc(memberRef, { role: newRole });
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember({ ...selectedMember, role: newRole as any });
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
    setShowManagerControls(false);
    setShowTransferConfirm(false);
  };

  return (
    <div className="flex flex-col h-full relative z-10 w-full animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">মেম্বারস</h1>
            <p className="text-sm font-semibold text-slate-500">মেস সদস্য ব্যবস্থাপনা</p>
          </div>
        </div>

        <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-[#6366f1] text-white shadow-md' : 'text-slate-500 hover:bg-white/80'}`}
          >
            <Users className="w-4 h-4" /> বর্তমান সদস্য
          </button>
          <button 
            onClick={() => setActiveTab('former')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'former' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-white/80'}`}
          >
            <UserMinus className="w-4 h-4" /> পুরানো সদস্য
          </button>
          {isManager && (
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-white/80'}`}
            >
              <UserPlus className="w-4 h-4" /> রিকোয়েস্ট <span className="w-5 h-5 bg-white text-emerald-600 rounded-full flex items-center justify-center text-[10px]">১</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        
        {/* ACTIVE MEMBERS TAB */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map(member => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={member.id} 
                onClick={() => setSelectedMember(member)}
                className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl p-6 cursor-pointer group hover:bg-white/90 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <img src={member.avatarSeed?.startsWith('http') ? member.avatarSeed : `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed || member.name}`} alt={member.name} className="w-16 h-16 rounded-2xl bg-indigo-50 border-4 border-white shadow-sm group-hover:scale-105 transition-transform" />
                  {member.role === 'Manager' && (
                    <span className="px-3 py-1 bg-indigo-100 text-[#6366f1] rounded-full text-[10px] font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ম্যানেজার
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">{member.name}</h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-3"><Phone className="w-3 h-3" /> {member.phone || 'No Phone'}</p>
                <div className="pt-3 border-t border-slate-100/80 flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400">যুক্ত হয়েছেন: <br/><span className="text-slate-600">{member.joinDate || 'N/A'}</span></p>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#6366f1] group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Quick Invite Card */}
            <div className="bg-indigo-50/50 backdrop-blur-md border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 text-[#6366f1] rounded-full flex items-center justify-center mb-3">
                <Copy className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-indigo-900">ইনভাইট কোড কপি করুন</h3>
              <p className="text-xs text-indigo-400 font-medium mt-1">মেস আইডি: <span className="font-bold">{messId || 'N/A'}</span></p>
            </div>
          </div>
        )}

        {/* FORMER MEMBERS TAB */}
        {activeTab === 'former' && (
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-3xl p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                  <th className="pb-3 px-4">মেম্বার</th>
                  <th className="pb-3 px-4">ছেড়ে যাওয়ার তারিখ</th>
                  <th className="pb-3 px-4">বকেয়া (ত্যাগের সময়)</th>
                </tr>
              </thead>
              <tbody>
                {mockFormerMembers.map(member => (
                  <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`} className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm" />
                      <span className="font-bold text-slate-700">{member.name}</span>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-slate-500">{member.leftDate}</td>
                    <td className="py-4 px-4 text-sm font-bold text-emerald-500">৳ {member.dueAtLeave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PENDING REQUESTS TAB */}
        {activeTab === 'pending' && isManager && (
          <div className="flex flex-col gap-4 max-w-2xl">
            {pendingRequests.length === 0 ? (
              <p className="text-slate-500 font-semibold text-center py-10 bg-white/50 rounded-3xl border border-dashed border-slate-200">কোন রিকোয়েস্ট নেই</p>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="bg-white/80 backdrop-blur-md border border-emerald-100 shadow-lg rounded-3xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={req.avatarSeed?.startsWith('http') ? req.avatarSeed : `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.avatarSeed || req.name}`} className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-white shadow-sm" />
                    <div>
                      <h3 className="font-bold text-slate-800">{req.name}</h3>
                      <p className="text-xs font-semibold text-slate-500">{req.phone || 'No Phone'}</p>
                      <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Request: {req.requestDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">বাতিল করুন</button>
                    <button className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors flex items-center gap-1">
                      <Check className="w-4 h-4" /> যুক্ত করুন
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MEMBER DETAILS MODAL */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-50 p-6 flex justify-between items-start border-b border-slate-100 relative">
                <div className="flex gap-4">
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.avatarSeed}`} className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md z-10 relative" />
                    {selectedMember.role === 'Manager' && (
                      <div className="absolute -bottom-2 -right-2 bg-[#6366f1] text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white z-20 shadow-sm">
                        <Shield className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <h2 className="text-xl font-black text-slate-800 leading-none mb-1">{selectedMember.name}</h2>
                    <p className="text-sm font-semibold text-slate-500 mb-2">{selectedMember.phone}</p>
                    <span className="px-3 py-1 bg-slate-200/50 text-slate-600 rounded-full text-[10px] font-bold">Joined: {selectedMember.joinDate}</span>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto no-scrollbar">
                
                {!showManagerControls ? (
                  <>
                    {/* Member Stats (Mini Overview) */}
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">আর্থিক ওভারভিউ (এই মাস)</h3>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">পরিশোধিত</p>
                        <h4 className="text-xl font-black text-slate-800">৳ {selectedMember.stats.paid}</h4>
                      </div>
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">বকেয়া</p>
                        <h4 className="text-xl font-black text-rose-500">৳ {selectedMember.stats.due}</h4>
                      </div>
                      <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">মোট বাজার</p>
                          <h4 className="text-xl font-black text-slate-800">৳ {selectedMember.stats.market}</h4>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm"><ShoppingCart className="w-5 h-5" /></div>
                      </div>
                    </div>

                    {/* Emergency Info (Private) */}
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ইমার্জেন্সি ইনফো (প্রাইভেট)</h3>
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center"><Droplet className="w-4 h-4" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400">রক্তের গ্রুপ</p><p className="text-sm font-bold text-slate-700">{selectedMember.bloodGroup}</p></div>
                      </div>
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400">জরুরী নাম্বার</p><p className="text-sm font-bold text-slate-700">{selectedMember.emergencyContact}</p></div>
                      </div>
                    </div>

                    {/* Manager Shield Button */}
                    {isManager && (
                      <button 
                        onClick={() => setShowManagerControls(true)}
                        className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                      >
                        <UserCog className="w-4 h-4" /> Manage Permissions & Role
                      </button>
                    )}
                  </>
                ) : (
                  /* Manager Controls View */
                  <div className="animate-fade-in">
                    <button onClick={() => setShowManagerControls(false)} className="text-xs font-bold text-[#6366f1] flex items-center gap-1 mb-4 hover:underline">
                      <ChevronLeft className="w-3 h-3" /> Back to Overview
                    </button>
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Shield className="text-[#6366f1] w-5 h-5"/> Manager Controls</h3>
                    
                    <div className="flex flex-col gap-4">
                      <div className="border border-slate-200 rounded-2xl p-4">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Assign Role</label>
                        <select 
                          onChange={(e) => handleUpdateRole(selectedMember.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                        >
                          <option value="Member" selected={selectedMember.role === 'Member'}>General Member</option>
                          <option value="Manager" selected={selectedMember.role === 'Manager'}>Manager (Admin)</option>
                        </select>
                      </div>

                      <div className="border border-slate-200 rounded-2xl p-4 flex justify-between items-center bg-slate-50">
                        <div>
                          <p className="text-sm font-bold text-slate-800">Remove Member</p>
                          <p className="text-[10px] text-slate-500 font-medium">Move to former members list</p>
                        </div>
                        <button className="px-4 py-2 bg-white border border-rose-200 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors shadow-sm">Remove</button>
                      </div>

                      {!showTransferConfirm ? (
                        <div className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-4 flex justify-between items-center mt-4">
                          <div>
                            <p className="text-sm font-bold text-indigo-900">Transfer Ownership</p>
                            <p className="text-[10px] text-indigo-500 font-medium">Make this user the primary owner</p>
                          </div>
                          <button onClick={() => setShowTransferConfirm(true)} className="px-4 py-2 bg-[#6366f1] text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200">Transfer</button>
                        </div>
                      ) : (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mt-4 animate-fade-in">
                          <div className="flex gap-3 text-rose-600 mb-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <div>
                              <p className="text-sm font-bold">Are you absolutely sure?</p>
                              <p className="text-xs mt-1 font-medium opacity-80">This will send an ownership request to {selectedMember.name}. If they accept, you will lose primary manager rights.</p>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowTransferConfirm(false)} className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold shadow-sm">Cancel</button>
                            <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200">Send Transfer Request</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/**
 * financialService.ts
 * Centralized logic for calculating member balances and mess-wide financials.
 */

import { db, collection, query, where, onSnapshot } from '../firebase';
import { Deposit } from './depositService';
import { BazarRecord } from '../types';
import { Bill } from '../types';
import { MealRecord } from '../types';

export interface MemberFinancials {
  totalPaid: number;
  totalBazar: number;
  mealCost: number;
  otherBills: number;
  receivable: number;
  dueAmount: number;
  balance: number;
  totalMeals: number;
  mealRate: number;
  userMealRecords: any[];
}

/**
 * Real-time listener for a member's financial overview.
 * Aggregates data from meals, bazar, bills, and deposits.
 */
export function listenToMemberFinancials(
  messId: string,
  userId: string,
  month: string, // format: "YYYY-MM"
  callback: (financials: MemberFinancials) => void
) {
  // Listeners for all relevant data
  let deposits: any[] = [];
  let bazarRecords: any[] = [];
  let allBazarRecords: any[] = [];
  let userBills: any[] = [];
  let userMeals: any[] = [];
  let allMessMeals: any[] = [];

  const updateFinancials = () => {
    // 1. Total Paid
    const totalPaid = deposits.reduce((sum, d) => sum + d.amount, 0);

    // 2. User Bazar (Approved only)
    const totalBazar = bazarRecords
      .filter(r => r.status === 'Approved')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    // 3. All Mess Bazar (Approved only - for meal rate)
    const messTotalBazar = allBazarRecords
      .filter(r => r.status === 'Approved')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    // 4. All Mess Meals (for meal rate)
    const messTotalMeals = allMessMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

    // 5. User Meals
    const userTotalMeals = userMeals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

    // 6. Meal Rate
    const mealRate = messTotalMeals > 0 ? messTotalBazar / messTotalMeals : 0;

    // 7. Meal Cost
    const mealCost = userTotalMeals * mealRate;

    // 8. Other Bills (User's splits)
    const otherBills = userBills.reduce((sum, bill) => {
      const userSplit = bill.splits.find((s: any) => s.userId === userId);
      return sum + (userSplit ? userSplit.amount : 0);
    }, 0);

    // 9. Balance Calculation
    // Total Credits = Paid + Bazar
    // Total Debits = Meal Cost + Other Bills
    const balance = (totalPaid + totalBazar) - (mealCost + otherBills);
    
    const receivable = balance > 0 ? balance : 0;
    const dueAmount = balance < 0 ? Math.abs(balance) : 0;

    callback({
      totalPaid,
      totalBazar,
      mealCost,
      otherBills,
      receivable,
      dueAmount,
      balance,
      totalMeals: userTotalMeals,
      mealRate,
      userMealRecords: userMeals
    });
  };

  // Setup Snapshots
  const unsubDeposits = onSnapshot(
    query(collection(db, 'deposits'), where('messId', '==', messId), where('userId', '==', userId), where('month', '==', month)),
    (snap) => { deposits = snap.docs.map(d => d.data()); updateFinancials(); }
  );

  const unsubUserBazar = onSnapshot(
    query(collection(db, 'bazar'), where('messId', '==', messId), where('submittedBy', '==', userId), where('month', '==', month)),
    (snap) => { bazarRecords = snap.docs.map(d => d.data()); updateFinancials(); }
  );

  const unsubAllBazar = onSnapshot(
    query(collection(db, 'bazar'), where('messId', '==', messId), where('month', '==', month)),
    (snap) => { allBazarRecords = snap.docs.map(d => d.data()); updateFinancials(); }
  );

  const unsubBills = onSnapshot(
    query(collection(db, 'bills'), where('messId', '==', messId), where('month', '==', month)),
    (snap) => { userBills = snap.docs.map(d => d.data()); updateFinancials(); }
  );

  const unsubUserMeals = onSnapshot(
    query(collection(db, 'meals'), where('messId', '==', messId), where('userId', '==', userId), where('month', '==', month)),
    (snap) => { userMeals = snap.docs.map(d => d.data()); updateFinancials(); }
  );

  const unsubAllMeals = onSnapshot(
    query(collection(db, 'meals'), where('messId', '==', messId), where('month', '==', month)),
    (snap) => { allMessMeals = snap.docs.map(d => d.data()); updateFinancials(); }
  );

  return () => {
    unsubDeposits();
    unsubUserBazar();
    unsubAllBazar();
    unsubBills();
    unsubUserMeals();
    unsubAllMeals();
  };
}

export interface MessFinancials {
  totalDue: number;
  totalPaid: number;
  collectionRate: number;
  topDues: { name: string; amount: number }[];
  categorySplits: { name: string; value: number }[];
  memberBazar: { name: string; budget: number; spent: number }[];
  pendingBazarCount: number;
  totalMembers: number;
}

/**
 * Real-time listener for mess-wide financials (Manager only).
 */
export function listenToMessFinancials(
  messId: string,
  month: string,
  callback: (financials: MessFinancials) => void
) {
  let allDeposits: any[] = [];
  let allBazar: any[] = [];
  let allBills: any[] = [];
  let allMeals: any[] = [];
  let allUsers: any[] = [];

  const update = () => {
    if (allUsers.length === 0) return;

    let totalDue = 0;
    let totalPaid = 0;
    const memberStats: any[] = [];

    // Calculate total mess bazar and meals for rate
    const messTotalBazar = allBazar.filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0);
    const messTotalMeals = allMeals.reduce((s, m) => s + (m.totalMeals || 0), 0);
    const mealRate = messTotalMeals > 0 ? messTotalBazar / messTotalMeals : 0;

    allUsers.forEach(user => {
      const userDeposits = allDeposits.filter(d => d.userId === user.uid).reduce((s, d) => s + d.amount, 0);
      const userBazar = allBazar.filter(r => r.submittedBy === user.uid && r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0);
      const userMeals = allMeals.filter(m => m.userId === user.uid).reduce((s, m) => s + (m.totalMeals || 0), 0);
      const userBills = allBills.reduce((sum, bill) => {
        const split = bill.splits?.find((s: any) => s.userId === user.uid);
        return sum + (split ? split.amount : 0);
      }, 0);

      const userMealCost = userMeals * mealRate;
      const balance = (userDeposits + userBazar) - (userMealCost + userBills);

      totalPaid += userDeposits;
      if (balance < 0) totalDue += Math.abs(balance);

      memberStats.push({ name: user.name, balance });
    });

    const collectionRate = (totalPaid + totalDue) > 0 ? (totalPaid / (totalPaid + totalDue)) * 100 : 0;
    const topDues = memberStats
      .filter(m => m.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, 3)
      .map(m => ({ name: m.name, amount: Math.abs(Math.round(m.balance)) }));

    // Category Splits (Mocking logic for categories if not present in bills)
    const rentTotal = allBills.filter(b => b.category === 'rent').reduce((s, b) => s + (b.totalAmount || 0), 0);
    const utilityTotal = allBills.filter(b => b.category === 'utility').reduce((s, b) => s + (b.totalAmount || 0), 0);
    const categorySplits = [
      { name: 'বাজার', value: messTotalBazar },
      { name: 'ভাড়া', value: rentTotal },
      { name: 'ইউটিলিটি', value: utilityTotal },
    ];

    // Member Bazar Chart Data
    const memberBazar = allUsers.map(user => {
      const spent = allBazar.filter(r => r.submittedBy === user.uid && r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0);
      return {
        name: user.name.split(' ')[0],
        budget: 4000, // Hardcoded budget for now or fetch from mess config
        spent
      };
    });

    const pendingBazarCount = allBazar.filter(r => r.status === 'Pending').length;
    const totalMembers = allUsers.length;

    callback({
      totalDue,
      totalPaid,
      collectionRate,
      topDues,
      categorySplits,
      memberBazar,
      pendingBazarCount,
      totalMembers
    });
  };

  const unsubUsers = onSnapshot(query(collection(db, 'users'), where('messId', '==', messId)), (snap) => {
    allUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    update();
  });

  const unsubDeps = onSnapshot(query(collection(db, 'deposits'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allDeposits = snap.docs.map(d => d.data());
    update();
  });

  const unsubBazar = onSnapshot(query(collection(db, 'bazar'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allBazar = snap.docs.map(d => d.data());
    update();
  });

  const unsubBills = onSnapshot(query(collection(db, 'bills'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allBills = snap.docs.map(d => d.data());
    update();
  });

  const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allMeals = snap.docs.map(d => d.data());
    update();
  });

  return () => {
    unsubUsers();
    unsubDeps();
    unsubBazar();
    unsubBills();
    unsubMeals();
  };
}

export interface MemberLedger {
  userId: string;
  userName: string;
  totalDeposit: number;
  totalMeals: number;
  mealCost: number;
  otherCost: number;
  totalExpense: number;
  balance: number;
}

/** Real-time listener: Full ledger for all members */
export function listenToFullLedger(
  messId: string,
  month: string,
  callback: (ledger: MemberLedger[], messStats: any) => void
) {
  let allUsers: any[] = [];
  let allDeposits: any[] = [];
  let allBazar: any[] = [];
  let allBills: any[] = [];
  let allMeals: any[] = [];

  const update = () => {
    if (allUsers.length === 0) return;

    const messTotalBazar = allBazar.filter(r => r.status === 'Approved').reduce((s, r) => s + r.totalAmount, 0);
    const messTotalMeals = allMeals.reduce((s, r) => s + r.totalMeals, 0);
    const mealRate = messTotalMeals > 0 ? messTotalBazar / messTotalMeals : 0;

    const ledger: MemberLedger[] = allUsers.map(user => {
      const userDeposits = allDeposits.filter(d => d.userId === user.uid).reduce((s, d) => s + d.amount, 0);
      const userMealsCount = allMeals.filter(m => m.userId === user.uid).reduce((s, m) => s + m.totalMeals, 0);
      const userMealCost = userMealsCount * mealRate;
      
      const userBillsCost = allBills.reduce((s, bill) => {
        const split = bill.splits?.find((sp: any) => sp.userId === user.uid);
        return s + (split ? split.amount : 0);
      }, 0);

      const totalExpense = userMealCost + userBillsCost;
      const balance = userDeposits - totalExpense;

      return {
        userId: user.uid,
        userName: user.name,
        totalDeposit: userDeposits,
        totalMeals: userMealsCount,
        mealCost: Math.round(userMealCost),
        otherCost: Math.round(userBillsCost),
        totalExpense: Math.round(totalExpense),
        balance: Math.round(balance)
      };
    });

    const messStats = {
      totalCollection: allDeposits.reduce((s, d) => s + d.amount, 0),
      totalExpense: messTotalBazar + allBills.reduce((s, b) => s + b.totalAmount, 0),
      totalMeals: messTotalMeals,
      mealRate: Math.round(mealRate * 100) / 100,
      pieData: [
        { name: 'বাজার', value: messTotalBazar, color: '#6366f1' },
        { name: 'অন্যান্য', value: allBills.reduce((s, b) => s + b.totalAmount, 0), color: '#f43f5e' }
      ]
    };

    callback(ledger, messStats);
  };

  const unsubUsers = onSnapshot(query(collection(db, 'users'), where('messId', '==', messId)), (snap) => {
    allUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    update();
  });

  const unsubDeps = onSnapshot(query(collection(db, 'deposits'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allDeposits = snap.docs.map(d => d.data());
    update();
  });

  const unsubBazar = onSnapshot(query(collection(db, 'bazar'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allBazar = snap.docs.map(d => d.data());
    update();
  });

  const unsubBills = onSnapshot(query(collection(db, 'bills'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allBills = snap.docs.map(d => d.data());
    update();
  });

  const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('messId', '==', messId), where('month', '==', month)), (snap) => {
    allMeals = snap.docs.map(d => d.data());
    update();
  });

  return () => {
    unsubUsers(); unsubDeps(); unsubBazar(); unsubBills(); unsubMeals();
  };
}

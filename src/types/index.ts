import { Timestamp } from '../firebase';

// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  messId?: string;
  role?: 'Manager' | 'Member';
  phone?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  joinedAt?: Timestamp;
  createdAt?: Timestamp;
}

// ─── Mess ────────────────────────────────────────────────────────────────────
export interface Mess {
  id: string;
  messId: string;
  name: string;
  password: string;
  creatorUid: string;
  managerEmail: string;
  createdAt: Timestamp;
  lastIdChange?: Timestamp;
  membersCount: number;
}

// ─── Meal ────────────────────────────────────────────────────────────────────
export interface MealRecord {
  id: string;
  messId: string;
  userId: string;
  userName: string;
  date: string;       // "YYYY-MM-DD"
  month: string;      // "YYYY-MM"
  selfMeals: {
    morning: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  guestMeals: {
    morning: number;
    lunch: number;
    dinner: number;
  };
  totalMeals: number; // self(0.5/1/1) + guest(counts)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Bazar ───────────────────────────────────────────────────────────────────
export interface BazarItem {
  id: string;
  name: string;
  rate: string;
  qty: string;
  total: string;
}

export interface BazarRecord {
  id: string;
  messId: string;
  submittedBy: string;        // uid
  submitterName: string;
  date: string;               // "YYYY-MM-DD HH:mm"
  month: string;              // "YYYY-MM"
  items: BazarItem[];
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectedReason?: string;
  hasReceipt: boolean;
  createdAt?: Timestamp;
}

// ─── Bill ────────────────────────────────────────────────────────────────────
export type BillCategory = 'rent' | 'utility' | 'other';

export interface BillSplit {
  userId: string;
  userName: string;
  amount: number;
  isPaid: boolean;
}

export interface Bill {
  id: string;
  messId: string;
  name: string;
  category: BillCategory;
  totalAmount: number;
  month: string;              // "YYYY-MM"
  splits: BillSplit[];
  createdBy: string;          // uid
  createdAt?: Timestamp;
}

// ─── Notice ──────────────────────────────────────────────────────────────────
export interface Notice {
  id: string;
  messId: string;
  title: string;
  description: string;
  isUrgent: boolean;
  recipients: 'all' | string[];
  creatorUid: string;
  createdAt?: Timestamp;
  readBy: string[];
  hiddenBy: string[];
}

export interface MarketRequest {
  id: string;
  messId: string;
  userId: string;
  userName: string;
  itemName: string;
  status: 'Pending' | 'Accepted' | 'Bought';
  votes?: Record<string, boolean>; // userId: true
  createdAt?: Timestamp;
}

// ─── Monthly Summary (computed) ───────────────────────────────────────────────
export interface MemberMonthSummary {
  userId: string;
  userName: string;
  totalMeals: number;
  bazarCredit: number;        // total amount this member submitted to bazar
  billExpense: number;        // total bill splits assigned to this member
  mealCost: number;           // totalMeals × perMealRate
  totalExpense: number;       // mealCost + billExpense
  balance: number;            // bazarCredit - totalExpense (simplified)
}

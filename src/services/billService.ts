/**
 * billService.ts
 * All Firestore operations related to bills and payments.
 */

import {
  db, collection, query, where, onSnapshot,
  doc, addDoc, updateDoc, serverTimestamp
} from '../firebase';
import type { Bill, BillCategory, BillSplit } from '../types';

const BILLS = 'bills';

/** Real-time listener: all bills for a mess in a month */
export function listenToBills(
  messId: string,
  month: string,
  callback: (bills: Bill[]) => void
) {
  const q = query(
    collection(db, BILLS),
    where('messId', '==', messId),
    where('month', '==', month)
  );
  return onSnapshot(q, (snap) => {
    const bills = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Bill[];
    bills.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    callback(bills);
  });
}

/** Manager creates a new bill */
export async function createBill(
  messId: string,
  createdBy: string,
  name: string,
  category: BillCategory,
  totalAmount: number,
  month: string,
  splits: BillSplit[]
) {
  await addDoc(collection(db, BILLS), {
    messId,
    createdBy,
    name,
    category,
    totalAmount,
    month,
    splits,
    createdAt: serverTimestamp()
  });
}

/** Member marks their split as paid */
export async function markSplitAsPaid(billId: string, userId: string, splits: BillSplit[]) {
  const updated = splits.map(s =>
    s.userId === userId ? { ...s, isPaid: true } : s
  );
  await updateDoc(doc(db, BILLS, billId), {
    splits: updated,
    updatedAt: serverTimestamp()
  });
}

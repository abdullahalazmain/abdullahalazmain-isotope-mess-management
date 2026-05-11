/**
 * depositService.ts
 * All Firestore operations related to member deposits (cash payments to manager).
 */

import {
  db, collection, query, where, onSnapshot,
  doc, addDoc, serverTimestamp
} from '../firebase';

const DEPOSITS = 'deposits';

export interface Deposit {
  id: string;
  messId: string;
  userId: string;
  userName: string;
  amount: number;
  month: string;
  createdAt: any;
}

/** Real-time listener: all deposits for a mess in a month */
export function listenToDeposits(
  messId: string,
  month: string,
  callback: (deposits: Deposit[]) => void
) {
  const q = query(
    collection(db, DEPOSITS),
    where('messId', '==', messId),
    where('month', '==', month)
  );
  return onSnapshot(q, (snap) => {
    const deposits = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Deposit[];
    callback(deposits);
  });
}

/** Manager records a deposit from a member */
export async function recordDeposit(
  messId: string,
  userId: string,
  userName: string,
  amount: number,
  month: string
) {
  await addDoc(collection(db, DEPOSITS), {
    messId,
    userId,
    userName,
    amount,
    month,
    createdAt: serverTimestamp()
  });
}

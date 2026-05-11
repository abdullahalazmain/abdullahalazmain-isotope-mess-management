/**
 * bazarService.ts
 * All Firestore operations related to bazar (market) tracking.
 */

import {
  db, collection, query, where, onSnapshot,
  doc, addDoc, updateDoc, serverTimestamp
} from '../firebase';
import type { BazarRecord, BazarItem } from '../types';

const BAZAR = 'bazar';

/** Real-time listener: all bazar records for a mess in a month */
export function listenToBazarRecords(
  messId: string,
  month: string,
  callback: (records: BazarRecord[]) => void
) {
  const q = query(
    collection(db, BAZAR),
    where('messId', '==', messId),
    where('month', '==', month)
  );
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map(d => ({ id: d.id, ...d.data() })) as BazarRecord[];
    records.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
    callback(records);
  });
}

/** Submit a new bazar entry */
export async function submitBazar(
  messId: string,
  submittedBy: string,
  submitterName: string,
  date: string,
  items: BazarItem[],
  totalAmount: number,
  hasReceipt: boolean
) {
  const month = date.substring(0, 7);
  await addDoc(collection(db, BAZAR), {
    messId,
    submittedBy,
    submitterName,
    date,
    month,
    items,
    totalAmount,
    status: 'Pending',
    hasReceipt,
    createdAt: serverTimestamp()
  });
}

/** Manager approves a bazar entry */
export async function approveBazar(bazarId: string) {
  await updateDoc(doc(db, BAZAR, bazarId), {
    status: 'Approved',
    updatedAt: serverTimestamp()
  });
}

/** Manager rejects a bazar entry with a reason */
export async function rejectBazar(bazarId: string, reason: string) {
  await updateDoc(doc(db, BAZAR, bazarId), {
    status: 'Rejected',
    rejectedReason: reason,
    updatedAt: serverTimestamp()
  });
}

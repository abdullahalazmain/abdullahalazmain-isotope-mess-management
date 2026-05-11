/**
 * mealService.ts
 * All Firestore operations related to meal tracking.
 */

import {
  db, collection, query, where, onSnapshot,
  doc, setDoc, updateDoc, serverTimestamp
} from '../firebase';
import type { MealRecord } from '../types';

const MEALS = 'meals';

/** Unique doc ID for a user's meal on a given date */
const mealDocId = (messId: string, userId: string, date: string) =>
  `${messId}_${userId}_${date}`;

/** Real-time listener: current user's meals for a given month */
export function listenToUserMeals(
  messId: string,
  userId: string,
  month: string,
  callback: (meals: MealRecord[]) => void
) {
  const q = query(
    collection(db, MEALS),
    where('messId', '==', messId),
    where('userId', '==', userId),
    where('month', '==', month)
  );
  return onSnapshot(q, (snap) => {
    const meals = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MealRecord[];
    callback(meals);
  });
}

/** Real-time listener: ALL members' meals for a given month (manager view) */
export function listenToAllMessMeals(
  messId: string,
  month: string,
  callback: (meals: MealRecord[]) => void
) {
  const q = query(
    collection(db, MEALS),
    where('messId', '==', messId),
    where('month', '==', month)
  );
  return onSnapshot(q, (snap) => {
    const meals = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MealRecord[];
    callback(meals);
  });
}

/** Save or update a meal record for a user on a date */
export async function saveMeal(
  messId: string,
  userId: string,
  userName: string,
  date: string,
  breakfast: boolean,
  lunch: boolean,
  dinner: boolean
) {
  const month = date.substring(0, 7); // "YYYY-MM"
  const totalMeals = (breakfast ? 0.5 : 0) + (lunch ? 1 : 0) + (dinner ? 1 : 0);
  const id = mealDocId(messId, userId, date);

  await setDoc(doc(db, MEALS, id), {
    messId, userId, userName, date, month,
    breakfast, lunch, dinner, totalMeals,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

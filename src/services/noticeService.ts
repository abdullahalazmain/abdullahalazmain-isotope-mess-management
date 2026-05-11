import { db, collection, query, where, onSnapshot, doc, addDoc, deleteDoc, updateDoc, serverTimestamp, arrayUnion } from '../firebase';
import { Notice } from '../types';

export const listenToNotices = (messId: string, callback: (notices: Notice[]) => void) => {
  const q = query(collection(db, 'notices'), where('messId', '==', messId));
  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notice[];
    // Sort by createdAt desc locally if needed, or by firestore index
    notices.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(notices);
  });
};

export const createNotice = async (
  messId: string, 
  title: string, 
  description: string, 
  isUrgent: boolean, 
  recipients: 'all' | string[], 
  creatorUid: string
) => {
  return addDoc(collection(db, 'notices'), {
    messId,
    title,
    description,
    isUrgent,
    recipients,
    creatorUid,
    createdAt: serverTimestamp(),
    readBy: [],
    hiddenBy: []
  });
};

export const deleteNotice = async (noticeId: string) => {
  return deleteDoc(doc(db, 'notices', noticeId));
};

export const markNoticeAsRead = async (noticeId: string, userId: string) => {
  return updateDoc(doc(db, 'notices', noticeId), {
    readBy: arrayUnion(userId)
  });
};

export const hideNoticeForUser = async (noticeId: string, userId: string) => {
  return updateDoc(doc(db, 'notices', noticeId), {
    hiddenBy: arrayUnion(userId)
  });
};

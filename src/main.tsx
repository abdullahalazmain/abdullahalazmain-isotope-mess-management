import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { db, collectionGroup, query, where, getDocs, deleteDoc, doc, updateDoc } from './firebase';
import App from './App.tsx';
import './styles/index.css';

// Temporary script to remove Abul Khan
const removeAbulKhan = async () => {
  try {
    const q = query(collectionGroup(db, 'requests'), where('name', '==', 'Abul Khan'));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(docSnap.ref);
      await updateDoc(doc(db, 'users', docSnap.data().uid), { pendingMessId: null });
      console.log('Removed Abul Khan');
    });
  } catch(e) {}
};
removeAbulKhan();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

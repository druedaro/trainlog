import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  getCountFromServer,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { JournalEntry, EntryAnalysis } from '@/types/entry';
import type { DiscoverDocument, DiscoverArticle } from '@/types/discover';

const ENTRIES_COLLECTION = 'entries';

interface CreateEntryInput {
  userId: string;
  transcript: string;
  analysis: EntryAnalysis;
}

export async function saveConfirmedEntry(
  input: CreateEntryInput,
): Promise<string> {
  const now = Timestamp.now();

  const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), {
    userId: input.userId,
    transcript: input.transcript,
    analysis: input.analysis,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function fetchEntryById(
  entryId: string,
  userId: string,
): Promise<JournalEntry | null> {
  const docRef = doc(db, ENTRIES_COLLECTION, entryId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  // Only return entries that belong to the requesting user
  if (data.userId !== userId) {
    return null;
  }

  return mapDocumentToEntry(docSnap.id, data);
}

export async function fetchEntriesByMonth(
  userId: string,
  year: number,
  month: number,
): Promise<JournalEntry[]> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const entriesQuery = query(
    collection(db, ENTRIES_COLLECTION),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
    where('createdAt', '<=', Timestamp.fromDate(endOfMonth)),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnap) =>
    mapDocumentToEntry(docSnap.id, docSnap.data()),
  );
}

export async function fetchEntriesByDay(
  userId: string,
  dateStr: string,
): Promise<JournalEntry[]> {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  const entriesQuery = query(
    collection(db, ENTRIES_COLLECTION),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
    where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnap) =>
    mapDocumentToEntry(docSnap.id, docSnap.data()),
  );
}

function mapDocumentToEntry(
  id: string,
  data: DocumentData,
): JournalEntry {
  return {
    id,
    userId: data.userId as string,
    transcript: data.transcript as string,
    analysis: data.analysis as EntryAnalysis,
    contextualResponse: data.contextualResponse as string | null | undefined,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}

export async function updateEntryContextualResponse(
  entryId: string,
  response: string | null,
): Promise<void> {
  const docRef = doc(db, ENTRIES_COLLECTION, entryId);
  await updateDoc(docRef, {
    contextualResponse: response,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteEntry(entryId: string): Promise<void> {
  const docRef = doc(db, ENTRIES_COLLECTION, entryId);
  await deleteDoc(docRef);
}

export async function fetchRecentEntries(
  userId: string,
  limitCount: number = 5,
): Promise<JournalEntry[]> {
  const entriesQuery = query(
    collection(db, ENTRIES_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnap) =>
    mapDocumentToEntry(docSnap.id, docSnap.data()),
  );
}

export async function countUserEntries(userId: string): Promise<number> {
  const coll = collection(db, ENTRIES_COLLECTION);
  const q = query(coll, where('userId', '==', userId));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}


export async function fetchDiscoverArticles(
  userId: string,
): Promise<DiscoverDocument | null> {
  const docRef = doc(db, 'users', userId, 'discover', 'latest');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as DiscoverDocument;
}

export async function fetchEntriesByDays(
  userId: string,
  days: number,
): Promise<JournalEntry[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const entriesQuery = query(
    collection(db, ENTRIES_COLLECTION),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startDate)),
    orderBy('createdAt', 'desc'),
  );

  const snapshot = await getDocs(entriesQuery);

  return snapshot.docs.map((docSnap) =>
    mapDocumentToEntry(docSnap.id, docSnap.data()),
  );
}

export async function fetchInsights(
  userId: string,
): Promise<any | null> {
  const docRef = doc(db, 'users', userId, 'insights', 'latest');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data();
}

export async function saveInsights(
  userId: string,
  data: any,
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'insights', 'latest');
  await setDoc(docRef, data);
}
export async function saveDiscoverArticles(
  userId: string,
  data: DiscoverDocument,
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'discover', 'latest');
  await setDoc(docRef, data);
}


export async function saveArticle(
  userId: string,
  article: DiscoverArticle,
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'savedArticles', article.id);
  await setDoc(docRef, article);
}

export async function removeSavedArticle(
  userId: string,
  articleId: string,
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'savedArticles', articleId);
  await deleteDoc(docRef);
}

export async function fetchSavedArticles(
  userId: string,
): Promise<DiscoverArticle[]> {
  const q = query(collection(db, 'users', userId, 'savedArticles'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as DiscoverArticle);
}

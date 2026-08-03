import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { JournalEntry, EntryAnalysis } from '@/types/entry';

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

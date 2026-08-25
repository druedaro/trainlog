import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Decode base64 service account
const serviceAccountKeyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountKeyBase64) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8')
);

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function backfillSavedArticles() {
  console.log('Starting backfill for savedArticles...');
  
  const usersSnapshot = await db.collection('users').get();
  let updatedCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const savedArticlesRef = db.collection(`users/${userDoc.id}/savedArticles`);
    const savedArticlesSnapshot = await savedArticlesRef.get();

    for (const articleDoc of savedArticlesSnapshot.docs) {
      const data = articleDoc.data();
      if (!data.savedAt) {
        await articleDoc.ref.update({
          savedAt: Date.now() - Math.floor(Math.random() * 1000000) // Randomize slightly
        });
        updatedCount++;
        console.log(`Updated article ${articleDoc.id} for user ${userDoc.id}`);
      }
    }
  }

  console.log(`Backfill complete. Updated ${updatedCount} articles.`);
}

backfillSavedArticles().catch(console.error);

import { adminDb, adminMessaging } from '../api/_lib/firebaseAdmin.js';

async function run() {
  console.log('Testing Push Notification...');
  const usersSnapshot = await adminDb.collection('users').get();
  console.log(`Found ${usersSnapshot.docs.length} users.`);
  
  let totalSent = 0;
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const tokensSnapshot = await adminDb.collection('users').doc(userId).collection('fcmTokens').get();
    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    console.log(`User ${userId} has ${tokens.length} tokens.`);
    
    if (tokens.length > 0) {
      console.log(`Found ${tokens.length} tokens for user ${userId}. Sending...`);
      const message = {
        notification: {
          title: 'Prueba de Notificación',
          body: 'Esto es una prueba manual desde tu asistente virtual.',
        },
        webpush: {
          notification: {
            icon: '/icon-192.png',
            badge: '/badge.svg',
          },
        },
        tokens: tokens,
      };
      
      const response = await adminMessaging.sendEachForMulticast(message);
      console.log(`User ${userId}: Success=${response.successCount}, Failure=${response.failureCount}`);
      totalSent += response.successCount;
    }
  }
  console.log(`Finished. Total notifications sent: ${totalSent}`);
}

run().catch(console.error);

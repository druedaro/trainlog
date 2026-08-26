import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminMessaging } from '../_lib/firebaseAdmin.js';

export default async function dailyReminder(req: VercelRequest, res: VercelResponse) {

  if (
    process.env.CRON_SECRET &&
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {


    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const usersSnapshot = await adminDb.collection('users').get();

    const notificationsPromises: Promise<any>[] = [];
    let sentCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      const entriesSnapshot = await adminDb
        .collection('entries')
        .where('userId', '==', userId)
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<=', endOfDay)
        .limit(1)
        .get();

      if (entriesSnapshot.empty) {


        const tokensSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .get();

        const tokens = tokensSnapshot.docs.map(doc => doc.id);

        if (tokens.length > 0) {

          const message = {
            notification: {
              title: '¡No olvides tu entrenamiento!',
              body: '🎙️ Registra cómo ha ido tu día.',
            },
            webpush: {
              notification: {
                icon: '/icon-192.png',
                badge: '/favicon.svg',
              },
            },
            tokens: tokens,
          };

          const pushPromise = adminMessaging.sendEachForMulticast(message)
            .then((response) => {
              sentCount += response.successCount;

              if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                  }
                });
                const cleanupPromises = failedTokens.map(token => 
                  adminDb.collection('users').doc(userId).collection('fcmTokens').doc(token).delete()
                );
                return Promise.all(cleanupPromises);
              }
            })
            .catch(error => {
              console.error(`Error sending push to user ${userId}:`, error);
            });

          notificationsPromises.push(pushPromise);
        }
      }
    }

    await Promise.all(notificationsPromises);

    return res.status(200).json({ success: true, sentNotifications: sentCount });
  } catch (error) {
    console.error('Error in dailyReminder cron:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

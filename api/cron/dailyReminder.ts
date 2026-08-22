import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminMessaging } from '../lib/firebaseAdmin.js';

export default async function dailyReminder(req: VercelRequest, res: VercelResponse) {
  // Verificación de seguridad para asegurar que la llamada viene del Cron de Vercel
  if (
    process.env.CRON_SECRET &&
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Calcular el inicio y fin del día en curso (UTC)
    // Asumimos que la lógica del usuario para "hoy" se basa en su zona horaria, pero para el cron usaremos la fecha actual del servidor.
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    // 2. Obtener todos los usuarios
    const usersSnapshot = await adminDb.collection('users').get();

    const notificationsPromises: Promise<any>[] = [];
    let sentCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // 3. Comprobar si el usuario tiene una entrada creada hoy
      const entriesSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('entries')
        .where('createdAt', '>=', startOfDay)
        .where('createdAt', '<=', endOfDay)
        .limit(1)
        .get();

      if (entriesSnapshot.empty) {
        // No ha entrenado/registrado nada hoy
        // 4. Buscar si tiene tokens FCM activos
        const tokensSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .get();

        const tokens = tokensSnapshot.docs.map(doc => doc.id);

        if (tokens.length > 0) {
          // 5. Enviar push notification a todos sus dispositivos
          const message = {
            notification: {
              title: '¡No olvides tu entrenamiento!',
              body: '🎙️ Registra cómo ha ido tu día.',
            },
            tokens: tokens,
          };

          const pushPromise = adminMessaging.sendEachForMulticast(message)
            .then((response) => {
              sentCount += response.successCount;
              // Limpiar tokens inválidos si hay fallos (opcional pero recomendado)
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

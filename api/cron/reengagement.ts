import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminMessaging } from '../_lib/firebaseAdmin.js';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export default async function reengagement(req: VercelRequest, res: VercelResponse) {
  if (
    process.env.CRON_SECRET &&
    req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!groq) {
    return res.status(500).json({ error: 'Groq API Key missing' });
  }

  try {
    const now = new Date();
    // Normalize to midnight UTC for day difference calculations
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const usersSnapshot = await adminDb.collection('users').get();
    
    let sentCount = 0;
    const notificationsPromises: Promise<any>[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const displayName = userData.displayName || 'atleta';
      const gender = userData.gender || 'masculino';
      const age = userData.age || 30;

      // Get last entry
      const entriesSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('entries')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      let daysInactive = 0;

      if (!entriesSnapshot.empty) {
        const lastEntryData = entriesSnapshot.docs[0].data();
        let lastDate: Date;
        if (lastEntryData.createdAt && lastEntryData.createdAt.toDate) {
          lastDate = lastEntryData.createdAt.toDate();
        } else {
          lastDate = new Date(); // fallback
        }
        
        const lastEntryDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        daysInactive = Math.floor((today.getTime() - lastEntryDay.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Fallback to account creation date if stored, but for now we ignore if 0 entries
        continue;
      }

      // Check if it's exactly 3, 5, or 7 days
      if (daysInactive === 3 || daysInactive === 5 || daysInactive === 7) {
        
        const tokensSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .get();

        const tokens = tokensSnapshot.docs.map(doc => doc.id);
        
        if (tokens.length > 0) {
          const systemPrompt = `Eres Anna, la entrenadora personal y psicóloga deportiva IA de la app Trainlog.
El usuario se llama ${displayName}, tiene ${age} años, género ${gender}.
El usuario lleva exactamente ${daysInactive} días sin entrenar ni registrar actividad en la app.
Tu tarea es escribir el texto de una notificación push corta (MÁXIMO 120 caracteres) para animarle amablemente a volver y registrar algo hoy.
Debe sonar como un mensaje de chat, muy empático, directo y que demuestre que te importas por él/ella. Usa algún emoji.
NO te pases de 120 caracteres.`;

          let pushMessageBody = `Llevas ${daysInactive} días descansando. ¿Retomamos hoy con algo suave? 💪`;

          try {
            const response = await groq.chat.completions.create({
              model: "openai/gpt-oss-120b",
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Genera el mensaje push.' }
              ],
              temperature: 0.7,
              max_tokens: 60,
            });
            pushMessageBody = response.choices[0]?.message?.content?.trim() || pushMessageBody;
            
            // Cleanup quotes if AI returns them
            if (pushMessageBody.startsWith('"') && pushMessageBody.endsWith('"')) {
              pushMessageBody = pushMessageBody.slice(1, -1);
            }
          } catch(e) {
            console.error(`Error generating reengagement message for user ${userId}`, e);
          }

          const message = {
            notification: {
              title: `Hola ${displayName} 👋`,
              body: pushMessageBody,
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
            .catch(err => console.error(err));
            
          notificationsPromises.push(pushPromise);
        }
      }
    }

    await Promise.all(notificationsPromises);
    return res.status(200).json({ success: true, reengagedUsers: sentCount });
  } catch (error) {
    console.error('Error in reengagement cron:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

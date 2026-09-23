import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminMessaging } from '../_lib/firebaseAdmin.js';
import { calculateStreak, getTopActivity } from '../_lib/gamification.js';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export default async function monthlyReportBuilder(req: VercelRequest, res: VercelResponse) {
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

    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfPrevMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
    const prevMonthStr = `${lastDayOfPrevMonth.getFullYear()}-${String(lastDayOfPrevMonth.getMonth() + 1).padStart(2, '0')}`;
    const firstDayOfPrevMonth = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), 1);

    const usersSnapshot = await adminDb.collection('users').get();
    
    let generatedCount = 0;
    const notificationsPromises: Promise<any>[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const gender = userData.gender || 'masculino';
      const age = userData.age || 30;
      const personalContext = userData.personalContext;

      const reportRef = adminDb.collection('users').doc(userId).collection('monthlyReports').doc(prevMonthStr);
      const reportSnap = await reportRef.get();

      if (reportSnap.exists) {

        continue;
      }

      const entriesSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('entries')
        .where('createdAt', '>=', firstDayOfPrevMonth)
        .where('createdAt', '<=', lastDayOfPrevMonth)
        .get();

      let summaryText = 'No registraste ningún entrenamiento el mes pasado. ¡Este mes es una nueva oportunidad para empezar a tope!';
      let totalEntries = 0;
      let maxStreak = 0;
      let topActivity = 'Ninguna';

      if (!entriesSnapshot.empty) {
        totalEntries = entriesSnapshot.docs.length;
        
        const entryDates: number[] = [];
        const activitiesList: string[][] = [];

        entriesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.createdAt && data.createdAt.toDate) {
            entryDates.push(data.createdAt.toDate().getTime());
          }
          if (data.analysis && data.analysis.activities) {
            activitiesList.push(data.analysis.activities);
          }
        });

        maxStreak = calculateStreak(entryDates);
        topActivity = getTopActivity(activitiesList);

        const systemPrompt = `Eres el entrenador personal IA de Trainlog (te llamas Anna).
Tu objetivo es generar un párrafo breve y muy motivador resumiendo el mes de entrenamiento del usuario.
Habla directamente al usuario de tú. Tono: energético, empático, directo.

Datos del mes (${prevMonthStr}):
- Entrenamientos completados: ${totalEntries}
- Actividad favorita: ${topActivity}
- Mejor racha de días seguidos: ${maxStreak}
- Perfil del usuario: ${gender}, ${age} años.
${personalContext ? `- Contexto Vital Actual (Tenlo muy en cuenta para la motivación): "${personalContext}"` : ''}

Escribe UN SOLO PÁRRAFO de máximo 40-50 palabras felicitándole, destacando sus logros de este mes, y animándole a superarse el próximo mes (o simplemente felicitándole por la resiliencia si su contexto vital es duro). Usa emojis. No incluyas saludos genéricos como "Hola", ve directo al grano. Adapta el lenguaje a su género (${gender}).`;

        try {
          const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Genera el párrafo motivacional.' }
            ],
            temperature: 0.7,
            max_tokens: 200,
          });
          summaryText = response.choices[0]?.message?.content?.trim() || "¡Qué gran mes! Sigue así.";
        } catch(e) {
          console.error(`Error generating Groq report for user ${userId}`, e);
          summaryText = "Has hecho un buen trabajo este mes. ¡Sigue así!";
        }
      }

      const reportData = {
        id: prevMonthStr,
        month: prevMonthStr,
        summary: summaryText,
        totalEntries,
        maxStreak,
        topActivity,
        createdAt: Date.now()
      };

      await reportRef.set(reportData);
      generatedCount++;

      const tokensSnapshot = await adminDb
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .get();

      const tokens = tokensSnapshot.docs.map(doc => doc.id);
      
      if (tokens.length > 0) {
        const monthName = new Date(prevMonthStr + '-02').toLocaleString('es', { month: 'long' });
        const message = {
          notification: {
            title: `🏆 Tu resumen de ${monthName} ya está listo`,
            body: '¡Descubre cómo te ha ido este mes!',
          },
          tokens: tokens,
        };

        const pushPromise = adminMessaging.sendEachForMulticast(message)
          .then((response) => {
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

    await Promise.all(notificationsPromises);
    return res.status(200).json({ success: true, generatedReports: generatedCount });
  } catch (error) {
    console.error('Error in monthlyReportBuilder cron:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey,
            }),
        });
    }
}

const db = getApps().length ? getFirestore(getApps()[0], 'surfdims') : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!db) return res.status(500).json({ error: 'Database connection failed. Check Firebase env vars.' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing required parameter: userId' });

    try {
        const tokensSnapshot = await db.collection('fcmTokens').where('userId', '==', userId).get();
        const tokens: string[] = [];
        tokensSnapshot.forEach(doc => tokens.push(doc.id));

        if (tokens.length === 0) {
            return res.status(404).json({ error: 'No push tokens found for this user. Please ensure notifications are allowed.' });
        }

        const response = await getMessaging().sendEachForMulticast({
            notification: {
                title: 'Test Notification',
                body: 'Web push notifications are working correctly!',
            },
            tokens,
        });

        return res.status(200).json({ success: true, message: `Sent successfully to ${response.successCount} devices.` });
    } catch (error: any) {
        console.error('Error sending test notification:', error);
        return res.status(500).json({ error: error.message });
    }
}

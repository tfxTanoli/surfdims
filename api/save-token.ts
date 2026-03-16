import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

    const { token, userId } = req.body;
    if (!token || !userId) return res.status(400).json({ error: 'Missing required parameters: token, userId' });

    try {
        await db.collection('fcmTokens').doc(token).set({
            userId,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return res.status(200).json({ success: true, message: 'Push token saved successfully.' });
    } catch (error: any) {
        console.error('Error saving push token:', error);
        return res.status(500).json({ error: error.message });
    }
}

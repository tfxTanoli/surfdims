import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }
}

const db = admin.apps.length ? admin.firestore() : null;
if (db) {
    db.settings({ databaseId: 'surfdims' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!db) {
        return res.status(500).json({ error: 'Database connection failed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    try {
        const tokensSnapshot = await db.collection('fcmTokens').where('userId', '==', userId).get();
        const tokens: string[] = [];
        
        tokensSnapshot.forEach(doc => {
            tokens.push(doc.id);
        });

        if (tokens.length === 0) {
             return res.status(404).json({ error: 'No push tokens found for this user. Please ensure notifications are allowed.' });
        }

        const message = {
            notification: {
                title: 'Test Notification',
                body: 'Web push notifications are working correctly!',
            },
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        return res.status(200).json({ 
            success: true, 
            message: `Sent successfully to ${response.successCount} devices.` 
        });
    } catch (error: any) {
        console.error('Error sending test notification:', error);
        return res.status(500).json({ error: error.message });
    }
}

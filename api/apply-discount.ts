import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

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

    const { discountCodeId, boardIds } = req.body;

    if (!discountCodeId || !boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
        return res.status(400).json({ error: 'Missing required parameters: discountCodeId, boardIds' });
    }

    try {
        const codeRef = db.collection('discountCodes').doc(discountCodeId);
        const codeDoc = await codeRef.get();

        if (!codeDoc.exists) {
            return res.status(404).json({ error: 'Discount code not found.' });
        }

        const codeData = codeDoc.data();
        if (!codeData) {
            return res.status(500).json({ error: 'Failed to read discount code data.' });
        }

        const now = new Date();
        const expiry = new Date(codeData.expiryDate);
        if (expiry < now) {
            return res.status(400).json({ error: 'This discount code has expired.' });
        }

        if (codeData.usageLimit !== undefined && codeData.usageCount >= codeData.usageLimit) {
            return res.status(400).json({ error: 'This discount code has reached its usage limit.' });
        }

        // Process all boards and mark as paid
        const batch = db.batch();
        const nowTimestamp = admin.firestore.Timestamp.now();
        const expiresAtDate = new Date(nowTimestamp.toMillis() + 365 * 24 * 60 * 60 * 1000); // 1 year

        for (const boardId of boardIds) {
            const boardRef = db.collection('boards').doc(boardId);
            batch.update(boardRef, {
                status: "Live",
                expiresAt: expiresAtDate.toISOString(),
                isPaid: true,
                activeAt: nowTimestamp,
                paymentVerified: true,
                paymentIntentId: 'free_discount_code'
            });
        }

        // Increment discount usage
        batch.update(codeRef, { usageCount: (codeData.usageCount || 0) + 1 });

        await batch.commit();

        return res.status(200).json({ success: true, message: 'Discount applied and listings activated.' });
    } catch (error: any) {
        console.error('Error applying discount:', error);
        return res.status(500).json({ error: error.message });
    }
}

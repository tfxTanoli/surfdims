import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

    const { discountCodeId, boardIds } = req.body;
    if (!discountCodeId || !boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
        return res.status(400).json({ error: 'Missing required parameters: discountCodeId, boardIds' });
    }

    try {
        const codeRef = db.collection('discountCodes').doc(discountCodeId);
        const codeDoc = await codeRef.get();

        if (!codeDoc.exists) return res.status(404).json({ error: 'Discount code not found.' });

        const codeData = codeDoc.data();
        if (!codeData) return res.status(500).json({ error: 'Failed to read discount code data.' });

        if (new Date(codeData.expiryDate) < new Date()) {
            return res.status(400).json({ error: 'This discount code has expired.' });
        }

        if (codeData.usageLimit !== undefined && codeData.usageCount >= codeData.usageLimit) {
            return res.status(400).json({ error: 'This discount code has reached its usage limit.' });
        }

        const batch = db.batch();
        const nowTimestamp = Timestamp.now();
        const expiresAtDate = new Date(nowTimestamp.toMillis() + 365 * 24 * 60 * 60 * 1000);

        for (const boardId of boardIds) {
            batch.update(db.collection('boards').doc(boardId), {
                status: 'Live',
                expiresAt: expiresAtDate.toISOString(),
                isPaid: true,
                activeAt: nowTimestamp,
                paymentVerified: true,
                paymentIntentId: 'free_discount_code',
            });
        }

        batch.update(codeRef, { usageCount: (codeData.usageCount || 0) + 1 });
        await batch.commit();

        return res.status(200).json({ success: true, message: 'Discount applied and listings activated.' });
    } catch (error: any) {
        console.error('Error applying discount:', error);
        return res.status(500).json({ error: error.message });
    }
}

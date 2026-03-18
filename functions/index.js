const { onDocumentWritten, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
require('dotenv').config();
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize with environment credentials if provided, otherwise default
if (!admin.apps.length) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
        try {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.warn("Could not load credentials from path:", serviceAccountPath, e);
            admin.initializeApp();
        }
    } else {
        admin.initializeApp();
    }
}

const db = admin.firestore();
db.settings({ databaseId: 'surfdims' });

/**
 * Helper to write in-app notifications into each user's Firestore notifications array.
 */
async function writeInAppNotifications(userIds, type, message, boardId) {
    if (!userIds || userIds.length === 0) return;
    try {
        // Firestore batch limit is 500 — chunk if needed
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 400) {
            chunks.push(userIds.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = db.batch();
            for (const userId of chunk) {
                const notification = {
                    id: Math.random().toString(36).substr(2, 9),
                    type,
                    message,
                    boardId: boardId || null,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };
                batch.update(db.collection('users').doc(userId), {
                    notifications: FieldValue.arrayUnion(notification)
                });
            }
            await batch.commit();
        }
        console.log(`Wrote in-app notifications to ${userIds.length} users.`);
    } catch (error) {
        console.error('Error writing in-app notifications:', error);
    }
}

/**
 * Helper to construct and send FCM messages.
 */
async function sendPushNotification(userIds, title, body, data = {}) {
    if (!userIds || userIds.length === 0) return;

    try {
        const tokens = [];
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            chunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const tokensSnapshot = await db.collection('fcmTokens').where('userId', 'in', chunk).get();
            tokensSnapshot.forEach(doc => {
                tokens.push(doc.id);
            });
        }

        if (tokens.length === 0) return;

        const message = {
            notification: { title, body },
            data,
            tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} messages. Failed ${response.failureCount} messages.`);

        // Cleanup dead tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error && (
                    resp.error.code === 'messaging/invalid-registration-token' ||
                    resp.error.code === 'messaging/registration-token-not-registered'
                )) {
                    failedTokens.push(tokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                const batch = db.batch();
                failedTokens.forEach(token => {
                    batch.delete(db.collection('fcmTokens').doc(token));
                });
                await batch.commit();
                console.log(`Cleaned up ${failedTokens.length} obsolete tokens.`);
            }
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

/**
 * Triggered on any write to a board document in the 'surfdims' database.
 * Handles:
 * - Used board auto-activation
 * - New board payment verification
 * - Alert match push notifications when board goes Live
 */
exports.onBoardCreate = onDocumentWritten(
    { document: "boards/{boardId}", database: "surfdims" },
    async (event) => {
        const boardId = event.params.boardId;

        const beforeData = event.data.before.exists ? event.data.before.data() : null;
        const afterData = event.data.after.exists ? event.data.after.data() : null;

        if (!afterData) return; // Deleted

        const justActivated = (!beforeData || beforeData.status !== "Live") && afterData.status === "Live";

        try {
            // Business Logic for newly created boards (not yet Live)
            if (!beforeData && afterData.status !== "Live") {
                if (afterData.condition === "Used") {
                    // --- USED BOARD LOGIC ---
                    const now = admin.firestore.Timestamp.now();
                    const expiresAtDate = new Date(now.toMillis() + 90 * 24 * 60 * 60 * 1000);

                    await db.collection("boards").doc(boardId).update({
                        status: "Live",
                        expiresAt: expiresAtDate.toISOString(),
                        isPaid: false,
                        activeAt: now
                    });
                    console.log(`Activated USED board ${boardId}. Expires: ${expiresAtDate.toISOString()}`);
                    return;
                } else if (afterData.condition === "New" && afterData.paymentIntentId) {
                    // --- NEW BOARD LOGIC --- Verify Stripe Payment
                    const stripeKey = process.env.STRIPE_SECRET_KEY;
                    if (stripeKey) {
                        const stripe = require("stripe")(stripeKey);
                        const paymentIntent = await stripe.paymentIntents.retrieve(afterData.paymentIntentId);

                        if (paymentIntent.status === 'succeeded') {
                            const now = admin.firestore.Timestamp.now();
                            const expiresAtDate = new Date(now.toMillis() + 365 * 24 * 60 * 60 * 1000);

                            await db.collection("boards").doc(boardId).update({
                                status: "Live",
                                expiresAt: expiresAtDate.toISOString(),
                                isPaid: true,
                                activeAt: now,
                                paymentVerified: true
                            });
                            console.log(`Activated NEW board ${boardId}. Payment verified.`);
                        } else {
                            await db.collection("boards").doc(boardId).update({
                                status: "PaymentFailed",
                                paymentVerified: false
                            });
                        }
                    }
                }
            }

            // --- PUSH NOTIFICATIONS: MATCH ALERTS ---
            // Only fires once when a board transitions to "Live"
            if (justActivated) {
                const usersSnapshot = await db.collection('users').get();
                const matchedUserIds = [];

                usersSnapshot.forEach(userDoc => {
                    const user = userDoc.data();
                    if (userDoc.id === afterData.sellerId || !user.alerts || user.alerts.length === 0) return;

                    const hasMatch = user.alerts.some(alert => {
                        const brandMatch = !alert.brand || afterData.brand.toLowerCase().includes(alert.brand.toLowerCase());
                        const modelMatch = !alert.model || afterData.model.toLowerCase().includes(alert.model.toLowerCase());

                        const dim = afterData.dimensions && afterData.dimensions[0];
                        if (!dim) return brandMatch && modelMatch;

                        const volMatch = dim.volume >= alert.volumeMin && dim.volume <= alert.volumeMax;
                        const lenMatch = dim.length >= alert.lengthMin && dim.length <= alert.lengthMax;
                        const widMatch = dim.width >= alert.widthMin && dim.width <= alert.widthMax;
                        const thickMatch = dim.thickness >= alert.thicknessMin && dim.thickness <= alert.thicknessMax;
                        const setupMatch = alert.finSetup === 'All' || afterData.finSetup === alert.finSetup;
                        const systemMatch = alert.finSystem === 'All' || afterData.finSystem === alert.finSystem;

                        return brandMatch && modelMatch && volMatch && lenMatch && widMatch && thickMatch && setupMatch && systemMatch;
                    });

                    if (hasMatch) {
                        matchedUserIds.push(userDoc.id); // use Firestore doc ID, not user.id field
                    }
                });

                if (matchedUserIds.length > 0) {
                    const alertMsg = `New listing matches your alert: ${afterData.brand} ${afterData.model}`;
                    await Promise.all([
                        sendPushNotification(
                            matchedUserIds,
                            "New Match Alert",
                            alertMsg,
                            { type: 'AlertMatch', boardId }
                        ),
                        writeInAppNotifications(
                            matchedUserIds,
                            'Alert Match',
                            alertMsg,
                            boardId
                        )
                    ]);
                    console.log(`Sent alert match notifications to ${matchedUserIds.length} users for board ${boardId}`);
                }
            }
        } catch (error) {
            console.error(`Error processing board ${boardId}:`, error);
        }
    }
);

/**
 * Triggered on any update to a board document in the 'surfdims' database.
 * Handles price drop notifications for users who favorited the board.
 */
exports.onBoardUpdate = onDocumentUpdated(
    { document: "boards/{boardId}", database: "surfdims" },
    async (event) => {
        const boardId = event.params.boardId;
        const before = event.data.before.data();
        const after = event.data.after.data();

        // Price Drop
        if (before.price !== undefined && after.price !== undefined && after.price < before.price) {
            const usersSnapshot = await db.collection('users').get();
            const favoritedUserIds = [];

            usersSnapshot.forEach(doc => {
                const user = doc.data();
                if (user.favs && user.favs.includes(boardId)) {
                    favoritedUserIds.push(doc.id); // use Firestore doc ID, not user.id field
                }
            });

            if (favoritedUserIds.length > 0) {
                // Look up seller's country to determine currency
                let sellerCountry = 'US';
                if (after.sellerId) {
                    try {
                        const sellerDoc = await db.collection('users').doc(after.sellerId).get();
                        if (sellerDoc.exists) {
                            sellerCountry = sellerDoc.data().country || 'US';
                        }
                    } catch (e) {
                        console.warn('Could not fetch seller country for currency:', e);
                    }
                }
                const currency = sellerCountry === 'NZ' ? 'NZD' : sellerCountry === 'AU' ? 'AUD' : sellerCountry === 'US' ? 'USD' : sellerCountry;
                const priceMsg = `Great news! The price for ${after.brand} ${after.model} dropped to $${after.price} ${currency}`;
                await Promise.all([
                    sendPushNotification(
                        favoritedUserIds,
                        "Price Drop Alert",
                        priceMsg,
                        { type: 'PriceDrop', boardId }
                    ),
                    writeInAppNotifications(
                        favoritedUserIds,
                        'Price Drop',
                        priceMsg,
                        boardId
                    )
                ]);
                console.log(`Sent price drop notifications to ${favoritedUserIds.length} users for board ${boardId}`);
            }
        }
    }
);

/**
 * Scheduled function (Daily) to check for expired listings.
 */
exports.checkExpiredListings = onSchedule("every 24 hours", async (event) => {
    const todayISO = new Date().toISOString();

    try {
        const snapshot = await db.collection("boards")
            .where("status", "==", "Live")
            .where("expiresAt", "<", todayISO)
            .get();

        if (snapshot.empty) {
            console.log("No expired listings found.");
            return null;
        }

        const batch = db.batch();
        const expiredUserIdsAndBoards = [];
        const now = admin.firestore.Timestamp.now();

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            batch.update(doc.ref, {
                status: "Expired",
                inactiveAt: now.toDate().toISOString(),
                lifecycleStatus: "inactive"
            });

            if (data.sellerId) {
                expiredUserIdsAndBoards.push({
                    sellerId: data.sellerId,
                    boardId: doc.id,
                    title: `${data.brand} ${data.model}`
                });
            }
        });

        await batch.commit();
        console.log(`Expired ${snapshot.size} listings.`);

        // Group by sellerId and send push notifications
        const notificationsBySeller = {};
        expiredUserIdsAndBoards.forEach(item => {
            if (!notificationsBySeller[item.sellerId]) notificationsBySeller[item.sellerId] = [];
            notificationsBySeller[item.sellerId].push(item.title);
        });

        for (const sellerId in notificationsBySeller) {
            const titles = notificationsBySeller[sellerId];
            const body = titles.length === 1
                ? `Your listing for ${titles[0]} has expired. Log in to renew it.`
                : `You have ${titles.length} expired listings. Log in to renew them.`;

            await Promise.all([
                sendPushNotification([sellerId], "Listing Expired", body, { type: 'ExpiredListing' }),
                writeInAppNotifications([sellerId], 'Expired Listing', body, null)
            ]);
        }

    } catch (error) {
        console.error("Error checking expired listings:", error);
    }
    return null;
});

/**
 * Scheduled function (Daily) to cleanup old inactive listings.
 */
exports.cleanupOldListings = onSchedule("every 24 hours", async (event) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cutoffISO = thirtyDaysAgo.toISOString();

    try {
        const snapshot = await db.collection("boards")
            .where("lifecycleStatus", "==", "inactive")
            .where("inactiveAt", "<", cutoffISO)
            .get();

        if (snapshot.empty) {
            console.log("No old listings to cleanup.");
            return null;
        }

        const bucket = admin.storage().bucket();
        const deletePromises = [];

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            deletePromises.push(doc.ref.delete());

            if (data.storagePath) {
                if (data.images && Array.isArray(data.images)) {
                    data.images.forEach(imageUrl => {
                        try {
                            const decodedUrl = decodeURIComponent(imageUrl);
                            const matches = decodedUrl.match(/o\/(.*?)\?/);
                            if (matches && matches[1]) {
                                const filePath = matches[1];
                                deletePromises.push(
                                    bucket.file(filePath).delete().catch(e =>
                                        console.log(`Failed to delete file ${filePath}`, e)
                                    )
                                );
                            }
                        } catch (e) {
                            console.log("Error parsing image URL for deletion", imageUrl);
                        }
                    });
                }
            }
        });

        await Promise.all(deletePromises);
        console.log(`Cleaned up ${snapshot.size} old listings.`);
    } catch (error) {
        console.error("Error cleaning up old listings:", error);
    }
    return null;
});

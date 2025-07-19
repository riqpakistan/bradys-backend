const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const shared = require('../Shared/shared');

const storeNotDeliveredShopsList = functions.https.onRequest(async (req, res) => {
    try {
        const salesmanId = req.query.salesmanId;
        const shops = req.body;
        const currentDate = shared.getCurrentDate();
        // const currentDate = new Date().toISOString().split('T')[0];

        if (!salesmanId) {
            return res.status(400).send('Salesman id is required.');
        }

        if (!Array.isArray(shops) || shops.length === 0) {
            return res.status(200).json({ message: 'No shops to store.' });
        }


        const notDeliveredRef = db.collection('Users').doc('Staff').collection('Salesmen').doc(salesmanId).collection('Delivered').doc(currentDate).collection('Not Delivered Shops');

        // Store each shop directly in Firestore
        for (const shop of shops) {
            const { shopId, ...shopData } = shop;

            if (!shopId) {
                throw new Error('Each shop must have a shopId.');
            }

            // Add shop data to Firestore with shopId as the document ID
            await notDeliveredRef.doc(shopId).set(shopData, { merge: true });
        }

        return res.status(200).json({ message: 'Shops stored successfully.' });
    } catch (error) {
        console.error('Error storing shops:', error);
        return res.status(500).json({ error: 'Error storing shops: ' + error.message });
    }
});

module.exports = storeNotDeliveredShopsList;




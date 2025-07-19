const db = require('../utils/firebaseAdmin');
const functions = require('firebase-functions');

const getNotDeliveredShopsList = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const currentDate = req.query.date;
    // const currentDate = new Date().toISOString().split('T')[0];

    if (!salesmanId || !currentDate) {
        return res.status(400).json({ error: 'Salesman id is required.' });
    }

    try {
        const shopsRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('Delivered')
            .doc(currentDate)
            .collection('Not Delivered Shops');

        const shopSnapshot = await shopsRef.get();

        if (shopSnapshot.empty) {
            return res.status(404).json({ error: 'No shops found.', salesmanId });
        }

        const shops = shopSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(shops);

    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ error: 'Error fetching shops: ' + error.message });
    }
});

module.exports = getNotDeliveredShopsList;


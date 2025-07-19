const db = require('../utils/firebaseAdmin'); // Ensure Firebase Admin is initialized here
const functions = require('firebase-functions');

const getSalesmanCashInHand = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;

    if (!salesmanId) {
        return res.status(400).json({ error: 'Salesman id is required.' });
    }

    try {
        const salesmanRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

        const salesmanDoc = await salesmanRef.get();

        if (!salesmanDoc.exists) {
            return res.status(200).json({
                cashInHand: 0.0,
            });
        }

        const cashInHand = salesmanDoc.data().cashInHand ?? 0.0;

        res.status(200).json({ cashInHand });
    } catch (error) {
        console.error('Error fetching cashInHand:', error);
        res.status(500).json({ error: 'Error fetching cashInHand: ' + error.message });
    }
});

module.exports = getSalesmanCashInHand;

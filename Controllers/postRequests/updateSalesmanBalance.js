const functions = require('firebase-functions');
const admin = require('firebase-admin');
const shared = require('../Shared/shared');

// Firestore reference
const db = admin.firestore();

const updateSalesmanBalance = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const { cashInHand } = req.body;
    const currentDate = shared.getCurrentDate();

    // Validate input
    if (!salesmanId) {
        return res.status(400).json({ error: 'Salesman id is required as a query parameter.' });
    }

    if (typeof cashInHand !== 'number') {
        return res.status(400).json({ error: 'Cash amount must be a number and is required in the request body.' });
    }

    try {
        const salesmanRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

        // Check if the salesman exists
        const salesmanDoc = await salesmanRef.get();
        if (!salesmanDoc.exists) {
            return res.status(404).json({
                error: `Salesman '${salesmanId}' does not exist.`,
            });
        }
       const data = salesmanDoc.data();
       const previousCashInHand = data?.cashInHand ?? 0;
       const updatedCashInHand = previousCashInHand +cashInHand;
       

        // Update the cashInHand field
        await salesmanRef.update({ cashInHand: updatedCashInHand });

        // Add the cashInHand value to the Transactions collection
        const transactionRef = salesmanRef.collection('Transactions').doc(currentDate);
        await transactionRef.set(
            { amountRecieved: cashInHand },
            { merge: true }
        );

        res.status(200).json({ message: `Cash in hand updated to ${cashInHand} for salesman '${salesmanId}'.` });
    } catch (error) {
        console.error('Error updating cashInHand:', error);
        res.status(500).json({ error: 'Error updating cashInHand: ' + error.message });
    }
});

module.exports = updateSalesmanBalance;

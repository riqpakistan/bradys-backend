const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const shared = require('../Shared/shared');

// Firebase Cloud Function to get tripStatus
const getSalesmanTripStatus = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];

    // Validate input parameters
    if (!salesmanId) {
        return res.status(400).json({ error: 'Salesman id is required.' });
    }

    try {
        // Reference to the specific document for trip status
        const tripRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('GatePass')
            .doc(currentDate);

        // Fetch the document snapshot
        const tripDoc = await tripRef.get();

        if (tripDoc.exists) {
            // Extract and return the tripStatus field
            const tripStatus = tripDoc.data().tripStatus;
            res.status(200).json({ tripStatus });
        } else {
            res.status(404).send('Trip data not found');
        }
    } catch (error) {
        console.error('Error fetching trip status:', error);
        res.status(500).send('Error fetching trip status: ' + error.message);
    }
});

module.exports = getSalesmanTripStatus;

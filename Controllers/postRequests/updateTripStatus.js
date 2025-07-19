const functions = require('firebase-functions');
const admin = require('firebase-admin');
const shared = require('../../Shared/shared');

// Firestore reference
const db = admin.firestore();

// Firebase Cloud Function to update the tripStatus field
const updateTripStatus = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;

    if (!salesmanId) {
        return res.status(400).json({ error: 'Salesman id is required.' });
    }

    try {
        // Get the current date in YYYY-MM-DD format
        const currentDate = shared.getCurrentDate();
        // const currentDate = new Date().toISOString().split('T')[0];

        // Reference to the Firestore document for trip status
        const tripStatusRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('GatePass')
            .doc(currentDate);

        // Update the tripStatus field to "Trip Started"
        await tripStatusRef.set({ tripStatus: 'Trip Started' }, { merge: true });

        // Respond with success message
        res.status(200).json({ message: 'Trip status updated successfully.' });
    } catch (error) {
        console.error('Error updating trip status:', error);
        res.status(500).json({ error: 'Error updating trip status: ' + error.message });
    }
});

module.exports = updateTripStatus;

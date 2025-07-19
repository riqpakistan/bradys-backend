const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const shared = require('../Shared/shared');

const getLastCompletedTripSalesman = functions.https.onRequest(async (req, res) => {
    const managerName = req.query.managerName;
    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];

    // Validate input parameters
    if (!managerName) {
        return res.status(400).json({ error: 'Manager name is required.' });
    }

    try {
        // Reference to the Trips collection for the given manager
        const tripsRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Managers')
            .doc(managerName)
            .collection('Trips').doc('All Trips').collection(currentDate);

        // Fetch the last added document by ordering by document ID in descending order
        const lastTripSnapshot = await tripsRef
            .limit(1)
            .get();

        if (lastTripSnapshot.empty) {
            return res.status(404).json({ error: `No trips found for manager ${managerName}.` });
        }

        // Extract the data from the last document
        const lastTripDoc = lastTripSnapshot.docs[0];
        const lastTripData = lastTripDoc.data();

        // Return the last trip data
        res.status(200).send(lastTripData);
    } catch (error) {
        console.error('Error fetching last added trip:', error);
        res.status(500).send('Error fetching last added trip: ' + error.message);
    }
});

module.exports = getLastCompletedTripSalesman;

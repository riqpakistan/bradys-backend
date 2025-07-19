const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const shared = require('../Shared/shared');

const getAllCompletedTripsSalesman = functions.https.onRequest(async (req, res) => {
    const managerName = req.query.managerName;
    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];  // Get current date in YYYY-MM-DD format

    // Validate input parameters
    if (!managerName) {
        return res.status(400).json({ error: 'Manager name is required.' });
    }

    try {
        // Reference to the Trips collection for the given manager and current date
        const tripsRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Managers')
            .doc(managerName)
            .collection('Trips')
            .doc('All Trips')
            .collection(currentDate);

        // Fetch all documents in the collection
        const tripsSnapshot = await tripsRef.get();

        if (tripsSnapshot.empty) {
            return res.status(404).json({ error: `No trips found for manager ${managerName} on ${currentDate}.` });
        }

        // Array to store trip data
        const tripsList = [];

        // Loop through all documents and extract the required fields (id, name, imageUrl, route)
        tripsSnapshot.forEach(doc => {
            const tripData = doc.data();
            tripsList.push({
                id: doc.id,  // Document ID
                name: tripData.name || 'N/A',
                imageUrl: tripData.imageUrl || 'N/A',
                route: tripData.route || 'N/A'
            });
        });

        // Return the list of all trips
        res.status(200).send(tripsList);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).send('Error fetching trips: ' + error.message);
    }
});

module.exports = getAllCompletedTripsSalesman;

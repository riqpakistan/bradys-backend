const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const shared = require('../../Shared/shared');

// Firebase Cloud Function 
const sendEndTripAlertToManager = functions.https.onRequest(async (req, res) => {
    const salesmanName = req.query.salesmanName;
    const managerName = req.query.managerName;
    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];

    if (!salesmanName) {
        return res.status(400).json({ error: 'Salesman name is required.' });
    }

    try {
        // Fetch the salesman's details from the salesmen collection
        const salesmenSnapshot = await db.collection('Users').doc('Staff').collection('Salesmen')
            .where('name', '==', salesmanName)
            .get();

        if (salesmenSnapshot.empty) {
            return res.status(404).json({ error: `No salesman found with the name ${salesmanName}.` });
        }
        console.log(salesmenSnapshot.docs);

        // Assuming salesman names are unique, get the first matching document
        const salesmanDoc = salesmenSnapshot.docs[0];
        const salesmanData = salesmanDoc.data();

        // Extract required fields and set defaults if they are missing
        const name = salesmanData.name || salesmanName;
        const imageUrl = salesmanData.imageUrl || 'N/A';
        const route = salesmanData.route || 'N/A';


        // Store the salesman's details in the managers/trips collection
        const managerDocRef = db.collection('Users')
            .doc('Staff')
            .collection('Managers')
            .doc(managerName);

        await managerDocRef.set({ name: managerName }, { merge: true });

        // Store the salesman's details in the manager's trips collection
        const managerTripsRef = managerDocRef.collection('Trips').doc('All Trips');

        await managerTripsRef.set({ id: 'All Trips' }, { merge: true });

        const managerCurrentDateTripsRef = managerTripsRef.collection(currentDate);


        await managerCurrentDateTripsRef.add({
            name: name,
            imageUrl: imageUrl,
            route: route,
            // updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Respond with success
        res.status(200).json({ message: 'Salesman details stored successfully in manager trips.' });
    } catch (error) {
        console.error('Error updating manager trips:', error);
        res.status(500).json({ error: 'Error updating manager trips: ' + error.message });
    }
});

module.exports = sendEndTripAlertToManager;

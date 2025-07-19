const db = require('../utils/firebaseAdmin');

const getManagerPendingRequestsList = async (req, res) => {
    const managerName = 'Ahsan';
    try {
        const pendingRequestsDocRef = db.collection('Users')
            .doc('Staff')
            .collection('Managers')
            .doc(managerName)
            .collection('Pending Requests');

        const snapshot = await pendingRequestsDocRef.get();

        if (!snapshot.empty) {

            const pendingRequests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(pendingRequests);
        } else {
            res.status(404).send('No pending requests found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

module.exports = getManagerPendingRequestsList;
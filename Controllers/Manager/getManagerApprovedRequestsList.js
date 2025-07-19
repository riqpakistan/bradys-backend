const db = require('../utils/firebaseAdmin');

const getManagerApprovedRequestsList = async (req, res) => {
    const managerName = 'Ahsan';
    try {
        const approvedRequestsDocRef = db.collection('Users')
            .doc('Staff')
            .collection('Managers')
            .doc(managerName)
            .collection('Approved Requests');

        const snapshot = await approvedRequestsDocRef.get();

        if (!snapshot.empty) {

            const approvedRequests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(approvedRequests);
        } else {
            res.status(404).send('No approved requests found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

module.exports = getManagerApprovedRequestsList;
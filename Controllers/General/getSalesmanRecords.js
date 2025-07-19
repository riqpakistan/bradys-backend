const db = require('../utils/firebaseAdmin');

const getSalesmanRecords = async (req, res) => {
    try {
        const salesmenRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen');

        const snapshot = await salesmenRef.get();

        if (!snapshot.empty) {

            const salesmenList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(salesmenList);
        } else {
            res.status(404).send('No salesman found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

module.exports = getSalesmanRecords;
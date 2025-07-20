const db = require('../../utils/firebaseAdmin');

const getManagerApprovedRequestDetails = async (req, res) => {
    const managerName = 'Ahsan';
    const salesmanId = 'qLkcUZQ5lN6Bw4tnzBuF';
    try {
        const requestedProductsDocRef = db.collection('Users')
            .doc('Staff')
            .collection('Managers')
            .doc(managerName)
            .collection('Approved Requests')
            .doc(salesmanId)
            .collection('Requested Products');

        const snapshot = await requestedProductsDocRef.get();

        if (!snapshot.empty) {

            const requestedProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(requestedProducts);
        } else {
            res.status(404).send('No details found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
}

module.exports = {getManagerApprovedRequestDetails};
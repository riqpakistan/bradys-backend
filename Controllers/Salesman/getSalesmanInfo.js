const db = require('../utils/firebaseAdmin');

const getSalesmanInfo = async (req, res) => {
    const salesmanId = req.query.salesmanId;
    try {

        if(!salesmanId){
            return res.status(404).send('Error: Salesman id is required');
        }

        const salesmanRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

        const documents = await salesmanRef.get();

        if (documents.exists) {
            res.status(200).json({
                id: documents.id,
                ...documents.data()
            });
        } else {
            res.status(404).send('Salesman data not found');
        }

    } catch (error) {
        res.status(500).send(error);
    }
}
module.exports = getSalesmanInfo;
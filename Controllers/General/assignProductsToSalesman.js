
const db = require('../utils/firebaseAdmin');

const assignProductsToSalesman = async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const { newData } = req.body;
    try {
        const getSalesmanRef = await db.collection('Users')
        const docRef = await db.collection('Users').doc('Staff').collection('Salesmen').doc(salesmanId).collection('Cart');
        await docRef.set({ newData });

        res.status(200).send('Created document with ID: ', docRef.id);
    } catch (error) {
        res.status(500).send('Error creating document: ', error);
    }
};

module.exports = assignProductsToSalesman;  

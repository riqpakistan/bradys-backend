const db = require('../utils/firebaseAdmin');
const functions = require('firebase-functions');
const shared = require('../Shared/shared');

const getGatePassCategories = functions.https.onRequest(async (req, res) => {
    const salesmanName = req.query.salesmanName;
    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];

    if (!salesmanName || !currentDate) {
        return res.status(400).json({ error: 'Salesman name and GatePass date is required.' });
    }

    try {
        const categoriesRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen').doc(salesmanName).collection('GatePass').doc(currentDate).collection('Categories');

        const categorySnapshot = await categoriesRef.get();

        if (categorySnapshot.empty) {
            return res.status(404).json({ error: 'No categories found.', salesmanName });

        } else {
            const categories = [];
            for (const doc of categorySnapshot.docs) {
                const categoryId = doc.id;
                const categoryData = doc.data();

                // Construct category object
                categories.push({
                    id: categoryId,
                    name: categoryData.name || categoryId,
                    imageUrl: categoryData.imageUrl || 'N/A',
                });


            }

            res.status(200).json(categories);

        }

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Error fetching categories: ' + error.message });
    }
});

module.exports = getGatePassCategories;
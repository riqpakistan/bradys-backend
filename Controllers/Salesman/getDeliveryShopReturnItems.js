const db = require('../utils/firebaseAdmin');
const functions = require('firebase-functions');

const getDeliveryShopReturnItems = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const currentDate = req.query.date;
    const shopId = req.query.shopId;

    if (!salesmanId || !currentDate || !shopId) {
        return res.status(400).json({ error: 'Salesman id, current date, and shop ID are required.' });
    }

    try {
        const returnItemsRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('Delivered')
            .doc(currentDate)
            .collection('Shops')
            .doc(shopId)
            .collection('Return Items');

        const returnItemsSnapshot = await returnItemsRef.get();

        if (returnItemsSnapshot.empty) {
            return res.status(404).json({ error: 'No return items found for the specified shop.', shopId });
        } else {
            const returnItems = [];
            returnItemsSnapshot.forEach(doc => {
                const productId = doc.id;
                const productData = doc.data();

                // Construct return item object
                returnItems.push({
                    id: productId,
                    ...productData, // Include all fields of the return item document
                });
            });

            res.status(200).json(returnItems);
        }
    } catch (error) {
        console.error('Error fetching return items:', error);
        res.status(500).json({ error: 'Error fetching return items: ' + error.message });
    }
});

module.exports = getDeliveryShopReturnItems;

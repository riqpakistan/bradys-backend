const db = require('../utils/firebaseAdmin');
const functions = require('firebase-functions');

const getDeliveryShopSalesItems = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const currentDate = req.query.date;
    const shopId = req.query.shopId;

    if (!salesmanId || !currentDate || !shopId) {
        return res.status(400).json({ error: 'Salesman id, current date, and shop ID are required.' });
    }

    try {
        const salesItemsRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('Delivered')
            .doc(currentDate)
            .collection('Shops')
            .doc(shopId)
            .collection('Sales Items');

        const salesItemsSnapshot = await salesItemsRef.get();

        if (salesItemsSnapshot.empty) {
            return res.status(404).json({ error: 'No sales items found for the specified shop.', shopId });
        } else {
            const salesItems = [];
            salesItemsSnapshot.forEach(doc => {
                const productId = doc.id;
                const productData = doc.data();

                // Construct sales item object
                salesItems.push({
                    id: productId,
                    ...productData, // Include all fields of the sales item document
                });
            });

            res.status(200).json(salesItems);
        }
    } catch (error) {
        console.error('Error fetching sales items:', error);
        res.status(500).json({ error: 'Error fetching sales items: ' + error.message });
    }
});

module.exports = getDeliveryShopSalesItems;

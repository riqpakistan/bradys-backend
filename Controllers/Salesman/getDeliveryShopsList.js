const db = require('../utils/firebaseAdmin');
const functions = require('firebase-functions');

const getDeliveryShopsList = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const currentDate = req.query.date;
    // const currentDate = new Date().toISOString().split('T')[0];

    if (!salesmanId || !currentDate) {
        return res.status(400).json({ error: 'Salesman id is required.' });
    }

    try {
        const shopsRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('Delivered')
            .doc(currentDate)
            .collection('Shops');

        const shopSnapshot = await shopsRef.get();

        if (shopSnapshot.empty) {
            return res.status(404).json({ error: 'No shops found.', salesmanId });
        }

        const shops = await Promise.all(
            shopSnapshot.docs.map(async (doc) => {
                const shopId = doc.id;
                const shopData = doc.data();

                // References to the collections
                const returnItemsRef = shopsRef.doc(shopId).collection('Return Items');
                const salesItemsRef = shopsRef.doc(shopId).collection('Sales Items');

                // Fetch collection lengths
                const [returnItemsSnapshot, salesItemsSnapshot] = await Promise.all([
                    returnItemsRef.get(),
                    salesItemsRef.get(),
                ]);

                const productsReturned = returnItemsSnapshot.size;
                const productsDelivered = salesItemsSnapshot.size;

                // Construct shop object with additional fields
                return {
                    id: shopId,
                    ...shopData,
                    productsReturned,
                    productsDelivered,
                };
            })
        );

        res.status(200).json(shops);
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ error: 'Error fetching shops: ' + error.message });
    }
});

module.exports = getDeliveryShopsList;










// const db = require('../utils/firebaseAdmin');
// const functions = require('firebase-functions');

// const getDeliveryShopsList = functions.https.onRequest(async (req, res) => {
//     const salesmanName = req.query.salesmanName;
//     const currentDate = new Date().toISOString().split('T')[0];

//     if (!salesmanName || !currentDate) {
//         return res.status(400).json({ error: 'Salesman name and current date are required.' });
//     }

//     try {
//         const shopsRef = db.collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanName)
//             .collection('Delivered')
//             .doc(currentDate)
//             .collection('Shops');

//         const shopSnapshot = await shopsRef.get();

//         if (shopSnapshot.empty) {
//             return res.status(404).json({ error: 'No shops found.', salesmanName });
//         } else {
//             const shops = [];
//             shopSnapshot.forEach(doc => {
//                 const shopId = doc.id;
//                 const shopData = doc.data();

//                 // Construct shop object
//                 shops.push({
//                     id: shopId,
//                     ...shopData, // Include all fields of the shop document
//                 });
//             });

//             res.status(200).json(shops);
//         }
//     } catch (error) {
//         console.error('Error fetching shops:', error);
//         res.status(500).json({ error: 'Error fetching shops: ' + error.message });
//     }
// });

// module.exports = getDeliveryShopsList;

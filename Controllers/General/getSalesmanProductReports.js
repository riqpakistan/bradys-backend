const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const getSalesmanProductReports = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const shopName = req.query.shopName;

    if (!salesmanId || !shopName) { 
        return res.status(400).json({ error: 'Salesman id and Shop name are required.' });
    }

    try {
        const tripsSnapshot = await db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('Delivered')
            .get();

        let deliveriesList = [];

        for (const tripsDoc of tripsSnapshot.docs) {
            const tripDate = tripsDoc.id;

            const shopsSnapshot = await db.collection('Users')
                .doc('Staff')
                .collection('Salesmen')
                .doc(salesmanId)
                .collection('Delivered')
                .doc(tripDate)
                .collection('Shops')
                .where('shopName', '==', shopName)  // Filter by shopName
                .get();

            for (const shopDoc of shopsSnapshot.docs) {
                const shopId = shopDoc.id;

                // Fetch Sales Items
                const salesItemsSnapshot = await db.collection('Users')
                    .doc('Staff')
                    .collection('Salesmen')
                    .doc(salesmanId)
                    .collection('Delivered')
                    .doc(tripDate)
                    .collection('Shops')
                    .doc(shopId)
                    .collection('Sales Items')
                    .get();

                // Fetch Return Items
                const returnItemsSnapshot = await db.collection('Users')
                    .doc('Staff')
                    .collection('Salesmen')
                    .doc(salesmanId)
                    .collection('Delivered')
                    .doc(tripDate)
                    .collection('Shops')
                    .doc(shopId)
                    .collection('Return Items')
                    .get();

                // Create a dictionary for quick lookup of return items
                let returnItemsMap = {};
                returnItemsSnapshot.forEach(returnDoc => {
                    const returnData = returnDoc.data();
                    returnItemsMap[returnData.name] = {
                        returnAmount: returnData.price || 0,
                        returnQuantity: returnData.quantity || 0,
                        returnWeight: returnData.weight || 0
                    };
                });

                // Process Sales Items and match with Return Items
                salesItemsSnapshot.forEach(salesDoc => {
                    const salesData = salesDoc.data();
                    const productName = salesData.name;
                    const salesAmount = salesData.price || 0;
                    const salesQuantity = salesData.quantity || 0;

                    let returnAmount = 0, returnQuantity = 0, returnWeight = 0;

                    if (returnItemsMap[productName]) {
                        returnAmount = returnItemsMap[productName].returnAmount;
                        returnQuantity = returnItemsMap[productName].returnQuantity;
                        returnWeight = returnItemsMap[productName].returnWeight;
                    }

                    deliveriesList.push({
                        date: tripDate,
                        productName,
                        salesAmount,
                        salesQuantity,
                        returnAmount,
                        returnQuantity,
                        returnWeight
                    });
                });

                // Process Unmatched Return Items
                returnItemsSnapshot.forEach(returnDoc => {
                    const returnData = returnDoc.data();
                    const productName = returnData.name;

                    if (!salesItemsSnapshot.docs.some(salesDoc => salesDoc.data().name === productName)) {
                        deliveriesList.push({
                            date: tripDate,
                            productName,
                            salesAmount: 0,
                            salesQuantity: 0,
                            returnAmount: returnData.price || 0,
                            returnQuantity: returnData.quantity || 0,
                            returnWeight: returnData.weight || 0
                        });
                    }
                });
            }
        }

        res.status(200).json(deliveriesList);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Error fetching reports: ' + error.message });
    }
});

module.exports = getSalesmanProductReports;











// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const db = admin.firestore();

// const getSalesmanProductReports = functions.https.onRequest(async (req, res) => {
//     const salesmanName = req.query.salesmanName;
//     const shopName = req.query.shopName;

//     if (!salesmanName || !shopName) {
//         return res.status(400).json({ error: 'Salesman and Shop name are required.' });
//     }

//     try {
//         const tripsSnapshot = await db.collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanName)
//             .collection('Delivered')
//             .get();

//         let deliveriesList = [];

//         for (const tripsDoc of tripsSnapshot.docs) {
//             const tripDate = tripsDoc.id; 

//             const shopsSnapshot = await db.collection('Users')
//                 .doc('Staff')
//                 .collection('Salesmen')
//                 .doc(salesmanName)
//                 .collection('Delivered')
//                 .doc(tripDate)
//                 .collection('Shops')
//                 .where('shopName', '==', shopName)
//                 .get();

//             for (const shopDoc of shopsSnapshot.docs) {
//                 const salesItemsSnapshot = await shopDoc.ref.collection('Sales Items').get();
//                 const returnItemsSnapshot = await shopDoc.ref.collection('Return Items').get();

//                 let returnItemsMap = {};
//                 returnItemsSnapshot.docs.forEach(doc => {
//                     const data = doc.data();
//                     returnItemsMap[data.name] = data.price;
//                 });

//                 let processedProducts = new Set();
                
//                 salesItemsSnapshot.docs.forEach(doc => {
//                     const data = doc.data();
//                     const productName = data.name;
//                     const salesAmount = data.price;
//                     const returnAmount = returnItemsMap[productName] || 0;
//                     processedProducts.add(productName);

//                     deliveriesList.push({
//                         date: tripDate,
//                         productName,
//                         salesAmount,
//                         returnAmount
//                     });
//                 });

//                 returnItemsSnapshot.docs.forEach(doc => {
//                     const data = doc.data();
//                     if (!processedProducts.has(data.name)) {
//                         deliveriesList.push({
//                             date: tripDate,
//                             productName: data.name,
//                             salesAmount: 0,
//                             returnAmount: data.price
//                         });
//                     }
//                 });
//             }
//         }

//         res.status(200).json(deliveriesList);
//     } catch (error) {
//         console.error('Error fetching reports: ', error);
//         res.status(500).json({ error: 'Error fetching reports: ' + error.message });
//     }
// });

// module.exports = getSalesmanProductReports;




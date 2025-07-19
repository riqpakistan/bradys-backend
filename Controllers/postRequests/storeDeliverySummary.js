

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const shared = require('../Shared/shared');

const storeDeliverySummary = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const salesmanName = req.query.salesmanName;
    const data = req.body;

    if (!salesmanId || !salesmanName || !data || !Array.isArray(data.shopsData) || !Array.isArray(data.salesData) || !Array.isArray(data.returnData)) {
        return res.status(400).json({ error: 'Salesman id, Salesman name and valid data (shopsData, salesData, returnData as arrays) are required.' });
    }

    try {
        const currentDate = shared.getCurrentDate();
        // const currentDate = new Date().toISOString().split('T')[0];

        const salesmanRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

        await salesmanRef.set({ name: salesmanName }, { merge: true });

        const dateRef = salesmanRef.collection('Delivered').doc(currentDate);

        await dateRef.set({ id: currentDate }, { merge: true });
 
        // Loop through shops data
        for (const shop of data.shopsData) {
            const { shopId, shopName, sectorName, shopDiscount, salesItemsAmount, returnItemsAmount, totalAmount, previousBalance, recievedAmount, remainingBalance } = shop;

            // Ensure the numeric values are explicitly treated as doubles
            const shopDetails = {
                shopName,
                shopDiscount: parseFloat(shopDiscount),
                salesItemsAmount: parseFloat(salesItemsAmount),
                returnItemsAmount: parseFloat(returnItemsAmount),
                totalAmount: parseFloat(totalAmount),
                previousBalance: parseFloat(previousBalance),
                recievedAmount: parseFloat(recievedAmount),
                remainingBalance: parseFloat(remainingBalance),
            };

            // Reference to the shop document
            const shopRef = dateRef.collection('Shops').doc(shopId);

            // Set shop-level data
            await shopRef.set(shopDetails, { merge: true });

              // Update in original Sectors and Shops collection
              const sectorShopRef = db.collection('Sectors').doc(sectorName)
              .collection('Shops').doc(shopId)
              .collection('Deliveries').doc(currentDate);
              const deliveryDetails = {
                salesItemsAmount: parseFloat(salesItemsAmount),
                returnItemsAmount: parseFloat(returnItemsAmount),
                totalAmount: parseFloat(totalAmount),
                previousBalance: parseFloat(previousBalance),
                recievedAmount: parseFloat(recievedAmount),
                remainingBalance: parseFloat(remainingBalance),
                salesmanName: salesmanName,
            };
          await sectorShopRef.set(deliveryDetails, { merge: true });

            // Add sales items to the shop
            const salesItems = data.salesData.filter(item => item.shopId === shopId);
            for (const salesItem of salesItems) {
                const { productId, name, imageUrl, price, quantity, weight, discount } = salesItem;

                const salesItemDetails = {
                    name,
                    imageUrl,
                    price: parseFloat(price),
                    quantity: parseFloat(quantity),
                    weight: parseFloat(weight),
                    discount: parseFloat(discount),
                };

                // Reference to the sales item document
                const salesItemRef = shopRef.collection('Sales Items').doc(productId);
                await salesItemRef.set(salesItemDetails, { merge: true });

                // Update in original Sectors and Shops collection
                const sectorSalesItemRef = sectorShopRef.collection('Sales Items').doc(productId);
                await sectorSalesItemRef.set(salesItemDetails, { merge: true });
            }

            // Add return items to the shop
            const returnItems = data.returnData.filter(item => item.shopId === shopId);
            for (const returnItem of returnItems) {
                const { productId, name, imageUrl, price, quantity, weight } = returnItem;

                // Ensure the numeric values are explicitly treated as doubles
                const returnItemDetails = {
                    name,
                    imageUrl,
                    price: parseFloat(price),
                    quantity: parseFloat(quantity),
                    weight: parseFloat(weight),
                };

                // Reference to the return item document
                const returnItemRef = shopRef.collection('Return Items').doc(productId);
                await returnItemRef.set(returnItemDetails, { merge: true });

                // Update in original Sectors and Shops collection
                const sectorReturnItemRef = sectorShopRef.collection('Return Items').doc(productId);
                await sectorReturnItemRef.set(returnItemDetails, { merge: true });
            }
        }

        // Respond with success
        res.status(200).json({ message: 'Shop data stored successfully.' });
    } catch (error) {
        console.error('Error storing shop data:', error);
        res.status(500).json({ error: 'Error storing shop data: ' + error.message });
    }
});

module.exports = storeDeliverySummary;
















// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const db = admin.firestore();

// const storeDeliverySummary = functions.https.onRequest(async (req, res) => {
//     const salesmanName = req.query.salesmanName;
//     const data = req.body;

//     if (!salesmanName || !data || !Array.isArray(data.shopsData) || !Array.isArray(data.salesData) || !Array.isArray(data.returnData)) {
//         return res.status(400).json({ error: 'Salesman name and valid data (shopsData, salesData, returnData as arrays) are required.' });
//     }

//     try {
//         const currentDate = new Date().toISOString().split('T')[0];

//         const salesmanRef = db.collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanName);

//         await salesmanRef.set({ name: salesmanName }, { merge: true });

//         const dateRef = salesmanRef.collection('Delivered').doc(currentDate);

//         await dateRef.set({ id: currentDate }, { merge: true });

//         // Loop through shops data
//         for (const shop of data.shopsData) {
//             const { shopId, ...shopDetails } = shop;

//             // Reference to the shop document
//             const shopRef = dateRef.collection('Shops').doc(shopId);

//             // Set shop-level data
//             await shopRef.set(shopDetails, { merge: true });

//             // Add sales items to the shop
//             const salesItems = data.salesData.filter(item => item.shopId === shopId);
//             for (const salesItem of salesItems) {
//                 const { productId, ...salesItemDetails } = salesItem;

//                 // Reference to the sales item document
//                 const salesItemRef = shopRef.collection('Sales Items').doc(productId);

//                 // Set or update the sales item data
//                 await salesItemRef.set(salesItemDetails, { merge: true });
//             }

//             // Add return items to the shop
//             const returnItems = data.returnData.filter(item => item.shopId === shopId);
//             for (const returnItem of returnItems) {
//                 const { productId, ...returnItemDetails } = returnItem;

//                 // Reference to the return item document
//                 const returnItemRef = shopRef.collection('Return Items').doc(productId);

//                 // Set or update the return item data
//                 await returnItemRef.set(returnItemDetails, { merge: true });
//             }
//         }

//         // Respond with success
//         res.status(200).json({ message: 'Shop data stored successfully.' });
//     } catch (error) {
//         console.error('Error storing shop data:', error);
//         res.status(500).json({ error: 'Error storing shop data: ' + error.message });
//     }
// });

// module.exports = storeDeliverySummary;
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const getSalesAndReturnReports = functions.https.onRequest(async (req, res) => {
    try {
        const sectorsSnapshot = await db.collection('Sectors').get();
        let shopSalesData = [];

        for (const sectorDoc of sectorsSnapshot.docs) {
            const sectorName = sectorDoc.id;
            const shopsSnapshot = await db.collection('Sectors').doc(sectorName).collection('Shops').get();

            for (const shopDoc of shopsSnapshot.docs) {
                const shopId = shopDoc.id;
                const shopName = shopDoc.data().name;
                let totalSalesAmount = 0;
                let totalReturnAmount = 0;
                let totalSalesWeight = 0;
                let totalReturnWeight = 0;

                const deliveriesSnapshot = await db.collection('Sectors')
                    .doc(sectorName)
                    .collection('Shops')
                    .doc(shopId)
                    .collection('Deliveries')
                    .get();

                for (const deliveryDoc of deliveriesSnapshot.docs) {
                    const deliveryDocId = deliveryDoc.id;
                    const deliveryData = deliveryDoc.data();
                    totalSalesAmount += deliveryData.salesItemsAmount || 0;
                    totalReturnAmount += deliveryData.returnItemsAmount || 0;

                    const returnWeightSnapshot = await db.collection('Sectors')
                    .doc(sectorName)
                    .collection('Shops')
                    .doc(shopId)
                    .collection('Deliveries')
                    .doc(deliveryDocId)
                    .collection('Return Items')
                    .get();
                    for (const returnWeightDoc of returnWeightSnapshot.docs) {
                        const returnWeightData = returnWeightDoc.data();
                        totalReturnWeight += returnWeightData.weight || 0;
                    }

                    const salesWeightSnapshot = await db.collection('Sectors')
                    .doc(sectorName)
                    .collection('Shops')
                    .doc(shopId)
                    .collection('Deliveries')
                    .doc(deliveryDocId)
                    .collection('Sales Items')
                    .get();
                    for (const salesWeightDoc of salesWeightSnapshot.docs) {
                        const salesWeightData = salesWeightDoc.data();
                        totalSalesWeight += salesWeightData.weight || 0;
                    }
                }

                shopSalesData.push({
                    shopName,
                    sectorName,
                    totalSalesAmount,
                    totalReturnAmount,
                    totalSalesWeight,
                    totalReturnWeight,
                });
            }
        }

        res.status(200).json(shopSalesData);
    } catch (error) {
        console.error('Error fetching shop sales data:', error);
        res.status(500).json({ error: 'Error fetching shop sales data: ' + error.message });
    }
});

module.exports = getSalesAndReturnReports;

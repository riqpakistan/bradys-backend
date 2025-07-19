const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const getAllSalesmenReports = functions.https.onRequest(async (req, res) => {

    try {
        const salesmenSnapshot = await db.collection('Users')
        .doc('Staff')
        .collection('Salesmen')
        .get();

        let totalSalesmen = salesmenSnapshot.size;
        let totalDeliveries = 0;
        let totalSales = 0;
        let totalReturn = 0;
        let topPerformer = null;
        let lessPerformer = null;
        let highestSales = 0;
        let highestReturn = 0;
        let salesmenList = [];

        for(salesmenDoc of salesmenSnapshot.docs){
            const salesmanData = salesmenDoc.data();
            const salesmanId = salesmenDoc.id;
            const salesmanName = salesmanData.name || 'N/A';
            const sectorName = salesmanData.sector || 'N/A';

            let salesmanSales = 0;
            let salesmanReturn = 0;
            let salesmanDeliveries = 0;
    
        const tripsSnapshot = await db.collection('Users')
        .doc('Staff')
        .collection('Salesmen')
        .doc(salesmanId)
        .collection('Delivered')
        .get();

        salesmanDeliveries = tripsSnapshot.size;
        totalDeliveries += salesmanDeliveries;

        for (const tripsDoc of tripsSnapshot.docs) {
            const tripDate = tripsDoc.id;
            
            const shopsSnapshot = await  db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('Delivered')
            .doc(tripDate)
            .collection('Shops')
            .get();

            for (const shopDoc of shopsSnapshot.docs) {
                const shopData= shopDoc.data();
                const salesItemsAmount = shopData.salesItemsAmount || 0;
                const returnItemsAmount = shopData.returnItemsAmount || 0;

                salesmanSales += salesItemsAmount;
                salesmanReturn += returnItemsAmount;
                totalSales += salesItemsAmount;
                totalReturn += returnItemsAmount;
                
               
            }
        }

        if(salesmanSales > highestSales){
            highestSales = salesmanSales;
            topPerformer = salesmanName;
        }

        if(salesmanReturn > highestReturn){
            highestReturn = salesmanReturn;
            lessPerformer = salesmanName;
        }

        salesmenList.push({
            id: salesmanId,
            name: salesmanName,
            cashInHand: salesmanData.cashInHand || 0,
            totalSales: salesmanSales,
            totalReturn: salesmanReturn,
            totalDeliveries: salesmanDeliveries,
            sector: sectorName,
        });


        }

        const allSalesmenDetails = {
            totalSalesmen,
            totalDeliveries,
            totalSales,
            totalReturn,
            topPerformer,
            lessPerformer,
            salesmenList,
        }

          
       
        

        res.status(200).json(allSalesmenDetails);
    } catch (error) {
        console.error('Error fetching salesman data:', error);
        res.status(500).json({ error: 'Error fetching salesman data: ' + error.message });
    }
});

module.exports = getAllSalesmenReports;

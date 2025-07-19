const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const getProductsReports = functions.https.onRequest(async (req, res) => {
    try {
        const productName = req.query.productName;
        // const startDate = req.query.startDate;
        // const endDate = req.query.endDate;
        const isShopWise = req.query.isShopWise;

        // console.log( startDate, endDate, isShopWise );

        let finalReports;
        if(isShopWise === 'true'){
            finalReports = await getShopWiseReports(productName, db);
        } else{
            finalReports = await getSalesmanWiseReports(productName, db);
        }

        res.status(200).send( finalReports );
    } catch (error) {
        console.error('Error fetching product reports:', error);
        res.status(500).json({ error: 'Error fetching product reports: ' + error.message });
    }
});

module.exports = getProductsReports;


    // Method to get products list Shop Wise
    async function getShopWiseReports(productName, db){

        // let shopWiseList = [];
        let shopWiseMap = new Map();
        const sectorsSnapshot = await db.collection('Sectors').get();
        // Get Sector data
        for(const sectorDoc of sectorsSnapshot.docs){
            const sectorName= sectorDoc.data().name || sectorDoc.id;
            const shopsSnapshot = await db.collection('Sectors')
            .doc(sectorName).collection('Shops').get();

        // Get Shop data
        for(shopDoc of shopsSnapshot.docs){
            const shopId = shopDoc.id;
            const shopName = shopDoc.data().name || 'Unknown Shop';
            const datesSnapshot = await db.collection('Sectors')
            .doc(sectorName).collection('Shops').doc(shopId).collection('Deliveries').get();

        // Get Date data
        for(dateDoc of datesSnapshot.docs){
            const date = dateDoc.id;
            // Sales Ref
            const salesItemsSnapshot = await db.collection('Sectors')
            .doc(sectorName).collection('Shops').doc(shopId).collection('Deliveries').doc(date)
            .collection('Sales Items').get();
         
        
        // Process Sales data
        for(salesItemsDoc of salesItemsSnapshot.docs){
            const salesData = salesItemsDoc.data();
            const salesKeys = `${date}_${salesData.name}_${shopName}`;

            // const soldPrice = salesData.price || 0.0;
            // const soldQuantity =salesData.quantity || 0;
            // const soldWeight = salesData.weight || 0.0;
            // const soldDiscount = salesData.discount || 0;

            if(!productName || salesData.name == productName){
            // shopWiseList.push({
            //     date, sectorName, shopName, soldPrice, soldQuantity, soldWeight, soldDiscount,
            // });
            shopWiseMap.set(salesKeys, {
                date,
                sectorName,
                shopName,
                salesPrice: salesData.price || 0.0,
                salesQuantity: salesData.quantity || 0,
                salesWeight: salesData.weight || 0.0,
                salesDiscount: salesData.discount || 0,
                returnPrice: 0.0,
                returnQuantity: 0,
                returnWeight: 0.0,

            });}
        }

        // Return Ref
        const returnItemsSnapshot = await db.collection('Sectors')
        .doc(sectorName).collection('Shops').doc(shopId).collection('Deliveries').doc(date)
        .collection('Return Items').get();

       // Process Return Data and Merge with Sales Data
       for (const returnItemsDoc of returnItemsSnapshot.docs) {
         const returnData = returnItemsDoc.data();
         const returnKey = `${date}_${returnData.name}_${shopName}`;

         if (!productName || returnData.name === productName) {
             if (shopWiseMap.has(returnKey)) {
                 // Update existing sales entry with return data
                 let existingEntry = shopWiseMap.get(returnKey);
                 existingEntry.returnPrice = returnData.price || 0.0;
                 existingEntry.returnQuantity = returnData.quantity || 0;
                 existingEntry.returnWeight = returnData.weight || 0.0;
                 shopWiseMap.set(returnKey, existingEntry);
             } else {
                 // No matching sales entry, create a return entry
                 shopWiseMap.set(returnKey, {
                     date,
                     sectorName,
                     shopName,
                     productName: returnData.name,
                     salesPrice: 0.0,
                     salesQuantity: 0,
                     salesWeight: 0.0,
                     salesDiscount: 0,
                     returnPrice: returnData.price || 0.0,
                     returnQuantity: returnData.quantity || 0,
                     returnWeight: returnData.weight || 0.0
                 });
             }
         }}


        }

      
        }

       
        }

    return Array.from(shopWiseMap.values());

}

    // Method to get products list Salesman Wise
    async function getSalesmanWiseReports(productName, db){
        let salesmanWiseMap = new Map();

        const salesmanSnapshot = await db.collection('Users')
        .doc('Staff').collection('Salesmen').get();

         // Get Salesman data
         for(const salesmanDoc of salesmanSnapshot.docs){
            const salesmanName= salesmanDoc.data().name || salesmanDoc.id;
            const dateSnapshot = await db.collection('Users')
            .doc('Staff').collection('Salesmen').doc(salesmanName)
            .collection('Delivered').get();

         // Get Date data
         for(const dateDoc of dateSnapshot.docs){
            const date= dateDoc.data().id || dateDoc.id;
            const shopSnapshot = await db.collection('Users')
            .doc('Staff').collection('Salesmen').doc(salesmanName)
            .collection('Delivered').doc(date).collection('Shops').get();

         // Get Shop data
         for(const shopDoc of shopSnapshot.docs){
            const shopId= shopDoc.id;
            const shopName = shopDoc.data().shopName;
            const salesItemsSnapshot = await db.collection('Users')
            .doc('Staff').collection('Salesmen').doc(salesmanName)
            .collection('Delivered').doc(date).collection('Shops').doc(shopId)
            .collection('Sales Items').get();


            // Process Sales data
        for(salesItemsDoc of salesItemsSnapshot.docs){
            const salesData = salesItemsDoc.data();
            const salesKeys = `${date}_${salesData.name}_${shopName}`;

            if(!productName || salesData.name == productName){
          
            salesmanWiseMap.set(salesKeys, {
                date,
                salesmanName,
                // sectorName,
                shopName,
                salesPrice: salesData.price || 0.0,
                salesQuantity: salesData.quantity || 0,
                salesWeight: salesData.weight || 0.0,
                salesDiscount: salesData.discount || 0,
                returnPrice: 0.0,
                returnQuantity: 0,
                returnWeight: 0.0,

            });}
        }

        // Process Return data
        const returnItemsSnapshot = await db.collection('Users')
        .doc('Staff').collection('Salesmen').doc(salesmanName)
        .collection('Delivered').doc(date).collection('Shops').doc(shopId)
        .collection('Return Items').get();

       // Process Return Data and Merge with Sales Data
       for (const returnItemsDoc of returnItemsSnapshot.docs) {
         const returnData = returnItemsDoc.data();
         const returnKey = `${date}_${returnData.name}_${shopName}`;

         if (!productName || returnData.name === productName) {
             if (salesmanWiseMap.has(returnKey)) {
                 // Update existing sales entry with return data
                 let existingEntry = salesmanWiseMap.get(returnKey);
                 existingEntry.returnPrice = returnData.price || 0.0;
                 existingEntry.returnQuantity = returnData.quantity || 0;
                 existingEntry.returnWeight = returnData.weight || 0.0;
                 salesmanWiseMap.set(returnKey, existingEntry);
             } else {
                 // No matching sales entry, create a return entry
                 salesmanWiseMap.set(returnKey, {
                     date,
                     salesmanName,
                    //  sectorName,
                     shopName,
                     productName: returnData.name,
                     salesPrice: 0.0,
                     salesQuantity: 0,
                     salesWeight: 0.0,
                     salesDiscount: 0,
                     returnPrice: returnData.price || 0.0,
                     returnQuantity: returnData.quantity || 0,
                     returnWeight: returnData.weight || 0.0
                 });
             }
         }}



             }
         
            }

         }

    return Array.from(salesmanWiseMap.values());

    }
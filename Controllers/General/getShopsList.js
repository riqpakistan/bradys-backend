const functions = require('firebase-functions');
const db = require('../utils/firebaseAdmin');

const getShopsList = functions.https.onRequest(async (req, res) => {
    try {
        const sectorsRef = db.collection('Sectors');
        const sectorsSnapshot = await sectorsRef.get();

        if (sectorsSnapshot.empty) {
            return res.status(404).json({ error: 'No sectors found.' });
        }

        const sectors = [];

        for (const sectorDoc of sectorsSnapshot.docs) {
            const sectorName = sectorDoc.id;

            // Reference to Shops collection under the current sector
            const shopsRef = sectorDoc.ref.collection('Shops');
            const shopsSnapshot = await shopsRef.get();

            // Collect shops for this sector
            const shopsList = shopsSnapshot.docs.map((shopDoc) => ({
                id: shopDoc.id, // Shop document ID
                ...shopDoc.data(), // All fields from the shop document
            }));

            // Add sector and its shops list to the result
            sectors.push({
                sectorName,
                shopsList,
            });
        }

        res.status(200).json(sectors);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching sectors and shops: ' + error.message });
    }
});

module.exports = getShopsList;











// const functions = require('firebase-functions');
// const db = require('../utils/firebaseAdmin');

// const getShopsList = functions.https.onRequest(async (req, res) => {

//     try {
//         const shopsRef = db.collection('Shops');
//         const shopsSnapshot = await shopsRef.get();

//         if (shopsSnapshot.empty) {
//             return res.status(404).json({ error: 'No shops found.' });

//         } else {
//             const shops = [];
//             for (const doc of shopsSnapshot.docs) {
//                 const shopId = doc.id;
//                 const shopData = doc.data();

//                 // Construct category object
//                 shops.push({
//                     id: shopId || 'N/A',
//                     name: shopData.name || 'N/A',
//                     imageUrl: shopData.imageUrl || 'N/A',
//                     address: shopData.address || 'N/A',
//                     discount: shopData.discount || 0,
//                 });


//             }

//             res.status(200).json(shops);

//         }

//     } catch (error) {
//         res.status(500).json({ error: 'Error fetching shops list: ' + error.message });
//     }
// });

// module.exports = getShopsList;
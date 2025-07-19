const functions = require('firebase-functions');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const admin = require('firebase-admin');


// Parse CSV and return data as an array
function parseCSV(binaryData) {
    return new Promise((resolve, reject) => {
        const results = [];
        const readableStream = new Readable();
        readableStream.push(binaryData);
        readableStream.push(null);

        readableStream
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

// Function to process shop data and update Firestore
async function processShopData(results) {
    const batch = admin.firestore().batch();
    const sectorsCollection = admin.firestore().collection('Sectors');

    for (const row of results) {
        const { name, sector, contact, location, balance, type } = row;

        // Ensure balance is parsed as a number
        const parsedBalance = parseFloat(balance);

        // Generate description field
        const description = `${name} is located in ${sector} and operates as a ${type}.`;

        // Reference to the sector document
        const sectorDocRef = sectorsCollection.doc(sector);

        // Ensure the sector document exists with a "name" field
        batch.set(sectorDocRef, { name: sector }, { merge: true });

        // Reference to the shops collection within the sector document
        const shopsCollection = sectorDocRef.collection('Shops');

        // Query for an existing shop with the same name
        const existingShopSnapshot = await shopsCollection.where('name', '==', name).get();

        if (!existingShopSnapshot.empty) {
            // If a matching shop exists, update its details
            const existingShopDoc = existingShopSnapshot.docs[0];
            batch.update(existingShopDoc.ref, {
                contact,
                location,
                balance: parsedBalance,
                type,
                discount: 0.0,
                description,
                sector,
            });
        } else {
            // If no matching shop exists, create a new document
            const newShopRef = shopsCollection.doc(); // Auto-generate document ID
            batch.set(newShopRef, {
                name,
                contact,
                location,
                balance: parsedBalance,
                type,
                discount: 0.0,
                description,
                sector,
            });
        }
    }

    await batch.commit();
    return { message: 'Shops successfully updated in sectors.' };
}

// Main function to handle HTTP requests
const addShops = functions.https.onRequest(async (req, res) => {



    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST method is allowed.' });
    }

    const binaryData = req.body;
    if (!binaryData || binaryData.length === 0) {
        return res.status(400).json({ error: 'No file uploaded or file is empty.' });
    }

    try {
        const results = await parseCSV(binaryData);
        const response = await processShopData(results);

        res.status(200).json(response);
    } catch (error) {
        console.error('Error processing shop data:', error);
        res.status(500).json({ error: 'Failed to process shop data.' });
    }
});

module.exports = addShops;








// const functions = require('firebase-functions');
// const csvParser = require('csv-parser');
// const { Readable } = require('stream');
// const admin = require('firebase-admin');

// // Parse CSV and return data as an array
// function parseCSV(binaryData) {
//     return new Promise((resolve, reject) => {
//         const results = [];
//         const readableStream = new Readable();
//         readableStream.push(binaryData);
//         readableStream.push(null);

//         readableStream
//             .pipe(csvParser())
//             .on('data', (data) => results.push(data))
//             .on('end', () => resolve(results))
//             .on('error', (err) => reject(err));
//     });
// }

// // Function to process shop data and update Firestore
// async function processShopData(results) {
//     const batch = admin.firestore().batch();
//     const shopsCollection = admin.firestore().collection('Shops');

//     for (const row of results) {
//         const { shopName, shopDiscount } = row;

//         // Convert discount to a float
//         const discount = parseFloat(shopDiscount);

//         // Query for existing shop by name
//         const existingShopSnapshot = await shopsCollection
//             .where('name', '==', shopName) // Firestore field is 'name'
//             .get();

//         if (!existingShopSnapshot.empty) {
//             // If shop exists, update its discount
//             const existingShopDoc = existingShopSnapshot.docs[0];
//             batch.update(existingShopDoc.ref, {
//                 discount, // Firestore field is 'discount'
//             });
//         } else {
//             // If shop doesn't exist, create a new document
//             const newShopRef = shopsCollection.doc(); // Auto-generate document ID
//             batch.set(newShopRef, {
//                 name: shopName, // Firestore field is 'name'
//                 discount,      // Firestore field is 'discount'
//             });
//         }
//     }

//     await batch.commit();
//     return { message: 'Shops successfully updated.' };
// }

// // Main function to handle HTTP requests
// const addShops = functions.https.onRequest(async (req, res) => {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Only POST method is allowed.' });
//     }

//     const binaryData = req.body;
//     if (!binaryData || binaryData.length === 0) {
//         return res.status(400).json({ error: 'No file uploaded or file is empty.' });
//     }

//     try {
//         const results = await parseCSV(binaryData);
//         const response = await processShopData(results);

//         res.status(200).json(response);
//     } catch (error) {
//         console.error('Error processing shop data:', error);
//         res.status(500).json({ error: 'Failed to process shop data.' });
//     }
// });

// module.exports = addShops;

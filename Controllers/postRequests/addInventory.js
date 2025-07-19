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

// Process inventory data and store it in Firestore
async function processInventoryData(results) {
    const batch = admin.firestore().batch();
    const warehouseRef = admin.firestore().collection('Warehouses').doc('Alpha Warehouse');

    // Ensure the Alpha Warehouse document exists with "name" and "imageUrl"
    batch.set(warehouseRef, { name: 'Alpha Warehouse', imageUrl: 'N/A' }, { merge: true });

    for (const row of results) {
        const { categoryName, productName, productPrice, productQuantity, productWeight } = row;

        // Convert types
        const price = parseFloat(productPrice);
        const weight = parseFloat(productWeight);
        const quantity = parseInt(productQuantity, 10);

        // Reference to the category document
        const categoryRef = warehouseRef.collection('Categories').doc(categoryName);

        // Ensure category document exists with "name" and "imageUrl"
        batch.set(categoryRef, { name: categoryName, imageUrl: 'N/A' }, { merge: true });

        // Check if the product already exists in the category
        const productsRef = categoryRef.collection('Products');
        const existingProductsSnapshot = await productsRef.where('name', '==', productName).get();

        if (!existingProductsSnapshot.empty) {
            // If product exists, update its quantity
            const existingProductDoc = existingProductsSnapshot.docs[0];
            const existingQuantity = existingProductDoc.data().quantity || 0;

            batch.update(existingProductDoc.ref, {
                quantity: existingQuantity + quantity,
            });
        } else {
            // If product does not exist, create a new document with "imageUrl"
            const newProductRef = productsRef.doc(); // Auto-generate product ID
            batch.set(newProductRef, {
                name: productName,
                price: price,
                weight: weight,
                quantity: quantity,
                imageUrl: 'N/A',
            });
        }
    }

    await batch.commit();
    return { message: 'Inventory successfully updated.' };
}

// Main function to handle HTTP requests
const addInventory = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST method is allowed.' });
    }

    const binaryData = req.body;
    if (!binaryData || binaryData.length === 0) {
        return res.status(400).json({ error: 'No file uploaded or file is empty.' });
    }

    try {
        const results = await parseCSV(binaryData);
        const response = await processInventoryData(results);

        res.status(200).json(response);
    } catch (error) {
        console.error('Error processing inventory:', error);
        res.status(500).json({ error: 'Failed to process inventory.' });
    }
});

module.exports = addInventory;

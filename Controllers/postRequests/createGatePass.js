const functions = require('firebase-functions');
const csvParser = require('csv-parser');
const { Readable } = require('stream');
const admin = require('firebase-admin');
const shared = require('../Shared/shared');

// Helper function: Parse CSV and return data as an array
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

// Helper function: Fetch category and product details from Firestore
async function getCategoryAndProductDetails(productName) {
    try {
        const warehousesRef = admin.firestore().collection('Warehouses').doc('Alpha Warehouse');
        const categoriesSnapshot = await warehousesRef.collection('Categories').get();

        for (const categoryDoc of categoriesSnapshot.docs) {
            const categoryData = categoryDoc.data();
            const productsSnapshot = await warehousesRef
                .collection('Categories')
                .doc(categoryDoc.id)
                .collection('Products')
                .where('name', '==', productName)
                .get();

            if (!productsSnapshot.empty) {
                const productData = productsSnapshot.docs[0].data();
                return {
                    categoryId: categoryDoc.id,
                    categoryName: categoryData.name,
                    categoryImageUrl: categoryData.imageUrl,
                    productId: productsSnapshot.docs[0].id,
                    productName: productData.name,
                    productPrice: productData.price,
                    productWeight: productData.weight,
                    availableQuantity: productData.quantity || 0,
                };
            }
        }

        // If no category matches, return default category "Extra"
        return {
            categoryId: "Extra",
            categoryName: "Extra",
            categoryImageUrl: null,
            productId: null,
            productName: productName,
            productPrice: 0,
            productWeight: 0,
            availableQuantity: 0,
        };
    } catch (error) {
        console.error(`Error fetching category and product details for product ${productName}:`, error);
        return {
            categoryId: "Extra",
            categoryName: "Extra",
            categoryImageUrl: null,
            productId: null,
            productName: productName,
            productPrice: 0,
            productWeight: 0,
            availableQuantity: 0,
        };
    }
}

// Helper function: Process salesmen data and prepare Firestore batch operations
async function processSalesmenData(results) {
    const salesmenData = {};
    // const currentDate = new Date().toISOString().split('T')[0];
    const currentDate = shared.getCurrentDate();

    const insufficientStockProducts = []; // To track products with insufficient stock

    // Group data by salesmanId
    results.forEach(({ salesmanId, productName, quantity, discount }) => {
        if (!salesmenData[salesmanId]) {
            salesmenData[salesmanId] = [];
        }
        salesmenData[salesmanId].push({ productName, quantity: parseInt(quantity, 10), discount: parseFloat(discount) });
    });

    const batch = admin.firestore().batch();

    for (const salesmanId in salesmenData) {
        const salesmanNameRef = admin.firestore()
            .collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

        batch.set(salesmanNameRef, { name: salesmanId }, { merge: true });

        const salesmanRef = salesmanNameRef.collection('GatePass').doc(currentDate);

        batch.set(salesmanRef, { id: salesmanRef.id, tripStatus: "Not Started", }, { merge: true });

        for (const product of salesmenData[salesmanId]) {
            const { productName, quantity } = product;

            // Fetch category and product details
            const details = await getCategoryAndProductDetails(productName);

            const {
                categoryId,
                categoryName,
                categoryImageUrl,
                productId,
                productName: fetchedProductName,
                productPrice,
                productWeight,
                availableQuantity,
            } = details;

            if (quantity > availableQuantity) {
                insufficientStockProducts.push({
                    productName: fetchedProductName,
                    requiredQuantity: quantity,
                    availableQuantity,
                });
                continue; // Skip adding this product to the gatepass
            }

            // Deduct the quantity from inventory
            const productRef = admin.firestore()
                .collection('Warehouses')
                .doc('Alpha Warehouse')
                .collection('Categories')
                .doc(categoryId)
                .collection('Products')
                .doc(productId);

            batch.update(productRef, { quantity: availableQuantity - quantity });

            const categoryRef = salesmanRef.collection('Categories').doc(categoryId);

            const categoryDoc = await categoryRef.get();
            const categoryData = {};
            if (!categoryDoc.exists || !categoryDoc.data()?.name) {
                categoryData.name = categoryId;
            }
            if (categoryImageUrl) {
                categoryData.imageUrl = categoryImageUrl;
            }
            batch.set(categoryRef, categoryData, { merge: true });

            const productsRef = categoryRef.collection('Products');
            const gatepassProductRef = productsRef.doc(productId || admin.firestore().collection('_').doc().id);

            batch.set(gatepassProductRef, {
                name: fetchedProductName,
                price: productPrice !== undefined ? productPrice : 0.0,
                quantity,
                weight: productWeight !== undefined ? productWeight : 0.0,
                discount: product.discount,
            }, { merge: true });
        }
    }

    if (insufficientStockProducts.length > 0) {
        return {
            error: "Insufficient stock for some products",
            details: insufficientStockProducts,
        };
    }

    await batch.commit();
    return { message: "GatePass successfully created." };
}

// Main Function: HTTP Trigger to create a gate pass
const createGatePass = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Only POST method is allowed' });
    }

    const binaryData = req.body;
    if (!binaryData || binaryData.length === 0) {
        return res.status(400).send({ error: 'No file uploaded or file is empty' });
    }

    try {
        const results = await parseCSV(binaryData);
        const result = await processSalesmenData(results);

        if (result.error) {
            res.status(400).send(result);
        } else {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send({ error: 'Failed to process request' });
    }
});

module.exports = createGatePass;



///////////////////////////////////////////////////
// const functions = require('firebase-functions');
// const csvParser = require('csv-parser');
// const { Readable } = require('stream');
// const admin = require('firebase-admin');
// // const moment = require('moment-timezone');

// // Helper function: Parse CSV and return data as an array
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

// // Helper function: Fetch category and product details from Firestore
// async function getCategoryAndProductDetails(productName) {
//     try {
//         const warehousesRef = admin.firestore().collection('Warehouses').doc('Alpha Warehouse');
//         const categoriesSnapshot = await warehousesRef.collection('Categories').get();

//         for (const categoryDoc of categoriesSnapshot.docs) {
//             const categoryData = categoryDoc.data();
//             const productsSnapshot = await warehousesRef
//                 .collection('Categories')
//                 .doc(categoryDoc.id)
//                 .collection('Products')
//                 .where('name', '==', productName)
//                 .get();


//             if (!productsSnapshot.empty) {
//                 const productData = productsSnapshot.docs[0].data();
//                 return {
//                     categoryId: categoryDoc.id,
//                     categoryName: categoryData.name,
//                     categoryImageUrl: categoryData.imageUrl,
//                     productId: productsSnapshot.docs[0].id,
//                     productName: productData.name,
//                     productPrice: productData.price,
//                     productWeight: productData.weight,
//                 };
//             }
//         }

//         // If no category matches, return default category "Extra"
//         return {
//             categoryId: "Extra",
//             categoryName: "Extra",
//             categoryImageUrl: null,
//             productId: null,
//             productName: productName,
//             productPrice: 0,
//             productWeight: 0,
//         };
//     } catch (error) {
//         console.error(`Error fetching category and product details for product ${productName}:`, error);
//         return {
//             categoryId: "Extra",
//             categoryName: "Extra",
//             categoryImageUrl: null,
//             productId: null,
//             productName: productName,
//             productPrice: 0,
//             productWeight: 0,
//         };
//     }
// }

// // Helper function: Process salesmen data and prepare Firestore batch operations
// async function processSalesmenData(results) {
//     const salesmenData = {};
//     const currentDate = new Date().toISOString().split('T')[0];
//     // const currentTimeInPakistan = moment.tz('Asia/Karachi');
//     // let currentDate = currentTimeInPakistan.format('YYYY-MM-DD');
//     // if (currentTimeInPakistan.hour() > 16 && currentTimeInPakistan.hour() < 24) {
//     //     currentDate = moment.tz('Asia/Karachi').subtract(1, 'days').format('YYYY-MM-DD');
//     // }
//     console.log(currentDate);


//     // Group data by salesmanId
//     results.forEach(({ salesmanId, productName, quantity }) => {
//         if (!salesmenData[salesmanId]) {
//             salesmenData[salesmanId] = [];
//         }
//         salesmenData[salesmanId].push({ productName, quantity: parseInt(quantity, 10) });
//     });

//     const batch = admin.firestore().batch();

//     // for (const salesmanId in salesmenData) {
//     //     const salesmanRef = admin.firestore()
//     //         .collection('Users')
//     //         .doc('Staff')
//     //         .collection('Salesmen')
//     //         .doc(salesmanId)
//     //         .collection('GatePass')
//     //         .doc(currentDate);

//     for (const salesmanId in salesmenData) {
//         const salesmanNameRef = admin.firestore()
//             .collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanId);

//         // Add the `name` field to the salesman's document
//         batch.set(salesmanNameRef, { name: salesmanId }, { merge: true });

//         const salesmanRef = salesmanNameRef
//             .collection('GatePass')
//             .doc(currentDate);

//         // Add an `id` field to the `currentDate` document
//         batch.set(
//             salesmanRef,
//             {
//                 id: salesmanRef.id,
//             },
//             { merge: true }
//         );

//         for (const product of salesmenData[salesmanId]) {
//             const { productName, quantity } = product;

//             // Fetch category and product details
//             const details = await getCategoryAndProductDetails(productName);

//             const {
//                 categoryId,
//                 categoryName,
//                 categoryImageUrl,
//                 productId,
//                 productName: fetchedProductName,
//                 productPrice,
//                 productWeight,
//             } = details;

//             const categoryRef = salesmanRef.collection('Categories').doc(categoryId);
//             // Fetch the current category document
//             const categoryDoc = await categoryRef.get();

//             // Prepare the category data
//             const categoryData = {};
//             if (!categoryDoc.exists || !categoryDoc.data()?.name) {
//                 categoryData.name = categoryId;
//             }
//             // const categoryData = { name: categoryName };
//             if (categoryImageUrl) {
//                 categoryData.imageUrl = categoryImageUrl;
//             } else {
//                 categoryData.imageUrl = '';
//             }
//             batch.set(categoryRef, categoryData, { merge: true });


//             // Check if the product already exists in the 'Products' collection
//             const productsRef = categoryRef.collection('Products');
//             const existingProductQuery = await productsRef.where('name', '==', fetchedProductName).get();

//             if (!existingProductQuery.empty) {
//                 // Product exists, update it
//                 const existingProductDoc = existingProductQuery.docs[0];
//                 batch.update(existingProductDoc.ref, { price: productPrice !== undefined ? productPrice : 0, quantity, weight: productWeight !== undefined ? productWeight : 0 });
//             } else {
//                 // Product doesn't exist, add it
//                 const productRef = productsRef.doc(productId || admin.firestore().collection('_').doc().id);
//                 batch.set(productRef, { name: fetchedProductName, price: productPrice !== undefined ? productPrice : 0, quantity, weight: productWeight !== undefined ? productWeight : 0 }, { merge: true });
//             }
//         }
//     }

//     return batch;
// }

// // Main Function: HTTP Trigger to create a gate pass
// const createGatePass = functions.https.onRequest(async (req, res) => {
//     if (req.method !== 'POST') {
//         return res.status(405).send({ error: 'Only POST method is allowed' });
//     }

//     const binaryData = req.body;
//     if (!binaryData || binaryData.length === 0) {
//         return res.status(400).send({ error: 'No file uploaded or file is empty' });
//     }

//     try {
//         const results = await parseCSV(binaryData);
//         const batch = await processSalesmenData(results);

//         await batch.commit();
//         res.status(200).send({ message: 'GatePass successfully created.' });
//     } catch (error) {
//         console.error('Error processing request:', error);
//         res.status(500).send({ error: 'Failed to process request' });
//     }
// });

// module.exports = createGatePass;

















// const functions = require('firebase-functions');
// const csvParser = require('csv-parser');
// const { Readable } = require('stream');
// const admin = require('firebase-admin');

// // Helper function: Parse CSV and return data as an array
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

// // Helper function: Fetch price for a product from Firestore
// async function getPriceForProduct(productName) {
//     try {
//         const warehousesRef = admin.firestore().collection('Warehouses').doc('Alpha Warehouse');
//         const categoriesSnapshot = await warehousesRef.collection('Categories').get();

//         for (const categoryDoc of categoriesSnapshot.docs) {
//             const productsSnapshot = await warehousesRef
//                 .collection('Categories')
//                 .doc(categoryDoc.id)
//                 .collection('Products')
//                 .where('name', '==', productName)
//                 .get();

//             if (!productsSnapshot.empty) {
//                 return productsSnapshot.docs[0].data().price;
//             }
//         }

//         return null; // Price not found
//     } catch (error) {
//         console.error(`Error fetching price for product ${productName}:`, error);
//         return null;
//     }
// }

// // Helper function: Process salesmen data and prepare Firestore batch operations
// async function processSalesmenData(results) {
//     const salesmenData = {};
//     const currentDate = new Date().toISOString().split('T')[0];

//     // Group data by salesmanId
//     results.forEach(({ salesmanId, productName, quantity }) => {
//         if (!salesmenData[salesmanId]) {
//             salesmenData[salesmanId] = [];
//         }
//         salesmenData[salesmanId].push({ productName, quantity: parseInt(quantity, 10) });
//     });

//     const batch = admin.firestore().batch();

//     for (const salesmanId in salesmenData) {
//         const productsRef = admin.firestore()
//             .collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanId)
//             .collection('GatePass')
//             .doc(currentDate);

//         for (const product of salesmenData[salesmanId]) {
//             const { productName, quantity } = product;

//             // Fetch price or set default to 0
//             let price = await getPriceForProduct(productName);
//             if (price === null) {
//                 console.warn(`Price not found for product: ${productName}. Setting default price to 0.`);
//                 price = 0;
//             }

//             const existingProductQuery = await productsRef.collection('Products')
//                 .where('productName', '==', productName)
//                 .get();

//             if (existingProductQuery.empty) {
//                 const newProductRef = productsRef.collection('Products').doc();
//                 batch.set(newProductRef, { productName, quantity, price });
//             } else {
//                 const existingProductDoc = existingProductQuery.docs[0];
//                 const existingProduct = existingProductDoc.data();

//                 if (existingProduct.quantity !== quantity || existingProduct.price !== price) {
//                     batch.update(existingProductDoc.ref, { quantity, price });
//                 } else {
//                     console.log(`Product ${productName} already exists with the same data for ${salesmanId} on ${currentDate}`);
//                 }
//             }
//         }
//     }

//     return batch;
// }

// // Main Function: HTTP Trigger to create a gate pass
// const createGatePass = functions.https.onRequest(async (req, res) => {
//     if (req.method !== 'POST') {
//         return res.status(405).send({ error: 'Only POST method is allowed' });
//     }

//     const binaryData = req.body;
//     if (!binaryData || binaryData.length === 0) {
//         return res.status(400).send({ error: 'No file uploaded or file is empty' });
//     }

//     try {
//         const results = await parseCSV(binaryData);
//         const batch = await processSalesmenData(results);

//         await batch.commit();
//         res.status(200).send({ message: 'Products successfully stored in Firestore' });
//     } catch (error) {
//         console.error('Error processing request:', error);
//         res.status(500).send({ error: 'Failed to process request' });
//     }
// });

// module.exports = createGatePass;









// const functions = require('firebase-functions');
// const csvParser = require('csv-parser');
// const { Readable } = require('stream');
// const admin = require('firebase-admin');

// const createGatePass = functions.https.onRequest((req, res) => {
//     if (req.method !== 'POST') {
//         return res.status(405).send({ error: 'Only POST method is allowed' });
//     }

//     const results = [];
//     const binaryData = req.body;
//     if (!binaryData || binaryData.length === 0) {
//         return res.status(400).send({ error: 'No file uploaded or file is empty' });
//     }

//     const readableStream = new Readable();
//     readableStream.push(binaryData);
//     readableStream.push(null);

//     readableStream
//         .pipe(csvParser())
//         .on('data', (data) => results.push(data))
//         .on('end', async () => {
//             try {
//                 const currentDate = new Date().toISOString().split('T')[0];
//                 const salesmenData = {};

//                 results.forEach((row) => {
//                     const { salesmanId, productName, quantity } = row;
//                     if (!salesmenData[salesmanId]) {
//                         salesmenData[salesmanId] = [];
//                     }
//                     salesmenData[salesmanId].push({ productName, quantity: parseInt(quantity, 10) });
//                 });

//                 const batch = admin.firestore().batch();

//                 for (const salesmanId in salesmenData) {
//                     const productsRef = admin.firestore()
//                         .collection('Users')
//                         .doc('Staff'.toString())
//                         .collection('Salesmen')
//                         .doc(salesmanId.toString())
//                         .collection('GatePass')
//                         .doc(currentDate.toString());

//                     for (const product of salesmenData[salesmanId]) {
//                         const { productName, quantity } = product;

//                         // Fetch the price from the Warehouses collection
//                         let price = await getPriceForProduct(productName);
//                         if (price === null) {
//                             console.error(`Price not found for product: ${productName}`);
//                             price = 0;
//                             // continue;
//                         }

//                         const existingProductQuery = await productsRef.collection('Products')
//                             .where('productName', '==', productName)
//                             .get();

//                         if (existingProductQuery.empty) {
//                             const newProductRef = productsRef.collection('Products').doc();
//                             batch.set(newProductRef, { productName, quantity, price });
//                         } else {
//                             const existingProductDoc = existingProductQuery.docs[0];
//                             const existingProduct = existingProductDoc.data();

//                             if (existingProduct.quantity !== quantity || existingProduct.price !== price) {
//                                 batch.update(existingProductDoc.ref, { quantity, price });
//                             } else {
//                                 console.log(`Product ${productName} already exists with the same data for ${salesmanId} on ${currentDate}`);
//                             }
//                         }
//                     }
//                 }

//                 await batch.commit();
//                 res.status(200).send({ message: 'Products successfully stored in Firestore' });
//             } catch (err) {
//                 console.error('Error storing or updating data in Firestore:', err);
//                 res.status(500).send({ error: 'Failed to store or update products in Firestore' });
//             }
//         })
//         .on('error', (err) => {
//             console.error('Error parsing CSV:', err);
//             res.status(500).send({ error: 'Failed to parse CSV file' });
//         });
// });

// // Helper function to fetch price for a product from Firestore
// async function getPriceForProduct(productName) {
//     try {
//         const warehousesRef = admin.firestore().collection('Warehouses').doc('Alpha Warehouse');
//         const categoriesSnapshot = await warehousesRef.collection('Categories').get();

//         for (const categoryDoc of categoriesSnapshot.docs) {
//             const productsSnapshot = await warehousesRef
//                 .collection('Categories')
//                 .doc(categoryDoc.id)
//                 .collection('Products')
//                 .where('name', '==', productName)
//                 .get();

//             if (!productsSnapshot.empty) {
//                 const productDoc = productsSnapshot.docs[0];
//                 return productDoc.data().price; // Return the price if found
//             }
//         }

//         return null; // Price not found
//     } catch (error) {
//         console.error(`Error fetching price for product ${productName}:`, error);
//         return null;
//     }
// }

// module.exports = createGatePass;

















// const functions = require('firebase-functions');
// const csvParser = require('csv-parser');
// const { Readable } = require('stream');
// const admin = require('firebase-admin');

// const createGatePass = functions.https.onRequest((req, res) => {
//     // Ensure the request is a POST request
//     if (req.method !== 'POST') {
//         return res.status(405).send({ error: 'Only POST method is allowed' });
//     }

//     const results = [];
//     // console.log('Receiving file upload...');

//     // Convert binary data in the request body into a readable stream
//     const binaryData = req.body;
//     if (!binaryData || binaryData.length === 0) {
//         return res.status(400).send({ error: 'No file uploaded or file is empty' });
//     }

//     const readableStream = new Readable();
//     readableStream.push(binaryData);
//     readableStream.push(null); // Signal the end of the stream

//     // Parse the CSV data using csv-parser
//     readableStream
//         .pipe(csvParser())
//         .on('data', (data) => results.push(data))
//         .on('end', async () => {
//             try {
//                 // Get the current date as YYYY-MM-DD
//                 const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

//                 // Create an object to group products by salesmanId
//                 const salesmenData = {};

//                 results.forEach((row) => {
//                     const { salesmanId, productName, quantity } = row;

//                     if (!salesmenData[salesmanId]) {
//                         salesmenData[salesmanId] = [];
//                     }

//                     // Add the product information to the corresponding salesman's array
//                     salesmenData[salesmanId].push({ productName, quantity: parseInt(quantity, 10) });
//                 });

//                 // Now store or update each salesperson's products in Firestore
//                 const batch = admin.firestore().batch();

//                 // Iterate over salesmen data and store in Firestore under the GatePass document for today's date
//                 for (const salesmanId in salesmenData) {
//                     const productsRef = admin.firestore()
//                         .collection('Users')
//                         .doc('Staff'.toString())
//                         .collection('Salesmen')
//                         .doc(salesmanId.toString())
//                         .collection('GatePass')
//                         .doc(currentDate.toString()); // Use the current date as the document ID

//                     // Check and add or update each product
//                     for (const product of salesmenData[salesmanId]) {
//                         const existingProductQuery = await productsRef.collection('Products')
//                             .where('productName', '==', product.productName)
//                             .get();

//                         if (existingProductQuery.empty) {
//                             // If the product doesn't exist, add it
//                             const newProductRef = productsRef.collection('Products').doc();
//                             batch.set(newProductRef, product);
//                         } else {
//                             // If the product exists, check if the quantity is different
//                             const existingProductDoc = existingProductQuery.docs[0];
//                             const existingProduct = existingProductDoc.data();

//                             if (existingProduct.quantity !== product.quantity) {
//                                 // If quantity is different, update the product
//                                 batch.update(existingProductDoc.ref, { quantity: product.quantity });
//                             } else {
//                                 console.log(`Product ${product.productName} already exists with the same quantity for ${salesmanId} on ${currentDate}`);
//                             }
//                         }
//                     }
//                 }

//                 // Commit the batch write
//                 await batch.commit();

//                 res.status(200).send({ message: 'Products successfully stored in Firestore' });
//             } catch (err) {
//                 console.error('Error storing or updating data in Firestore:', err);
//                 res.status(500).send({ error: 'Failed to store or update products in Firestore' });
//             }
//         })
//         .on('error', (err) => {
//             console.error('Error parsing CSV:', err);
//             res.status(500).send({ error: 'Failed to parse CSV file' });
//         });
// });

// module.exports = createGatePass;

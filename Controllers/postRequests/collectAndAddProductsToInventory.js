const functions = require('firebase-functions');
const admin = require('firebase-admin');
const shared = require('../Shared/shared');


// Initialize Firestore
const db = admin.firestore();

// Firebase Cloud Function to update the cart and inventory
const collectAndAddProductsToInventory = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    // const managerName = req.query.managerName;
    const warehouseName = req.query.warehouseName;
    const cartData = req.body;

    if (!salesmanId || !warehouseName || !Array.isArray(cartData)) {
        return res.status(400).json({ error: 'Salesman id, cart data, and warehouse name are required.' });
    }

    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];


    try {
        // Group products by categoryId
        const categorizedData = {};
        cartData.forEach(product => {
            const { categoryId, productId, name, quantity, price, weight } = product;
            if (!categorizedData[categoryId]) {
                categorizedData[categoryId] = {};
            }
            categorizedData[categoryId][productId] = { name, quantity, price, weight };
        });

        // Loop through the categorized data
        for (const categoryId in categorizedData) {
            const products = categorizedData[categoryId];

            // Reference to the category document in the cart
            const categoryRef = db.collection('Users')
                .doc('Staff')
                .collection('Salesmen')
                .doc(salesmanId)
                .collection('Cart')
                .doc(categoryId);

            // Reference to the returned products document in delivered
            const returnedCategoriesRef = db.collection('Users')
                .doc('Staff')
                .collection('Salesmen')
                .doc(salesmanId)
                .collection('Delivered')
                .doc(currentDate).collection('Returned Products').doc(categoryId);
            await returnedCategoriesRef.set({ name: categoryId }, { merge: true });


            // Loop through the products in the category
            for (const productId in products) {
                const product = products[productId];
                const { name, quantity, price, weight } = product;

                // Reference to the product document within the category in the cart
                const productRef = categoryRef.collection('Products').doc(productId);

                // Check if the product exists in Firestore
                const productDoc = await productRef.get();
                if (productDoc.exists) {
                    const currentQuantity = productDoc.data().quantity || 0;

                    // Subtract the quantity from the current quantity
                    const newQuantity = currentQuantity - quantity;

                    // If the new quantity is zero or less, delete the product document
                    if (newQuantity <= 0) {

                        await productRef.delete();
                        console.log(`Product ${name} removed from cart as its quantity became zero or less.`);
                    } else {

                        await productRef.update({
                            quantity: newQuantity
                        });
                        console.log(`Updated ${name} in cart with new quantity: ${newQuantity}`);
                    }
                } else {
                    console.log(`Product with ID ${productId} not found in cart.`);
                }

                // Check if the returned product exists in Firestore
                const returnedProductsRef = returnedCategoriesRef.collection('Products').doc(productId);
                const returnedProductDoc = await returnedProductsRef.get();
                if (returnedProductDoc.exists) {
                    const currentQuantity = returnedProductDoc.data().quantity || 0;

                    const newQuantity = currentQuantity + quantity;

                    // Returned Products ref
                    await returnedProductsRef.update({
                        quantity: newQuantity
                    });
                } else {
                    // Returned Products ref
                    await returnedProductsRef.set({
                        name: name,
                        price: price || 0.0,
                        quantity: quantity,
                        weight: weight || 0.0,
                        categoryId: categoryId
                    });

                }

                // Now handle the inventory update
                const inventoryCategoryRef = db.collection('Warehouses')
                    .doc(warehouseName)
                    .collection('Categories')
                    .doc(categoryId);

                // Check if the product exists in the inventory
                const productInInventoryRef = inventoryCategoryRef.collection('Products').doc(productId);
                const productInInventoryDoc = await productInInventoryRef.get();

                if (productInInventoryDoc.exists) {
                    // Product exists in inventory, update the quantity
                    const currentInventoryQuantity = productInInventoryDoc.data().quantity || 0;
                    const newInventoryQuantity = currentInventoryQuantity + quantity;

                    // Update the quantity in the product document
                    await productInInventoryRef.update({
                        quantity: newInventoryQuantity
                    });
                    console.log(`Updated inventory for ${name} with new quantity: ${newInventoryQuantity}`);
                } else {
                    // Product does not exist in inventory, add it
                    // Add category name if it does not exist
                    await inventoryCategoryRef.set({
                        name: categoryId
                    }, { merge: true });

                    // Create a new product document in inventory
                    await productInInventoryRef.set({
                        name: name,
                        price: price || 0.0,
                        quantity: quantity,
                        weight: weight || 0.0
                    });
                    console.log(`Added new product ${name} to inventory.`);
                }
            }

            // After processing products, check if the category is empty
            const remainingProducts = await categoryRef.collection('Products').get();
            if (remainingProducts.empty) {
                // If the category has no products left, delete the category
                await categoryRef.delete();
                console.log(`Category ${categoryId} has no products left and was deleted.`);
            }
        }

        // Delete salesman from completed trips list
        // const tripsRef = db.collection('Users')
        //     .doc('Staff')
        //     .collection('Managers')
        //     .doc(managerName)
        //     .collection('Trips')
        //     .doc('All Trips')
        //     .collection(currentDate);

        // const tripsSnapshot = await tripsRef.get();
        // tripsSnapshot.forEach(async (tripDoc) => {
        //     if (tripDoc.data().name === salesmanName) {
        //         await tripDoc.ref.delete();
        //         console.log(`Deleted trip document for salesman ${salesmanName} on date ${currentDate}.`);
        //     }
        // });




        // Respond with success message
        res.status(200).json({ message: 'Cart and inventory updated successfully.' });
    } catch (error) {
        console.error('Error updating cart data:', error);
        res.status(500).json({ error: 'Error updating cart and inventory: ' + error.message });
    }
});

module.exports = collectAndAddProductsToInventory;




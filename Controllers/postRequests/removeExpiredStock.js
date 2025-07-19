const functions = require('firebase-functions');
const admin = require('firebase-admin');
const shared = require('../Shared/shared');

// Initialize Firestore
const db = admin.firestore();

const removeExpiredStock = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const cartData = req.body;
    const currentDate = shared.getCurrentDate();
    // const currentDate = new Date().toISOString().split('T')[0];

    if (!salesmanId || !Array.isArray(cartData)) {
        return res.status(400).json({ error: 'Salesman id and products list are required.' });
    }

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

            // Loop through the products in the category
            for (const productId in products) {
                const product = products[productId];
                const { name, quantity, price, weight } = product;

                // Reference to the product document within the category in the cart
                const productRef = categoryRef.collection('Products').doc(productId);

                // Add the product to the "Returned Expired Products" collection
                const returnedRef = db.collection('Users')
                    .doc('Staff')
                    .collection('Salesmen')
                    .doc(salesmanId)
                    .collection('Delivered')
                    .doc(currentDate)
                    .collection('Expired Products')
                    .doc(productId);

                const returnedProductsDoc = await returnedRef.get();
                if (returnedProductsDoc.exists) {
                    const currentQuantity = returnedProductsDoc.data().quantity || 0;

                    const newQuantity = currentQuantity + quantity;

                    // Returned Products ref
                    await returnedRef.update({
                        quantity: newQuantity
                    });
                } else {
                    await returnedRef.set({
                        name: name,
                        price: price || 0.0,
                        quantity: quantity,
                        weight: weight || 0.0,
                        categoryId: categoryId
                    });
                }



                // Check if the product exists in Firestore
                const productDoc = await productRef.get();
                if (productDoc.exists) {
                    const currentQuantity = productDoc.data().quantity || 0;

                    // Subtract the quantity from the current quantity
                    const newQuantity = currentQuantity - quantity;

                    // If the new quantity is zero or less, delete the product document
                    if (newQuantity <= 0) {


                        // Remove the product from the cart
                        await productRef.delete();
                        console.log(`Product ${name} removed from cart and added to Returned Expired Products.`);
                    } else {
                        // Update the cart with the new quantity
                        await productRef.update({
                            quantity: newQuantity
                        });
                        console.log(`Updated ${name} in cart with new quantity: ${newQuantity}`);
                    }
                } else {
                    console.log(`Product with ID ${productId} not found in cart.`);
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

        // Respond with success message
        res.status(200).json({ message: 'Cart updated and expired products moved successfully.' });
    } catch (error) {
        console.error('Error updating cart data:', error);
        res.status(500).json({ error: 'Error updating cart: ' + error.message });
    }
});

module.exports = removeExpiredStock;

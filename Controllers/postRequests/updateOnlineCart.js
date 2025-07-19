const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore reference
const db = admin.firestore();

// Firebase Cloud Function to store cart data in Firestore
const updateOnlineCart = functions.https.onRequest(async (req, res) => {
    const salesmanId = req.query.salesmanId;
    const cartData = req.body;

    if (!salesmanId || !Array.isArray(cartData)) {
        return res.status(400).json({ error: 'Salesman id and cart data (as an array) are required.' });
    }

    try {
        // Group products by categoryId
        const categorizedData = {};
        cartData.forEach(product => {
            const { categoryId, productId, ...productDetails } = product;
            if (!categorizedData[categoryId]) {
                categorizedData[categoryId] = {};
            }
            categorizedData[categoryId][productId] = productDetails;
        });

        // Loop through the categorized data
        for (const categoryId in categorizedData) {
            const products = categorizedData[categoryId];

            // Reference to the category document
            const categoryRef = db.collection('Users')
                .doc('Staff')
                .collection('Salesmen')
                .doc(salesmanId)
                .collection('Cart')
                .doc(categoryId); // Document for each category

            // Set the category-level `name` field
            await categoryRef.set({ name: categoryId }, { merge: true });

            // Loop through the products in the category
            for (const productId in products) {
                const product = products[productId];

                // Reference to the product document within the category
                const productRef = categoryRef.collection('Products').doc(productId);

                // Set or update the product data
                await productRef.set({
                    name: product.name,
                    imageUrl: product.imageUrl || 'N/A',
                    price: product.price || 0.0,
                    quantity: product.quantity || 0,
                    weight: product.weight || 0.0,
                }, { merge: true }); // Use merge to update the document if it exists
            }
        }

        // Respond with success message
        res.status(200).json({ message: 'Cart data stored successfully.' });
    } catch (error) {
        console.error('Error storing cart data:', error);
        res.status(500).json({ error: 'Error storing cart data: ' + error.message });
    }
});

module.exports = updateOnlineCart;

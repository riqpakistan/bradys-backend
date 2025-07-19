const db = require('../utils/firebaseAdmin');
const functions = require('firebase-functions');

const getProductsWithCategoriesForReturnItems = functions.https.onRequest(async (req, res) => {
    const warehouseName = req.query.warehouseName;

    if (!warehouseName) {
        return res.status(400).json({ error: 'Warehouse name is required.' });
    }

    try {
        const categoriesRef = db.collection('Warehouses')
            .doc(warehouseName)
            .collection('Categories');

        const categorySnapshot = await categoriesRef.get();

        if (categorySnapshot.empty) {
            return res.status(404).json({ error: 'No categories found.', salesmanName });
        }

        const productsList = [];

        for (const categoryDoc of categorySnapshot.docs) {
            const categoryId = categoryDoc.id;

            const productsRef = categoriesRef.doc(categoryId).collection('Products');
            const productsSnapshot = await productsRef.get();

            if (!productsSnapshot.empty) {
                productsSnapshot.forEach(productDoc => {
                    const productId = productDoc.id;
                    const productData = productDoc.data();

                    // Construct product object with category reference
                    productsList.push({
                        categoryId: categoryId,
                        productId: productId,
                        name: productData.name || productId,
                        imageUrl: productData.imageUrl || 'N/A',
                        price: productData.price || 0.0,
                        quantity: productData.quantity || 0,
                        weight: productData.weight || 0,
                    });
                });
            }
        }

        if (productsList.length === 0) {
            return res.status(404).json({ error: 'No products found.', salesmanName });
        }

        res.status(200).json(productsList);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products: ' + error.message });
    }
});

module.exports = getProductsWithCategoriesForReturnItems;

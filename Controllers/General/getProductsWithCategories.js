const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const getProductsWithCategories = functions.https.onRequest(async (req, res) => {
    const warehouseName = req.query.warehouseName;
    try {

        
            const categoriesSnapshot =await db.collection('Warehouses').doc(warehouseName).collection('Categories').get();
            let productsList = [];
            for (const categoriesDoc of categoriesSnapshot.docs) {
                const categoryId = categoriesDoc.id;
                const categoryData = categoriesDoc.data();
               

                const productsSnapshot = await db.collection('Warehouses').doc(warehouseName).collection('Categories')
                    .doc(categoryId)
                    .collection('Products')
                    .get();
                for (const productsDoc of productsSnapshot.docs) {
                    const productId = productsDoc.id;
                    const productData = productsDoc.data();
                productsList.push({
                    categoryName: categoryData.name || categoryId,
                    productId,
                    name: productData.name || '',
                    imageUrl: productData.imageUrl || '',
                    price: productData.price || 0.0,
                    quantity: productData.quantity || 0,
                    weight: productData.weight || 0.0,
                });
                   
                }

                

               
            }

        res.status(200).json(productsList);
    } catch (error) {
        console.error('Error fetching products data:', error);
        res.status(500).json({ error: 'Error fetching products data: ' + error.message });
    }
});

module.exports = getProductsWithCategories;

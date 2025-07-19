const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const getFullInventory = functions.https.onRequest(async (req, res) => {
    try {
        const warehousesSnapshot = await db.collection('Warehouses').get();
        let inventoryData = [];

        for (const warehousesDoc of warehousesSnapshot.docs) {
            const warehouseId = warehousesDoc.id;
            const warehouseData= warehousesDoc.data();
            
            const categoriesSnapshot =await db.collection('Warehouses').doc(warehouseId).collection('Categories').get();
            let categoriesData = [];
            for (const categoriesDoc of categoriesSnapshot.docs) {
                const categoryId = categoriesDoc.id;
                const categoryData = categoriesDoc.data();
               

                const productsSnapshot = await db.collection('Warehouses').doc(warehouseId).collection('Categories')
                    .doc(categoryId)
                    .collection('Products')
                    .get();
                let productsData = [];
                for (const productsDoc of productsSnapshot.docs) {
                    const productId = productsDoc.id;
                    const productData = productsDoc.data();
                productsData.push({
                    productId,
                    name: productData.name || '',
                    imageUrl: productData.imageUrl || '',
                    price: productData.price || 0.0,
                    quantity: productData.quantity || 0,
                    weight: productData.weight || 0.0,
                });
                   
                }

                categoriesData.push({
                    categoryId,
                     categoryName : categoryData.name || '',
                     categoryImage : categoryData.imageUrl || '',
                     products: productsData,

                });

               
            } inventoryData.push({
                warehouseId,
                 warehouseName : warehouseData.name || '',
                 warehouseImage : warehouseData.imageUrl || '',
                 categories: categoriesData,
            });
        }

        res.status(200).json(inventoryData);
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        res.status(500).json({ error: 'Error fetching inventory data: ' + error.message });
    }
});

module.exports = getFullInventory;

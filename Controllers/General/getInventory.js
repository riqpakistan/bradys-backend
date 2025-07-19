const db = require('../utils/firebaseAdmin');

const getInventory = async (req, res) => {
    const warehouseName = req.query.warehouseName;
    const newProducts = req.query.newProducts;

    if (!warehouseName) {
        return res.status(400).json({ error: 'Warehouse name is required.' });
    }

    try {
        const categoriesRef = db.collection('Warehouses')
            .doc(warehouseName)
            .collection('Categories');

        const categorySnapshot = await categoriesRef.get();

        if (categorySnapshot.empty) {
            return res.status(404).json({ error: 'No categories found.', warehouseName });

        } else {
            const categories = [];
            for (const doc of categorySnapshot.docs) {
                const categoryId = doc.id;
                const categoryData = doc.data();
                var productSnapshot;

                // if (newProducts == 'false') {
                //     productSnapshot = await db.collection('Warehouses').
                //         doc(warehouseName).collection('Categories').doc(categoryId).collection('Return Products').get();
                // } else {
                //     productSnapshot = await db.collection('Warehouses').
                //         doc(warehouseName).collection('Categories').doc(categoryId).collection('New Products').get();
                // }

                productSnapshot = await db.collection('Warehouses').
                    doc(warehouseName).collection('Categories').doc(categoryId).collection('Products').get();




                // Construct category object
                categories.push({
                    name: categoryData.name || categoryId,
                    imageUrl: categoryData.imageUrl || '',
                    productsCount: productSnapshot.size,
                });


            }

            res.status(200).json(categories);

        }

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Error fetching categories: ' + error.message });
    }
}

module.exports = getInventory;
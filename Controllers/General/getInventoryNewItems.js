const db = require('../utils/firebaseAdmin');

const getInventoryNewItems = async (req, res) => {
    const warehouseName = req.query.warehouseName;
    const selectedCategoryName = req.query.selectedCategoryName;
    try {
        const productsRef = db.collection('Warehouses')
            .doc(warehouseName)
            .collection('Categories')
            .doc(selectedCategoryName)
            .collection('Products');

        const productsSnapshot = await productsRef.get();

        if (productsSnapshot.empty) {
            return res.status(404).json({ error: 'No products found.' });

        } else {
            const products = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(products);

        }

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products: ' + error.message });
    }
}

module.exports = getInventoryNewItems;
const db = require('../utils/firebaseAdmin')

const getProductsWithData = async (req, res) => {
    const warehouseName = req.query.warehouseName;
    const categoryName = req.query.categoryName;
    try {
        const productsRef = db.collection('Warehouses').doc(warehouseName).collection('Categories').doc(categoryName).collection('Products');

        const productsSnapshot = await productsRef.get();

        if (productsSnapshot.empty) {
            res.status(404).json({
                Error: 'No products found',
            });
        }
        else {
            const productsList = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.status(200).json(productsList);
        }
    } catch (error) {
        res.status(500).send(error);
    }

}

module.exports = getProductsWithData;
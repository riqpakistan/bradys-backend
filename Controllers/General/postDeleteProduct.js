const admin = require('firebase-admin');
const db = admin.firestore();

const postDeleteProduct = async (req, res) => {
    const { warehouseName, categoryName, productName } = req.body;

    if (!warehouseName || !categoryName || !productName) {
        return res.status(400).json({ Error: 'Missing required fields' });
    }

    try {

        const productRef = db.collection('Warehouses').doc(warehouseName).collection('Categories')
            .doc(categoryName)
            .collection('New Products').doc(productName);

        await productRef.delete();

        res.status(200).json({
            message: 'Product deleted successfully',

        });
    } catch (error) {
        console.error('Error deleting product: ', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = postDeleteProduct;

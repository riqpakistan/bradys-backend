const admin = require('firebase-admin');
const db = admin.firestore();

const postAddProduct = async (req, res) => {
    const { name, price, quantity, imageUrl, categoryName, warehouseName } = req.body;

    if (!name || !price || !quantity || !imageUrl || !categoryName || !warehouseName) {
        return res.status(400).json({ Error: 'Missing required fields' });
    }

    try {

        const productRef = db.collection('Warehouses').doc(warehouseName).collection('Categories')
            .doc(categoryName)
            .collection('New Products');

        await productRef.doc(name).set({
            name: name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            imageUrl: imageUrl,
        });

        res.status(200).json({
            message: 'Product added successfully',
            productId: name

        });
    } catch (error) {
        console.error('Error adding product: ', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = postAddProduct;

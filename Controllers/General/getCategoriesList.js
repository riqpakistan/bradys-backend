const db = require('../utils/firebaseAdmin')

const getCategoriesList = async (req, res) => {
    const warehouseName = req.query.warehouseName;
    try {
        const categoriesRef = db.collection('Warehouses').doc(warehouseName).collection('Categories');

        const categoriesSnapshot = await categoriesRef.get();

        if (categoriesSnapshot.empty) {
            res.status(404).json({
                Error: 'No categories found',
            });
        }
        else {
            const categoriesList = categoriesSnapshot.docs.map(doc => doc.id);
            res.status(200).send(categoriesList);
            // res.status(200).json({ 'categoriesList': categoriesList });
        }
    } catch (error) {
        res.status(500).send(error);
    }

}

module.exports = getCategoriesList;
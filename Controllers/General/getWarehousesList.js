const db = require('../utils/firebaseAdmin')

const getWarehousesList = async (req, res) => {

    try {
        const warehousesRef = db.collection('Warehouses');

        const warehousesSnapshot = await warehousesRef.get();

        if (warehousesSnapshot.empty) {
            res.status(404).json({
                Error: 'No warehouses found',
            });
        }
        else {
            const warehousesList = warehousesSnapshot.docs.map(doc => doc.id);
            res.status(200).json({ 'warehouseList': warehousesList });
        }
    } catch (error) {
        res.status(500).send(error);
    }

}

module.exports = getWarehousesList;
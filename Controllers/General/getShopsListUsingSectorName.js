const functions = require('firebase-functions');
const db = require('../utils/firebaseAdmin');

const getShopsListUsingSectorName = functions.https.onRequest(async (req, res) => {
    try {
        const sectorName = req.query.sectorName;

        if (!sectorName) {
            return res.status(400).json({ error: 'Sector name is required.' });
        }

        const shopsSnapshot = await db.collection('Sectors')
        .doc(sectorName)
        .collection('Shops')
        .get();

        let shopsList = [];

        for(shopDoc of shopsSnapshot.docs){
            const shopData = shopDoc.data();
            const shopName = shopData.name;
            const shopLocation = shopData.location || 'N/A';
            const shopBalance = shopData.balance || 0;

            shopsList.push({
                shopName,
                shopLocation,
                shopBalance,
            });
        }

      
        res.status(200).json(shopsList);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching shops: ' + error.message });
    }
});

module.exports = getShopsListUsingSectorName;

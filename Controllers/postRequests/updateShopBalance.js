const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore reference
const db = admin.firestore();

// Firebase Cloud Function to batch update balances with validation
const updateShopBalance = functions.https.onRequest(async (req, res) => {
    const updates = req.body;

    // Validate input
    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(200).json({ error: 'No shops found.' });
    }

    try {
        // Validate existence of all sectorName and shopId before updating
        for (const update of updates) {
            const { sectorName, shopId, newBalance } = update;

            // Check for required fields
            if (!sectorName || !shopId || typeof newBalance !== 'number') {
                throw new Error(
                    `Invalid data format. Each update must include sectorName, shopId, and newBalance. Received: ${JSON.stringify(update)}`
                );
            }

            // Check if sector exists
            const sectorRef = db.collection('Sectors').doc(sectorName);
            const sectorDoc = await sectorRef.get();
            if (!sectorDoc.exists) {
                return res.status(404).json({
                    error: `Sector '${sectorName}' does not exist. Aborting updates.`,
                });
            }

            // Check if shop exists
            const shopRef = sectorRef.collection('Shops').doc(shopId);
            const shopDoc = await shopRef.get();
            if (!shopDoc.exists) {
                return res.status(404).json({
                    error: `Shop with ID '${shopId}' does not exist in sector '${sectorName}'. Aborting updates.`,
                });
            }
        }

        // Create a batch for updates
        const batch = db.batch();
        updates.forEach(({ sectorName, shopId, newBalance }) => {
            const shopRef = db
                .collection('Sectors')
                .doc(sectorName)
                .collection('Shops')
                .doc(shopId);

            batch.update(shopRef, { balance: newBalance });
        });

        // Commit the batch operation
        await batch.commit();

        res.status(200).json({ message: 'Balances updated successfully.' });
    } catch (error) {
        console.log('Error updating balances:', error);
        res.status(500).json({ error: 'Error updating balances: ' + error.message });
    }
});

module.exports = updateShopBalance;

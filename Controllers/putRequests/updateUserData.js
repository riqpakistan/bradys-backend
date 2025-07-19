
const db = require('../../utils/firebaseAdmin');

const updateUserData = async (req, res) => {
    const { collectionName, docId, updatedData } = req.body;
    try {
        const docRef = db.collection(collectionName).doc(docId);
        await docRef.update(updatedData);
        res.status(200).send('Document updated successfully');
    } catch (error) {
        res.status(500).send('Error updating document');
    }
};

module.exports = updateUserData;

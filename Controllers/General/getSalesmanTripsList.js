const db = require('../utils/firebaseAdmin');

const getSalesmanTripsList = async (req, res) => {
    const salesmanName = req.query.salesmanName;

    try {
        const tripsRef = db.collection('Users').doc('Staff').collection('Salesmen').doc(salesmanName).collection('Trips');

        const tripsSnapshot = await tripsRef.get();

        if (tripsSnapshot.empty) {
            res.status(200).send('No trips found');
        } else {
            const tripsList = [];
            for (const doc of tripsSnapshot.docs) {
                tripsList.push({
                    id: doc.id,
                    ...doc.data()
                });
            }

            res.status(200).json(tripsList);

        }

    } catch (error) {
        res.status(500).send(error);

    }


}

module.exports = getSalesmanTripsList;
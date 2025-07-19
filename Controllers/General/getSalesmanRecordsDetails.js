const db = require('../utils/firebaseAdmin');

const getSalesmanRecordsDetails = async (req, res) => {
    const salesmanId = req.query.salesmanId;
    try {
        const salesmanDetailsRef = db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

        const snapshot = await salesmanDetailsRef.get();

        if (!snapshot.exists) {
            return res.status(404).send('No records found');
        }

        const salesmanDetails = snapshot.data();

        const tripsRef = salesmanDetailsRef.collection('Delivered');
        const tripsSnapshot = await tripsRef.get();

        const trips = await Promise.all(
            tripsSnapshot.docs.map(async (doc) => {
                const shopsRef = doc.ref.collection('Shops');
                const notDeliveredShopsRef = doc.ref.collection('Not Delivered Shops');

                const shopsCount = (await shopsRef.get()).size;
                const notDeliveredShopsCount = (await notDeliveredShopsRef.get()).size;

                return {
                    id: doc.id,
                    ...doc.data(),
                    deliveredShopsLength: shopsCount,
                    notDeliveredShopsLength: notDeliveredShopsCount,
                };
            })
        );

        res.status(200).json({
            salesmanDetails: salesmanDetails,
            trips: trips,
        });
    } catch (error) {
        console.error('Error fetching salesman records:', error);
        res.status(500).send(error.message);
    }
};

module.exports = getSalesmanRecordsDetails;






// const db = require('../utils/firebaseAdmin');

// const getSalesmanRecordsDetails = async (req, res) => {
//     const salesmanName = req.query.salesmanName;
//     try {
//         const salesmanDetailsRef = db.collection('Users')
//             .doc('Staff')
//             .collection('Salesmen').doc(salesmanName);

//         const snapshot = await salesmanDetailsRef.get();

//         if (snapshot.exists) {
//             salesmanDetails = snapshot.data();

//             const tripsRef = salesmanDetailsRef.collection('Delivered');
//             const tripsSnapshot = await tripsRef.get();

//             const trips = tripsSnapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data(),
//             }));
//             res.status(200).json({
//                 salesmanDetails: salesmanDetails,
//                 trips: trips
//             });
//         } else {
//             res.status(404).send('No records found');
//         }
//         // const salesmanDetailsRef = db.collection('Users')
//         //     .doc('Staff')
//         //     .collection('Salesmen').doc(salesmanName);

//         // const snapshot = await salesmanDetailsRef.get();

//         // if (snapshot.exists) {

//         //     const salesmanDetails = snapshot.data();
//         //     res.status(200).json(salesmanDetails);
//         // } else {
//         //     res.status(404).send('No records found');
//         // }
//     } catch (error) {
//         res.status(500).send(error);
//     }
// }

// module.exports = getSalesmanRecordsDetails;
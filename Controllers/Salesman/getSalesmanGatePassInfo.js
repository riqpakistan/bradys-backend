const db = require('../utils/firebaseAdmin');
const shared = require('../Shared/shared');

const getSalesmanGatePassInfo = async (req, res) => {
    const salesmanId = req.query.salesmanId;

    try {
        const currentDate = shared.getCurrentDate();
        // const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        const currentGatePassRef = db
            .collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId)
            .collection('GatePass')
            .doc(currentDate);

        const currentGatePassSnapshot = await currentGatePassRef.get();

        if (currentGatePassSnapshot.exists) {
            const isTripStarted = currentGatePassSnapshot.data().isTripStarted;

            // Fetch categories with products data
            const categories = await fetchCategoriesWithProducts(currentGatePassRef);

            res.status(200).send({ isTripStarted: isTripStarted, gatePassId: currentDate, categories });
        } else {
            res.status(404).send('No GatePass found for this salesman');
            return;
        }
    } catch (error) {
        console.error('Error fetching GatePass data:', error);
        res.status(500).send(error.message);
    }
};

// Function to fetch categories and their products
const fetchCategoriesWithProducts = async (gatePassRef) => {
    const categoriesRef = gatePassRef.collection('Categories');
    const categoriesSnapshot = await categoriesRef.get();

    const categories = await Promise.all(
        categoriesSnapshot.docs.map(async (doc) => {
            const categoryData = {
                id: doc.id,
                ...doc.data(),
            };

            // Fetch products in this category
            const productsRef = doc.ref.collection('Products');
            const productsSnapshot = await productsRef.get();

            categoryData.products = productsSnapshot.docs.map((productDoc) => ({
                id: productDoc.id,
                ...productDoc.data(),
            }));

            return categoryData;
        })
    );

    return categories;
};

module.exports = getSalesmanGatePassInfo;












// const db = require('../utils/firebaseAdmin');

// const getSalesmanGatePassInfo = async (req, res) => {
//     const salesmanName = req.query.salesmanName;
//     try {

//         const currentGatePassRef = db
//             .collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanName).collection('GatePass');

//         const currentGatepassSnapshot = await currentGatePassRef.get();

//         if (!currentGatepassSnapshot.empty) {
//             const docs = currentGatepassSnapshot.docs;
//             const currentGatePassDoc = docs[0];
//             const currentGatePassDocId = currentGatePassDoc.id;


//             const productsRef = await db
//                 .collection('Users')
//                 .doc('Staff')
//                 .collection('Salesmen')
//                 .doc(salesmanName)
//                 .collection('GatePass')
//                 .doc(currentGatePassDocId).collection('Categories');

//             const productsSnapshot = await productsRef.get();

//             if (!productsSnapshot.empty) {

//                 const isTripStarted = currentGatePassDocId.data().isTripStarted;
//                 const products = productsSnapshot.docs.map(doc => ({
//                     id: doc.id,
//                     ...doc.data(),
//                 }));


//                 res.status(200).send({ gatePassId: currentGatePassDocId, isTripStarted: isTripStarted, products });
//             } else {
//                 res.status(404).send('No products found in the last GatePass.');
//             }
//         } else {
//             console.log('No GatePass found for this salesman');
//             return null;
//         }

//     } catch (error) {
//         res.status(500).send(error);
//     }
// }
// module.exports = getSalesmanGatePassInfo;










// const db = require('../utils/firebaseAdmin');

// const getSalesmanGatePassInfo = async (req, res) => {
//     const salesmanName = req.query.salesmanName;
//     try {

//         const lastDocRef = db
//             .collection('Users')
//             .doc('Staff')
//             .collection('Salesmen')
//             .doc(salesmanName).collection('GatePass');

//         const lastDocSnapshot = await lastDocRef.get();

//         if (!lastDocSnapshot.empty) {
//             const docs = lastDocSnapshot.docs;
//             const lastDoc = docs[docs.length - 1];
//             const lastGatePassId = lastDoc.id;

//             const productsRef = await db
//                 .collection('Users')
//                 .doc('Staff')
//                 .collection('Salesmen')
//                 .doc(salesmanName)
//                 .collection('GatePass')
//                 .doc(lastGatePassId).collection('Categories');

//             const productsSnapshot = await productsRef.get();

//             if (!productsSnapshot.empty) {
//                 const isTripStarted = lastDoc.data().isTripStarted;
//                 const products = productsSnapshot.docs.map(doc => ({
//                     id: doc.id,
//                     ...doc.data(),
//                 }));


//                 res.status(200).send({ gatePassId: lastGatePassId, isTripStarted: isTripStarted, products });
//             } else {
//                 res.status(404).send('No products found in the last GatePass.');
//             }
//         } else {
//             console.log('No GatePass found for this salesman');
//             return null;
//         }

//     } catch (error) {
//         res.status(500).send(error);
//     }
// }
// module.exports = getSalesmanGatePassInfo;
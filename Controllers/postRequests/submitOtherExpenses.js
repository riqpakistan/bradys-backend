const functions = require('firebase-functions');
const admin = require('firebase-admin');
const shared = require('../Shared/shared');

// Initialize Firestore
const db = admin.firestore();

const submitOtherExpenses = functions.https.onRequest(
    async (req, res) => {
        const salesmanId = req.query.salesmanId;
        const expensesList = req.body;
        const currentDate = shared.getCurrentDate();

        if (!salesmanId || !Array.isArray(expensesList)) {
            return res.status(400).json({ error: 'Salesman id and expense list are required.' });
        }
        try {
            const salesmanRef = await db.collection('Users')
            .doc('Staff')
            .collection('Salesmen')
            .doc(salesmanId);

            const otherExpensesRef = await salesmanRef
                .collection('Delivered')
                .doc(currentDate)
                .collection('Other Expenses');
            
            const transactionsRef = await salesmanRef
            .collection('Transactions').doc(currentDate);
            
            // Fetch salesman's current data
        const salesmanDoc = await salesmanRef.get();
        let currentCashInHand = 0;
        if (salesmanDoc.exists) {
            currentCashInHand = salesmanDoc.data().cashInHand || 0;
        } else {
            return res.status(404).json({ error: `Salesman '${salesmanId}' does not exist.` });
        }

        // Fetch current otherExpenses value
        const transactionDoc = await transactionsRef.get();
        let currentOtherExpenses = 0;
        if (transactionDoc.exists) {
            currentOtherExpenses = transactionDoc.data().otherExpenses || 0;
        }
           

            // Calculate total expense amount
            let totalExpenses = 0;
            const batch = db.batch();

            expensesList.forEach((expense) => {
                const { title, details, amount } = expense;
                totalExpenses += amount;

                const expenseDocRef = otherExpensesRef.doc(title);
                batch.set(expenseDocRef, { details, amount }, { merge: true });
            });

             // Update cashInHand and otherExpenses fields
        batch.update(salesmanRef, { cashInHand: currentCashInHand - totalExpenses });
        batch.update(transactionsRef, { otherExpenses: currentOtherExpenses + totalExpenses });

        // Commit batch
            await batch.commit();

            res.status(200).json({
                message: `Expenses submitted successfully. Total: ${totalExpenses}. Updated cashInHand: ${currentCashInHand - totalExpenses}.`
            });

        }
        catch (error) {
            console.error('Error submitting expenses:', error.message);
            res.status(500).json({ error: 'Error submitting expenses: ' + error.message });
        }


    }
);

module.exports = submitOtherExpenses;
const admin = require("firebase-admin");


let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} else {
  console.error("FIREBASE_CREDENTIALS file string not found in environment variables");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;





// Previous code

// // Importing firebase admin sdk
// const admin = require('firebase-admin');

// // Checking if admin sdk is already initialized or not
// if (!admin.apps.length) {
//     // Initializing admin sdk if not initialized
//     admin.initializeApp();
// }
// // Getting reference of firestore
// const db = admin.firestore();

// // Exporting firestore refrence so other files can use it
// module.exports = db;
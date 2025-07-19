const fs = require("fs");

// Read your service account JSON file
const serviceAccount = require("./pkey.json");

// Convert the object to JSON string
let stringified = JSON.stringify(serviceAccount);

// Escape newline characters in the private key (\\n instead of \n)
stringified = stringified.replace(/\n/g, "\\n");

// Print result to copy-paste
console.log("Paste the following into your .env or Vercel env variable:");
console.log(`FIREBASE_CONFIG='${stringified}'`);

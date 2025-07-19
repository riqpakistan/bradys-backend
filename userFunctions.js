const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create a new user in Firestore
exports.createUser = functions.https.onCall(async (data, context) => {
  try {
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "");
    }

    // Extract user data from request
    const {userId, username} = data;

    // Validate input (basic validation)
    if (!userId || !username) {
      throw new functions.https.HttpsError("invalid-argument", "required");
    }

    // Add the user to the Firestore "Users" collection
    const userRef = admin.firestore().collection("TestUser").doc(userId);

    // Set the user document with the provided data
    await userRef.set({
      userId: userId,
      username: username,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return success message
    return {message: "User created successfully!"};
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError("internal", "Failed to create user");
  }
});

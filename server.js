const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const managerRoutes = require("./Routes/managerRoutes");
app.use("/api/manager", managerRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Bradys backend API is running.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});





// Previous cloud functions code 

// // Old code for version 1
// // Initializing firebase functions inside index.js
// // const functions = require("firebase-functions");

// // // Request methods
// // const getUserData = require('./getRequests/getUserData');
// // const postUserData = require('./postRequests/postUserData');
// // const updateUserData = require('./putRequests/updateUserData');
// // const deleteUserData = require('./deleteRequests/deleteUserData');

// // // Defining cloud functions for each http method
// // exports.getUserData = functions.https.onRequest(getUserData);
// // exports.postUserData = functions.https.onRequest(postUserData);
// // exports.updateUserData = functions.https.onRequest(updateUserData);
// // exports.deleteUserData = functions.https.onRequest(deleteUserData);


// // New code for version 2
// // Initializing firebase functions inside index.js
// const { onRequest } = require("firebase-functions/v2/https");

// // Example url
// // http://localhost:5001/project1-4ee2b/us-central1/getUserData

// // File: /api/getManagerInfo.js (inside your Vercel project)
// const getManagerInfo = require('./Manager/getManagerInfo');

// export default function handler(req, res) {
//   return getManagerInfo(req, res);
// }

// // Manager methods
// // const getManagerInfo = require('./Manager/getManagerInfo');
// // exports.getManagerInfo = onRequest(getManagerInfo);

// const getManagerPendingRequestsList = require('./Manager/getManagerPendingRequestsList');
// exports.getManagerPendingRequestsList = onRequest(getManagerPendingRequestsList);

// const getManagerPendingRequestDetails = require('./Manager/getManagerPendingRequestDetails');
// exports.getManagerPendingRequestDetails = onRequest(getManagerPendingRequestDetails);

// const getManagerApprovedRequestsList = require('./Manager/getManagerApprovedRequestsList');
// exports.getManagerApprovedRequestsList = onRequest(getManagerApprovedRequestsList);

// const getManagerApprovedRequestDetails = require('./Manager/getManagerApprovedRequestDetails');
// exports.getManagerApprovedRequestDetails = onRequest(getManagerApprovedRequestDetails);

// const getSalesmanRecords = require('./General/getSalesmanRecords');
// exports.getSalesmanRecords = onRequest(getSalesmanRecords);

// const getSalesmanRecordsDetails = require('./General/getSalesmanRecordsDetails');
// exports.getSalesmanRecordsDetails = onRequest(getSalesmanRecordsDetails);

// const getInventory = require('./General/getInventory');
// exports.getInventory = onRequest(getInventory);

// const getInventoryNewItems = require('./General/getInventoryNewItems');
// exports.getInventoryNewItems = onRequest(getInventoryNewItems);

// const getInventoryReturnItems = require('./General/getInventoryReturnItems');
// exports.getInventoryReturnItems = onRequest(getInventoryReturnItems);

// const getWarehousesList = require('./General/getWarehousesList');
// exports.getWarehousesList = onRequest(getWarehousesList);

// const getCategoriesList = require('./General/getCategoriesList');
// exports.getCategoriesList = onRequest(getCategoriesList);

// const getProductsList = require('./General/getProductsList');
// exports.getProductsList = onRequest(getProductsList);

// const getProductsWithData = require('./General/getProductsWithData');
// exports.getProductsWithData = onRequest(getProductsWithData);

// const getSalesmanInfo = require('./Salesman/getSalesmanInfo');
// exports.getSalesmanInfo = onRequest(getSalesmanInfo);

// const getSalesmanTripsList = require('./General/getSalesmanTripsList');
// exports.getSalesmanTripsList = onRequest(getSalesmanTripsList);

// const postAddProduct = require('./General/postAddProduct');
// exports.postAddProduct = onRequest(postAddProduct);

// const postDeleteProduct = require('./General/postDeleteProduct');
// exports.postDeleteProduct = onRequest(postDeleteProduct);

// const assignProductsToSalesman = require('./General/assignProductsToSalesman');
// exports.assignProductsToSalesman = onRequest(assignProductsToSalesman);

// const getSalesmanGatePassInfo = require('./Salesman/getSalesmanGatePassInfo');
// exports.getSalesmanGatePassInfo = onRequest(getSalesmanGatePassInfo);

// // const dummyGatepass = require('./postRequests/dummyGatepass');
// // exports.dummyGatepass = onRequest(dummyGatepass);

// exports.createGatePass = require('./postRequests/createGatePass');

// exports.getShopsList = require('./General/getShopsList');

// exports.getGatePassCategories = require('./Salesman/getGatePassCategories');

// exports.getGatePassProducts = require('./Salesman/getGatePassProducts');

// exports.getProductsWithCategoriesForReturnItems = require('./Salesman/getProductsWithCategoriesForReturnItems');

// exports.updateOnlineCart = require('./postRequests/updateOnlineCart');

// exports.getOnlineCart = require('./Salesman/getOnlineCart');

// exports.storeDeliverySummary = require('./postRequests/storeDeliverySummary');

// exports.getDeliveryShopsList = require('./Salesman/getDeliveryShopsList');

// exports.getNotDeliveredShopsList = require('./Salesman/getNotDeliveredShopsList');

// exports.getDeliveryShopSalesItems = require('./Salesman/getDeliveryShopSalesItems');

// exports.getDeliveryShopReturnItems = require('./Salesman/getDeliveryShopReturnItems');

// exports.getSalesmanTripStatus = require('./Salesman/getSalesmanTripStatus');

// exports.sendEndTripAlertToManager = require('./Salesman/sendEndTripAlertToManager');

// exports.getLastCompletedTripSalesman = require('./Manager/getLastCompletedTripSalesman');

// exports.getAllCompletedTripsSalesman = require('./Manager/getAllCompletedTripsSalesman');

// exports.getCompletedTripSalesmanCartCategories = require('./Manager/getCompletedTripSalesmanCartCategories');

// exports.getCompletedTripSalesmanCartProducts = require('./Manager/getCompletedTripSalesmanCartProducts');

// exports.getSalesAndReturnReports = require('./Manager/getSalesAndReturnReports');

// exports.addInventory = require('./postRequests/addInventory');

// exports.collectAndAddProductsToInventory = require('./postRequests/collectAndAddProductsToInventory');

// exports.addShops = require('./postRequests/addShops');

// exports.updateShopBalance = require('./postRequests/updateShopBalance');

// exports.updateSalesmanBalance = require('./postRequests/updateSalesmanBalance');

// exports.getSalesmanCashInHand = require('./Salesman/getSalesmanCashInHand');

// exports.storeNotDeliveredShopsList = require('./postRequests/storeNotDeliveredShopsList');

// exports.removeExpiredStock = require('./postRequests/removeExpiredStock');

// exports.updateTripStatus = require('./postRequests/updateTripStatus');

// exports.submitOtherExpenses = require('./postRequests/submitOtherExpenses');

// exports.getFullInventory = require('./General/getFullInventory');

// exports.getSalesmanProductReports = require('./General/getSalesmanProductReports');

// exports.getProductsWithCategories = require('./General/getProductsWithCategories');

// exports.getProductsReports = require('./General/getProductsReports');

// exports.getAllSalesmenReports = require('./General/getAllSalesmenReports');

// exports.getShopsListUsingSectorName = require('./General/getShopsListUsingSectorName');







// /////////////////////////////////////////////////////////


// /**
//  * Boiler plate code
//  * Import function triggers from their respective submodules:
//  *
//  * const {onCall} = require("firebase-functions/v2/https");  // uncomment it
//  * const {onDocumentWritten} = require("firebase-functions/v2/firestore");  // uncomment it
//  *
//  * See a full list of supported triggers at https://firebase.google.com/docs/functions
//  */

// // const {onRequest} = require("firebase-functions/v2/https");
// // const logger = require("firebase-functions/logger");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started

// // exports.helloWorld = onRequest((request, response) => {
// //   logger.info("Hello logs!", {structuredData: true});
// //   response.send("Hello from Firebase!");
// // });
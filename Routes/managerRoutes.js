// Modules
const express = require("express");
const router = express.Router();


// Imports 
const {getAllCompletedTripsSalesman}= require('../Controllers/Manager/getAllCompletedTripsSalesman');
const {getCompletedTripSalesmanCartCategories} = require('../Controllers/Manager/getCompletedTripSalesmanCartCategories')
const {getCompletedTripSalesmanCartProducts} = require('../Controllers/Manager/getCompletedTripSalesmanCartProducts')
const {getLastCompletedTripSalesman} = require('../Controllers/Manager/getLastCompletedTripSalesman');
const {getManagerApprovedRequestDetails} = require('../Controllers/Manager/getManagerApprovedRequestDetails');
const {getManagerApprovedRequestsList} = require('../Controllers/Manager/getManagerApprovedRequestsList');
const  {getManagerInfo}  = require("../Controllers/Manager/getManagerInfo");
const {getManagerPendingRequestDetails} = require('../Controllers/Manager/getManagerPendingRequestDetails');
const {getManagerPendingRequestsList} = require('../Controllers/Manager/getManagerPendingRequestsList');
const {getSalesAndReturnReports} = require('../Controllers/Manager/getSalesAndReturnReports');

// Routes
router.get('/getAllCompletedTripsSalesman', getAllCompletedTripsSalesman);
router.get('/getCompletedTripSalesmanCartCategories', getCompletedTripSalesmanCartCategories);
router.get('/getCompletedTripSalesmanCartProducts', getCompletedTripSalesmanCartProducts);
router.get('/getLastCompletedTripSalesman', getLastCompletedTripSalesman);
router.get('/getManagerApprovedRequestDetails', getManagerApprovedRequestDetails);
router.get('/getManagerApprovedRequestsList', getManagerApprovedRequestsList);
router.get("/getManagerInfo", getManagerInfo);
router.get('/getManagerPendingRequestDetails', getManagerPendingRequestDetails);
router.get('/getManagerPendingRequestsList', getManagerPendingRequestsList);
router.get('/getSalesAndReturnReports', getSalesAndReturnReports);

// Export
module.exports = router;

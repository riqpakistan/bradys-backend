const express = require("express");
const  {getManagerInfo}  = require("../Controllers/Manager/getManagerInfo");

const router = express.Router();

// GET /api/manager?managerId=abc123
router.get("/", getManagerInfo);

module.exports = router;

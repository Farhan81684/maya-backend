const express = require('express');
const router = express.Router();
const dashboardDataController = require('../controllers/dashboardData');

router.get('/', dashboardDataController.getDashboardData);

//insert data 
router.post('/', dashboardDataController.insertDashboardData);

module.exports = router;
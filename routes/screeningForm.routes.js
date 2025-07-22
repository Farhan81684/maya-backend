const express = require('express');
const router = express.Router();
const screeningFormController = require('../controllers/screeningForm');

// We only have POST, GET all, and PUT (by ID)
router.post('/',
    screeningFormController.submitForm
);


module.exports = router;
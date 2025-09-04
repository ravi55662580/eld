const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getDrivers,
  createDriver,
  getDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/driverController');
const { validateObjectId, validateDriverCreation, validatePagination } = require('../utils/validation');

const router = express.Router();
router.use(authenticate);

router.get('/', validatePagination(), getDrivers);
router.post('/', validateDriverCreation(), createDriver);
router.get('/:id', validateObjectId('id'), getDriver);
router.put('/:id', validateObjectId('id'), updateDriver);
router.delete('/:id', validateObjectId('id'), deleteDriver);

module.exports = router;

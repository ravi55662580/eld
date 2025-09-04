const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getAssets,
  createAsset,
  getAsset,
  updateAsset,
  deleteAsset
} = require('../controllers/assetController');
const { validateObjectId, validateAssetCreation, validatePagination } = require('../utils/validation');

const router = express.Router();
router.use(authenticate);

router.get('/', validatePagination(), getAssets);
router.post('/', validateAssetCreation(), createAsset);
router.get('/:id', validateObjectId('id'), getAsset);
router.put('/:id', validateObjectId('id'), updateAsset);
router.delete('/:id', validateObjectId('id'), deleteAsset);

module.exports = router;

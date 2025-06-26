const express = require('express');
const router = express.Router();
const bloodUnitsController = require('../controllers/bloodunitsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');   

router.get('/', authenticate, authorize(['manager']), bloodUnitsController.listBloodUnits);
router.get('/search/:blood_unit_id', authenticate, authorize(['manager']), bloodUnitsController.searchBloodUnitsByGroup);
router.get('/:id', authenticate, authorize(['manager']), bloodUnitsController.getBloodUnit);
router.post('/',authenticate,authorize(['manager']),bloodUnitsController.createBloodUnit);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getSummary, getMonthly, getCategories, getCashFlow, getSavings, getInsights } = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.get('/categories', getCategories);
router.get('/cash-flow', getCashFlow);
router.get('/savings', getSavings);
router.get('/insights', getInsights);

module.exports = router;

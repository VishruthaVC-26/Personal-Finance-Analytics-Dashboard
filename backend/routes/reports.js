const express = require('express');
const router = express.Router();
const { exportTransactions, generateMonthlyReport, exportMonthlyReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/transactions.csv', exportTransactions);
router.get('/monthly', generateMonthlyReport);
router.get('/monthly.csv', exportMonthlyReport);

module.exports = router;

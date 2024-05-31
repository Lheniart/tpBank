const express = require('express');
const accountController = require('../controllers/accountController');
const exportController = require("../controllers/exportController");
const budgetController = require("../controllers/budgetController")

const router = express.Router();

router.get('/', accountController.getAccounts);
router.post('/', accountController.createAccount);
router.post('/:accountId/exports', exportController.exportTransactions);
router.get('/:accountId/exports', (req, res) => {
    const accountId = req.params.accountId;
    const filePath = `exports/transactions_account_${accountId}.csv`;
    res.download(filePath);
});
router.get('/budgets/:amount', budgetController.getTransactionsUnderBudget);

module.exports = router;

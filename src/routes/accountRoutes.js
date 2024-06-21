const express = require('express');
const accountController = require('../controllers/accountController');
const exportController = require("../controllers/exportController");
const budgetController = require("../controllers/budgetController")
const transactionController = require("../controllers/transactionController");

const router = express.Router();

router.get('/', accountController.getAccounts);
router.post('/', accountController.createAccount);
router.post('/:accountId/exports', accountController.exportCSV);

router.get('/:accountId/exports', accountController.dlCSV);
router.get('/budgets/:amount', budgetController.getTransactionsUnderBudget);

router.get('/:accountId/budgets/:amount', transactionController.getTransactionsUpToBudget);

module.exports = router;

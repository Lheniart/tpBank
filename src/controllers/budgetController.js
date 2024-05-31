const budgetService = require('../services/budgetService');

async function getTransactionsUnderBudget(req, res) {
    const budget = parseFloat(req.params.amount);

    if (isNaN(budget) || budget <= 0) {
        return res.status(400).json({ message: 'Invalid budget amount' });
    }

    try {
        const transactions = await budgetService.getTransactionsUnderBudget(budget);
        res.status(200).json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while fetching transactions' });
    }
}

module.exports = { getTransactionsUnderBudget };

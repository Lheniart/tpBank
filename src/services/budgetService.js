const budgetRepository = require('../repositories/budgetRepository');

async function getTransactionsUnderBudget(budget) {
    return await budgetRepository.fetchTransactionsUnderBudget(budget);
}

module.exports = { getTransactionsUnderBudget };

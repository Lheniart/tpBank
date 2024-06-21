const transactionRepository = require('../repositories/transactionRepository');

async function createTransaction(accountId, transactionName, amount, type) {
    return await transactionRepository.insertTransaction(accountId, transactionName, amount, type);
}

async function getTransactionsByAccountId(accountId) {
    return await transactionRepository.getTransactionsByAccountId(accountId);
}

async function getTransactionsUpToBudget(accountId, budget) {
    return await transactionRepository.getTransactionsUpToBudget(accountId, budget);
}

module.exports = { createTransaction, getTransactionsByAccountId, getTransactionsUpToBudget };

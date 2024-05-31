const transactionRepository = require('../repositories/transactionRepository');

async function createTransaction(accountId, transactionName, amount, type) {
    return await transactionRepository.insertTransaction(accountId, transactionName, amount, type);
}

async function getTransactionsByAccountId(accountId) {
    return await transactionRepository.getTransactionsByAccountId(accountId);
}

module.exports = { createTransaction, getTransactionsByAccountId };

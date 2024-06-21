const accountRepository = require('../repositories/accountRepository');

async function createAccount(userId, accountName) {
    return await accountRepository.insertAccount(userId, accountName);
}

async function getAccounts() {
    return await accountRepository.getAllAccounts();
}
async function exportCSV(accountId) {
    return await accountRepository.exportTransaction(accountId);
}

async function dlCSV(accountId) {
    return await accountRepository.dlCSV();
}

module.exports = { createAccount, getAccounts, exportCSV, dlCSV };

const accountRepository = require('../repositories/accountRepository');

async function createAccount(userId, accountName) {
    return await accountRepository.insertAccount(userId, accountName);
}

async function getAccounts() {
    return await accountRepository.getAllAccounts();
}

module.exports = { createAccount, getAccounts };

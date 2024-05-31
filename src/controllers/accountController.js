const accountService = require('../services/accountService');

async function createAccount(req, res) {
    try {
        const accountId = await accountService.createAccount(req.body.userId, req.body.accountName);
        res.redirect(`/views/${req.body.userId}`);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

async function getAccounts(req, res) {
    try {
        const accounts = await accountService.getAccounts();
        res.json(accounts);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

module.exports = { createAccount, getAccounts };

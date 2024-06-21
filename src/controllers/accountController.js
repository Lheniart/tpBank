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
async function exportCSV(req, res){
    const accountId = req.params.accountId;
    console.log("export user id : ", accountId)
    await accountService.exportCSV(accountId)
        .then(response => {
           console.log(response)
        })
        .catch(error => {
            console.error(error)
        })
}

async function dlCSV(req, res){
    await accountService.dlCSV()
        .then(response => {
            res.json({ content: response });
        })
        .catch(error => {
            console.error(error)
        })
}

module.exports = { createAccount, getAccounts, exportCSV, dlCSV };

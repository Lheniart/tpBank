const transactionService = require('../services/transactionService');

async function createTransaction(req, res) {
    try {
        const transactionId = await transactionService.createTransaction(
            req.body.accountId,
            req.body.transactionName,
            req.body.amount,
            req.body.type
        );
        res.redirect(`/views/${req.body.userId}/${req.body.accountId}`);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

module.exports = { createTransaction };

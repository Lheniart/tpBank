const { createObjectCsvWriter } = require('csv-writer');
const transactionService = require('../services/transactionService');
const path = require('path');

async function exportTransactions(req, res) {
    const accountId = req.params.accountId;
    console.log("export user id : ", accountId)
    try {
        const transactions = await transactionService.getTransactionsByAccountId(accountId);

        console.log("Fetched transactions: ", transactions); // Ajoutez cette ligne pour vérifier les données

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this account' });
        }

        const csvWriter = createObjectCsvWriter({
            path: path.join(__dirname, `../../exports/transactions_account_${accountId}.csv`),
            header: [
                { id: 'ID', title: 'ID' },
                { id: 'NAME', title: 'NAME' },
                { id: 'AMOUNT', title: 'AMOUNT' },
                { id: 'TYPE', title: 'TYPE' },
                { id: 'ACCOUNT_ID', title: 'ACCOUNT_ID' },
                { id: 'CREATION_TS', title: 'CREATION_TS' }
            ]
        });

        await csvWriter.writeRecords(transactions);

        res.status(200).json({ message: 'CSV file created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'An error occurred while exporting transactions' });
    }
}

module.exports = { exportTransactions };

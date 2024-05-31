const oracledb = require('oracledb');
const connectToDatabase = require('../db/database');

async function fetchTransactionsUnderBudget(budget) {
    const connection = await connectToDatabase();
    let transactions = [];
    let cumulativeAmount = 0;

    try {
        const result = await connection.execute(
            `SELECT id, name, amount, type, account_id, creation_ts 
            FROM transactions 
            ORDER BY creation_ts ASC`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const resultSet = result.resultSet;

        let row;
        while ((row = await resultSet.getRow())) {
            if (row.type === 0) { // Outgoing transaction
                cumulativeAmount += row.amount;
            } else { // Incoming transaction
                cumulativeAmount -= row.amount;
            }

            transactions.push(row);

            if (cumulativeAmount >= budget) {
                break;
            }
        }

        await resultSet.close();
    } catch (err) {
        console.error('Error fetching transactions:', err);
    }
    return transactions;
}

module.exports = { fetchTransactionsUnderBudget };

const oracledb = require('oracledb');
const connectToDatabase = require('../db/database');

async function insertTransaction(accountId, transactionName, amount, type) {
    const connection = await connectToDatabase();
    const result = await connection.execute(
        `BEGIN create_transaction(:accountId, :transactionName, :amount, :type, :transactionId); END;`,
        {
            accountId,
            transactionName,
            amount,
            type,
            transactionId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
    );
    return result.outBinds.transactionId;
}

async function getTransactionsByAccountId(accountId) {
    const connection = await connectToDatabase();
    const result = await connection.execute(
        `SELECT id, name, amount, type, account_id, TO_CHAR(creation_ts, 'YYYY-MM-DD HH24:MI:SS') as creation_ts 
        FROM transactions_secure_view WHERE account_id = :accountId`,
        [accountId]
    );
    return result.rows;
}

async function getTransactionsUpToBudget(accountId, budget) {
    const connection = await connectToDatabase();
    const result = await connection.execute(
        `BEGIN get_transactions_up_to_budget(:accountId, :budget, :cursor); END;`,
        {
            accountId,
            budget,
            cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
        }
    );

    const resultSet = result.outBinds.cursor;
    const transactions = await resultSet.getRows(10000);
    await resultSet.close();

    return transactions;
}





module.exports = { insertTransaction, getTransactionsByAccountId, getTransactionsUpToBudget };

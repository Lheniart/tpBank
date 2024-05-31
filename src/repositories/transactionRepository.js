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
        FROM transactions WHERE account_id = :accountId`,
        [accountId]
    );
    return result.rows;
}


module.exports = { insertTransaction, getTransactionsByAccountId };

const connectToDatabase = require('../db/database');
const oracledb = require('oracledb');

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

module.exports = { insertTransaction };

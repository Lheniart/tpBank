const connectToDatabase = require('../db/database');
const oracledb = require('oracledb');

async function insertAccount(userId, accountName) {
    const connection = await connectToDatabase();
    const result = await connection.execute(
        `BEGIN create_account(:userId, :accountName, :accountId); END;`,
        {
            userId,
            accountName,
            accountId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
    );
    return result.outBinds.accountId;
}

async function getAllAccounts() {
    const connection = await connectToDatabase();
    const result = await connection.execute(`SELECT * FROM accounts`);
    return result.rows;
}

module.exports = { insertAccount, getAllAccounts };

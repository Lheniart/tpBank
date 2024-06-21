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

async function exportTransaction(accountId) {
    const connection = await connectToDatabase();
    try {
        const result = await connection.execute(
            `BEGIN export_transactions_to_csv(:accountId); END;`,
            {
                accountId: accountId
            }
        );
        console.log("result : ",result)
        return "Export successful";
    } catch (error) {
        console.error("Error exporting accounts to CSV:", error);
        return "Export failed";
    }
}

async function dlCSV(){

    const connection = await connectToDatabase();

    const exportsSQL = `BEGIN
	read_file('transactions.csv', :content);
END;`;
    try {
        const result = await connection.execute(exportsSQL, {
            content: { dir: oracledb.BIND_OUT, type: oracledb.CLOB },
        });
        return await result.outBinds.content.getData();
    } catch (error) {
        console.error("Error exporting accounts to CSV:", error);
        return "Export failed";
    }
}

module.exports = { insertAccount, getAllAccounts, exportTransaction, dlCSV };

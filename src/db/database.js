const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let connection;

async function connectToDatabase() {
    if (!connection) {
        try {
            connection = await oracledb.getConnection({
                user: "admin",
                password: "password",
                connectionString: "0.0.0.0:1521/XEPDB1",
            });
            console.log("Successfully connected to Oracle Database");
        } catch (err) {
            console.error("Error connecting to Oracle Database:", err);
            throw err; // Rethrow the error to ensure setupDatabase can handle it
        }
    }
    return connection;
}

module.exports = connectToDatabase;

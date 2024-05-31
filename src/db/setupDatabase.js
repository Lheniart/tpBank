const connectToDatabase = require("./database");

async function setupDatabase() {
    const connection = await connectToDatabase();
    if (!connection) {
        throw new Error("Failed to connect to the database");
    }

    await connection.execute(`BEGIN
        EXECUTE IMMEDIATE 'DROP TABLE transactions CASCADE CONSTRAINTS';
        EXECUTE IMMEDIATE 'DROP TABLE accounts CASCADE CONSTRAINTS';
        EXECUTE IMMEDIATE 'DROP TABLE users CASCADE CONSTRAINTS';
        EXCEPTION WHEN OTHERS THEN
            IF SQLCODE <> -942 THEN RAISE; END IF;
    END;`);

    await connection.execute(`CREATE TABLE users (
        id          NUMBER GENERATED ALWAYS AS IDENTITY,
        name        VARCHAR2(256),
        email       VARCHAR2(512),
        creation_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        accounts    NUMBER DEFAULT 0,
        PRIMARY KEY (id)
    )`);

    await connection.execute(`CREATE TABLE accounts (
        id           NUMBER GENERATED ALWAYS AS IDENTITY,
        name         VARCHAR2(256),
        amount       NUMBER DEFAULT 0,
        user_id      NUMBER,
        transactions NUMBER DEFAULT 0,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
        creation_ts  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    )`);

    await connection.execute(`CREATE TABLE transactions (
        id          NUMBER GENERATED ALWAYS AS IDENTITY,
        name        VARCHAR2(256),
        amount      NUMBER,
        type        NUMBER(1), -- 0: Out, 1: In
        account_id  NUMBER,
        creation_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts(id)
    )`);

    const usersSql = `INSERT INTO users (name, email, accounts) VALUES (:1, :2, :3)`;
    const usersRows = [
        ["Valentin Montagne", "contact@vm-it-consulting.com", 0],
        ["Amélie Dal", "amelie.dal@gmail.com", 0]
    ];
    let usersResult = await connection.executeMany(usersSql, usersRows);
    console.log(usersResult.rowsAffected, "Users rows inserted");

    const accountsSql = `INSERT INTO accounts (name, amount, user_id) VALUES (:1, :2, :3)`;
    const accountsRows = [["Compte courant", 2000, 1]];
    let accountsResult = await connection.executeMany(accountsSql, accountsRows);
    console.log(accountsResult.rowsAffected, "Accounts rows inserted");
    await connection.commit(); // Commit des insertions

    // Créer les procédures stockées et la fonction
    await connection.execute(`CREATE OR REPLACE FUNCTION format_transaction_name (
        p_type IN transactions.type%TYPE,
        p_transaction_name IN transactions.name%TYPE
    ) RETURN VARCHAR2 AS
    BEGIN
        RETURN 'T' || p_type || '-' || UPPER(p_transaction_name);
    END;`);

    await connection.execute(`CREATE OR REPLACE PROCEDURE insert_user (
        p_user_name IN users.name%TYPE,
        p_user_email IN users.email%TYPE,
        p_user_id OUT users.id%TYPE
    ) AS
    BEGIN
        INSERT INTO users (name, email)
        VALUES (p_user_name, p_user_email)
        RETURNING id INTO p_user_id;
    END;`);

    await connection.execute(`CREATE OR REPLACE PROCEDURE create_account (
        p_user_id IN users.id%TYPE,
        p_account_name IN accounts.name%TYPE,
        p_account_id OUT accounts.id%TYPE
    ) AS
    BEGIN
        INSERT INTO accounts (name, amount, user_id, creation_ts)
        VALUES (p_account_name, 0, p_user_id, SYSTIMESTAMP)
        RETURNING id INTO p_account_id;

        UPDATE users
        SET accounts = accounts + 1
        WHERE id = p_user_id;
    END;`);

    await connection.execute(`CREATE OR REPLACE PROCEDURE create_transaction (
        p_account_id IN accounts.id%TYPE,
        p_transaction_name IN transactions.name%TYPE,
        p_amount IN transactions.amount%TYPE,
        p_type IN transactions.type%TYPE,
        p_transaction_id OUT transactions.id%TYPE
    ) AS
        v_formatted_name VARCHAR2(256);
    BEGIN
        v_formatted_name := format_transaction_name(p_type, p_transaction_name);

        INSERT INTO transactions (name, amount, type, account_id)
        VALUES (v_formatted_name, p_amount, p_type, p_account_id)
        RETURNING id INTO p_transaction_id;

        UPDATE accounts
        SET amount = amount + (CASE WHEN p_type = 1 THEN p_amount ELSE -p_amount END),
            transactions = transactions + 1
        WHERE id = p_account_id;
    END;`);
}

module.exports = setupDatabase;

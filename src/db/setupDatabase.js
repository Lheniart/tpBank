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

    await connection.execute(`CREATE TABLE users
                              (
                                  id          NUMBER GENERATED ALWAYS AS IDENTITY,
                                  name        VARCHAR2(256),
                                  email       VARCHAR2(512),
                                  creation_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  accounts    NUMBER                   DEFAULT 0,
                                  PRIMARY KEY (id)
                              )`);

    await connection.execute(`CREATE TABLE accounts
                              (
                                  id           NUMBER GENERATED ALWAYS AS IDENTITY,
                                  name         VARCHAR2(256),
                                  amount       NUMBER                   DEFAULT 0,
                                  user_id      NUMBER,
                                  transactions NUMBER                   DEFAULT 0,
                                  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id),
                                  creation_ts  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  PRIMARY KEY (id)
                              )`);

    await connection.execute(`CREATE TABLE transactions
                              (
                                  id          NUMBER GENERATED ALWAYS AS IDENTITY,
                                  name        VARCHAR2(256),
                                  amount      NUMBER,
                                  type        NUMBER(1), -- 0: Out, 1: In
                                  account_id  NUMBER,
                                  creation_ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                  PRIMARY KEY (id),
                                  CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES accounts (id)
                              )`);

    await connection.execute(`CREATE INDEX idx_transactions_account_creation_ts
                          ON transactions (account_id, creation_ts)`);

    const usersSql = `INSERT INTO users (name, email, accounts)
                      VALUES (:1, :2, :3)`;
    const usersRows = [
        ["Valentin Montagne", "contact@vm-it-consulting.com", 0],
        ["Amélie Dal", "amelie.dal@gmail.com", 0]
    ];
    let usersResult = await connection.executeMany(usersSql, usersRows);
    console.log(usersResult.rowsAffected, "Users rows inserted");

    const accountsSql = `INSERT INTO accounts (name, amount, user_id)
                         VALUES (:1, :2, :3)`;
    const accountsRows = [["Compte courant", 2000, 1]];
    let accountsResult = await connection.executeMany(accountsSql, accountsRows);
    console.log(accountsResult.rowsAffected, "Accounts rows inserted");
    await connection.commit();

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
        SET transactions = transactions + 1
        WHERE id = p_account_id;
    END;`);

    await connection.execute(`CREATE OR REPLACE PROCEDURE export_transactions_to_csv(p_account_id IN NUMBER) IS
            v_file UTL_FILE.FILE_TYPE;
            v_line VARCHAR2(32767);
        BEGIN
            v_file := UTL_FILE.FOPEN('EXPORT_DIR', 'transactions.csv', 'W');
        
            UTL_FILE.PUT_LINE(v_file, 'ID,NAME,AMOUNT,TYPE,ACCOUNT_ID,CREATION_TS');
        
            FOR rec IN (SELECT id, name, amount, type, account_id, creation_ts
                        FROM transactions
                        WHERE account_id = p_account_id) LOOP
                v_line := rec.id || ',' || rec.name || ',' || rec.amount || ',' || rec.type || ',' || rec.account_id || ',' || rec.creation_ts;
                UTL_FILE.PUT_LINE(v_file, v_line);
            END LOOP;
        
            UTL_FILE.FCLOSE(v_file);
        EXCEPTION
            WHEN OTHERS THEN
                IF UTL_FILE.IS_OPEN(v_file) THEN UTL_FILE.FCLOSE(v_file);
            END IF;
            RAISE;
        END;
        `
    );

    await connection.execute(`CREATE OR REPLACE PROCEDURE read_file(p_filename IN VARCHAR2, p_file_content OUT CLOB) IS
          l_file UTL_FILE.FILE_TYPE;
          l_line VARCHAR2(32767);
        BEGIN
          p_file_content := '';
          l_file := UTL_FILE.FOPEN('EXPORT_DIR', p_filename, 'R');
        
          LOOP
              BEGIN
                  UTL_FILE.GET_LINE(l_file, l_line);
                  p_file_content := p_file_content || l_line || CHR(10); -- CHR(10) is newline character
        
              EXCEPTION
                  WHEN NO_DATA_FOUND THEN
                      EXIT;
              END;
          END LOOP;
        
          UTL_FILE.FCLOSE(l_file);
        EXCEPTION
          WHEN UTL_FILE.INVALID_PATH THEN
              RAISE_APPLICATION_ERROR(-20001, 'Invalid file path');
          WHEN UTL_FILE.READ_ERROR THEN
              RAISE_APPLICATION_ERROR(-20004, 'File read error');
          WHEN OTHERS THEN
              RAISE_APPLICATION_ERROR(-20005, 'An error occurred: ' || SQLERRM);
        END read_file;`
    );

    await connection.execute(`CREATE OR REPLACE PROCEDURE get_transactions_up_to_budget (
    p_account_id IN accounts.id%TYPE,
    p_budget IN NUMBER,
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT id, name, amount, type, account_id, TO_CHAR(creation_ts, 'YYYY-MM-DD HH24:MI:SS') as creation_ts
        FROM (
            SELECT t.*, 
                   SUM(amount) OVER (ORDER BY creation_ts) AS running_total
            FROM transactions t
            WHERE t.account_id = p_account_id
        )
        WHERE running_total - amount < p_budget;
END;
`);

    await connection.execute(`
    CREATE OR REPLACE TRIGGER trg_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    BEGIN
        IF INSERTING THEN
            UPDATE accounts
            SET amount = amount + (CASE WHEN :NEW.type = 1 THEN :NEW.amount ELSE -:NEW.amount END),
                transactions = transactions + 1
            WHERE id = :NEW.account_id;
        END IF;

        IF UPDATING THEN
            UPDATE accounts
            SET amount = amount + 
                (CASE 
                    WHEN :NEW.type = 1 THEN :NEW.amount 
                    ELSE -:NEW.amount 
                END) - 
                (CASE 
                    WHEN :OLD.type = 1 THEN :OLD.amount 
                    ELSE -:OLD.amount 
                END)
            WHERE id = :NEW.account_id;
        END IF;

        IF DELETING THEN
            UPDATE accounts
            SET amount = amount - (CASE WHEN :OLD.type = 1 THEN :OLD.amount ELSE -:OLD.amount END),
                transactions = transactions - 1
            WHERE id = :OLD.account_id;
        END IF;
    END;
    `);

    await connection.execute(`CREATE OR REPLACE VIEW transactions_secure_view AS
                          SELECT id,
                                 amount,
                                 creation_ts,
                                 account_id
                          FROM transactions`);
}

module.exports = setupDatabase;

const path = require("path");
const express = require("express");
const setupDatabase = require('./src/db/setupDatabase');
const userRoutes = require('./src/routes/userRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const connectToDatabase = require('./src/db/database');

const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");

// Define the directory where your HTML files (views) are located
app.set("views", path.join(__dirname, "src/views"));

// Optionally, you can define a static files directory (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);

// Define a route to render the HTML file
app.get("/", async (req, res) => {
    res.render("index"); // Assuming you have an "index.ejs" file in the "views" directory
});

app.get("/views/:userId", async (req, res) => {
    const connection = await connectToDatabase();
    const getCurrentUserSQL = `SELECT * FROM users WHERE id = :1`;
    const getAccountsSQL = `SELECT * FROM accounts WHERE user_id = :1`;
    const [currentUser, accounts] = await Promise.all([
        connection.execute(getCurrentUserSQL, [req.params.userId]),
        connection.execute(getAccountsSQL, [req.params.userId])
    ]);

    console.log(currentUser, accounts);
    res.render("user-view", {
        currentUser: currentUser.rows[0], accounts: accounts.rows,
    });
});

app.get("/views/:userId/:accountId", async (req, res) => {
    const connection = await connectToDatabase();
    const getAccountSQL = `SELECT * FROM accounts WHERE id = :1 AND user_id = :2`;
    const getTransactionsSQL = `SELECT * FROM transactions WHERE account_id = :1`;

    const [account, transactions] = await Promise.all([
        connection.execute(getAccountSQL, [req.params.accountId, req.params.userId]),
        connection.execute(getTransactionsSQL, [req.params.accountId])
    ]);

    if (account.rows.length === 0) {
        return res.status(404).send('Account not found');
    }

    res.render("account-view", {
        account: account.rows[0],
        transactions: transactions.rows
    });
});

setupDatabase().then(() => {
    app.listen(3000, () => {
        console.log("Server started on http://localhost:3000");
    });
}).catch(err => {
    console.error("Failed to set up the database:", err);
});

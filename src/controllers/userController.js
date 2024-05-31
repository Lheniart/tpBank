const userService = require('../services/userService');

async function createUser(req, res) {
    try {
        const userId = await userService.createUser(req.body.name, req.body.email);
        res.redirect(`/views/${userId}`);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

module.exports = { createUser };

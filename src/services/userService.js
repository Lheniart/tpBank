const userRepository = require('../repositories/userRepository');

async function createUser(name, email) {
    return await userRepository.insertUser(name, email);
}

module.exports = { createUser };

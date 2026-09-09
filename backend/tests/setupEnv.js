// Jest must never touch the dev database — point it at a dedicated oism_test DB
// instead of the default .env (see backend/.env.test).
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });

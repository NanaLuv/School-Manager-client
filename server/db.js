const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool(process.env.DATABASE_URL);

module.exports = pool;

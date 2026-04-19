const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();


const dbUrl = new URL(process.env.MYSQL_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace(/^\//, ""),
});

module.exports = pool;

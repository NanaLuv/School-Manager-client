const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME || "sch_mgt",
//   port: process.env.DB_PORT || 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

const dbUrl = new URL(process.env.MYSQL_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port, 10) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace(/^\//, ""),
});

module.exports = pool;

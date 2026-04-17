const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const urlDB =
  "mysql://${process.env.MYSQLUSER}:${process.env.MYSQL_ROOT_PASSWORD}@${process.env.RAILWAY_PRIVATE_DOMAIN}:3306/${process.env.MYSQL_DATABASE}";

const pool = mysql.createPool({
  urlDB,
  ssl: {
    rejectUnauthorized: false,
  },
  // host: process.env.DB_HOST || "localhost",
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME || "sch_mgt",
  // port: process.env.DB_PORT || 3306,
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0,
});

module.exports = pool;

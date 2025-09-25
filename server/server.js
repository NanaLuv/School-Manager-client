const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.SERVER_PORT;

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

app.listen(port, () => {
  console.log("Server running on port " + port);
  testConnection();
});

module.exports = app;

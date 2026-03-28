const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const router = require("./router/routes");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/schmgt", router);
app.use("/uploads", express.static("uploads"));
app.use('/uploads/school-logo', express.static('uploads/school-logo'));

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

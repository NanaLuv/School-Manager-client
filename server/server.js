const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const router = require("./router/routes");
const path = require("path");
dotenv.config();

const app = express();

// cors configuration to allow requests from the frontend URL

app.use(
  cors({
    origin: "https://school-manager-rhab.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.get("/test", (req, res) => {
  res.json({ message: "CORS working" });
});
app.use(express.json());
app.use("/schmgt", router);
app.use("/uploads", express.static("uploads"));
app.use("/uploads/school-logo", express.static("uploads/school-logo"));

// // For production, serve static files if needed
// // if (process.env.NODE_ENV === "production") {
// //   // app.use(express.static(path.join(__dirname, "../client/build")));
// //   app.get("*", (req, res) => {
// //     // res.sendFile(path.join(__dirname, "../client/build", "index.html"));
// //   });
// // }

const port = process.env.PORT || process.env.SERVER_PORT || 5000;

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
    // console.error("DB failed, but keeping server alive");
  }
}

app.listen(port, "0.0.0.0", () => {
  console.log("Server running on port " + port);
  testConnection();
});

// app.listen(port, "0.0.0.0", () => {
//   console.log("Server running on port " + port);
// });

module.exports = app;

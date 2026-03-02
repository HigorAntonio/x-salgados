const express = require("express");
const knex = require("./db");

// initialize
const app = express();

// middlewares
app.use(express.json());

// health check endpoint
app.get("/status", async (req, res) => {
  try {
    // simple knex raw query to ensure DB connection
    await knex.raw('SELECT 1');
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

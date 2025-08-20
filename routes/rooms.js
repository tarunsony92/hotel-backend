// routes/rooms.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔹 GET /api/rooms - Get all rooms
router.get("/", (req, res) => {
  const sql = "SELECT roomNumber, status FROM rooms";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching rooms:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;

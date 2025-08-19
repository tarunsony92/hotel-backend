// routes/rooms.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all rooms
router.get("/", (req, res) => {
  db.query("SELECT * FROM rooms", (err, results) => {
    if (err) {
      console.error("Error fetching rooms:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;

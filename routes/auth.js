const express = require('express');
const router = express.Router();
const db = require('../db'); // adjust path if different
const bcrypt = require('bcrypt');


// Register route

router.post('/register', async (req, res) => {
  const { full_name, email, password, role, location } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let query = "";
    let values = [];

    if (role === "user") {
      query = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;
      values = [full_name, email, hashedPassword];
    } else if (role === "seller") {
      if (!location) {
        return res.status(400).json({ error: "Location is required for seller" });
      }
      query = `INSERT INTO sellers (full_name, email, password, location) VALUES (?, ?, ?, ?)`;
      values = [full_name, email, hashedPassword, location];
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error inserting user/seller:", err);
        return res.status(500).json({ error: "Registration failed" });
      }

      res.status(201).json({ message: `${role} registered successfully` });
    });
  } catch (err) {
    console.error("Hashing error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// 🟢 Login route
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  // Dynamically select table based on role
  const table = role === 'seller' ? 'sellers' : 'users';

  const sql = `SELECT * FROM ${table} WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    // Check password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.full_name || user.name,
        email: user.email,
        role: role
      }
    });
  });
});

module.exports = router;

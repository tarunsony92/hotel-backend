const express = require('express');
const router = express.Router();
const db = require('../db'); // Your DB connection

// 🔹 POST /api/bookings - Book rooms
router.post('/book', (req, res) => {
  const { name, email, phone, age, address, gender, selectedRooms, releaseDateTime } = req.body;

  if (!name || !email || !phone || !age || !address || !gender || !selectedRooms || selectedRooms.length === 0 || !releaseDateTime) {
    return res.status(400).json({ error: "All fields and at least one room are required" });
  }

  const roomsString = selectedRooms.join(',');

  let formattedReleaseDateTime = releaseDateTime;
  if (releaseDateTime.length === 16 && releaseDateTime.includes('T')) {
    formattedReleaseDateTime = releaseDateTime.replace('T', ' ') + ':00';
  }

  const insertSql = `
    INSERT INTO bookings (name, email, phone, age, address, gender, rooms, releaseDateTime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertSql,
    [name, email, phone, age, address, gender, roomsString, formattedReleaseDateTime],
    (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Booking failed" });
      }

      // 🔹 Step 2: Update room status
      const placeholders = selectedRooms.map(() => '?').join(',');
      const updateSql = `
        UPDATE rooms
        SET status = 'booked'
        WHERE roomNumber IN (${placeholders})
      `;

      db.query(updateSql, selectedRooms, (err2, updateResult) => {
        if (err2) {
          console.error("Error updating room status:", err2);
          return res.status(500).json({ error: "Booking saved but room status update failed" });
        }

        res.status(201).json({ message: "Booking saved and room status updated successfully" });
      });
    }
  );
});

// 🔹 GET /api/bookings - Get all room statuses
router.get('/', (req, res) => {
  const sql = "SELECT roomNumber, status FROM rooms";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching rooms:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

// 🔵 Seller route – Get all bookings
router.get('/all-bookings', (req, res) => {
  const sql = "SELECT * FROM bookings";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching bookings:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// 🔹 NEW: Get total bookings and latest booking date for a user
router.get('/user-booking-stats/:email', (req, res) => {
  const userEmail = req.params.email;
  // console.log("Fetching stats for:", userEmail); // ✅ debug

  const sql = `
    SELECT COUNT(*) AS totalBookings, MAX(releaseDateTime) AS latestBookingDate
    FROM bookings
    WHERE email = ?
  `;

  db.query(sql, [userEmail], (err, results) => {
    if (err) {
      console.error("Error fetching booking stats:", err);
      return res.status(500).json({ error: "Failed to fetch booking stats" });
    }

    // console.log("SQL results:", results); // ✅ debug

    if (results.length > 0) {
      const stats = results[0];
      res.json({
        totalBookings: stats.totalBookings || 0,
        latestBookingDate: stats.latestBookingDate || null
      });
    } else {
      res.json({ totalBookings: 0, latestBookingDate: null });
    }
  });
});


module.exports = router;

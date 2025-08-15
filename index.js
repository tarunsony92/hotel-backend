const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require("node-cron");
const db = require("./db"); // MySQL connection

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.send("API Running with MySQL");
});

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const bookingRoutes = require("./routes/bookings");
app.use("/api/bookings", bookingRoutes);

// ====================
// 🔹 Auto-release Cron Job
// ====================
cron.schedule("* * * * *", () => {
  // console.log("⏳ Auto-release job running...");

  // Step 1: Update rooms whose booking time is expired
  const releaseRoomsSql = `
    UPDATE rooms r
    JOIN bookings b
      ON FIND_IN_SET(r.roomNumber, REPLACE(b.rooms,' ','')) > 0
    SET r.status = 'available',
        r.booking_time = NULL,
        r.releaseDateTime = NULL
    WHERE b.releaseDateTime <= NOW();
  `;

  db.query(releaseRoomsSql, (err1, result1) => {
    if (err1) {
      console.error("❌ Auto-release (rooms) failed:", err1);
      return;
    }

    if (result1.affectedRows > 0) {
      // console.log(`✅ ${result1.affectedRows} rooms made available.`);
    } else {
      console.log("ℹ No rooms to release right now.");
    }
  });
});
// ====================

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cron = require("node-cron");
const db = require("./db"); // MySQL connection

const app = express();
const port = process.env.PORT || 5000;

// ====================
// 🔹 CORS config
// ====================
// Local development
const allowedOrigins = [
  "http://localhost:3000", // React local
  "https://your-frontend-domain.com" // Production frontend
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ====================
// 🔹 JSON body parser
// ====================
app.use(express.json());

// ====================
// 🔹 Default route
// ====================
app.get("/", (req, res) => {
  res.send("API Running with MySQL");
});

// ====================
// 🔹 Routes
// ====================
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const bookingRoutes = require("./routes/bookings");
app.use("/api/bookings", bookingRoutes);

const roomRoutes = require("./routes/rooms");
app.use("/api/rooms", roomRoutes);


// ====================
// 🔹 Auto-release Cron Job (runs every minute)
// ====================
cron.schedule("* * * * *", () => {
  // console.log("⏳ Auto-release job running...");

  const releaseRoomsSql = `
    UPDATE rooms r
    JOIN bookings b
      ON FIND_IN_SET(r.roomNumber, REPLACE(b.rooms,' ',''))
    SET r.status = 'available',
        r.booking_time = NULL,
        r.releaseDateTime = NULL
    WHERE b.releaseDateTime <= NOW();
  `;

  db.query(releaseRoomsSql, (err, result) => {
    if (err) {
      // console.error("❌ Auto-release (rooms) failed:", err);
      return;
    }

    if (result.affectedRows > 0) {
      // console.log(`✅ ${result.affectedRows} rooms made available.`);
    } else {
      // console.log("ℹ No rooms to release right now.");
    }
  });
});

// ====================
// 🔹 Start server
// ====================
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

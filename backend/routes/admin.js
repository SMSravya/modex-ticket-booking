const express = require("express");
const router = express.Router();
const pool = require("../db");

// Create a show (returns 201)
router.post("/shows", async (req, res) => {
  try {
    const { name, start_time, total_seats } = req.body;
    if (!name || !start_time || !total_seats) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const showRes = await pool.query(
      `INSERT INTO shows (name, start_time, total_seats)
       VALUES ($1,$2,$3) RETURNING id`,
      [name, start_time, total_seats]
    );

    const showId = showRes.rows[0].id;

    // Insert seats
    const insertSeatsQuery = `INSERT INTO seats (show_id, seat_number, status) VALUES ($1,$2,'AVAILABLE')`;
    for (let i = 1; i <= total_seats; i++) {
      await pool.query(insertSeatsQuery, [showId, i]);
    }

    return res.status(201).json({ message: "Show created", showId });
  } catch (err) {
    console.error("Admin create show error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: list all bookings (with optional status filter)
router.get("/bookings", async (req, res) => {
  try {
    const statusFilter = req.query.status; // optional ?status=PENDING
    let q = `SELECT * FROM bookings ORDER BY id DESC`;
    let params = [];
    if (statusFilter) {
      q = `SELECT * FROM bookings WHERE status=$1 ORDER BY id DESC`;
      params = [statusFilter];
    }
    const r = await pool.query(q, params);
    return res.status(200).json(r.rows);
  } catch (err) {
    console.error("Admin list bookings error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

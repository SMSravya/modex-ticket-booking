const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const shows = await pool.query(`SELECT * FROM shows ORDER BY id DESC`);
    return res.status(200).json(shows.rows);
  } catch (err) {
    console.error("Get shows error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id/seats", async (req, res) => {
  try {
    const { id } = req.params;
    const seats = await pool.query(
      `SELECT id, seat_number, status, booking_id FROM seats WHERE show_id=$1 ORDER BY seat_number`,
      [id]
    );
    return res.status(200).json(seats.rows);
  } catch (err) {
    console.error("Get seats error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

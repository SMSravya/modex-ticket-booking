// routes/book.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// Helper: basic validation
function validateBookingPayload(body) {
  if (!body) return "Missing body";
  if (!body.showId || !Array.isArray(body.seats) || body.seats.length === 0) {
    return "showId and seats (non-empty array) are required";
  }
  return null;
}

// Create a booking (PENDING). Returns bookingId and status PENDING (201).
// Body: { showId, seats: [1,2], userName }
router.post("/", async (req, res) => {
  const err = validateBookingPayload(req.body);
  if (err) return res.status(400).json({ error: err });

  const { showId, seats, userName } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the seat rows for update to prevent races
    const locked = await client.query(
      `SELECT * FROM seats
       WHERE show_id=$1 AND seat_number = ANY($2::int[])
       FOR UPDATE`,
      [showId, seats]
    );

    if (locked.rows.length !== seats.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Some seats not found" });
    }

    // Ensure all seats are AVAILABLE
    for (const s of locked.rows) {
      if (s.status !== "AVAILABLE") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: `Seat ${s.seat_number} is already booked` });
      }
    }

    // Create booking as PENDING
    const bookingRes = await client.query(
      `INSERT INTO bookings (show_id, user_name, status)
       VALUES ($1,$2,'PENDING') RETURNING id, created_at`,
      [showId, userName || "guest"]
    );
    const bookingId = bookingRes.rows[0].id;

    // Mark seats as PENDING and set booking_id
    await client.query(
      `UPDATE seats SET status='PENDING', booking_id=$1, updated_at=now()
       WHERE show_id=$2 AND seat_number = ANY($3::int[])`,
      [bookingId, showId, seats]
    );

    await client.query("COMMIT");

    // Return 201 Created with bookingId
    return res.status(201).json({ message: "Booking created", bookingId, status: "PENDING" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking create error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Confirm booking: moves PENDING -> CONFIRMED and seats -> CONFIRMED
// Body: { bookingId }
router.post("/confirm", async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the booking row
    const b = await client.query(
      `SELECT * FROM bookings WHERE id=$1 FOR UPDATE`,
      [bookingId]
    );
    if (b.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }
    const booking = b.rows[0];
    if (booking.status !== "PENDING") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Booking is not PENDING (current: ${booking.status})` });
    }

    // Confirm booking and its seats
    await client.query(`UPDATE bookings SET status='CONFIRMED', updated_at=now() WHERE id=$1`, [bookingId]);
    await client.query(`UPDATE seats SET status='CONFIRMED', updated_at=now() WHERE booking_id=$1`, [bookingId]);

    await client.query("COMMIT");
    return res.status(200).json({ message: "Booking confirmed", bookingId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking confirm error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get booking + seat list: GET /bookings/:id
router.get("/:id", async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  if (isNaN(bookingId)) return res.status(400).json({ error: "Invalid booking id" });

  try {
    const bookingRes = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);
    if (bookingRes.rows.length === 0) return res.status(404).json({ error: "Booking not found" });

    const booking = bookingRes.rows[0];
    const seatsRes = await pool.query(`SELECT seat_number, status FROM seats WHERE booking_id=$1 ORDER BY seat_number`, [bookingId]);

    return res.status(200).json({ booking, seats: seatsRes.rows });
  } catch (err) {
    console.error("Get booking error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

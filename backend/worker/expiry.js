// worker/expiry.js
const pool = require("../db");

async function expirePending() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Select PENDING bookings older than 2 minutes and lock them
    const res = await client.query(
      `SELECT id FROM bookings
       WHERE status='PENDING' AND created_at < now() - interval '2 minutes'
       FOR UPDATE SKIP LOCKED`
    );

    if (res.rows.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const ids = res.rows.map(r => r.id);
    console.log("Expiring bookings:", ids);

    // Mark bookings FAILED
    await client.query(`UPDATE bookings SET status='FAILED', updated_at=now() WHERE id = ANY($1::int[])`, [ids]);

    // Free up seats that belonged to these bookings
    await client.query(`UPDATE seats SET status='AVAILABLE', booking_id=NULL, updated_at=now() WHERE booking_id = ANY($1::int[])`, [ids]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Expiry worker error:", err);
  } finally {
    client.release();
  }
}

async function loop() {
  console.log("Expiry worker started - checking every 30s");
  // run immediately once
  await expirePending();
  setInterval(expirePending, 30 * 1000);
}

loop().catch(err => {
  console.error("Worker fatal:", err);
  process.exit(1);
});

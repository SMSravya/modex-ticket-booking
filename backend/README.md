# Ticket Booking System - Backend

## Run locally

1. Install dependencies:
```bash
cd backend
npm install



# ✅ `backend/README.md` (copy-paste this entire file)

```md
# Ticket Booking System — Backend

**Tech stack:** Node.js, Express, PostgreSQL  
**Project:** Modex Assessment — Part 1 (Backend)  
**Author:** Sravya

---

## Overview

This backend implements a concurrency-safe ticket booking system (show/trip/slot management) that prevents overbooking using PostgreSQL transactions and row-level locks. It supports booking lifecycle states: **PENDING**, **CONFIRMED**, **FAILED**, and includes an expiry worker that marks stale PENDING bookings as FAILED after 2 minutes.

Core features:
- Admin create shows/trips and auto-populate seats
- Users list shows and view seat status
- Create booking (PENDING) and confirm booking (CONFIRMED)
- Booking expiry worker (PENDING → FAILED after 2 minutes)
- Concurrency-safe seat booking using `SELECT ... FOR UPDATE` and transactions
- Postman collection included for testing

---

## Repo structure (backend)

```

backend/
server.js
db.js
schema.sql
.env
package.json
README.md
postman_collection.json
worker/
expiry.js
routes/
admin.js
shows.js
book.js
test/
concurrency.js

````

---

## Prerequisites

- Node.js 18+ and npm  
- PostgreSQL (local or Docker)  
- Git (for pushing)  
- (Optional) Docker (recommended for Postgres local dev)

---

## Quick start (local)

1. Clone repo (if not already):
```bash
git clone <your-repo-url>
cd modex-ticket-system/backend
````

2. Install dependencies:

```bash
npm install
```

3. Configure DB & environment:

* Create Postgres DB and user (example using Docker):

```bash
docker run --name ticket-postgres -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=ticketdb -p 5432:5432 -d postgres:15
```

* Copy schema into DB (option A: docker exec):

```bash
docker cp ./schema.sql ticket-postgres:/schema.sql
docker exec -it ticket-postgres bash -c "psql -U dev -d ticketdb -f /schema.sql"
```

* Create `.env` in `backend/`:

```
DATABASE_URL=postgres://dev:pass@localhost:5432/ticketdb
PORT=4000
```

4. Start server:

```bash
npm run dev
```

5. In a second terminal start expiry worker:

```bash
npm run worker
```

---

## API Reference

Base URL for local testing: `http://localhost:4000`

### Admin

* **POST /admin/shows** — Create a show (201)

  * Body:

    ```json
    {
      "name": "Avengers Movie",
      "start_time": "2025-12-11 19:00",
      "total_seats": 40
    }
    ```
  * Response:

    ```json
    { "message": "Show created", "showId": 1 }
    ```

* **GET /admin/bookings** — List bookings (200)

  * Optional query: `?status=PENDING`

### Shows

* **GET /shows** — List shows (200)
* **GET /shows/:id/seats** — List seats for a show (200)

  * Response example:

    ```json
    [
      { "id": 11, "seat_number": 1, "status": "AVAILABLE", "booking_id": null },
      ...
    ]
    ```

### Booking

* **POST /book** — Create booking (201) — *PENDING*

  * Body:

    ```json
    { "showId": 1, "seats": [1,2], "userName": "Alice" }
    ```
  * Response:

    ```json
    { "message": "Booking created", "bookingId": 5, "status": "PENDING" }
    ```

* **POST /book/confirm** — Confirm booking (200)

  * Body:

    ```json
    { "bookingId": 5 }
    ```
  * Response:

    ```json
    { "message": "Booking confirmed", "bookingId": 5 }
    ```

* **GET /book/:id** — Get booking & seats (200)

  * Response:

    ```json
    {
      "booking": { "id":5, "show_id":1, "user_name":"Alice", "status":"CONFIRMED", ... },
      "seats": [ { "seat_number": 1, "status": "CONFIRMED" }, ... ]
    }
    ```

### Status codes

* `201` — Created (show, booking)
* `200` — OK
* `400` — Bad request / validation
* `404` — Not found
* `409` — Conflict (seat not available)
* `500` — Server error

---

## Concurrency & consistency

Booking flow:

1. `POST /book` starts a DB transaction and executes:

   * `SELECT ... FOR UPDATE` on requested seat rows (locks them)
   * validates they are `AVAILABLE`
   * inserts a bookings row with `status='PENDING'`
   * updates `seats` rows to `status='PENDING'` and attaches `booking_id`
   * commits transaction

This ensures atomic seat reservation and prevents multiple transactions from booking the same seat.

To confirm:

* `POST /book/confirm` locks the booking row and updates status to `CONFIRMED` (and seats → `CONFIRMED`).

Expiry:

* Worker `worker/expiry.js` runs every 30 seconds and marks `PENDING` bookings older than 2 minutes as `FAILED`, freeing seats.

---

## Tests

### Concurrency test

From `backend` folder:

```bash
node test/concurrency.js
```

This script sends multiple concurrent booking requests for the same seat to validate locking. Expect only the first to create a booking; others return conflicts.

### Manual test examples (PowerShell)

Create show:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/admin/shows" -Method POST -Body (@{
  name = "Demo Show"
  start_time = "2025-12-11 19:00"
  total_seats = 10
} | ConvertTo-Json) -ContentType "application/json"
```

Create booking:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/book" -Method POST -Body (@{
  showId = 1
  seats = @(1)
  userName = "TestUser"
} | ConvertTo-Json) -ContentType "application/json"
```

Confirm booking:

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/book/confirm" -Method POST -Body (@{
  bookingId = 1
} | ConvertTo-Json) -ContentType "application/json"
```

---

## Postman collection

A Postman import file is included: `postman_collection.json`.
Import it into Postman to quickly run the above requests.

---

## Deployment notes (high-level)

Recommended providers: **Render**, **Railway**, **Heroku** (or AWS/GCP). Steps overview:

1. Create Postgres managed DB (Render/Railway).
2. Set `DATABASE_URL` env var on the host: `postgres://<user>:<pass>@<host>:<port>/<db>`.
3. Deploy backend repo (NodeJS). Set `PORT` env var if required.
4. Run `schema.sql` on the managed DB (use psql or provider SQL editor).
5. Start backend; start worker as separate process (or use a worker service on the platform).
6. Configure CORS for the frontend origin.

I will provide detailed Render/Railway instructions in the deployment step.

---

## Git & Submission

* Push the `backend/` folder to your public GitHub repo (include `README.md`, `postman_collection.json`, `schema.sql`).
* Record a short unlisted video showing:

  * Setup & run locally
  * Create show → Create booking → Confirm booking
  * Run concurrency test and show results
  * Show expiry worker marking booking FAILED (2-minute test)
  * Show deployment steps and live endpoint (if deployed)

---

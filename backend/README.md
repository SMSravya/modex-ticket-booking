## Ticket Booking System — Backend

**Tech stack:** Node.js, Express, PostgreSQL  
**Project:** Modex Assessment — Backend

## Overview

This backend implements a concurrency-safe ticket booking system using PostgreSQL transactions and row-level locks. It supports booking lifecycle states **PENDING**, **CONFIRMED**, and **FAILED**, and includes an expiry worker that marks stale PENDING bookings as FAILED after 2 minutes.

Features:
- Admin can create shows and auto-populate seats
- Users can list shows and view seat status
- Create booking (PENDING) and confirm booking (CONFIRMED)
- Background worker to expire old PENDING bookings
- Concurrency-safe seat booking with `SELECT ... FOR UPDATE`
- Postman collection for API testing

## Backend structure

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



## Prerequisites

- Node.js 18+ and npm  
- PostgreSQL  
- Git

## Run locally

1. Clone and enter backend:

git clone <your-repo-url>
cd modex-ticket-system/backend



2. Install dependencies:

npm install



3. Start PostgreSQL and create database (example with Docker):

docker run --name ticket-postgres
-e POSTGRES_USER=dev
-e POSTGRES_PASSWORD=pass
-e POSTGRES_DB=ticketdb
-p 5432:5432 -d postgres:15



4. Apply schema:

docker cp ./schema.sql ticket-postgres:/schema.sql
docker exec -it ticket-postgres bash -c "psql -U dev -d ticketdb -f /schema.sql"



5. Create `.env` in `backend/`:

DATABASE_URL=postgres://dev:pass@localhost:5432/ticketdb
PORT=4000



6. Start API server:

npm run dev



7. In another terminal, start the expiry worker:

npm run worker



## API reference

Base URL (local): `http://localhost:4000`

### Admin

- **POST `/admin/shows`** — create a show

Request body:

{
"name": "Avengers Movie",
"start_time": "2025-12-11 19:00",
"total_seats": 40
}



Example response:

{ "message": "Show created", "showId": 1 }



- **GET `/admin/bookings`** — list bookings, optional `?status=PENDING`

### Shows

- **GET `/shows`** — list shows
- **GET `/shows/:id/seats`** — list seats for a show

Example response:

[
{ "id": 11, "seat_number": 1, "status": "AVAILABLE", "booking_id": null }
]



### Booking

- **POST `/book`** — create booking (PENDING)

{
"showId": 1,
"seats":,​​
"userName": "Alice"
}



Response:

{ "message": "Booking created", "bookingId": 5, "status": "PENDING" }



- **POST `/book/confirm`** — confirm booking

{ "bookingId": 5 }



Response:

{ "message": "Booking confirmed", "bookingId": 5 }



- **GET `/book/:id`** — get booking and seats

{
"booking": { "id": 5, "show_id": 1, "user_name": "Alice", "status": "CONFIRMED" },
"seats": [
{ "seat_number": 1, "status": "CONFIRMED" }
]
}



### Status codes

- 201 — created
- 200 — success
- 400 — bad request
- 404 — not found
- 409 — conflict (seat not available)
- 500 — server error

## Concurrency behaviour

- `/book` opens a transaction, locks requested seats with `SELECT ... FOR UPDATE`, verifies they are `AVAILABLE`, inserts a booking with `status = PENDING`, updates seats to `PENDING`, then commits.
- `/book/confirm` locks the booking row, verifies it is `PENDING`, then sets booking and seats to `CONFIRMED`.
- `worker/expiry.js` periodically marks PENDING bookings older than 2 minutes as `FAILED` and frees their seats.

## Tests

### Concurrency script

From `backend/`:

node test/concurrency.js



This fires multiple concurrent booking requests for the same seat; only one should succeed.

## Postman collection

Import `backend/postman_collection.json` into Postman to run all core requests quickly.

## Deployment notes

High-level steps for a platform like Render or Railway:

1. Create a managed PostgreSQL instance.
2. Set `DATABASE_URL` and `PORT` environment variables for the service.
3. Deploy the Node.js backend from this repository.
4. Run `schema.sql` against the managed database.
5. Run the HTTP server and the expiry worker (as a separate worker service or process).
6. Configure CORS to allow the deployed frontend origin.

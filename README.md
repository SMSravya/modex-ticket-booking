
# Modex Ticket Booking System

Full‑stack ticket booking system with a React (Vite) frontend and a Node.js + Express + PostgreSQL backend.

- **Frontend:** React + TypeScript + Vite + Tailwind CSS  
- **Backend:** Node.js, Express, PostgreSQL  
- **Deployment:** Backend on Render, frontend on Vercel

---

## Features

- Admin:
  - Create shows with name, city, start time, and total seats
  - View all bookings with status and user details
- Users:
  - Browse shows filtered by city
  - View seat layout and live booking status
  - Book multiple seats for a show
- Booking lifecycle:
  - PENDING → CONFIRMED → FAILED
  - Background worker automatically expires old PENDING bookings
- Concurrency-safe seat booking using PostgreSQL transactions and row locks
- Fully responsive UI with clear status banners and error handling

---

## Repository structure

modex-ticket-booking/
backend/
server.js
db.js
schema.sql
package.json
worker/
expiry.js
routes/
admin.js
shows.js
book.js
test/
concurrency.js
postman_collection.json
README.md # backend-specific details (optional)
frontend/
index.html
vite.config.ts
package.json
src/
main.tsx
App.tsx
api.ts
con/
components/
pages/
README.md # this file



---

## Prerequisites

- Node.js 18+ and npm  
- PostgreSQL (local, Docker, or managed)  
- Git  
- (Optional) Docker for running local Postgres easily

---

## Local setup

### 1. Clone the repo

git clone https://github.com/SMSravya/modex-ticket-booking.git
cd modex-ticket-booking



### 2. Backend setup

1. Install backend dependencies:

cd backend
npm install



2. Start PostgreSQL and create database (example using Docker):

docker run --name ticket-postgres
-e POSTGRES_USER=dev
-e POSTGRES_PASSWORD=pass
-e POSTGRES_DB=ticketdb
-p 5432:5432 -d postgres:15



3. Apply DB schema:

docker cp ./schema.sql ticket-postgres:/schema.sql
docker exec -it ticket-postgres
bash -c "psql -U dev -d ticketdb -f /schema.sql"



4. Create `.env` in `backend/`:

DATABASE_URL=postgres://dev:pass@localhost:5432/ticketdb
PORT=4000



5. Start backend API:

npm run dev



6. In another terminal, start the expiry worker:

cd backend
npm run worker



### 3. Frontend setup

1. Install frontend dependencies:

cd frontend
npm install



2. Create `src/config.ts` (if not present) and point it to your backend:

export const API_BASE_URL = "http://localhost:4000";



3. Start Vite dev server:

npm run dev



4. Open the URL shown in the terminal (usually `http://localhost:5173`).

---

## How to use

### Admin flow

1. Go to the **Admin** page.
2. Create a new show by entering:
- Name
- City
- Start time
- Total seats
3. See the show appear in the list and observe bookings table when users start booking.

### User booking flow

1. On Home/Shows page, pick a **city** or use **“Use my location”**.
2. Select a show and open its booking interface.
3. Choose one or more seats and submit booking.
4. The booking is initially **PENDING**, then **CONFIRMED** once finalized.
5. If a PENDING booking is not completed within 2 minutes, the worker marks it **FAILED** and seats become available again.

---

## API overview (backend)

Base URL (local): `http://localhost:4000`

- `POST /admin/shows` — create show  
- `GET /admin/bookings` — list bookings (optional `?status=PENDING`)  
- `GET /shows` — list shows  
- `GET /shows/:id/seats` — list seats for a show  
- `POST /book` — create booking (PENDING)  
- `POST /book/confirm` — confirm booking  
- `GET /book/:id` — get booking and seats

See `backend/postman_collection.json` for ready-made Postman requests.

---

## Concurrency and booking guarantees

- Seat selection and booking creation run inside a single PostgreSQL transaction.
- Seats are locked using `SELECT ... FOR UPDATE` so two users cannot book the same seat at the same time.
- The expiry worker periodically scans PENDING bookings older than 2 minutes, marks them FAILED, and frees associated seats.

---

## Deployment (current setup)

- **Backend:** Render
- Environment variables: `DATABASE_URL`, `NODE_ENV=production`
- `DATABASE_URL` points to Render Postgres internal URL
- `schema.sql` executed once using Render’s Postgres console
- **Frontend:** Vercel
- Root directory: `frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- `API_BASE_URL` set to the Render backend URL

---

## Scripts

### Backend

cd backend
npm run dev # start API locally
npm run worker # start expiry worker
node test/concurrency.js # run concurrency test
https://modex-ticket-booking.onrender.com



### Frontend

cd frontend
npm run dev # start Vite dev server
npm run build # production build
https://modex-ticket-booking-iuyc.vercel.app/



---

## License

This project is for the Modex assessment and personal portfolio use.

# Ticket Booking System — Frontend

**Tech stack:** React, TypeScript, Vite, Tailwind CSS, React Router  
**Project:** Modex Assessment — Part 2 (Frontend)  
**Author:** Sravya

---

## Overview

This is a BookMyShow-style frontend for the Modex Ticket Booking System backend.  
It provides a user view for browsing shows and booking seats, and an admin view for creating shows and viewing bookings.  
The app is built with React + TypeScript, uses Context API for global state and caching, and integrates with the concurrency-safe Node.js + PostgreSQL backend.

Key features:

- Modern dark UI with movie-card layout and seat map
- Admin dashboard to create shows and see recent bookings
- User show list with city filter and responsive cards
- Visual seat selection grid with live availability from backend
- Booking flow integrated with PENDING → CONFIRMED logic
- Global Context for shows, selected city, and basic mock user
- API error handling, loading states, and simple form validation

---

## Project structure

frontend/
src/
api.ts # Typed API client for backend
config.ts # API_BASE_URL
main.tsx # App entry, BrowserRouter + AppProvider
App.tsx # Routes
index.css # Tailwind base
components/
AppLayout.tsx # Navbar, city selector, layout shell
context/
AppContext.tsx # Context API: currentUser, shows, selectedCity, loaders
pages/
HomePage.tsx # User shows list + city filter
BookingPage.tsx # Seat grid + booking flow
AdminPage.tsx # Create show + bookings table
types/
showExtras.ts # Frontend-only mapping: showId → city, city list
tailwind.config.js
postcss.config.js
vite.config.ts
package.json

text

---

## Setup & running locally

1. **Backend**

Make sure the backend is running on port `4000` and connected to PostgreSQL (see backend README).

2. **Install frontend dependencies**

cd frontend
npm install

text

3. **Environment configuration**

The API base URL is configured in `src/config.ts`:

export const API_BASE_URL = "http://localhost:4000";

text

For deployment, change this to your deployed backend URL (for example, Render/Railway HTTPS endpoint).

4. **Run dev server**

npm run dev

text

Vite will print a URL like `http://localhost:5173` (or 5174). Open it in the browser.

---

## Features

### User flows

- **Home (`/`)**
  - Lists all shows as gradient cards with name, start time, and total seats.
  - City selector in navbar (frontend-only filter) to view shows per city.
  - Clicking “View Seats” navigates to `/booking/:id`.

- **Booking (`/booking/:id`)**
  - Shows show details and a color legend (available, selected, booked).
  - Renders a seat grid using live data from `GET /shows/:id/seats`.
  - Users can select one or more available seats and confirm booking.
  - On booking:
    - Calls `POST /book` then `POST /book/confirm`.
    - Shows success or error messages (e.g., seat already booked, server errors).
    - Refreshes seat layout from backend.

### Admin flows

- **Admin dashboard (`/admin`)**
  - Create show with name, start time, and total seats.
  - Validates presence of all fields and basic seat count.
  - Shows API errors in a friendly message if creation fails.
  - Displays recent bookings table (optionally filterable by status) using `GET /admin/bookings`.

---

## State management & API usage

- **Context API**
  - `AppContext` holds:
    - `currentUser` (mock: `{ name: "Guest", role: "USER" }`)
    - `shows`, `loadingShows`, `showsError`
    - `selectedCity`, `setSelectedCity`
    - `loadShowsOnce()` and `refreshShows()`
  - Shows are fetched once and cached. Subsequent pages reuse the same data to avoid unnecessary re-fetches.

- **API client**
  - `api.ts` uses Axios with typed responses for:
    - `GET /shows`
    - `GET /shows/:id/seats`
    - `POST /admin/shows`
    - `POST /book`
    - `POST /book/confirm`
    - `GET /book/:id`
    - `GET /admin/bookings[?status=...]`

---

## Assumptions

- Authentication is mocked via a simple `currentUser` object in context; there is no real login.
- City selection is implemented on the frontend only:
  - `types/showExtras.ts` maps `showId → city`.
  - Backend schema is unchanged; all shows are fetched and then filtered client-side.
- Booking confirmation is done immediately after creating a PENDING booking for a smoother demo flow.
- Backend is responsible for concurrency control and overbooking prevention; frontend only shows the latest status.

---

## Known limitations

- No real authentication / authorization; admin route is not protected.
- City data is not stored in the database; mapping must be updated manually if show IDs change.
- Booking status is shown in-page but there is no “My bookings” history per user.
- No live WebSocket updates; seat availability is refreshed after actions, not in real time.
- Mobile layout is responsive but not exhaustively tested on all screen sizes.

---

## Screenshots

Add screenshots or a short GIF of:

- Home page with show cards and city selector.
- Booking page with seat layout.
- Admin dashboard (create show + bookings table).

---

## Deployment notes (summary)

- Deploy backend (e.g., Render/Railway) with PostgreSQL and set `DATABASE_URL` + `PORT`.
- Deploy frontend (e.g., Vercel/Netlify):
  - Set `API_BASE_URL` build-time value to backend URL (via environment or by editing `config.ts` for prod).
  - Build with `npm run build` and serve the `dist/` folder.
- Verify:
  - Home loads shows from the deployed backend.
  - Admin can create shows.
  - Booking flow works end-to-end in production.